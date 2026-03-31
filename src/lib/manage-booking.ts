import { sql } from '@/lib/db';
import { ensureBookingManageColumns } from '@/lib/booking-token-migration';

export type RefundPolicy = 'full' | 'deposit_only' | 'none';

export interface ManagePolicy {
  cancellationHoursNotice: number;
  rescheduleHoursNotice: number;
  cancellationRefundPolicy: RefundPolicy;
  customerRescheduleEnabled: boolean;
  customerCancelEnabled: boolean;
}

export interface ManageBookingRecord {
  id: string;
  customer_name: string;
  customer_email: string;
  service_id: string | null;
  service_name: string;
  booking_date: string;
  booking_time: string;
  address: string;
  status: string;
  deposit_amount_cents: number;
  amount_paid_cents: number;
  price_cents: number;
  stripe_payment_intent_id: string | null;
  manage_token: string | null;
  manage_token_expires_at: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  rescheduled_from_date: string | null;
  rescheduled_from_time: string | null;
  refund_status: string | null;
  stripe_refund_id: string | null;
}

export async function fetchManagePolicy(): Promise<ManagePolicy> {
  await ensureBookingManageColumns();
  const rows = (await sql`
    SELECT key, value
    FROM settings
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
    Number.parseInt(map.get('cancellation_hours_notice') || '24', 10) || 24,
  );
  const rescheduleHoursNotice = Math.max(
    0,
    Number.parseInt(map.get('reschedule_hours_notice') || '24', 10) || 24,
  );
  const rawPolicy = map.get('cancellation_refund_policy');
  const cancellationRefundPolicy: RefundPolicy =
    rawPolicy === 'deposit_only' || rawPolicy === 'none' ? rawPolicy : 'full';
  const customerRescheduleEnabled =
    (map.get('customer_reschedule_enabled') ?? 'true') !== 'false';
  const customerCancelEnabled =
    (map.get('customer_cancel_enabled') ?? 'true') !== 'false';
  return {
    cancellationHoursNotice,
    rescheduleHoursNotice,
    cancellationRefundPolicy,
    customerRescheduleEnabled,
    customerCancelEnabled,
  };
}

export async function fetchBookingByManageToken(token: string): Promise<ManageBookingRecord | null> {
  await ensureBookingManageColumns();
  const rows = (await sql`
    SELECT
      b.id,
      b.customer_name,
      b.customer_email,
      b.service_id,
      b.service_name,
      b.booking_date::text AS booking_date,
      b.booking_time::text AS booking_time,
      b.address,
      b.status::text AS status,
      COALESCE(b.deposit_amount_cents, 0)::int AS deposit_amount_cents,
      COALESCE(b.amount_paid_cents, 0)::int AS amount_paid_cents,
      COALESCE(s.price_cents, 0)::int AS price_cents,
      b.stripe_payment_intent_id,
      b.manage_token,
      b.manage_token_expires_at::text AS manage_token_expires_at,
      b.cancellation_reason,
      b.cancelled_at::text AS cancelled_at,
      b.rescheduled_from_date::text AS rescheduled_from_date,
      b.rescheduled_from_time,
      b.refund_status,
      b.stripe_refund_id
    FROM bookings b
    LEFT JOIN services s ON s.id = b.service_id
    WHERE b.manage_token = ${token}
    LIMIT 1
  `) as ManageBookingRecord[];
  return rows[0] ?? null;
}

export function getBookingDateTimeMillis(bookingDate: string, bookingTime: string): number {
  const iso = `${bookingDate}T${bookingTime.slice(0, 8)}`;
  return new Date(iso).getTime();
}

export function isWithinNoticeWindow(bookingAtMillis: number, hoursNotice: number): boolean {
  return bookingAtMillis - Date.now() < hoursNotice * 60 * 60 * 1000;
}

