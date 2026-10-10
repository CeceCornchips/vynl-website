import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { ensureBookingCalendarColumns } from '@/lib/bookings-db';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureBookingCalendarColumns();
    const url = new URL(request.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      return Response.json(
        { ok: false, error: 'Missing or invalid start/end (YYYY-MM-DD).' },
        { status: 400 },
      );
    }

    const bookings = (await sql`
      SELECT
        b.id,
        b.customer_id,
        b.customer_name,
        b.customer_email,
        b.customer_phone,
        b.service_id,
        b.service_name,
        b.booking_date::text AS booking_date,
        b.booking_time::text AS booking_time,
        b.notes,
        b.status,
        b.deposit_paid,
        b.deposit_amount_cents,
        b.stripe_payment_intent_id,
        b.google_calendar_event_id,
        b.calendar_duration_minutes,
        b.inspo_images,
        b.addons,
        b.created_at,
        b.updated_at,
        s.duration_minutes AS service_duration_minutes
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE b.booking_date >= ${start}::date
        AND b.booking_date <= ${end}::date
      ORDER BY b.booking_date ASC, b.booking_time ASC, b.created_at ASC
    `) as Record<string, unknown>[];

    return Response.json({ ok: true, bookings });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
