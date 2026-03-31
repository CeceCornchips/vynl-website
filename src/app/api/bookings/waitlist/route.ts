import { sql } from '@/lib/db';
import { ensureWaitlistTable } from '@/lib/waitlist-db';

interface WaitlistBody {
  serviceId: string;
  date: string;
  customerEmail: string;
  customerName: string;
}

export async function POST(request: Request) {
  try {
    await ensureWaitlistTable();
    const body = (await request.json()) as WaitlistBody;

    const serviceId = body.serviceId?.trim();
    const date = body.date?.trim();
    const customerEmail = body.customerEmail?.trim().toLowerCase();
    const customerName = body.customerName?.trim();

    if (!serviceId || !date || !customerEmail || !customerName) {
      return Response.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ ok: false, error: 'Invalid date.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return Response.json({ ok: false, error: 'Invalid email address.' }, { status: 400 });
    }

    const serviceRows = (await sql`
      SELECT id, is_active
      FROM services
      WHERE id = ${serviceId}
      LIMIT 1
    `) as { id: string; is_active: boolean }[];

    if (!serviceRows[0] || !serviceRows[0].is_active) {
      return Response.json({ ok: false, error: 'Invalid service.' }, { status: 400 });
    }

    await sql`
      INSERT INTO booking_waitlist (service_id, date, customer_name, customer_email)
      VALUES (${serviceId}, ${date}::date, ${customerName}, ${customerEmail})
    `;

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
