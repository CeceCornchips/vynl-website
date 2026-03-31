import { sql } from '@/lib/db';
import {
  computeAvailableSlots,
  timeStrToMinutes,
  type ExistingBookingBlock,
} from '@/lib/booking-availability';
import { fetchParsedBookingSettings } from '@/lib/settings-db';

/**
 * GET /api/booking/availability?date=YYYY-MM-DD&serviceId=uuid
 * Returns slot start times as "HH:mm:ss" strings (Postgres TIME compatible).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dateStr = url.searchParams.get('date');
    const serviceId = url.searchParams.get('serviceId');

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return Response.json(
        { ok: false, error: 'Missing or invalid date (use YYYY-MM-DD).' },
        { status: 400 },
      );
    }
    if (!serviceId?.trim()) {
      return Response.json(
        { ok: false, error: 'Missing serviceId.' },
        { status: 400 },
      );
    }

    const services = (await sql`
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

    if (services.length === 0 || !services[0].is_active) {
      return Response.json({ ok: true, available: false, slots: [] as string[] });
    }

    const durationMins = Math.max(1, Number(services[0].duration_minutes));

    const parsed = await fetchParsedBookingSettings();

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

    const bookingCount = countRows[0]?.c ?? 0;

    const { available, slots } = computeAvailableSlots(
      dateStr,
      durationMins,
      parsed,
      existing,
      bookingCount,
      new Date(),
      undefined,
      {
        serviceBufferTimeMins: services[0].buffer_time_mins,
        serviceMaxBookingsPerDay: services[0].max_bookings_per_day,
        maxAdvanceDaysCap: 60,
      },
    );

    return Response.json({ ok: true, available, slots });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
