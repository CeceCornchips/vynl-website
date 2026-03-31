import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { sendBookingReschedule } from '@/lib/email';

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      id: string;
      newDate: string;
      newTime: string;
    };

    const { id, newDate, newTime } = body;

    if (!id?.trim() || !newDate || !newTime) {
      return Response.json({ ok: false, error: 'Missing id, newDate, or newTime.' }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      return Response.json({ ok: false, error: 'Invalid newDate.' }, { status: 400 });
    }

    const rows = (await sql`
      UPDATE bookings
      SET
        booking_date = ${newDate}::date,
        booking_time = ${newTime}::time,
        updated_at = NOW()
      WHERE id = ${id}
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

    if (rows.length === 0) {
      return Response.json({ ok: false, error: 'Booking not found.' }, { status: 404 });
    }

    const b = rows[0];
    try {
      await sendBookingReschedule({
        bookingId: b.id,
        customerName: b.customer_name,
        customerEmail: b.customer_email,
        serviceName: b.service_name,
        bookingDate: b.booking_date,
        bookingTime: b.booking_time,
        
        depositAmountCents: b.deposit_amount_cents,
        manageToken: b.manage_token,
      });
    } catch (emailErr) {
      console.error('Reschedule email failed:', emailErr);
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
