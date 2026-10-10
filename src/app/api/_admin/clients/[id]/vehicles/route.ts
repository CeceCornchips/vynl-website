import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { ensureClientsSchema } from '@/lib/clients-migration';
import type { ClientVehicle } from '@/types/database';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return Response.json({ ok: false, error: 'Invalid client ID.' }, { status: 400 });

  try {
    await ensureClientsSchema();

    const vehicles = (await sql`
      SELECT id, client_id, make, model, year, colour, rego, notes, is_primary,
             created_at::text AS created_at
      FROM client_vehicles
      WHERE client_id = ${clientId}
      ORDER BY is_primary DESC, created_at ASC
    `) as ClientVehicle[];

    return Response.json({ ok: true, vehicles });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return Response.json({ ok: false, error: 'Invalid client ID.' }, { status: 400 });

  try {
    await ensureClientsSchema();

    const body = (await request.json()) as {
      make?: string;
      model?: string;
      year?: number;
      colour?: string;
      rego?: string;
      notes?: string;
      is_primary?: boolean;
    };

    if (body.is_primary) {
      await sql`UPDATE client_vehicles SET is_primary = false WHERE client_id = ${clientId}`;
    }

    const [vehicle] = (await sql`
      INSERT INTO client_vehicles (client_id, make, model, year, colour, rego, notes, is_primary)
      VALUES (
        ${clientId},
        ${body.make?.trim() ?? null},
        ${body.model?.trim() ?? null},
        ${body.year ?? null},
        ${body.colour?.trim() ?? null},
        ${body.rego?.trim().toUpperCase() ?? null},
        ${body.notes?.trim() ?? null},
        ${body.is_primary ?? false}
      )
      RETURNING id, client_id, make, model, year, colour, rego, notes, is_primary,
                created_at::text AS created_at
    `) as ClientVehicle[];

    return Response.json({ ok: true, vehicle }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
