import { sql } from '@/lib/db';
import { sendBookingReschedule } from '@/lib/email';
import {
  fetchBookingByManageToken,
  fetchManagePolicy,
  getBookingDateTimeMillis,
  isWithinNoticeWindow,
} from '@/lib/manage-booking';
import { computeAvailableSlots, timeStrToMinutes, type ExistingBookingBlock } from '@/lib/booking-availability';
import { fetchParsedBookingSettings } from '@/lib/settings-db';

interface Params {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const body = (await request.json()) as { newDate?: string; newTime?: string };
    if (!body.newDate || !body.newTime) {
      return Response.json({ ok: false, error: 'Missing newDate/newTime.' }, { status: 400 });
    }

    const booking = await fetchBookingByManageToken(token);
    if (!booking || !booking.manage_token_expires_at || new Date(booking.manage_token_expires_at).getTime() < Date.now()) {
      return Response.json({ ok: false, error: 'This link has expired. Please contact us.' }, { status: 410 });
    }
    if (booking.status === 'cancelled') {
      return Response.json({ ok: false, error: 'Booking is already cancelled.' }, { status: 400 });
    }

    const bookingAt = getBookingDateTimeMillis(booking.booking_date, booking.booking_time);
    if (bookingAt < Date.now()) {
      return Response.json({ ok: false, error: 'This appointment has already passed.' }, { status: 400 });
    }

    const policy = await fetchManagePolicy();
    if (isWithinNoticeWindow(bookingAt, policy.rescheduleHoursNotice)) {
      return Response.json({ ok: false, error: 'Too close to appointment to reschedule online.' }, { status: 400 });
    }

    const svc = (await sql`
      SELECT duration_minutes, buffer_time_mins, max_bookings_per_day
      FROM services
      WHERE id = ${booking.service_id}
      LIMIT 1
    `) as { duration_minutes: number; buffer_time_mins: number; max_bookings_per_day: number | null }[];
    if (!svc[0]) {
      return Response.json({ ok: false, error: 'Service not found.' }, { status: 404 });
    }

    const bookingRows = (await sql`
      SELECT b.booking_time::text AS booking_time, COALESCE(s.duration_minutes, 60)::int AS duration_minutes
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE b.booking_date = ${body.newDate}::date
        AND b.status <> 'cancelled'
        AND b.id <> ${booking.id}
    `) as { booking_time: string; duration_minutes: number }[];
    const existing: ExistingBookingBlock[] = bookingRows.map((r) => ({
      startMinutes: timeStrToMinutes(r.booking_time.trim()),
      durationMins: Math.max(1, Number(r.duration_minutes)),
    }));
    const countRows = (await sql`
      SELECT COUNT(*)::int AS c
      FROM bookings
      WHERE booking_date = ${body.newDate}::date
        AND status <> 'cancelled'
        AND id <> ${booking.id}
    `) as { c: number }[];
    const parsed = await fetchParsedBookingSettings();
    const computed = computeAvailableSlots(
      body.newDate,
      Math.max(1, Number(svc[0].duration_minutes)),
      parsed,
      existing,
      countRows[0]?.c ?? 0,
      new Date(),
      undefined,
      {
        serviceBufferTimeMins: svc[0].buffer_time_mins,
        serviceMaxBookingsPerDay: svc[0].max_bookings_per_day,
        maxAdvanceDaysCap: 60,
      },
    );
    const normalizedTime = `${body.newTime.slice(0, 5)}:00`;
    if (!computed.slots.includes(normalizedTime)) {
      return Response.json({ ok: false, error: 'Selected slot is not available.' }, { status: 400 });
    }

    const updated = (await sql`
      UPDATE bookings
      SET
        rescheduled_from_date = booking_date,
        rescheduled_from_time = booking_time::text,
        booking_date = ${body.newDate}::date,
        booking_time = ${normalizedTime}::time,
        updated_at = NOW()
      WHERE id = ${booking.id}
      RETURNING
        id,
        customer_name,
        customer_email,
        service_name,
        booking_date::text AS booking_date,
        booking_time::text AS booking_time,
        deposit_amount_cents,
        manage_token
    `) as {
      id: string;
      customer_name: string;
      customer_email: string;
      service_name: string;
      booking_date: string;
      booking_time: string;
      address: string;
      deposit_amount_cents: number;
      manage_token: string | null;
    }[];

    if (updated[0]) {
      try {
        await sendBookingReschedule({
          bookingId: updated[0].id,
          customerName: updated[0].customer_name,
          customerEmail: updated[0].customer_email,
          serviceName: updated[0].service_name,
          bookingDate: updated[0].booking_date,
          bookingTime: updated[0].booking_time,
          address: 'Vynl Studio',
          depositAmountCents: updated[0].deposit_amount_cents,
          manageToken: updated[0].manage_token,
        });
      } catch (emailError) {
        console.error('Failed to send reschedule confirmation email:', emailError);
      }
    }

    return Response.json({ ok: true, booking: updated[0] ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

