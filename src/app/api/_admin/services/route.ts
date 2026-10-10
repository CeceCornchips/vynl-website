import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import type { Service } from '@/types/database';
import {
  ensureServicesAdminSchema,
  normalizeAvailabilityOverride,
  safeParseStringArray,
} from '@/lib/admin-services';

interface ServiceWithMetrics extends Service {
  booking_count: number;
  revenue_cents: number;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureServicesAdminSchema();

    const services = (await sql`
      SELECT
        s.*,
        COUNT(b.id)::int AS booking_count,
        COALESCE(SUM(b.deposit_amount_cents), 0)::int AS revenue_cents
      FROM services s
      LEFT JOIN bookings b
        ON b.service_id = s.id
      WHERE COALESCE(s.is_deleted, FALSE) = FALSE
      GROUP BY s.id
      ORDER BY
        s.display_order ASC,
        s.created_at ASC
    `) as ServiceWithMetrics[];

    return Response.json({ ok: true, services });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureServicesAdminSchema();

    const body = await request.json() as {
      name: string;
      description?: string;
      category?: string;
      duration_minutes: number;
      price_cents: number;
      deposit_cents: number;
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
    const {
      name,
      description,
      category,
      duration_minutes,
      price_cents,
      deposit_cents,
      deposit_type,
      is_active,
      buffer_time_mins,
      max_bookings_per_day,
      online_booking_enabled,
      whats_included,
      preparation_notes,
      image_url,
      display_order,
      availability_override,
    } = body;

    if (!name?.trim()) {
      return Response.json({ ok: false, error: 'Service name is required.' }, { status: 400 });
    }
    if (!duration_minutes || duration_minutes <= 0) {
      return Response.json({ ok: false, error: 'Duration must be greater than 0.' }, { status: 400 });
    }
    if (price_cents == null || price_cents < 0) {
      return Response.json({ ok: false, error: 'Price must be 0 or more.' }, { status: 400 });
    }
    if (deposit_cents == null || deposit_cents < 0) {
      return Response.json({ ok: false, error: 'Deposit must be 0 or more.' }, { status: 400 });
    }

    const [maxOrder] = (await sql`
      SELECT COALESCE(MAX(display_order), 0)::int AS max_order
      FROM services
      WHERE COALESCE(is_deleted, FALSE) = FALSE
    `) as Array<{ max_order: number }>;

    const [service] = (await sql`
      INSERT INTO services (
        name,
        description,
        category,
        duration_minutes,
        price_cents,
        deposit_cents,
        deposit_type,
        is_active,
        buffer_time_mins,
        max_bookings_per_day,
        online_booking_enabled,
        whats_included,
        preparation_notes,
        image_url,
        display_order,
        availability_override
      )
      VALUES (
        ${name.trim()},
        ${description?.trim() ?? null},
        ${category?.trim() ?? null},
        ${duration_minutes},
        ${price_cents},
        ${deposit_cents},
        ${deposit_type === 'percentage' ? 'percentage' : 'fixed'},
        ${is_active ?? true},
        ${Math.max(0, buffer_time_mins ?? 0)},
        ${typeof max_bookings_per_day === 'number' ? Math.max(1, max_bookings_per_day) : null},
        ${online_booking_enabled ?? true},
        ${JSON.stringify(safeParseStringArray(whats_included ?? []))}::jsonb,
        ${preparation_notes?.trim() ?? null},
        ${image_url?.trim() ?? null},
        ${display_order ?? maxOrder.max_order + 1},
        ${availability_override ? JSON.stringify(normalizeAvailabilityOverride(availability_override)) : null}::jsonb
      )
      RETURNING *
    `) as Service[];

    return Response.json({ ok: true, service }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH() {
  return Response.json(
    { ok: false, error: 'Use PATCH /api/admin/services/[id] instead.' },
    { status: 405 },
  );
}
