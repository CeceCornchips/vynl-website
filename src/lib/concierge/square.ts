import { SquareClient, SquareEnvironment, type CatalogObject } from 'square';

/**
 * Read-only Square lookups for the DM concierge: the bookable menu, the
 * booking rules and policy text, open appointment times, and the studio's
 * street address (used only to block it from replies; never shown to the AI).
 *
 * Uses the same env vars as the site's /api/square routes.
 */

let client: SquareClient | null = null;
function square(): SquareClient {
  client ??= new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN ?? '',
    environment:
      process.env.NEXT_PUBLIC_SQUARE_ENV === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  });
  return client;
}

function locationId(): string {
  return process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? '';
}

/** Tiny time-based cache so a burst of DMs doesn't re-read Square each time. */
function cached<T>(ttlMs: number, load: () => Promise<T>): () => Promise<T> {
  let value: { data: T; expiresAt: number } | null = null;
  let pending: Promise<T> | null = null;
  return async () => {
    if (value && Date.now() < value.expiresAt) return value.data;
    pending ??= load()
      .then((data) => {
        value = { data, expiresAt: Date.now() + ttlMs };
        return data;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  };
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export interface SquareService {
  variationId: string;
  name: string;
  description: string | null;
  /** null when Square lists the price as variable. */
  priceCents: number | null;
  durationMinutes: number;
  isAddOn: boolean;
}

function cleanName(name: string): string {
  return name.replace(/\s*\(add.?on only\)\s*/i, '').trim();
}

/**
 * The same services the website shows: items in the "Nail Services" category,
 * plus "Add Ons" items tagged "(ADD-ON ONLY)".
 */
export const loadSquareMenu = cached(5 * 60_000, async (): Promise<SquareService[]> => {
  const objects: CatalogObject[] = [];
  for await (const obj of await square().catalog.list({ types: 'ITEM,CATEGORY' })) objects.push(obj);

  const categoryNames: Record<string, string> = {};
  for (const obj of objects) {
    if (obj.type === 'CATEGORY' && obj.id && obj.categoryData?.name) {
      categoryNames[obj.id] = obj.categoryData.name;
    }
  }

  const menu: SquareService[] = [];
  for (const obj of objects) {
    if (obj.type !== 'ITEM' || !obj.itemData) continue;
    const data = obj.itemData;
    if (data.productType && data.productType !== 'APPOINTMENTS_SERVICE' && data.productType !== 'REGULAR') {
      continue;
    }
    const categoryId = data.categoryId ?? data.categories?.[0]?.id;
    const category = categoryId ? (categoryNames[categoryId] ?? '') : '';
    const isService = /nail.?service/i.test(category);
    const isAddOn = /add.?on/i.test(category);
    if (!isService && !isAddOn) continue;
    if (isAddOn && !/\(add.?on only\)/i.test(data.name ?? '')) continue;

    const variation = (data.variations ?? []).find((v) => !v.isDeleted) ?? data.variations?.[0];
    if (!variation?.id || variation.type !== 'ITEM_VARIATION') continue;
    const v = variation.itemVariationData;
    if (v?.availableForBooking === false) continue;

    const priceCents = v?.priceMoney?.amount ? Number(v.priceMoney.amount) : null;
    const durationMs = v?.serviceDuration ? Number(v.serviceDuration) : 0;
    menu.push({
      variationId: variation.id,
      name: cleanName(data.name ?? 'Service'),
      description: data.description?.trim() || null,
      priceCents: priceCents && priceCents > 0 ? priceCents : null,
      durationMinutes: durationMs > 0 ? Math.round(durationMs / 60_000) : isAddOn ? 30 : 60,
      isAddOn,
    });
  }
  return menu;
});

// ─── Booking rules ────────────────────────────────────────────────────────────

export interface SquareBookingRules {
  bookingSiteUrl: string | null;
  /** True when each online booking is a request you accept in Square. */
  requiresAcceptance: boolean;
  cancellationWindowHours: number | null;
  minLeadHours: number | null;
  maxLeadDays: number | null;
  policyText: string | null;
}

export const loadBookingRules = cached(10 * 60_000, async (): Promise<SquareBookingRules> => {
  const profile = (await square().bookings.getBusinessProfile()).businessBookingProfile;
  const settings = profile?.businessAppointmentSettings;

  let bookingSiteUrl: string | null = null;
  try {
    for await (const lp of await square().bookings.locationProfiles.list()) {
      if (lp.locationId === locationId() || (!bookingSiteUrl && lp.bookingSiteUrl)) {
        bookingSiteUrl = lp.bookingSiteUrl ?? bookingSiteUrl;
      }
    }
  } catch {
    // The booking site link is a nice-to-have; the env override or fallback covers it.
  }

  const seconds = (n: number | null | undefined) => (typeof n === 'number' ? n : null);
  const windowS = seconds(settings?.cancellationWindowSeconds);
  const minS = seconds(settings?.minBookingLeadTimeSeconds);
  const maxS = seconds(settings?.maxBookingLeadTimeSeconds);

  return {
    bookingSiteUrl,
    requiresAcceptance: profile?.bookingPolicy === 'REQUIRES_ACCEPTANCE',
    cancellationWindowHours: windowS == null ? null : Math.round(windowS / 3600),
    minLeadHours: minS == null ? null : Math.round(minS / 3600),
    maxLeadDays: maxS == null ? null : Math.round(maxS / 86_400),
    policyText: settings?.cancellationPolicyText?.trim() || null,
  };
});

// ─── Studio address (for the reply guard only) ───────────────────────────────

/** Street lines of the studio address. Never put these in a prompt. */
export const loadStudioAddressLines = cached(60 * 60_000, async (): Promise<string[]> => {
  const address = (await square().locations.get({ locationId: locationId() })).location?.address;
  return [address?.addressLine1, address?.addressLine2].filter(
    (line): line is string => typeof line === 'string' && line.trim().length >= 4,
  );
});

// ─── Availability ─────────────────────────────────────────────────────────────

/** Open start times (ISO strings) for one service plus optional add-ons. */
export async function searchSquareAvailability(
  variationIds: string[],
  startAtISO: string,
  endAtISO: string,
): Promise<string[]> {
  const teamMemberId = process.env.SQUARE_TEAM_MEMBER_ID;
  const res = await square().bookings.searchAvailability({
    query: {
      filter: {
        startAtRange: { startAt: startAtISO, endAt: endAtISO },
        locationId: locationId(),
        segmentFilters: variationIds.map((serviceVariationId) => ({
          serviceVariationId,
          ...(teamMemberId ? { teamMemberIdFilter: { any: [teamMemberId] } } : {}),
        })),
      },
    },
  });
  return (res.availabilities ?? [])
    .map((a) => a.startAt)
    .filter((s): s is string => typeof s === 'string' && s.length > 0);
}
