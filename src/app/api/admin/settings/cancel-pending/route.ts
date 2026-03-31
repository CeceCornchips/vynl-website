import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = (await sql`
      UPDATE bookings
      SET status = 'cancelled', updated_at = NOW()
      WHERE status = 'pending'
      RETURNING id
    `) as { id: string }[];

    return Response.json({ ok: true, cancelled: result.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
