import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
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

    if (!from || !to || !isYmd(from) || !isYmd(to)) {
      return Response.json({ ok: false, error: 'from and to are required (YYYY-MM-DD).' }, { status: 400 });
    }

    const rows = await sql`
      SELECT
        b.service_name,
        COALESCE(SUM(COALESCE(s.price_cents, 0)), 0)::int AS total_revenue,
        COUNT(*)::int AS booking_count
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE
        b.booking_date >= ${from}::date
        AND b.booking_date <= ${to}::date
        AND b.status IN ('confirmed', 'completed')
      GROUP BY b.service_name
      ORDER BY total_revenue DESC, b.service_name ASC
    `;

    return Response.json({ ok: true, services: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
