/**
 * Booking schedule settings stored in `settings` table (key/value).
 * Used by admin UI, public booking page, and availability API.
 */

export const BUSINESS_TIMEZONE =
  process.env.BUSINESS_TIMEZONE ?? 'Australia/Sydney';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayWorkingHours {
  enabled: boolean;
  /** 24h "HH:mm" */
  start: string;
  /** 24h "HH:mm" */
  end: string;
}

export type WorkingHours = Record<DayKey, DayWorkingHours>;

export const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  mon: { enabled: true, start: '08:00', end: '17:00' },
  tue: { enabled: true, start: '08:00', end: '17:00' },
  wed: { enabled: true, start: '08:00', end: '17:00' },
  thu: { enabled: true, start: '08:00', end: '17:00' },
  fri: { enabled: true, start: '08:00', end: '17:00' },
  sat: { enabled: true, start: '08:00', end: '13:00' },
  sun: { enabled: false, start: '08:00', end: '17:00' },
};

export interface ParsedBookingSettings {
  workingHours: WorkingHours;
  slotDurationMins: number;
  bufferTimeMins: number;
  leadTimeHours: number;
  maxBookingsPerDay: number;
  advanceBookingDays: number;
  blackoutDates: string[];
  bookingPageTitle: string;
  bookingPageDescription: string;
  bookingShowPrice: boolean;
  bookingShowDuration: boolean;
  bookingRequirePhone: boolean;
  bookingRequireNotes: boolean;
}

export const BOOKING_SETTINGS_KEYS = [
  'working_hours',
  'slot_duration_mins',
  'buffer_time_mins',
  'lead_time_hours',
  'max_bookings_per_day',
  'advance_booking_days',
  'blackout_dates',
  'booking_page_title',
  'booking_page_description',
  'booking_show_price',
  'booking_show_duration',
  'booking_require_phone',
  'booking_require_notes',
] as const;

/** Subset exposed to the public booking page (no admin-only keys). */
export const PUBLIC_BOOKING_SETTINGS_KEYS = BOOKING_SETTINGS_KEYS;

export function parseWorkingHours(raw: string | null | undefined): WorkingHours {
  if (!raw?.trim()) return { ...DEFAULT_WORKING_HOURS };
  try {
    const parsed = JSON.parse(raw) as Partial<WorkingHours>;
    const out = { ...DEFAULT_WORKING_HOURS };
    for (const k of DAY_ORDER) {
      const d = parsed[k];
      if (d && typeof d === 'object') {
        out[k] = {
          enabled: Boolean(d.enabled),
          start: typeof d.start === 'string' ? d.start : out[k].start,
          end: typeof d.end === 'string' ? d.end : out[k].end,
        };
      }
    }
    return out;
  } catch {
    return { ...DEFAULT_WORKING_HOURS };
  }
}

export function parseBlackoutDates(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x));
  } catch {
    return [];
  }
}

export function parseBookingSettings(
  settings: Record<string, string | null | undefined>,
): ParsedBookingSettings {
  const slot = Number(settings.slot_duration_mins ?? 60);
  const buffer = Number(settings.buffer_time_mins ?? 0);
  const lead = Number(
    settings.lead_time_hours ?? settings.booking_lead_time_hours ?? 24,
  );
  const max = Number(settings.max_bookings_per_day ?? 10);
  const advance = Number(settings.advance_booking_days ?? 30);

  return {
    workingHours: parseWorkingHours(settings.working_hours ?? null),
    slotDurationMins: Number.isFinite(slot) && slot > 0 ? slot : 60,
    bufferTimeMins: Number.isFinite(buffer) && buffer >= 0 ? buffer : 0,
    leadTimeHours: Number.isFinite(lead) && lead >= 0 ? lead : 24,
    maxBookingsPerDay: Number.isFinite(max) && max >= 1 ? Math.min(20, max) : 10,
    advanceBookingDays: Number.isFinite(advance) && advance >= 1 ? advance : 30,
    blackoutDates: parseBlackoutDates(settings.blackout_dates ?? null),
    bookingPageTitle: settings.booking_page_title?.trim() || 'Book Your Detail',
    bookingPageDescription:
      settings.booking_page_description?.trim() ||
      'We come to you — choose a service and pick your preferred time.',
    bookingShowPrice: (settings.booking_show_price ?? 'true') !== 'false',
    bookingShowDuration: (settings.booking_show_duration ?? 'true') !== 'false',
    bookingRequirePhone: (settings.booking_require_phone ?? 'true') === 'true',
    bookingRequireNotes: (settings.booking_require_notes ?? 'false') === 'true',
  };
}

/** YYYY-MM-DD weekday in UTC (calendar day). */
export function dayKeyFromDateStr(dateStr: string): DayKey {
  const [y, m, d] = dateStr.split('-').map(Number);
  const jd = new Date(Date.UTC(y, m - 1, d));
  const keys: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return keys[jd.getUTCDay()];
}
