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
    const body = (await request.json()) as { id: string; status: BookingStatus };
    const { id, status } = body;

    if (!id?.trim() || !status) {
      return Response.json({ ok: false, error: 'Missing id or status.' }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return Response.json({ ok: false, error: 'Invalid status value.' }, { status: 400 });
    }

    const result = (await sql`
      UPDATE bookings
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `) as { id: string }[];

    if (result.length === 0) {
      return Response.json({ ok: false, error: 'Booking not found.' }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
