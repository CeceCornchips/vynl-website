import { sql } from '@/lib/db';

let migrated = false;

export async function ensureNotificationsTable(): Promise<void> {
  if (migrated) return;

  await sql`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id SERIAL PRIMARY KEY,
      notification_type TEXT UNIQUE NOT NULL,
      enabled BOOLEAN DEFAULT true,
      subject TEXT,
      body TEXT,
      send_offset_hours INTEGER DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    INSERT INTO notification_settings (notification_type, enabled, subject, body, send_offset_hours)
    VALUES (
      'booking_confirmation',
      true,
      'Your booking is confirmed – {service_name}',
      'Hi {customer_name}, your Vynl appointment for {service_name} on {date} at {time} is confirmed. Your deposit of {deposit_amount} has been received. Remaining balance of {remaining_balance} is due on the day. We can\'t wait to see you!',
      0
    )
    ON CONFLICT (notification_type) DO NOTHING
  `;

  await sql`
    INSERT INTO notification_settings (notification_type, enabled, subject, body, send_offset_hours)
    VALUES (
      'booking_reminder_24h',
      true,
      'Reminder: Your appointment is tomorrow – {service_name}',
      'Hi {customer_name}, just a reminder that your {service_name} appointment is tomorrow, {date} at {time}. Remaining balance due on the day: {remaining_balance}. See you soon!',
      24
    )
    ON CONFLICT (notification_type) DO NOTHING
  `;

  await sql`
    INSERT INTO notification_settings (notification_type, enabled, subject, body, send_offset_hours)
    VALUES (
      'booking_reminder_1h',
      true,
      'Your appointment is in 1 hour – {service_name}',
      'Hi {customer_name}, your {service_name} appointment at Vynl starts in about 1 hour at {time} today. See you soon!',
      1
    )
    ON CONFLICT (notification_type) DO NOTHING
  `;

  await sql`
    INSERT INTO notification_settings (notification_type, enabled, subject, body, send_offset_hours)
    VALUES (
      'booking_cancellation',
      true,
      'Your booking has been cancelled – {service_name}',
      'Hi {customer_name}, your booking for {service_name} on {date} at {time} has been cancelled. {refund_message}',
      0
    )
    ON CONFLICT (notification_type) DO NOTHING
  `;

  await sql`
    INSERT INTO notification_settings (notification_type, enabled, subject, body, send_offset_hours)
    VALUES (
      'booking_reschedule',
      true,
      'Your booking has been rescheduled – {service_name}',
      'Hi {customer_name}, your booking has been rescheduled to {date} at {time}. If you have any questions please contact us.',
      0
    )
    ON CONFLICT (notification_type) DO NOTHING
  `;

  await sql`
    INSERT INTO notification_settings (notification_type, enabled, subject, body, send_offset_hours)
    VALUES (
      'admin_new_booking',
      true,
      'New booking received – {service_name}',
      'New Vynl booking from {customer_name} for {service_name} on {date} at {time}. Deposit paid: {deposit_amount}.',
      0
    )
    ON CONFLICT (notification_type) DO NOTHING
  `;

  migrated = true;
}

export interface NotificationSetting {
  id: number;
  notification_type: string;
  enabled: boolean;
  subject: string;
  body: string;
  send_offset_hours: number;
  updated_at: string;
}

export async function getNotificationSetting(type: string): Promise<NotificationSetting | null> {
  await ensureNotificationsTable();
  const rows = (await sql`
    SELECT * FROM notification_settings WHERE notification_type = ${type} LIMIT 1
  `) as NotificationSetting[];
  return rows[0] ?? null;
}

export async function getAllNotificationSettings(): Promise<NotificationSetting[]> {
  await ensureNotificationsTable();
  return (await sql`
    SELECT * FROM notification_settings ORDER BY id ASC
  `) as NotificationSetting[];
}
