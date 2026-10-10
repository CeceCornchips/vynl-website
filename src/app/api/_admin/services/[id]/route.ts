import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import type { Service } from '@/types/database';
import {
  ensureServicesAdminSchema,
  normalizeAvailabilityOverride,
  safeParseStringArray,
} from '@/lib/admin-services';

type UpdateBody = {
  name?: string;
  description?: string | null;
  category?: string | null;
  duration_minutes?: number;
  price_cents?: number;
  deposit_cents?: number;
  deposit_type?: 'fixed' | 'percentage';
  is_active?: boolean;
  buffer_time_mins?: number;
  max_bookings_per_day?: number | null;
  online_booking_enabled?: boolean;
  whats_included?: string[];
  preparation_notes?: string | null;
  image_url?: string | null;
  display_order?: number;
  availability_override?: unknown;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureServicesAdminSchema();
    const { id } = await params;
    const body = (await request.json()) as UpdateBody;

    if (!id?.trim()) {
      return Response.json({ ok: false, error: 'Service id is required.' }, { status: 400 });
    }

    if ('name' in body && !body.name?.trim()) {
      return Response.json({ ok: false, error: 'Service name cannot be empty.' }, { status: 400 });
    }

    const [service] = (await sql`
      UPDATE services
      SET
        name = COALESCE(${body.name?.trim() ?? null}, name),
        description = CASE WHEN ${'description' in body} THEN ${body.description?.trim() ?? null} ELSE description END,
        category = CASE WHEN ${'category' in body} THEN ${body.category?.trim() ?? null} ELSE category END,
        duration_minutes = COALESCE(${body.duration_minutes ?? null}, duration_minutes),
        price_cents = COALESCE(${body.price_cents ?? null}, price_cents),
        deposit_cents = COALESCE(${body.deposit_cents ?? null}, deposit_cents),
        deposit_type = CASE
          WHEN ${body.deposit_type ?? null} = 'percentage' THEN 'percentage'
          WHEN ${body.deposit_type ?? null} = 'fixed' THEN 'fixed'
          ELSE deposit_type
        END,
        is_active = COALESCE(${body.is_active ?? null}, is_active),
        buffer_time_mins = COALESCE(${body.buffer_time_mins ?? null}, buffer_time_mins),
        max_bookings_per_day = CASE
          WHEN ${'max_bookings_per_day' in body} THEN ${body.max_bookings_per_day ?? null}
          ELSE max_bookings_per_day
        END,
        online_booking_enabled = COALESCE(${body.online_booking_enabled ?? null}, online_booking_enabled),
        whats_included = CASE
          WHEN ${'whats_included' in body} THEN ${JSON.stringify(safeParseStringArray(body.whats_included ?? []))}::jsonb
          ELSE whats_included
        END,
        preparation_notes = CASE
          WHEN ${'preparation_notes' in body} THEN ${body.preparation_notes?.trim() ?? null}
          ELSE preparation_notes
        END,
        image_url = CASE
          WHEN ${'image_url' in body} THEN ${body.image_url?.trim() ?? null}
          ELSE image_url
        END,
        display_order = COALESCE(${body.display_order ?? null}, display_order),
        availability_override = CASE
          WHEN ${'availability_override' in body}
            THEN ${body.availability_override ? JSON.stringify(normalizeAvailabilityOverride(body.availability_override)) : null}::jsonb
          ELSE availability_override
        END,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `) as Service[];

    if (!service) {
      return Response.json({ ok: false, error: 'Service not found.' }, { status: 404 });
    }

    return Response.json({ ok: true, service });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
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

    if (!id?.trim()) {
      return Response.json({ ok: false, error: 'Service id is required.' }, { status: 400 });
    }

    const [service] = (await sql`
      UPDATE services
      SET
        is_active = FALSE,
        is_deleted = TRUE,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `) as Service[];

    if (!service) {
      return Response.json({ ok: false, error: 'Service not found.' }, { status: 404 });
    }

    return Response.json({ ok: true, service });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
