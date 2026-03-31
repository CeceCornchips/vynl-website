import { sql } from '@/lib/db';
import {
  addCalendarDaysYmd,
  computeAvailableSlots,
  timeStrToMinutes,
  type ExistingBookingBlock,
} from '@/lib/booking-availability';
import { BUSINESS_TIMEZONE } from '@/lib/booking-settings';
import { fetchParsedBookingSettings } from '@/lib/settings-db';
import { formatInTimeZone } from 'date-fns-tz';

function toLabel(hhmmss: string): string {
  const parts = hhmmss.split(':').map((x) => Number(x));
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export async function GET(request: Request) {
  try {
    const serviceId = new URL(request.url).searchParams.get('serviceId');
    if (!serviceId?.trim()) {
      return Response.json({ ok: false, error: 'Missing serviceId.' }, { status: 400 });
    }

    const rows = (await sql`
      SELECT duration_minutes, is_active, buffer_time_mins, max_bookings_per_day
      FROM services
      WHERE id = ${serviceId}
      LIMIT 1
    `) as {
      duration_minutes: number;
      is_active: boolean;
      buffer_time_mins: number;
      max_bookings_per_day: number | null;
    }[];

    if (!rows[0] || !rows[0].is_active) {
      return Response.json({ ok: true, date: null, slots: [] });
    }

    const parsed = await fetchParsedBookingSettings();
    const today = formatInTimeZone(new Date(), BUSINESS_TIMEZONE, 'yyyy-MM-dd');

    for (let dayOffset = 1; dayOffset <= 60; dayOffset += 1) {
      const dateStr = addCalendarDaysYmd(today, dayOffset);

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

      const countRows = (await sql`
        SELECT COUNT(*)::int AS c
        FROM bookings
        WHERE booking_date = ${dateStr}::date
          AND status <> 'cancelled'
      `) as { c: number }[];

      const computed = computeAvailableSlots(
        dateStr,
        Math.max(1, Number(rows[0].duration_minutes)),
        parsed,
        existing,
        countRows[0]?.c ?? 0,
        new Date(),
        undefined,
        {
          serviceBufferTimeMins: rows[0].buffer_time_mins,
          serviceMaxBookingsPerDay: rows[0].max_bookings_per_day,
          maxAdvanceDaysCap: 60,
        },
      );

      if (computed.slots.length > 0) {
        return Response.json({
          ok: true,
          date: dateStr,
          slots: computed.slots.map((s) => ({
            time: s.slice(0, 5),
            available: true,
            label: toLabel(s),
          })),
        });
      }
    }

    return Response.json({ ok: true, date: null, slots: [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
