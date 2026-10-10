import { auth } from '@clerk/nextjs/server';
import { ensureBookingCalendarColumns } from '@/lib/bookings-db';
import { sql } from '@/lib/db';
import { ensureBookingManageColumns } from '@/lib/booking-token-migration';
import { ensureStripeBookingColumns } from '@/lib/stripe-migration';
import type { Booking, BookingStatus } from '@/types/database';

const VALID_STATUSES = new Set<BookingStatus>([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
]);
const VALID_PAYMENT_STATUSES = new Set([
  'unpaid',
  'deposit_paid',
  'paid_in_full',
  'failed',
  'cancelled',
]);

function parsePositiveInt(raw: string | null, fallback: number): number {
  const value = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim().toLowerCase() ?? '';
    const status = url.searchParams.get('status')?.trim() ?? '';
    const service = url.searchParams.get('service')?.trim() ?? '';
    const paymentStatus = url.searchParams.get('payment_status')?.trim() ?? '';
    const startDate = url.searchParams.get('startDate')?.trim() ?? '';
    const endDate = url.searchParams.get('endDate')?.trim() ?? '';
    const includeCancelled = url.searchParams.get('includeCancelled') === 'true';
    const page = parsePositiveInt(url.searchParams.get('page'), 1);
    const limit = Math.min(parsePositiveInt(url.searchParams.get('limit'), 20), 100);

    await ensureBookingCalendarColumns();
    await ensureBookingManageColumns();
    await ensureStripeBookingColumns();

    const allBookings = (await sql`
      SELECT
        id, customer_id, client_id, customer_name, customer_email, customer_phone,
        service_id, service_name,
        booking_date::text AS booking_date,
        booking_time::text AS booking_time,
        notes, status,
        deposit_paid, deposit_amount_cents, stripe_payment_intent_id, stripe_customer_id, payment_status, amount_paid_cents,
        cancellation_reason, cancelled_at::text AS cancelled_at, rescheduled_from_date::text AS rescheduled_from_date,
        rescheduled_from_time, refund_status, stripe_refund_id,
        google_calendar_event_id,
        calendar_duration_minutes,
        inspo_images,
        addons,
        created_at, updated_at
      FROM bookings
    `) as (Booking & { client_id: number | null })[];

    const filtered = allBookings.filter((b) => {
      if (!includeCancelled && b.status === 'cancelled') return false;
      if (status && status !== 'all') {
        if (!VALID_STATUSES.has(status as BookingStatus)) return false;
        if (b.status !== status) return false;
      }
      if (service && service !== 'all') {
        if (b.service_id !== service && b.service_name !== service) return false;
      }
      if (paymentStatus && paymentStatus !== 'all') {
        if (!VALID_PAYMENT_STATUSES.has(paymentStatus)) return false;
        if ((b.payment_status ?? 'unpaid') !== paymentStatus) return false;
      }
      const bookingDate = String(b.booking_date).split('T')[0];
      if (startDate && bookingDate < startDate) return false;
      if (endDate && bookingDate > endDate) return false;
      if (search) {
        const haystack = [
          b.customer_name,
          b.customer_email,
          b.customer_phone,
          b.id,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      const dateCmp = String(b.booking_date).localeCompare(String(a.booking_date));
      if (dateCmp !== 0) return dateCmp;
      const timeCmp = String(b.booking_time).localeCompare(String(a.booking_time));
      if (timeCmp !== 0) return timeCmp;
      return String(b.created_at).localeCompare(String(a.created_at));
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const clampedPage = Math.min(page, totalPages);
    const offset = (clampedPage - 1) * limit;
    const bookings = filtered.slice(offset, offset + limit);

    const services = Array.from(
      new Map(
        allBookings
          .filter((b) => b.service_id && b.service_name)
          .map((b) => [String(b.service_id), { id: String(b.service_id), name: b.service_name }]),
      ).values(),
    ).sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({
      ok: true,
      bookings,
      total,
      page: clampedPage,
      limit,
      totalPages,
      services,
    });
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
    await ensureStripeBookingColumns();

    const body = await request.json() as {
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      /** When set, link booking to this customer (admin search) and update their contact row. */
      customer_id?: string;
      service_id: string;
      booking_date: string;
      booking_time: string;
      notes?: string;
      deposit_paid?: boolean;
    };

    const {
      customer_name,
      customer_email,
      customer_phone,
      service_id,
      booking_date,
      booking_time,
      notes,
      deposit_paid = false,
    } = body;

    if (!customer_name?.trim() || !customer_email?.trim() || !customer_phone?.trim()) {
      return Response.json({ ok: false, error: 'Customer name, email, and phone are required.' }, { status: 400 });
    }
    if (!service_id || !booking_date || !booking_time) {
      return Response.json({ ok: false, error: 'Service, date, and time are required.' }, { status: 400 });
    }

    // Look up service
    const services = await sql`SELECT * FROM services WHERE id = ${service_id} AND is_active = true`;
    if (services.length === 0) {
      return Response.json({ ok: false, error: 'Service not found.' }, { status: 404 });
    }
    const service = services[0] as { id: string; name: string; deposit_cents: number };

    // Find or create customer
    let customerId: string | null = null;
    if (body.customer_id?.trim()) {
      const cid = body.customer_id.trim();
      const rows = await sql`SELECT id FROM customers WHERE id = ${cid} LIMIT 1`;
      if (rows.length === 0) {
        return Response.json({ ok: false, error: 'Customer not found.' }, { status: 404 });
      }
      customerId = (rows[0] as { id: string }).id;
      await sql`
        UPDATE customers
        SET
          name = ${customer_name.trim()},
          email = ${customer_email.toLowerCase().trim()},
          phone = ${customer_phone.trim()},
          updated_at = NOW()
        WHERE id = ${customerId}
      `;
    } else {
      const existingCustomers = await sql`
        SELECT id FROM customers WHERE email = ${customer_email.toLowerCase().trim()}
      `;
      if (existingCustomers.length > 0) {
        customerId = (existingCustomers[0] as { id: string }).id;
        await sql`
          UPDATE customers
          SET name = ${customer_name.trim()}, phone = ${customer_phone.trim()}, updated_at = NOW()
          WHERE id = ${customerId}
        `;
      } else {
        const newCustomer = await sql`
          INSERT INTO customers (name, email, phone)
          VALUES (${customer_name.trim()}, ${customer_email.toLowerCase().trim()}, ${customer_phone.trim()})
          RETURNING id
        `;
        customerId = (newCustomer[0] as { id: string }).id;
      }
    }

    // Create booking
    const [booking] = (await sql`
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
        amount_paid_cents
      ) VALUES (
        ${customerId},
        ${customer_name.trim()},
        ${customer_email.toLowerCase().trim()},
        ${customer_phone.trim()},
        ${service_id},
        ${service.name},
        ${booking_date},
        ${booking_time},
        ${notes?.trim() ?? null},
        'pending',
        ${deposit_paid},
        ${service.deposit_cents},
        ${deposit_paid ? 'deposit_paid' : 'unpaid'},
        ${deposit_paid ? service.deposit_cents : 0}
      )
      RETURNING
        id, customer_id, customer_name, customer_email, customer_phone,
        service_id, service_name,
        booking_date::text AS booking_date,
        booking_time::text AS booking_time,
        notes, status,
        deposit_paid, deposit_amount_cents, stripe_payment_intent_id, stripe_customer_id, payment_status, amount_paid_cents,
        google_calendar_event_id,
        created_at, updated_at
    `) as Booking[];

    return Response.json({ ok: true, booking }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
