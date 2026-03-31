import { sql } from '@/lib/db';
import { ensureSettingsTable } from '@/lib/settings-db';

/**
 * Idempotent migration for customer self-serve booking management.
 * Runs on-demand from public/manage and booking creation routes.
 */
export async function ensureBookingManageColumns() {
  await sql`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS manage_token TEXT
  `;
  await sql`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS manage_token_expires_at TIMESTAMPTZ
  `;
  await sql`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT
  `;
  await sql`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ
  `;
  await sql`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduled_from_date DATE
  `;
  await sql`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rescheduled_from_time TEXT
  `;
  await sql`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none'
  `;
  await sql`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT
  `;

  await ensureSettingsTable();
  await sql`
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS cancellation_hours_notice INTEGER DEFAULT 24
  `;
  await sql`
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS reschedule_hours_notice INTEGER DEFAULT 24
  `;
  await sql`
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS cancellation_refund_policy TEXT DEFAULT 'full'
  `;

  // Keep existing key/value settings architecture; ensure defaults exist.
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('cancellation_hours_notice', '24', NOW())
    ON CONFLICT (key) DO NOTHING
  `;
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('reschedule_hours_notice', '24', NOW())
    ON CONFLICT (key) DO NOTHING
  `;
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('cancellation_refund_policy', 'full', NOW())
    ON CONFLICT (key) DO NOTHING
  `;
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('customer_reschedule_enabled', 'true', NOW())
    ON CONFLICT (key) DO NOTHING
  `;
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('customer_cancel_enabled', 'true', NOW())
    ON CONFLICT (key) DO NOTHING
  `;
}

