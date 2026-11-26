import { formatInTimeZone } from 'date-fns-tz';
import { loadBookingRules, loadSquareMenu, searchSquareAvailability } from '@/lib/concierge/square';

const TZ = 'Australia/Sydney';
const DAY = 86_400_000;

export interface OpenSlotsResult {
  service: string;
  add_ons: string[];
  duration_minutes: number;
  timezone: string;
  dates: { date: string; weekday: string; times: string[] }[];
  note?: string;
}

/** Midnight at the start of a Sydney calendar day, as a Date. */
function sydneyMidnight(ymd: string): Date {
  // Try both offsets and keep the one that lands on 00:00 Sydney time.
  for (const offset of ['+11:00', '+10:00']) {
    const d = new Date(`${ymd}T00:00:00${offset}`);
    if (formatInTimeZone(d, TZ, 'HH:mm') === '00:00') return d;
  }
  return new Date(`${ymd}T00:00:00+10:00`);
}

/**
 * Real open times from your Square calendar for one service (plus any
 * add-ons, which make the appointment longer). Up to 31 days from date_from.
 */
export async function findOpenSlots(
  serviceVariationId: string,
  addOnVariationIds: string[],
  dateFrom: string,
  days: number,
): Promise<OpenSlotsResult | { error: string }> {
  const [menu, rules] = await Promise.all([loadSquareMenu(), loadBookingRules()]);
  const service = menu.find((s) => s.variationId === serviceVariationId && !s.isAddOn);
  if (!service) return { error: 'Unknown service id. Use a service id (not an add-on) from the live menu.' };
  const addOns = addOnVariationIds.map((id) => menu.find((s) => s.variationId === id && s.isAddOn));
  if (addOns.some((a) => !a)) return { error: 'Unknown add-on id. Use add-on ids from the live menu.' };

  const now = Date.now();
  const earliest = now + (rules.minLeadHours ?? 1) * 3_600_000 + 60_000;
  const latest = rules.maxLeadDays ? now + rules.maxLeadDays * DAY : now + 60 * DAY;

  const today = formatInTimeZone(new Date(now), TZ, 'yyyy-MM-dd');
  const fromYmd = /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) && dateFrom > today ? dateFrom : today;
  const span = Math.min(31, Math.max(1, Math.round(days) || 14));

  const start = Math.max(sydneyMidnight(fromYmd).getTime(), earliest);
  let end = Math.min(sydneyMidnight(fromYmd).getTime() + span * DAY, latest);
  if (end - start < DAY) end = Math.min(start + DAY, latest); // Square needs at least a day
  if (end <= start) {
    return {
      service: service.name,
      add_ons: addOns.map((a) => a!.name),
      duration_minutes: 0,
      timezone: 'Sydney',
      dates: [],
      note: `That's further ahead than bookings open (${rules.maxLeadDays ?? 60} days).`,
    };
  }

  const startTimes = await searchSquareAvailability(
    [service.variationId, ...addOns.map((a) => a!.variationId)],
    new Date(start).toISOString(),
    new Date(end).toISOString(),
  );

  const byDate = new Map<string, string[]>();
  for (const iso of startTimes) {
    const d = new Date(iso);
    const key = formatInTimeZone(d, TZ, 'yyyy-MM-dd');
    const list = byDate.get(key) ?? [];
    list.push(formatInTimeZone(d, TZ, 'h:mm a').toLowerCase());
    byDate.set(key, list);
  }

  const dates = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, times]) => ({
      date,
      weekday: formatInTimeZone(sydneyMidnight(date), TZ, 'EEEE'),
      times,
    }));

  return {
    service: service.name,
    add_ons: addOns.map((a) => a!.name),
    duration_minutes: service.durationMinutes + addOns.reduce((n, a) => n + a!.durationMinutes, 0),
    timezone: 'Sydney',
    dates,
    ...(dates.length === 0
      ? {
          note: `No open times between ${formatInTimeZone(new Date(start), TZ, 'd MMM')} and ${formatInTimeZone(new Date(end), TZ, 'd MMM')}. Offer to check later dates, or suggest the booking page for cancellations.`,
        }
      : {}),
  };
}
