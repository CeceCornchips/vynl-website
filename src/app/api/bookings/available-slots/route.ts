import { sql } from '@/lib/db';
import {
  computeAvailableSlots,
  timeStrToMinutes,
  type ExistingBookingBlock,
} from '@/lib/booking-availability';
import { fetchParsedBookingSettings } from '@/lib/settings-db';

function formatSlotLabel(hhmmss: string): string {
  const parts = hhmmss.split(':').map((x) => Number(x));
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dateStr = url.searchParams.get('date');
    const serviceId = url.searchParams.get('serviceId');
    const excludeBookingId = url.searchParams.get('excludeBookingId');

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return Response.json({ ok: false, error: 'Missing or invalid date.' }, { status: 400 });
    }
    if (!serviceId?.trim()) {
      return Response.json({ ok: false, error: 'Missing serviceId.' }, { status: 400 });
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
      return Response.json({ ok: true, slots: [] });
    }

    const parsed = await fetchParsedBookingSettings();

    const bookingRows = (await sql`
      SELECT b.booking_time::text AS booking_time,
             COALESCE(s.duration_minutes, 60)::int AS duration_minutes
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE b.booking_date = ${dateStr}::date
        AND b.status <> 'cancelled'
        AND (${excludeBookingId}::text IS NULL OR b.id <> ${excludeBookingId})
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
        AND (${excludeBookingId}::text IS NULL OR id <> ${excludeBookingId})
    `) as { c: number }[];

    const bookingCount = countRows[0]?.c ?? 0;
    const computed = computeAvailableSlots(
      dateStr,
      Math.max(1, Number(services[0].duration_minutes)),
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

    const slots = computed.slots.map((s) => ({
      time: s.slice(0, 5),
      available: true,
      label: formatSlotLabel(s),
    }));

    return Response.json({ ok: true, slots });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
