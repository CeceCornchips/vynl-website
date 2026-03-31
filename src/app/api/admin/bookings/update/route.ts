import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import type { BookingStatus } from '@/types/database';
import { ensureBookingCalendarColumns } from '@/lib/bookings-db';

const VALID_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureBookingCalendarColumns();
    const body = (await request.json()) as {
      id: string;
      customer_id?: string | null;
      customer_name?: string;
      customer_email?: string;
      customer_phone?: string;
      service_id?: string;
      booking_date?: string;
      booking_time?: string;
      notes?: string | null;
      status?: BookingStatus;
      deposit_paid?: boolean;
      calendar_duration_minutes?: number | null;
    };

    const { id, ...patch } = body;
    if (!id?.trim()) {
      return Response.json({ ok: false, error: 'Missing id.' }, { status: 400 });
    }

    const existing = (await sql`
      SELECT
        id,
        customer_id,
        service_id,
        customer_name,
        customer_email,
        customer_phone,
        service_name,
        booking_date::text AS booking_date,
        booking_time::text AS booking_time,
        notes,
        status,
        deposit_paid,
        deposit_amount_cents,
        calendar_duration_minutes
      FROM bookings
      WHERE id = ${id}
      LIMIT 1
    `) as {
      id: string;
      customer_id: string | null;
      service_id: string | null;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      service_name: string;
      booking_date: string;
      booking_time: string;
      notes: string | null;
      status: BookingStatus;
      deposit_paid: boolean;
      deposit_amount_cents: number;
      calendar_duration_minutes: number | null;
    }[];

    if (existing.length === 0) {
      return Response.json({ ok: false, error: 'Booking not found.' }, { status: 404 });
    }

    const cur = existing[0];

    if (patch.status && !VALID_STATUSES.includes(patch.status)) {
      return Response.json({ ok: false, error: 'Invalid status.' }, { status: 400 });
    }

    let nextCustomerId = cur.customer_id;
    if (patch.customer_id !== undefined) {
      if (patch.customer_id === null || String(patch.customer_id).trim() === '') {
        nextCustomerId = null;
      } else {
        const cid = String(patch.customer_id).trim();
        const exists = (await sql`SELECT 1 FROM customers WHERE id = ${cid} LIMIT 1`) as unknown[];
        if (exists.length === 0) {
          return Response.json({ ok: false, error: 'Customer not found.' }, { status: 404 });
        }
        nextCustomerId = cid;
      }
    }

    const customer_name = patch.customer_name?.trim() ?? cur.customer_name;
    const customer_email = patch.customer_email?.trim().toLowerCase() ?? cur.customer_email;
    const customer_phone = patch.customer_phone?.trim() ?? cur.customer_phone;
    const service_id = patch.service_id?.trim() ?? cur.service_id;
    let service_name = cur.service_name;
    let deposit_amount_cents = cur.deposit_amount_cents;

    if (patch.service_id?.trim()) {
      const sv = (await sql`
        SELECT name, deposit_cents FROM services WHERE id = ${patch.service_id.trim()} LIMIT 1
      `) as { name: string; deposit_cents: number }[];
      if (sv.length > 0) {
        service_name = sv[0].name;
        deposit_amount_cents = sv[0].deposit_cents;
      }
    }

    const booking_date = patch.booking_date ?? cur.booking_date;
    const booking_time = patch.booking_time ?? cur.booking_time;
    const notes = patch.notes !== undefined ? patch.notes : cur.notes;
    const status = patch.status ?? cur.status;
    const deposit_paid = patch.deposit_paid ?? cur.deposit_paid;
    const calendar_duration_minutes =
      patch.calendar_duration_minutes !== undefined
        ? patch.calendar_duration_minutes
        : cur.calendar_duration_minutes;

    if (nextCustomerId) {
      await sql`
        UPDATE customers
        SET
          name = ${customer_name},
          email = ${customer_email},
          phone = ${customer_phone},
          updated_at = NOW()
        WHERE id = ${nextCustomerId}
      `;
    }

    await sql`
      UPDATE bookings
      SET
        customer_id = ${nextCustomerId},
        customer_name = ${customer_name},
        customer_email = ${customer_email},
        customer_phone = ${customer_phone},
        service_id = ${service_id},
        service_name = ${service_name},
        booking_date = ${booking_date}::date,
        booking_time = ${booking_time}::time,
        notes = ${notes},
        status = ${status},
        deposit_paid = ${deposit_paid},
        deposit_amount_cents = ${deposit_amount_cents},
        calendar_duration_minutes = ${calendar_duration_minutes},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    const updated = (await sql`
      SELECT
        b.id,
        b.customer_id,
        b.customer_name,
        b.customer_email,
        b.customer_phone,
        b.service_id,
        b.service_name,
        b.booking_date::text AS booking_date,
        b.booking_time::text AS booking_time,
        b.notes,
        b.status,
        b.deposit_paid,
        b.deposit_amount_cents,
        b.stripe_payment_intent_id,
        b.google_calendar_event_id,
        b.calendar_duration_minutes,
        b.created_at,
        b.updated_at,
        s.duration_minutes AS service_duration_minutes
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE b.id = ${id}
      LIMIT 1
    `) as Record<string, unknown>[];

    return Response.json({ ok: true, booking: updated[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
