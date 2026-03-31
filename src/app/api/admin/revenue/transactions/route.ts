import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { ensureStripeBookingColumns } from '@/lib/stripe-migration';

function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureStripeBookingColumns();

    const url = new URL(request.url);
    const from = url.searchParams.get('from')?.trim() ?? '';
    const to = url.searchParams.get('to')?.trim() ?? '';

    if ((from && !isYmd(from)) || (to && !isYmd(to))) {
      return Response.json({ ok: false, error: 'Invalid from/to date. Use YYYY-MM-DD.' }, { status: 400 });
    }

    const transactions = await sql`
      SELECT
        b.id,
        b.booking_date::text AS booking_date,
        b.customer_name,
        b.service_name,
        COALESCE(s.price_cents, 0)::int AS price_cents,
        COALESCE(b.deposit_amount_cents, 0)::int AS deposit_cents,
        GREATEST(COALESCE(s.price_cents, 0) - COALESCE(b.amount_paid_cents, 0), 0)::int AS balance_cents,
        b.status,
        COALESCE(b.payment_status, 'unpaid')::text AS payment_status,
        COALESCE(b.amount_paid_cents, 0)::int AS amount_paid_cents
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE
        (${from} = '' OR b.booking_date >= ${from}::date)
        AND (${to} = '' OR b.booking_date <= ${to}::date)
      ORDER BY b.booking_date DESC, b.created_at DESC
    `;

    return Response.json({ ok: true, transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
