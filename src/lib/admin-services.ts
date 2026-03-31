import { sql } from '@/lib/db';

export interface ServiceStats {
  booking_count: number;
  revenue_cents: number;
  last_booked_at: string | null;
}

let schemaEnsured = false;

export async function ensureServicesAdminSchema() {
  if (schemaEnsured) return;

  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR(100)`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_time_mins INTEGER DEFAULT 0`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS max_bookings_per_day INTEGER`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS online_booking_enabled BOOLEAN DEFAULT TRUE`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS whats_included JSONB DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS preparation_notes TEXT`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_type VARCHAR(20) DEFAULT 'fixed'`;
  await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS availability_override JSONB`;

  await sql`
    UPDATE services
    SET
      display_order = COALESCE(display_order, 0),
      buffer_time_mins = COALESCE(buffer_time_mins, 0),
      online_booking_enabled = COALESCE(online_booking_enabled, TRUE),
      deposit_type = CASE
        WHEN deposit_type IN ('fixed', 'percentage') THEN deposit_type
        ELSE 'fixed'
      END
    WHERE
      display_order IS NULL
      OR buffer_time_mins IS NULL
      OR online_booking_enabled IS NULL
      OR deposit_type IS NULL
      OR deposit_type NOT IN ('fixed', 'percentage')
  `;

  schemaEnsured = true;
}

export function safeParseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function normalizeAvailabilityOverride(value: unknown) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const useGlobalDays =
    typeof candidate.use_global_days === 'boolean' ? candidate.use_global_days : true;
  const useGlobalSlots =
    typeof candidate.use_global_slots === 'boolean' ? candidate.use_global_slots : true;

  return {
    use_global_days: useGlobalDays,
    days: safeParseStringArray(candidate.days),
    use_global_slots: useGlobalSlots,
    slots: safeParseStringArray(candidate.slots),
  };
}
