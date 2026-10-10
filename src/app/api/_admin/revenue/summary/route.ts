import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { ensureStripeBookingColumns } from '@/lib/stripe-migration';

type SummaryRow = {
  month_revenue_cents: number;
  month_bookings: number;
  month_avg_booking_value_cents: number;
  month_deposits_collected_cents: number;
  month_outstanding_balance_cents: number;
  last_month_revenue_cents: number;
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureStripeBookingColumns();

    const rows = (await sql`
      WITH month_bounds AS (
        SELECT
          date_trunc('month', CURRENT_DATE)::date AS month_start,
          (date_trunc('month', CURRENT_DATE) + interval '1 month')::date AS next_month_start,
          (date_trunc('month', CURRENT_DATE) - interval '1 month')::date AS last_month_start
      )
      SELECT
        COALESCE(SUM(
          CASE
            WHEN b.booking_date >= mb.month_start
              AND b.booking_date < mb.next_month_start
              AND b.payment_status IN ('deposit_paid', 'paid_in_full')
            THEN COALESCE(b.amount_paid_cents, 0)
            ELSE 0
          END
        ), 0)::int AS month_revenue_cents,
        COALESCE(SUM(
          CASE
            WHEN b.booking_date >= mb.month_start
              AND b.booking_date < mb.next_month_start
            THEN 1
            ELSE 0
          END
        ), 0)::int AS month_bookings,
        COALESCE(AVG(
          CASE
            WHEN b.booking_date >= mb.month_start
              AND b.booking_date < mb.next_month_start
              AND b.status IN ('confirmed', 'completed')
            THEN COALESCE(b.amount_paid_cents, 0)
            ELSE NULL
          END
        ), 0)::int AS month_avg_booking_value_cents,
        COALESCE(SUM(
          CASE
            WHEN b.booking_date >= mb.month_start
              AND b.booking_date < mb.next_month_start
              AND b.payment_status IN ('deposit_paid', 'paid_in_full')
            THEN COALESCE(b.amount_paid_cents, 0)
            ELSE 0
          END
        ), 0)::int AS month_deposits_collected_cents,
        COALESCE(SUM(
          CASE
            WHEN b.booking_date >= mb.month_start
              AND b.booking_date < mb.next_month_start
              AND b.status IN ('confirmed', 'in_progress')
            THEN GREATEST(COALESCE(s.price_cents, 0) - COALESCE(b.amount_paid_cents, 0), 0)
            ELSE 0
          END
        ), 0)::int AS month_outstanding_balance_cents,
        COALESCE(SUM(
          CASE
            WHEN b.booking_date >= mb.last_month_start
              AND b.booking_date < mb.month_start
              AND b.payment_status IN ('deposit_paid', 'paid_in_full')
            THEN COALESCE(b.amount_paid_cents, 0)
            ELSE 0
          END
        ), 0)::int AS last_month_revenue_cents
      FROM month_bounds mb
      LEFT JOIN bookings b ON true
      LEFT JOIN services s ON s.id = b.service_id
    `) as SummaryRow[];

    const summary = rows[0] ?? {
      month_revenue_cents: 0,
      month_bookings: 0,
      month_avg_booking_value_cents: 0,
      month_deposits_collected_cents: 0,
      month_outstanding_balance_cents: 0,
      last_month_revenue_cents: 0,
    };

    const percentChange =
      summary.last_month_revenue_cents === 0
        ? (summary.month_revenue_cents > 0 ? 100 : 0)
        : ((summary.month_revenue_cents - summary.last_month_revenue_cents) /
            summary.last_month_revenue_cents) *
          100;

    return Response.json({
      ok: true,
      summary: {
        ...summary,
        percent_change_vs_last_month: Number(percentChange.toFixed(2)),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
