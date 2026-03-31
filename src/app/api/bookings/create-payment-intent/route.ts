import { sql } from '@/lib/db';
import { sendBookingConfirmation } from '@/lib/email';
import { stripe } from '@/lib/stripe';
import { ensureStripeBookingColumns } from '@/lib/stripe-migration';
import { getBookingSettings } from '@/lib/settings-db';

interface CreatePaymentIntentBody {
  bookingId: string;
  serviceId: string;
  depositType: 'percentage' | 'fixed' | 'none';
  depositValue: number;
  totalPriceCents: number;
}

function toDepositCents(body: CreatePaymentIntentBody): number {
  let safeDeposit = Number.isFinite(body.depositValue) ? body.depositValue : 0;
  const safeTotal = Math.max(0, Number(body.totalPriceCents) || 0);

  if (body.depositType === 'percentage') {
    // Some legacy/admin flows store percentage-style deposits in cents (e.g. 4000 => 40.00%).
    // Normalize those values so we don't accidentally overcharge.
    if (safeDeposit > 100) {
      safeDeposit = safeDeposit / 100;
    }
    return Math.max(0, Math.round((safeTotal * safeDeposit) / 100));
  }
  if (body.depositType === 'fixed') {
    return Math.max(0, Math.round(safeDeposit * 100));
  }
  return 0;
}

function validateDepositAmount(
  depositType: CreatePaymentIntentBody['depositType'],
  depositCents: number,
  totalPriceCents: number,
): string | null {
  if (depositCents < 0) return 'Deposit amount cannot be negative.';
  if (totalPriceCents < 0) return 'Total price cannot be negative.';

  if (depositType === 'percentage' && depositCents > totalPriceCents) {
    return 'Percentage deposit cannot exceed the total service price.';
  }

  if (depositType === 'fixed' && depositCents > totalPriceCents) {
    return 'Fixed deposit cannot exceed the total service price.';
  }

  return null;
}

export async function POST(request: Request) {
  try {
    await ensureStripeBookingColumns();

    const body = (await request.json()) as CreatePaymentIntentBody;
    const bookingId = body.bookingId?.trim();
    const serviceId = body.serviceId?.trim();

    if (!bookingId || !serviceId || !Number.isFinite(Number(body.totalPriceCents))) {
      return Response.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const depositCents = toDepositCents(body);
    const validationError = validateDepositAmount(
      body.depositType,
      depositCents,
      Math.max(0, Number(body.totalPriceCents) || 0),
    );
    if (validationError) {
      return Response.json({ ok: false, error: validationError }, { status: 400 });
    }

    if (depositCents === 0) {
      const updated = (await sql`
        UPDATE bookings
        SET
          payment_status = 'unpaid',
          amount_paid_cents = 0,
          deposit_amount_cents = 0,
          status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
          updated_at = NOW()
        WHERE id = ${bookingId}
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
        const booking = updated[0];
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
            depositAmountCents: 0,
            manageToken: booking.manage_token,
            customerRescheduleEnabled: bookingSettings.customerRescheduleEnabled,
            customerCancelEnabled: bookingSettings.customerCancelEnabled,
          });
        } catch (emailError) {
          console.error('Failed to send booking confirmation email:', emailError);
        }
      }

      return Response.json({
        ok: true,
        clientSecret: null,
        depositAmountCents: 0,
        isFree: true,
      });
    }

    const chargeAmount = Math.max(50, depositCents);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: 'aud',
      metadata: {
        bookingId,
        serviceId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    await sql`
      UPDATE bookings
      SET
        stripe_payment_intent_id = ${paymentIntent.id},
        stripe_customer_id = ${typeof paymentIntent.customer === 'string' ? paymentIntent.customer : null},
        deposit_amount_cents = ${chargeAmount},
        payment_status = 'unpaid',
        updated_at = NOW()
      WHERE id = ${bookingId}
    `;

    return Response.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      depositAmountCents: chargeAmount,
      isFree: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
