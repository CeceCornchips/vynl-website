import { stripe } from '@/lib/stripe';
import { sql } from '@/lib/db';
import { sendBookingCancellation } from '@/lib/email';
import {
  fetchBookingByManageToken,
  fetchManagePolicy,
  getBookingDateTimeMillis,
  isWithinNoticeWindow,
} from '@/lib/manage-booking';

interface Params {
  params: Promise<{ token: string }>;
}

function formatAud(cents: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const body = (await request.json()) as { reason?: string };
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
    if (isWithinNoticeWindow(bookingAt, policy.cancellationHoursNotice)) {
      return Response.json({ ok: false, error: 'Too close to appointment to cancel online.' }, { status: 400 });
    }

    const amountPaid = Math.max(0, Number(booking.amount_paid_cents || 0));
    const deposit = Math.max(0, Number(booking.deposit_amount_cents || 0));
    let refundAmountCents = 0;
    if (policy.cancellationRefundPolicy === 'full') {
      refundAmountCents = amountPaid;
    } else if (policy.cancellationRefundPolicy === 'deposit_only') {
      refundAmountCents = Math.max(0, amountPaid - deposit);
    }

    let refundStatus = refundAmountCents > 0 ? 'pending' : 'none';
    let stripeRefundId: string | null = null;
    if (refundAmountCents > 0 && booking.stripe_payment_intent_id) {
      const refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        amount: refundAmountCents,
      });
      refundStatus = refund.status === 'succeeded' ? 'refunded' : 'pending';
      stripeRefundId = refund.id;
    }

    const rows = (await sql`
      UPDATE bookings
      SET
        status = 'cancelled',
        cancellation_reason = ${body.reason?.trim() || null},
        cancelled_at = NOW(),
        refund_status = ${refundStatus},
        stripe_refund_id = ${stripeRefundId},
        updated_at = NOW()
      WHERE id = ${booking.id}
      RETURNING
        id,
        customer_name,
        customer_email,
        service_name,
        booking_date::text AS booking_date,
        booking_time::text AS booking_time,
        address
    `) as {
      id: string;
      customer_name: string;
      customer_email: string;
      service_name: string;
      booking_date: string;
      booking_time: string;
      address: string;
    }[];

    if (rows[0]) {
      const refundMessage =
        refundAmountCents > 0
          ? `Your refund of ${formatAud(refundAmountCents)} will appear in 5–10 business days.`
          : undefined;
      try {
        await sendBookingCancellation({
          bookingId: rows[0].id,
          customerName: rows[0].customer_name,
          customerEmail: rows[0].customer_email,
          serviceName: rows[0].service_name,
          bookingDate: rows[0].booking_date,
          bookingTime: rows[0].booking_time,
          address: 'Vynl Studio',
          depositAmountCents: booking.deposit_amount_cents,
          refundMessage,
        });
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
      }
    }

    return Response.json({
      ok: true,
      refundAmountCents,
      refundStatus,
      stripeRefundId,
      booking: rows[0] ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

