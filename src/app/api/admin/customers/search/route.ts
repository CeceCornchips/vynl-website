import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export type CustomerSearchResult = {
  id: string;
  name: string;
  email: string;
  phone: string;
  booking_count: number;
};

/** Strip characters that break LIKE patterns; keep search useful. */
function sanitizeQuery(q: string): string {
  return q.replace(/[%_\\]/g, '').trim().slice(0, 80);
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('q') ?? '';
  const q = sanitizeQuery(raw);
  if (q.length < 1) {
    return Response.json({ ok: true, customers: [] as CustomerSearchResult[] });
  }

  const pattern = `%${q}%`;

  try {
    const rows = (await sql`
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        COUNT(b.id)::int AS booking_count
      FROM customers c
      LEFT JOIN bookings b ON b.customer_id = c.id
      WHERE
        c.name ILIKE ${pattern}
        OR c.email ILIKE ${pattern}
        OR c.phone ILIKE ${pattern}
      GROUP BY c.id, c.name, c.email, c.phone
      ORDER BY
        COUNT(b.id) DESC,
        c.name ASC
      LIMIT 8
    `) as CustomerSearchResult[];

    return Response.json({ ok: true, customers: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
