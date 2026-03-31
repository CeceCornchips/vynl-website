import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(values: unknown[]): string {
  return values.map(escapeCsv).join(',');
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bookings = (await sql`
      SELECT
        b.id,
        b.customer_name,
        b.customer_email,
        b.customer_phone,
        b.service_name,
        b.booking_date,
        b.booking_time,

        b.notes,
        b.status,
        b.deposit_paid,
        b.deposit_amount_cents,
        b.created_at,
        b.updated_at
      FROM bookings b
      ORDER BY b.booking_date DESC, b.booking_time DESC
    `) as Record<string, unknown>[];

    const customers = (await sql`
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        COUNT(b.id)::int AS total_bookings,
        COALESCE(SUM(b.deposit_amount_cents), 0)::int AS total_spent_cents,
        c.created_at
      FROM customers c
      LEFT JOIN bookings b ON b.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `) as Record<string, unknown>[];

    const bookingHeaders = [
      'Booking ID',
      'Customer Name',
      'Email',
      'Phone',
      'Service',
      'Date',
      'Time',
      'Address',
      'Notes',
      'Status',
      'Deposit Paid',
      'Deposit Amount ($)',
      'Created At',
      'Updated At',
    ];

    const customerHeaders = [
      'Customer ID',
      'Name',
      'Email',
      'Phone',
      'Total Bookings',
      'Total Spent ($)',
      'Member Since',
    ];

    const lines: string[] = [];

    lines.push('BOOKINGS');
    lines.push(rowToCsv(bookingHeaders));
    for (const b of bookings) {
      lines.push(
        rowToCsv([
          b.id,
          b.customer_name,
          b.customer_email,
          b.customer_phone,
          b.service_name,
          b.booking_date,
          b.booking_time,
  
          b.notes,
          b.status,
          b.deposit_paid,
          b.deposit_amount_cents != null
            ? ((b.deposit_amount_cents as number) / 100).toFixed(2)
            : '0.00',
          b.created_at,
          b.updated_at,
        ]),
      );
    }

    lines.push('');
    lines.push('CUSTOMERS');
    lines.push(rowToCsv(customerHeaders));
    for (const c of customers) {
      lines.push(
        rowToCsv([
          c.id,
          c.name,
          c.email,
          c.phone,
          c.total_bookings,
          c.total_spent_cents != null
            ? ((c.total_spent_cents as number) / 100).toFixed(2)
            : '0.00',
          c.created_at,
        ]),
      );
    }

    const csv = lines.join('\n');
    const date = new Date().toISOString().split('T')[0];

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="detailing-export-${date}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
