import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { ensureClientsSchema } from '@/lib/clients-migration';
import type { Client, ClientVehicle, Booking } from '@/types/database';
import { computeClientTags } from '@/types/database';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return Response.json({ ok: false, error: 'Invalid client ID.' }, { status: 400 });

  try {
    await ensureClientsSchema();

    const [client] = (await sql`
      SELECT
        id, full_name, email, phone, notes, tags,
        total_spend_cents, visit_count,
        last_visited_at::text AS last_visited_at,
        is_vip, marketing_opt_in,
        created_at::text AS created_at,
        updated_at::text AS updated_at
      FROM clients
      WHERE id = ${clientId}
    `) as Client[];

    if (!client) return Response.json({ ok: false, error: 'Client not found.' }, { status: 404 });

    const vehicles = (await sql`
      SELECT id, client_id, make, model, year, colour, rego, notes, is_primary,
             created_at::text AS created_at
      FROM client_vehicles
      WHERE client_id = ${clientId}
      ORDER BY is_primary DESC, created_at ASC
    `) as ClientVehicle[];

    const bookings = (await sql`
      SELECT
        id, service_name,
        booking_date::text AS booking_date,
        booking_time::text AS booking_time,
        status, payment_status, deposit_paid, deposit_amount_cents, amount_paid_cents,
        created_at::text AS created_at
      FROM bookings
      WHERE client_id = ${clientId}
      ORDER BY booking_date DESC, booking_time DESC
    `) as Partial<Booking>[];

    return Response.json({
      ok: true,
      client: { ...client, computed_tags: computeClientTags(client) },
      vehicles,
      bookings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return Response.json({ ok: false, error: 'Invalid client ID.' }, { status: 400 });

  try {
    await ensureClientsSchema();

    const body = (await request.json()) as Partial<{
      full_name: string;
      email: string | null;
      phone: string | null;
      notes: string | null;
      is_vip: boolean;
      marketing_opt_in: boolean;
    }>;

    const [client] = (await sql`
      UPDATE clients SET
        full_name = COALESCE(${body.full_name ?? null}, full_name),
        email = CASE WHEN ${body.email !== undefined} THEN ${body.email ?? null} ELSE email END,
        phone = CASE WHEN ${body.phone !== undefined} THEN ${body.phone ?? null} ELSE phone END,
        notes = CASE WHEN ${body.notes !== undefined} THEN ${body.notes ?? null} ELSE notes END,
        is_vip = CASE WHEN ${body.is_vip !== undefined} THEN ${body.is_vip ?? false} ELSE is_vip END,
        marketing_opt_in = CASE WHEN ${body.marketing_opt_in !== undefined} THEN ${body.marketing_opt_in ?? true} ELSE marketing_opt_in END,
        updated_at = NOW()
      WHERE id = ${clientId}
      RETURNING
        id, full_name, email, phone, notes, tags,
        total_spend_cents, visit_count,
        last_visited_at::text AS last_visited_at,
        is_vip, marketing_opt_in,
        created_at::text AS created_at,
        updated_at::text AS updated_at
    `) as Client[];

    if (!client) return Response.json({ ok: false, error: 'Client not found.' }, { status: 404 });

    return Response.json({
      ok: true,
      client: { ...client, computed_tags: computeClientTags(client) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return Response.json({ ok: false, error: 'Invalid client ID.' }, { status: 400 });

  try {
    await ensureClientsSchema();

    const activeBookings = (await sql`
      SELECT id FROM bookings
      WHERE client_id = ${clientId}
        AND status NOT IN ('cancelled', 'completed')
      LIMIT 1
    `) as { id: string }[];

    if (activeBookings.length > 0) {
      return Response.json(
        { ok: false, error: 'Cannot delete client with active bookings. Please cancel or complete them first.' },
        { status: 409 },
      );
    }

    await sql`UPDATE bookings SET client_id = NULL WHERE client_id = ${clientId}`;
    await sql`DELETE FROM clients WHERE id = ${clientId}`;

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
