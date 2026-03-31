import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import type { BookingStatus } from '@/types/database';

const VALID_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { ids: string[]; status: BookingStatus };
    const { ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ ok: false, error: 'ids must be a non-empty array.' }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return Response.json({ ok: false, error: 'Invalid status value.' }, { status: 400 });
    }

    await sql`
      UPDATE bookings
      SET status = ${status}, updated_at = NOW()
      WHERE id = ANY(${ids}::uuid[])
    `;

    return Response.json({ ok: true, updated: ids.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
