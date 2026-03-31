import { sql } from '@/lib/db';

let migrationRan = false;

export async function ensureClientsSchema() {
  if (migrationRan) return;

  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      notes TEXT,
      tags JSONB DEFAULT '[]',
      total_spend_cents INTEGER DEFAULT 0,
      visit_count INTEGER DEFAULT 0,
      last_visited_at TIMESTAMPTZ,
      is_vip BOOLEAN DEFAULT false,
      marketing_opt_in BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS client_vehicles (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      make TEXT,
      model TEXT,
      year INTEGER,
      colour TEXT,
      rego TEXT,
      notes TEXT,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id)`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_make TEXT`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_model TEXT`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_year INTEGER`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_colour TEXT`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_rego TEXT`;

  migrationRan = true;
}
