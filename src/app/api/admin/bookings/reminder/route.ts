import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { sendBookingReminder } from '@/lib/email';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { id: string };
    const { id } = body;
    if (!id?.trim()) {
      return Response.json({ ok: false, error: 'Missing id.' }, { status: 400 });
    }

    const rows = (await sql`
      SELECT
        id,
        customer_name,
        customer_email,
        service_name,
        booking_date::text AS booking_date,
        booking_time::text AS booking_time,
        deposit_amount_cents
      FROM bookings
      WHERE id = ${id}
      LIMIT 1
    `) as {
      id: string;
      customer_name: string;
      customer_email: string;
      service_name: string;
      booking_date: string;
      booking_time: string;
      address: string;
      deposit_amount_cents: number;
    }[];

    if (rows.length === 0) {
      return Response.json({ ok: false, error: 'Booking not found.' }, { status: 404 });
    }

    const b = rows[0];
    await sendBookingReminder({
      bookingId: b.id,
      customerName: b.customer_name,
      customerEmail: b.customer_email,
      serviceName: b.service_name,
      bookingDate: b.booking_date,
      bookingTime: b.booking_time,
      
      depositAmountCents: b.deposit_amount_cents,
    });

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
