import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { ensureClientsSchema } from '@/lib/clients-migration';
import type { ClientVehicle } from '@/types/database';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; vehicleId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { id, vehicleId } = await params;
  const clientId = parseInt(id, 10);
  const vId = parseInt(vehicleId, 10);
  if (isNaN(clientId) || isNaN(vId)) {
    return Response.json({ ok: false, error: 'Invalid ID.' }, { status: 400 });
  }

  try {
    await ensureClientsSchema();

    const body = (await request.json()) as Partial<{
      make: string | null;
      model: string | null;
      year: number | null;
      colour: string | null;
      rego: string | null;
      notes: string | null;
      is_primary: boolean;
    }>;

    if (body.is_primary) {
      await sql`UPDATE client_vehicles SET is_primary = false WHERE client_id = ${clientId}`;
    }

    const [vehicle] = (await sql`
      UPDATE client_vehicles SET
        make = CASE WHEN ${body.make !== undefined} THEN ${body.make ?? null} ELSE make END,
        model = CASE WHEN ${body.model !== undefined} THEN ${body.model ?? null} ELSE model END,
        year = CASE WHEN ${body.year !== undefined} THEN ${body.year ?? null} ELSE year END,
        colour = CASE WHEN ${body.colour !== undefined} THEN ${body.colour ?? null} ELSE colour END,
        rego = CASE WHEN ${body.rego !== undefined} THEN ${body.rego ?? null} ELSE rego END,
        notes = CASE WHEN ${body.notes !== undefined} THEN ${body.notes ?? null} ELSE notes END,
        is_primary = CASE WHEN ${body.is_primary !== undefined} THEN ${body.is_primary ?? false} ELSE is_primary END
      WHERE id = ${vId} AND client_id = ${clientId}
      RETURNING id, client_id, make, model, year, colour, rego, notes, is_primary,
                created_at::text AS created_at
    `) as ClientVehicle[];

    if (!vehicle) return Response.json({ ok: false, error: 'Vehicle not found.' }, { status: 404 });

    return Response.json({ ok: true, vehicle });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; vehicleId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { id, vehicleId } = await params;
  const clientId = parseInt(id, 10);
  const vId = parseInt(vehicleId, 10);
  if (isNaN(clientId) || isNaN(vId)) {
    return Response.json({ ok: false, error: 'Invalid ID.' }, { status: 400 });
  }

  try {
    await ensureClientsSchema();
    await sql`DELETE FROM client_vehicles WHERE id = ${vId} AND client_id = ${clientId}`;
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
