import { sql } from '@/lib/db';
import { parseBookingSettings, type ParsedBookingSettings } from '@/lib/booking-settings';
import { getBusinessProfile } from '@/lib/business-profile';

export interface BookingPolicySettings {
  cancellationHoursNotice: number;
  rescheduleHoursNotice: number;
  cancellationRefundPolicy: 'full' | 'deposit_only' | 'none';
  customerRescheduleEnabled: boolean;
  customerCancelEnabled: boolean;
}

export async function ensureSettingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function getBookingSettings(): Promise<BookingPolicySettings> {
  await ensureSettingsTable();
  const rows = (await sql`
    SELECT key, value FROM settings
    WHERE key IN (
      'cancellation_hours_notice',
      'reschedule_hours_notice',
      'cancellation_refund_policy',
      'customer_reschedule_enabled',
      'customer_cancel_enabled'
    )
  `) as { key: string; value: string | null }[];
  const map = new Map(rows.map((r) => [r.key, r.value ?? '']));

  const cancellationHoursNotice = Math.max(
    0,
    parseInt(map.get('cancellation_hours_notice') || '24', 10) || 24,
  );
  const rescheduleHoursNotice = Math.max(
    0,
    parseInt(map.get('reschedule_hours_notice') || '24', 10) || 24,
  );
  const rawPolicy = map.get('cancellation_refund_policy');
  const cancellationRefundPolicy: BookingPolicySettings['cancellationRefundPolicy'] =
    rawPolicy === 'deposit_only' || rawPolicy === 'none' ? rawPolicy : 'full';

  const customerRescheduleEnabled = (map.get('customer_reschedule_enabled') ?? 'true') !== 'false';
  const customerCancelEnabled = (map.get('customer_cancel_enabled') ?? 'true') !== 'false';

  return {
    cancellationHoursNotice,
    rescheduleHoursNotice,
    cancellationRefundPolicy,
    customerRescheduleEnabled,
    customerCancelEnabled,
  };
}

export async function fetchParsedBookingSettings(): Promise<ParsedBookingSettings> {
  await ensureSettingsTable();
  const [rawRows, profile] = await Promise.all([
    sql`SELECT key, value FROM settings`,
    getBusinessProfile().catch(() => null),
  ]);
  const rows = rawRows as { key: string; value: string | null }[];
  const map: Record<string, string | null> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  // Business profile lead time / advance days take precedence when set
  if (profile) {
    if (profile.booking_lead_time_hours != null) {
      map.lead_time_hours = String(profile.booking_lead_time_hours);
    }
    if (profile.booking_advance_days != null) {
      map.advance_booking_days = String(profile.booking_advance_days);
    }
  }
  return parseBookingSettings(map);
}
