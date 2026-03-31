import {
  computeAvailableSlots,
  timeStrToMinutes,
  type ExistingBookingBlock,
} from '@/lib/booking-availability';
import { randomBytes } from 'crypto';
import { sql } from '@/lib/db';
import { ensureBookingManageColumns } from '@/lib/booking-token-migration';
import { fetchParsedBookingSettings } from '@/lib/settings-db';
import { ensureStripeBookingColumns } from '@/lib/stripe-migration';
import { ensureClientsSchema } from '@/lib/clients-migration';
import type { Customer } from '@/types/database';

interface CreateBookingBody {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string | null;
  bookingDate: string;
  bookingTime: string;
  serviceId: string;
  serviceName: string;
  depositAmountCents?: number;
  notes?: string | null;
  inspoImages?: string[] | null;
  addons?: string[] | null;
}

function normalizeBookingTime(t: string): string {
  const parts = t.split(':').map((x) => x.trim());
  const h = Math.min(23, Math.max(0, parseInt(parts[0] ?? '0', 10)));
  const m = Math.min(59, Math.max(0, parseInt(parts[1] ?? '0', 10)));
  const s =
    parts[2] != null ? Math.min(59, Math.max(0, parseInt(parts[2], 10))) : 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export async function POST(request: Request) {
  try {
    await ensureStripeBookingColumns();
    await ensureBookingManageColumns();
    await ensureClientsSchema();

    const body: CreateBookingBody = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      bookingDate,
      bookingTime,
      serviceId,
      serviceName,
      depositAmountCents = 0,
      notes,
      inspoImages,
      addons,
    } = body;

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !bookingDate ||
      !bookingTime ||
      !serviceId ||
      !serviceName?.trim()
    ) {
      return Response.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      return Response.json({ ok: false, error: 'Invalid date.' }, { status: 400 });
    }

    const parsed = await fetchParsedBookingSettings();

    if (parsed.bookingRequirePhone && !phone?.trim()) {
      return Response.json(
        { ok: false, error: 'Phone number is required.' },
        { status: 400 },
      );
    }

    if (parsed.bookingRequireNotes && !notes?.trim()) {
      return Response.json(
        { ok: false, error: 'Please add the requested notes for this booking.' },
        { status: 400 },
      );
    }

    const normalizedTime = normalizeBookingTime(bookingTime);

    const svc = (await sql`
      SELECT duration_minutes, is_active, buffer_time_mins, max_bookings_per_day
      FROM services
      WHERE id = ${serviceId}
      LIMIT 1
    `) as {
      duration_minutes: number;
      is_active: boolean;
      buffer_time_mins: number;
      max_bookings_per_day: number | null;
    }[];

    if (svc.length === 0 || !svc[0].is_active) {
      return Response.json({ ok: false, error: 'Invalid or inactive service.' }, { status: 400 });
    }

    const durationMins = Math.max(1, Number(svc[0].duration_minutes));

    const bookingRows = (await sql`
      SELECT b.booking_time::text AS booking_time,
             COALESCE(s.duration_minutes, 60)::int AS duration_minutes
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      WHERE b.booking_date = ${bookingDate}::date
        AND b.status <> 'cancelled'
    `) as { booking_time: string; duration_minutes: number }[];

    const existing: ExistingBookingBlock[] = bookingRows.map((r) => ({
      startMinutes: timeStrToMinutes(r.booking_time.trim()),
      durationMins: Math.max(1, Number(r.duration_minutes)),
    }));

    const countRows = (await sql`
      SELECT COUNT(*)::int AS c
      FROM bookings
      WHERE booking_date = ${bookingDate}::date
        AND status <> 'cancelled'
    `) as { c: number }[];

    const bookingCount = countRows[0]?.c ?? 0;

    const { slots } = computeAvailableSlots(
      bookingDate,
      durationMins,
      parsed,
      existing,
      bookingCount,
      new Date(),
      undefined,
      {
        serviceBufferTimeMins: svc[0].buffer_time_mins,
        serviceMaxBookingsPerDay: svc[0].max_bookings_per_day,
        maxAdvanceDaysCap: 60,
      },
    );

    if (!slots.includes(normalizedTime)) {
      return Response.json(
        { ok: false, error: 'This time slot is no longer available. Please choose another time.' },
        { status: 400 },
      );
    }

    const phoneForDb = phone?.trim() || '-';

    const customerName = `${firstName.trim()} ${lastName.trim()}`;

    const existingCustomer = (await sql`
      SELECT * FROM customers WHERE email = ${email.toLowerCase().trim()} LIMIT 1
    `) as Customer[];

    let customerId: string;

    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
      await sql`
        UPDATE customers
        SET name = ${customerName}, phone = ${phoneForDb}, updated_at = NOW()
        WHERE id = ${customerId}
      `;
    } else {
      const created = (await sql`
        INSERT INTO customers (name, email, phone)
        VALUES (${customerName}, ${email.toLowerCase().trim()}, ${phoneForDb})
        RETURNING id
      `) as { id: string }[];
      customerId = created[0].id;
    }

    const token = randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const result = (await sql`
      INSERT INTO bookings (
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        service_id,
        service_name,
        booking_date,
        booking_time,
        notes,
        status,
        deposit_paid,
        deposit_amount_cents,
        payment_status,
        amount_paid_cents,
        manage_token,
        manage_token_expires_at,
        inspo_images,
        addons
      ) VALUES (
        ${customerId},
        ${customerName},
        ${email.toLowerCase().trim()},
        ${phoneForDb},
        ${serviceId},
        ${serviceName},
        ${bookingDate},
        ${normalizedTime}::time,
        ${notes ?? null},
        'pending',
        false,
        ${depositAmountCents},
        'unpaid',
        0,
        ${token},
        ${tokenExpiresAt.toISOString()},
        ${inspoImages ?? null},
        ${addons && addons.length > 0 ? addons : null}
      )
      RETURNING id, manage_token
    `) as { id: string; manage_token: string }[];

    const bookingId = result[0].id;

    // Auto-create or update matching CRM client record
    try {
      const emailKey = email.toLowerCase().trim();
      const existingClients = (await sql`
        SELECT id FROM clients WHERE email = ${emailKey} LIMIT 1
      `) as { id: number }[];

      let clientId: number;
      if (existingClients.length > 0) {
        clientId = existingClients[0].id;
        await sql`
          UPDATE clients SET
            visit_count = visit_count + 1,
            last_visited_at = NOW(),
            updated_at = NOW()
          WHERE id = ${clientId}
        `;
      } else {
        const [newClient] = (await sql`
          INSERT INTO clients (full_name, email, phone)
          VALUES (${customerName}, ${emailKey}, ${phoneForDb === '-' ? null : phoneForDb})
          RETURNING id
        `) as { id: number }[];
        clientId = newClient.id;
      }

      await sql`UPDATE bookings SET client_id = ${clientId} WHERE id = ${bookingId}`;
    } catch {
      // Non-fatal: booking was already created successfully
    }

    return Response.json({ ok: true, bookingId, manageToken: result[0].manage_token });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
