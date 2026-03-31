import { sql } from '@/lib/db';

let migrated = false;

export async function ensureBusinessProfileTables(): Promise<void> {
  if (migrated) return;

  await sql`
    CREATE TABLE IF NOT EXISTS business_profile (
      id SERIAL PRIMARY KEY,
      business_name TEXT,
      tagline TEXT,
      description TEXT,
      abn TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      address_line1 TEXT,
      address_line2 TEXT,
      suburb TEXT,
      state TEXT,
      postcode TEXT,
      country TEXT DEFAULT 'Australia',
      logo_url TEXT,
      cover_image_url TEXT,
      gallery_urls JSONB DEFAULT '[]',
      facebook_url TEXT,
      instagram_url TEXT,
      tiktok_url TEXT,
      google_business_url TEXT,
      timezone TEXT DEFAULT 'Australia/Sydney',
      currency TEXT DEFAULT 'AUD',
      date_format TEXT DEFAULT 'DD/MM/YYYY',
      time_format TEXT DEFAULT '12h',
      week_starts_on TEXT DEFAULT 'Monday',
      getting_here_note TEXT,
      amenities JSONB DEFAULT '[]',
      highlights JSONB DEFAULT '[]',
      online_booking_enabled BOOLEAN DEFAULT true,
      booking_lead_time_hours INTEGER DEFAULT 2,
      booking_advance_days INTEGER DEFAULT 60,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`INSERT INTO business_profile (id) VALUES (1) ON CONFLICT DO NOTHING`;

  // Idempotently add columns that may be missing if the table was created by an older migration
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS tagline TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS description TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS abn TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS phone TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS website TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS address_line1 TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS address_line2 TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS suburb TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS state TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS postcode TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Australia'`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS logo_url TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS cover_image_url TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS facebook_url TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS instagram_url TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS tiktok_url TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS google_business_url TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AUD'`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD/MM/YYYY'`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS time_format TEXT DEFAULT '12h'`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS week_starts_on TEXT DEFAULT 'Monday'`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS getting_here_note TEXT`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'`;
  await sql`ALTER TABLE business_profile ADD COLUMN IF NOT EXISTS online_booking_enabled BOOLEAN DEFAULT true`;

  await sql`
    CREATE TABLE IF NOT EXISTS business_hours (
      id SERIAL PRIMARY KEY,
      day_of_week TEXT NOT NULL UNIQUE,
      is_open BOOLEAN DEFAULT true,
      open_time TEXT DEFAULT '08:00',
      close_time TEXT DEFAULT '17:00'
    )
  `;

  await sql`
    INSERT INTO business_hours (day_of_week, is_open, open_time, close_time) VALUES
      ('Monday',    true,  '08:00', '17:00'),
      ('Tuesday',   true,  '08:00', '17:00'),
      ('Wednesday', true,  '08:00', '17:00'),
      ('Thursday',  true,  '08:00', '17:00'),
      ('Friday',    true,  '08:00', '17:00'),
      ('Saturday',  true,  '08:00', '13:00'),
      ('Sunday',    false, '08:00', '17:00')
    ON CONFLICT (day_of_week) DO NOTHING
  `;

  migrated = true;
}
