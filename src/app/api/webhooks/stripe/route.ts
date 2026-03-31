import type Stripe from 'stripe';
import { sql } from '@/lib/db';
import { sendBookingConfirmation, sendAdminNewBookingAlert } from '@/lib/email';
import { stripe } from '@/lib/stripe';
import { ensureStripeBookingColumns } from '@/lib/stripe-migration';
import { getBookingSettings } from '@/lib/settings-db';
import { ensureClientsSchema } from '@/lib/clients-migration';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ ok: false, error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ ok: false, error: 'Webhook secret not configured.' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  try {
    await ensureStripeBookingColumns();
    await ensureClientsSchema();

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const updated = (await sql`
        UPDATE bookings
        SET
          payment_status = 'deposit_paid',
          amount_paid_cents = ${paymentIntent.amount_received},
          stripe_payment_intent_id = ${paymentIntent.id},
          status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
          deposit_paid = true,
          updated_at = NOW()
        WHERE stripe_payment_intent_id = ${paymentIntent.id}
        RETURNING
          id,
          client_id,
          customer_name,
          customer_email,
          service_name,
          booking_date,
          booking_time,
          deposit_amount_cents,
          manage_token
      `) as {
        id: string;
        client_id: number | null;
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
        const booking = updated[0];

        // Update client spend
        if (booking.client_id) {
          try {
            await sql`
              UPDATE clients SET
                total_spend_cents = total_spend_cents + ${paymentIntent.amount_received},
                visit_count = visit_count + 1,
                last_visited_at = NOW(),
                updated_at = NOW()
              WHERE id = ${booking.client_id}
            `;
          } catch {
            // Non-fatal
          }
        }

        try {
          const bookingSettings = await getBookingSettings();
          await sendBookingConfirmation({
            bookingId: booking.id,
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            serviceName: booking.service_name,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time,
            address: 'Vynl Studio',
            depositAmountCents: booking.deposit_amount_cents,
            manageToken: booking.manage_token,
            customerRescheduleEnabled: bookingSettings.customerRescheduleEnabled,
            customerCancelEnabled: bookingSettings.customerCancelEnabled,
          });
          await sendAdminNewBookingAlert({
            bookingId: booking.id,
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            serviceName: booking.service_name,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time,
            address: 'Vynl Studio',
            depositAmountCents: booking.deposit_amount_cents,
          }).catch((e) => console.error('Admin new booking email failed:', e));
        } catch (emailError) {
          console.error('Failed to send booking confirmation email:', emailError);
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await sql`
        UPDATE bookings
        SET payment_status = 'failed', updated_at = NOW()
        WHERE stripe_payment_intent_id = ${paymentIntent.id}
      `;
    }
  } catch (error) {
    console.error('Stripe webhook handling failed:', error);
  }

  return Response.json({ received: true });
}
