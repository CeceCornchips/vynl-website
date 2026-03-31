import { sql } from '@/lib/db';
import { sendBookingConfirmation } from '@/lib/email';
import { stripe } from '@/lib/stripe';
import { ensureBookingManageColumns } from '@/lib/booking-token-migration';
import { ensureStripeBookingColumns } from '@/lib/stripe-migration';

export async function GET(request: Request) {
  try {
    await ensureStripeBookingColumns();
    await ensureBookingManageColumns();

    const url = new URL(request.url);
    const bookingId = url.searchParams.get('bookingId')?.trim() ?? '';
    const paymentIntentId = url.searchParams.get('payment_intent')?.trim() ?? '';

    if (!bookingId) {
      return Response.json({ ok: false, error: 'Missing bookingId.' }, { status: 400 });
    }

    const rows = (await sql`
      SELECT
        b.id,
        customer_name,
        customer_email,
        service_name,
        booking_date::text AS booking_date,
        booking_time::text AS booking_time,
        deposit_amount_cents,
        amount_paid_cents,
        payment_status,
        manage_token,
        COALESCE(s.price_cents, 0)::int AS price_cents
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE b.id = ${bookingId}
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
      amount_paid_cents: number;
      payment_status: string;
      manage_token: string | null;
      price_cents: number;
    }[];

    if (!rows[0]) {
      return Response.json({ ok: false, error: 'Booking not found.' }, { status: 404 });
    }

    let paymentIntentStatus: string | null = null;
    if (paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentIntentStatus = pi.status;

      // Fallback: if webhook is unavailable, confirm booking and send email here once.
      if (pi.status === 'succeeded' && rows[0].payment_status !== 'deposit_paid') {
        const updated = (await sql`
          UPDATE bookings
          SET
            payment_status = 'deposit_paid',
            amount_paid_cents = ${pi.amount_received ?? rows[0].deposit_amount_cents},
            stripe_payment_intent_id = ${pi.id},
            status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
            deposit_paid = true,
            updated_at = NOW()
          WHERE id = ${bookingId}
            AND payment_status <> 'deposit_paid'
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
            await sendBookingConfirmation({
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
            console.error('Fallback success email failed:', emailError);
          }
        }
      }
    }

    return Response.json({
      ok: true,
      booking: rows[0],
      paymentIntentStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
