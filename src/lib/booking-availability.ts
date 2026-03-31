import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { ParsedBookingSettings } from '@/lib/booking-settings';
import { BUSINESS_TIMEZONE, dayKeyFromDateStr } from '@/lib/booking-settings';

export interface ExistingBookingBlock {
  /** Minutes from midnight for appointment start */
  startMinutes: number;
  durationMins: number;
}

export interface SlotComputationOptions {
  serviceBufferTimeMins?: number;
  serviceMaxBookingsPerDay?: number | null;
  maxAdvanceDaysCap?: number;
}

function parseHHMMToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/** "HH:mm:ss" or "HH:mm" -> minutes from midnight */
export function timeStrToMinutes(t: string): number {
  const parts = t.split(':').map((x) => Number(x));
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  return h * 60 + m;
}

/** Minutes from midnight -> "HH:mm:ss" for DB */
export function minutesToTimeStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** Calendar YYYY-MM-DD + N days (UTC date math, DST-safe for limits). */
export function addCalendarDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  return `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, '0')}-${String(base.getUTCDate()).padStart(2, '0')}`;
}

function slotInstantUtc(dateStr: string, minutesFromMidnight: number, tz: string): Date {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  const wall = `${dateStr} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  return fromZonedTime(wall, tz);
}

/**
 * Returns available start times as "HH:mm:ss" strings for the given calendar date.
 */
export function computeAvailableSlots(
  dateStr: string,
  serviceDurationMins: number,
  parsed: ParsedBookingSettings,
  existing: ExistingBookingBlock[],
  bookingCountForDay: number,
  now: Date = new Date(),
  tz: string = BUSINESS_TIMEZONE,
  options: SlotComputationOptions = {},
): { available: boolean; slots: string[] } {
  const {
    workingHours,
    slotDurationMins,
    bufferTimeMins,
    leadTimeHours,
    maxBookingsPerDay,
    advanceBookingDays,
    blackoutDates,
  } = parsed;

  if (blackoutDates.includes(dateStr)) {
    return { available: false, slots: [] };
  }

  const todayStr = formatInTimeZone(now, tz, 'yyyy-MM-dd');
  const cappedAdvanceDays = Math.min(
    Number.isFinite(options.maxAdvanceDaysCap) ? Math.max(1, Number(options.maxAdvanceDaysCap)) : 60,
    Math.max(1, advanceBookingDays),
  );
  const maxStr = addCalendarDaysYmd(todayStr, cappedAdvanceDays);

  if (dateStr < todayStr || dateStr > maxStr) {
    return { available: false, slots: [] };
  }

  const effectiveMaxBookingsPerDay =
    options.serviceMaxBookingsPerDay != null
      ? Math.max(1, Number(options.serviceMaxBookingsPerDay))
      : maxBookingsPerDay;

  if (bookingCountForDay >= effectiveMaxBookingsPerDay) {
    return { available: false, slots: [] };
  }

  const dayKey = dayKeyFromDateStr(dateStr);
  const wh = workingHours[dayKey];
  if (!wh.enabled) {
    return { available: false, slots: [] };
  }

  const startM = parseHHMMToMinutes(wh.start);
  const endM = parseHHMMToMinutes(wh.end);
  if (startM >= endM) {
    return { available: false, slots: [] };
  }

  const step = Math.max(5, slotDurationMins);
  const leadMs = leadTimeHours * 60 * 60 * 1000;
  const leadCutoff = new Date(now.getTime() + leadMs);

  const D = Math.max(1, serviceDurationMins);
  const effectiveBufferMins =
    options.serviceBufferTimeMins != null
      ? Math.max(0, Number(options.serviceBufferTimeMins))
      : Math.max(0, bufferTimeMins);
  const slots: string[] = [];

  const sorted = [...existing]
    .map((b) => ({
      start: Math.max(startM, b.startMinutes),
      end: Math.min(endM, b.startMinutes + b.durationMins + effectiveBufferMins),
    }))
    .filter((b) => b.end > startM && b.start < endM)
    .sort((a, b) => a.start - b.start);

  const freeWindows: Array<{ start: number; end: number }> = [];
  if (sorted.length === 0) {
    freeWindows.push({ start: startM, end: endM });
  } else {
    if (startM < sorted[0].start) {
      freeWindows.push({ start: startM, end: sorted[0].start });
    }
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (a.end < b.start) {
        freeWindows.push({ start: a.end, end: b.start });
      }
    }
    if (sorted[sorted.length - 1].end < endM) {
      freeWindows.push({ start: sorted[sorted.length - 1].end, end: endM });
    }
  }

  for (const w of freeWindows) {
    for (let t = w.start; t + D <= w.end; t += step) {
      const slotStart = slotInstantUtc(dateStr, t, tz);
      if (slotStart.getTime() < leadCutoff.getTime()) continue;
      slots.push(minutesToTimeStr(t));
    }
  }

  return { available: slots.length > 0, slots };
}
