import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { ensureServicesAdminSchema } from '@/lib/admin-services';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureServicesAdminSchema();
    const { id } = await params;

    const [stats] = (await sql`
      SELECT
        COUNT(*)::int AS booking_count,
        COALESCE(SUM(deposit_amount_cents), 0)::int AS revenue_cents,
        MAX((booking_date::text || 'T' || booking_time::text)) AS last_booked_at
      FROM bookings
      WHERE service_id = ${id}
    `) as Array<{
      booking_count: number;
      revenue_cents: number;
      last_booked_at: string | null;
    }>;

    return Response.json({ ok: true, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
