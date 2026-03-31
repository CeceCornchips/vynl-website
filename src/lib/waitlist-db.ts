import { sql } from '@/lib/db';

export async function ensureWaitlistTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS booking_waitlist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}
