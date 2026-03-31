import { sql } from '@/lib/db';

let schemaEnsured = false;

export async function ensureStripeBookingColumns() {
  if (schemaEnsured) return;

  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount_paid_cents INTEGER DEFAULT 0`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_amount_cents INTEGER DEFAULT 0`;

  await sql`
    UPDATE bookings
    SET
      payment_status = COALESCE(payment_status, CASE WHEN deposit_paid THEN 'deposit_paid' ELSE 'unpaid' END),
      amount_paid_cents = COALESCE(amount_paid_cents, CASE WHEN deposit_paid THEN deposit_amount_cents ELSE 0 END),
      deposit_amount_cents = COALESCE(deposit_amount_cents, 0)
    WHERE
      payment_status IS NULL
      OR amount_paid_cents IS NULL
      OR deposit_amount_cents IS NULL
  `;

  schemaEnsured = true;
}
