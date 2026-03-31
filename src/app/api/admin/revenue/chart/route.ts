import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

type GroupBy = 'day' | 'week' | 'month';

function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseGroupBy(value: string | null): GroupBy {
  if (value === 'week' || value === 'month') return value;
  return 'day';
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const from = url.searchParams.get('from')?.trim() ?? '';
    const to = url.searchParams.get('to')?.trim() ?? '';
    const groupBy = parseGroupBy(url.searchParams.get('groupBy'));

    if (!from || !to || !isYmd(from) || !isYmd(to)) {
      return Response.json({ ok: false, error: 'from and to are required (YYYY-MM-DD).' }, { status: 400 });
    }

    const chartRows = await sql`
      SELECT
        CASE
          WHEN ${groupBy} = 'week' THEN to_char(date_trunc('week', b.booking_date), 'YYYY-MM-DD')
          WHEN ${groupBy} = 'month' THEN to_char(date_trunc('month', b.booking_date), 'YYYY-MM')
          ELSE to_char(date_trunc('day', b.booking_date), 'YYYY-MM-DD')
        END AS date,
        COALESCE(SUM(COALESCE(s.price_cents, 0)), 0)::int AS revenue
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE
        b.booking_date >= ${from}::date
        AND b.booking_date <= ${to}::date
        AND b.status IN ('confirmed', 'completed')
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return Response.json({ ok: true, points: chartRows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
