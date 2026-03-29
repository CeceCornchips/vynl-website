import { NextResponse } from "next/server";
import { SquareClient, SquareEnvironment } from "square";
import type { CatalogObject } from "square";

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN ?? "",
  environment:
    process.env.NEXT_PUBLIC_SQUARE_ENV === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CatalogService {
  variationId: string;
  name: string;
  description?: string;
  priceCents: number;
  priceLabel: string;
  durationMinutes: number;
  duration: string;
  /** Deposit charged at booking time (AUD cents). 0 means "Quoted". */
  depositCents: number;
  depositLabel: string;
}

export interface ServicesResponse {
  services: CatalogService[];
  addOns: CatalogService[];
}

// ── In-memory cache (5 minutes) ───────────────────────────────────────────────
// Set to null to bust cache after a filter change (module reload also resets it).

let cache: { data: ServicesResponse; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_SERVICE_DEPOSIT_CENTS = 6000; // A$60.00

function formatCents(cents: number): string {
  return `A$${(cents / 100).toFixed(2)}`;
}

function minutesToDuration(mins: number): string {
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  if (hours === 0) return `${remainder} mins`;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} mins`;
}

// ── GET /api/services ─────────────────────────────────────────────────────────

export async function GET() {
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
    });
  }

  try {
    // catalog.list() returns a Page<CatalogObject> — an async iterable that
    // auto-paginates. Iterate to collect all ITEM and CATEGORY objects.
    const allObjects: CatalogObject[] = [];
    const page = await square.catalog.list({ types: "ITEM,CATEGORY" });
    for await (const obj of page) {
      allObjects.push(obj);
    }

    // Build category ID → name map
    const categoryNames: Record<string, string> = {};
    for (const obj of allObjects) {
      if (obj.type === "CATEGORY" && obj.id && obj.categoryData?.name) {
        categoryNames[obj.id] = obj.categoryData.name;
      }
    }

    const services: CatalogService[] = [];
    const addOns: CatalogService[] = [];

    for (const obj of allObjects) {
      if (obj.type !== "ITEM") continue;

      const data = obj.itemData;
      if (!data) continue;

      // Skip non-appointment items (gift cards, etc.). Null/undefined productType
      // means it's a regular appointment service, so we allow it through.
      if (
        data.productType &&
        data.productType !== "APPOINTMENTS_SERVICE" &&
        data.productType !== "REGULAR"
      ) {
        continue;
      }

      // Resolve the item's primary category name
      const catId: string | undefined =
        data.categoryId ?? data.categories?.[0]?.id;
      const catName = catId ? (categoryNames[catId] ?? "") : "";

      const isInNailServices = /nail.?service/i.test(catName);
      const isInAddOns = /add.?on/i.test(catName);

      // Items with no category (Fix, Gel Polish, AFTER HOURS, etc.) are
      // internal/operational and should never appear on the public website.
      if (!isInNailServices && !isInAddOns) continue;

      // Add-ons must carry the "(ADD-ON ONLY)" suffix in their name.
      // This excludes items like "LVL 4 NAIL ART" and "LVL 5 NAIL ART" that
      // sit in the Add Ons category but haven't been tagged for public booking.
      if (isInAddOns && !/\(add.?on only\)/i.test(data.name ?? "")) continue;

      const isAddOn = isInAddOns;

      // Use the first non-deleted variation (fall back to first variation)
      const variation =
        (data.variations ?? []).find((v) => !v.isDeleted) ??
        data.variations?.[0];

      if (!variation?.id) continue;
      if (variation.type !== "ITEM_VARIATION") continue;

      const varData = variation.itemVariationData;

      // Price — Square returns amount as bigint; convert to number
      const priceCents = varData?.priceMoney?.amount
        ? Number(varData.priceMoney.amount)
        : 0;
      const priceLabel = priceCents > 0 ? formatCents(priceCents) : "Price varies";

      // Duration — Square stores serviceDuration in milliseconds (bigint)
      const durationMs = varData?.serviceDuration
        ? Number(varData.serviceDuration)
        : 0;
      const durationMinutes =
        durationMs > 0 ? Math.round(durationMs / 60000) : isAddOn ? 30 : 60;
      const duration = minutesToDuration(durationMinutes);

      // Deposit: main services → flat A$60; add-ons → full catalog price
      const depositCents = isAddOn ? priceCents : DEFAULT_SERVICE_DEPOSIT_CENTS;
      const depositLabel = depositCents > 0 ? formatCents(depositCents) : "Quoted";

      const catalogService: CatalogService = {
        variationId: variation.id,
        name: data.name ?? "Service",
        description: data.description ?? undefined,
        priceCents,
        priceLabel,
        durationMinutes,
        duration,
        depositCents,
        depositLabel,
      };

      if (isAddOn) {
        addOns.push(catalogService);
      } else {
        services.push(catalogService);
      }
    }

    const result: ServicesResponse = { services, addOns };
    cache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
    });
  } catch (error) {
    console.error("[/api/services]", error);
    return NextResponse.json(
      { error: "Failed to fetch services from Square catalog." },
      { status: 500 }
    );
  }
}
