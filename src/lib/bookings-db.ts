import { sql } from '@/lib/db';

/** Ensures optional columns used by the admin calendar exist (idempotent). */
export async function ensureBookingCalendarColumns() {
  await sql`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS calendar_duration_minutes INTEGER
  `;
}
