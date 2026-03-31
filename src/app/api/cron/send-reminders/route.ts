import { sql } from '@/lib/db';
import { sendNotificationEmail } from '@/lib/email';
import { getNotificationSetting } from '@/lib/notifications-migration';

type ReminderType = 'booking_reminder_24h' | 'booking_reminder_1h';

interface BookingRow {
  id: string;
  customer_name: string;
  customer_email: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  deposit_amount_cents: number;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatAUD(cents: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
}

async function ensureReminderColumns(): Promise<void> {
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT false`;
}

async function processReminder(
  type: ReminderType,
  offsetHours: number,
): Promise<{ sent: number; failed: number }> {
  const now = new Date();
  const targetTime = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
  const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);

  // Build a timestamp range for booking datetime
  const windowStartISO = windowStart.toISOString();
  const windowEndISO = windowEnd.toISOString();

  const sentColumn = type === 'booking_reminder_24h' ? 'reminder_24h_sent' : 'reminder_1h_sent';

  // Query bookings whose combined booking_date + booking_time falls within the window
  const bookings =
    sentColumn === 'reminder_24h_sent'
      ? ((await sql`
          SELECT
            id,
            customer_name,
            customer_email,
            service_name,
            booking_date::text AS booking_date,
            booking_time::text AS booking_time,
            deposit_amount_cents
          FROM bookings
          WHERE status = 'confirmed'
            AND reminder_24h_sent IS NOT TRUE
            AND (booking_date::text || 'T' || booking_time::text)::timestamptz
                  BETWEEN ${windowStartISO}::timestamptz AND ${windowEndISO}::timestamptz
        `) as BookingRow[])
      : ((await sql`
          SELECT
            id,
            customer_name,
            customer_email,
            service_name,
            booking_date::text AS booking_date,
            booking_time::text AS booking_time,
            deposit_amount_cents
          FROM bookings
          WHERE status = 'confirmed'
            AND reminder_1h_sent IS NOT TRUE
            AND (booking_date::text || 'T' || booking_time::text)::timestamptz
                  BETWEEN ${windowStartISO}::timestamptz AND ${windowEndISO}::timestamptz
        `) as BookingRow[]);

  let sent = 0;
  let failed = 0;

  for (const booking of bookings) {
    try {
      const vars: Record<string, string> = {
        customer_name: booking.customer_name,
        service_name: booking.service_name,
        date: formatDate(booking.booking_date),
        time: formatTime(booking.booking_time),
        deposit_amount: formatAUD(booking.deposit_amount_cents),
        remaining_balance: '',
        refund_message: '',
        manage_link: '',
        booking_id: booking.id,
      };

      await sendNotificationEmail(type, vars, booking.customer_email);

      if (sentColumn === 'reminder_24h_sent') {
        await sql`
          UPDATE bookings
          SET reminder_24h_sent = TRUE, updated_at = NOW()
          WHERE id = ${booking.id}
        `;
      } else {
        await sql`
          UPDATE bookings
          SET reminder_1h_sent = TRUE, updated_at = NOW()
          WHERE id = ${booking.id}
        `;
      }

      sent++;
    } catch (err) {
      console.error(`Failed to send ${type} reminder for booking ${booking.id}:`, err);
      failed++;
    }
  }

  return { sent, failed };
}

export async function GET(request: Request) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ ok: false, error: 'Unauthorised.' }, { status: 401 });
  }

  try {
    await ensureReminderColumns();

    const [setting24h, setting1h] = await Promise.all([
      getNotificationSetting('booking_reminder_24h'),
      getNotificationSetting('booking_reminder_1h'),
    ]);

    const results: Record<string, { sent: number; failed: number; skipped?: boolean }> = {};

    if (setting24h?.enabled) {
      results.reminder_24h = await processReminder(
        'booking_reminder_24h',
        setting24h.send_offset_hours ?? 24,
      );
    } else {
      results.reminder_24h = { sent: 0, failed: 0, skipped: true };
    }

    if (setting1h?.enabled) {
      results.reminder_1h = await processReminder(
        'booking_reminder_1h',
        setting1h.send_offset_hours ?? 1,
      );
    } else {
      results.reminder_1h = { sent: 0, failed: 0, skipped: true };
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
