import { formatInTimeZone } from 'date-fns-tz';
import { sql } from '@/lib/db';
import {
  addCalendarDaysYmd,
  computeAvailableSlots,
  timeStrToMinutes,
  type ExistingBookingBlock,
} from '@/lib/booking-availability';
import { BUSINESS_TIMEZONE, DAY_LABELS, dayKeyFromDateStr } from '@/lib/booking-settings';
import { fetchParsedBookingSettings } from '@/lib/settings-db';

function toLabel(hhmmss: string): string {
  const [h = 0, m = 0] = hhmmss.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
}

export interface OpenSlotsResult {
  service: string;
  duration_minutes: number;
  timezone: string;
  dates: { date: string; weekday: string; times: string[] }[];
  note?: string;
}

/**
 * Open start times for one service, using the same rules as the website's
 * booking page (working hours, buffers, lead time, blackout dates, existing
 * bookings).
 */
export async function findOpenSlots(
  serviceId: string,
  dateFrom: string,
  days: number,
): Promise<OpenSlotsResult | { error: string }> {
  // Service ids are UUIDs; anything else would make Postgres throw.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serviceId)) {
    return { error: 'Unknown service id. Use an id from the live menu.' };
  }
  const services = (await sql`
    SELECT name, duration_minutes, is_active, is_deleted, buffer_time_mins, max_bookings_per_day
    FROM services
    WHERE id = ${serviceId}
    LIMIT 1
  `) as {
    name: string;
    duration_minutes: number;
    is_active: boolean;
    is_deleted: boolean;
    buffer_time_mins: number;
    max_bookings_per_day: number | null;
  }[];
  const svc = services[0];
  if (!svc || !svc.is_active || svc.is_deleted) {
    return { error: 'Unknown service id. Use an id from the live menu.' };
  }

  const today = formatInTimeZone(new Date(), BUSINESS_TIMEZONE, 'yyyy-MM-dd');
  const start = /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) && dateFrom > today ? dateFrom : today;
  const span = Math.min(14, Math.max(1, Math.round(days) || 7));
  const parsed = await fetchParsedBookingSettings();
  const durationMins = Math.max(1, Number(svc.duration_minutes));

  const dates: OpenSlotsResult['dates'] = [];
  for (let i = 0; i < span; i += 1) {
    const dateStr = addCalendarDaysYmd(start, i);

    const bookingRows = (await sql`
      SELECT b.booking_time::text AS booking_time,
             COALESCE(s.duration_minutes, 60)::int AS duration_minutes
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE b.booking_date = ${dateStr}::date
        AND b.status <> 'cancelled'
    `) as { booking_time: string; duration_minutes: number }[];

    const existing: ExistingBookingBlock[] = bookingRows.map((r) => ({
      startMinutes: timeStrToMinutes(r.booking_time.trim()),
      durationMins: Math.max(1, Number(r.duration_minutes)),
    }));

    const { slots } = computeAvailableSlots(
      dateStr,
      durationMins,
      parsed,
      existing,
      bookingRows.length,
      new Date(),
      undefined,
      {
        serviceBufferTimeMins: svc.buffer_time_mins,
        serviceMaxBookingsPerDay: svc.max_bookings_per_day,
        maxAdvanceDaysCap: 60,
      },
    );

    if (slots.length > 0) {
      dates.push({
        date: dateStr,
        weekday: DAY_LABELS[dayKeyFromDateStr(dateStr)],
        times: slots.map(toLabel),
      });
    }
  }

  return {
    service: svc.name,
    duration_minutes: durationMins,
    timezone: 'Sydney',
    dates,
    ...(dates.length === 0
      ? { note: `No open times from ${start} for ${span} days. Offer to check later dates.` }
      : {}),
  };
}
