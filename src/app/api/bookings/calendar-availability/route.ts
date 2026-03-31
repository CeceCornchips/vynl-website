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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const serviceId = url.searchParams.get('serviceId');
    const month = url.searchParams.get('month');
    const excludeBookingId = url.searchParams.get('excludeBookingId');

    if (!serviceId?.trim()) {
      return Response.json({ ok: false, error: 'Missing serviceId.' }, { status: 400 });
    }
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ ok: false, error: 'Missing or invalid month.' }, { status: 400 });
    }

    const [year, mm] = month.split('-').map(Number);
    const monthStart = `${year}-${String(mm).padStart(2, '0')}-01`;
    const nextMonth = mm === 12 ? `${year + 1}-01-01` : `${year}-${String(mm + 1).padStart(2, '0')}-01`;
    const monthEnd = addCalendarDaysYmd(nextMonth, -1);

    const serviceRows = (await sql`
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

    if (!serviceRows[0] || !serviceRows[0].is_active) {
      return Response.json({ ok: true, days: {} });
    }

    const parsed = await fetchParsedBookingSettings();
    const duration = Math.max(1, Number(serviceRows[0].duration_minutes));

    const bookingRows = (await sql`
      SELECT
        booking_date::text AS booking_date,
        b.booking_time::text AS booking_time,
        COALESCE(s.duration_minutes, 60)::int AS duration_minutes
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE b.booking_date >= ${monthStart}::date
        AND b.booking_date <= ${monthEnd}::date
        AND b.status <> 'cancelled'
        AND (${excludeBookingId}::text IS NULL OR b.id <> ${excludeBookingId})
    `) as { booking_date: string; booking_time: string; duration_minutes: number }[];

    const grouped: Record<string, ExistingBookingBlock[]> = {};
    for (const row of bookingRows) {
      if (!grouped[row.booking_date]) grouped[row.booking_date] = [];
      grouped[row.booking_date].push({
        startMinutes: timeStrToMinutes(row.booking_time.trim()),
        durationMins: Math.max(1, Number(row.duration_minutes)),
      });
    }

    const countRows = (await sql`
      SELECT booking_date::text AS booking_date, COUNT(*)::int AS c
      FROM bookings
      WHERE booking_date >= ${monthStart}::date
        AND booking_date <= ${monthEnd}::date
        AND status <> 'cancelled'
        AND (${excludeBookingId}::text IS NULL OR id <> ${excludeBookingId})
      GROUP BY booking_date
    `) as { booking_date: string; c: number }[];
    const countMap = new Map(countRows.map((r) => [r.booking_date, r.c]));

    const today = formatInTimeZone(new Date(), BUSINESS_TIMEZONE, 'yyyy-MM-dd');
    const maxDate = addCalendarDaysYmd(today, 60);
    const days: Record<string, 'available' | 'full' | 'closed'> = {};

    for (let date = monthStart; date <= monthEnd; date = addCalendarDaysYmd(date, 1)) {
      if (date < today || date > maxDate) {
        days[date] = 'closed';
        continue;
      }
      const computed = computeAvailableSlots(
        date,
        duration,
        parsed,
        grouped[date] ?? [],
        countMap.get(date) ?? 0,
        new Date(),
        undefined,
        {
          serviceBufferTimeMins: serviceRows[0].buffer_time_mins,
          serviceMaxBookingsPerDay: serviceRows[0].max_bookings_per_day,
          maxAdvanceDaysCap: 60,
        },
      );
      days[date] = computed.slots.length > 0 ? 'available' : 'full';
    }

    return Response.json({ ok: true, days });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
