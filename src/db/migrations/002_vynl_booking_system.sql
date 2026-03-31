-- =============================================================
-- Migration 002: Vynl Booking System
-- Run against Neon project: bold-cake-96619135 (vynl-website)
--
-- This migration adds the full booking system schema from the
-- detailing project, adapted for Vynl nail studio.
-- It is fully idempotent — safe to re-run.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── ENUM TYPES ───────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── SERVICES ─────────────────────────────────────────────────
-- Managed via /admin/services. Add Vynl nail services here or
-- through the admin dashboard after deployment.

CREATE TABLE IF NOT EXISTS services (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     VARCHAR(100) NOT NULL,
  description              TEXT,
  category                 VARCHAR(100),
  duration_minutes         INTEGER      NOT NULL CHECK (duration_minutes > 0),
  price_cents              INTEGER      NOT NULL CHECK (price_cents >= 0),
  deposit_cents            INTEGER      NOT NULL CHECK (deposit_cents >= 0),
  deposit_type             VARCHAR(20)  NOT NULL DEFAULT 'fixed',
  buffer_time_mins         INTEGER      NOT NULL DEFAULT 0,
  max_bookings_per_day     INTEGER,
  online_booking_enabled   BOOLEAN      NOT NULL DEFAULT TRUE,
  whats_included           JSONB        NOT NULL DEFAULT '[]'::jsonb,
  preparation_notes        TEXT,
  image_url                TEXT,
  display_order            INTEGER      NOT NULL DEFAULT 0,
  is_deleted               BOOLEAN      NOT NULL DEFAULT FALSE,
  availability_override    JSONB,
  is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── CUSTOMERS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(20)  NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── BOOKINGS ─────────────────────────────────────────────────
-- Drop old Square-based bookings table only if it exists and has
-- the old schema (square_payment_id column). Otherwise, keep it.
-- We rename it to bookings_square_legacy for safety.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'square_payment_id'
  ) THEN
    ALTER TABLE bookings RENAME TO bookings_square_legacy;
    RAISE NOTICE 'Renamed old Square-based bookings table to bookings_square_legacy';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS bookings (
  id                          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                   INTEGER,
  customer_id                 UUID           REFERENCES customers (id) ON DELETE SET NULL,
  customer_name               VARCHAR(255)   NOT NULL,
  customer_email              VARCHAR(255)   NOT NULL,
  customer_phone              VARCHAR(20)    NOT NULL DEFAULT '-',
  service_id                  UUID           REFERENCES services (id) ON DELETE SET NULL,
  service_name                VARCHAR(100)   NOT NULL,
  booking_date                DATE           NOT NULL,
  booking_time                TIME           NOT NULL,
  calendar_duration_minutes   INTEGER,
  notes                       TEXT,
  status                      booking_status NOT NULL DEFAULT 'pending',
  deposit_paid                BOOLEAN        NOT NULL DEFAULT FALSE,
  deposit_amount_cents        INTEGER        NOT NULL DEFAULT 0 CHECK (deposit_amount_cents >= 0),
  stripe_payment_intent_id    TEXT,
  stripe_customer_id          TEXT,
  payment_status              TEXT           DEFAULT 'unpaid',
  amount_paid_cents           INTEGER        DEFAULT 0,
  manage_token                TEXT,
  manage_token_expires_at     TIMESTAMPTZ,
  cancellation_reason         TEXT,
  cancelled_at                TIMESTAMPTZ,
  rescheduled_from_date       DATE,
  rescheduled_from_time       TEXT,
  refund_status               TEXT           DEFAULT 'none',
  stripe_refund_id            TEXT,
  google_calendar_event_id    VARCHAR(255),
  reminder_sent               BOOLEAN        NOT NULL DEFAULT FALSE,
  -- Vynl-specific: inspiration image URLs uploaded during booking
  inspo_images                TEXT[],
  created_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_bookings_booking_date   ON bookings (booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id    ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id     ON bookings (service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status         ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings (customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_pi      ON bookings (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_clerk_user_id ON customers (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email         ON customers (email);

-- ── CLIENTS (CRM) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clients (
  id                INTEGER      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  full_name         TEXT         NOT NULL,
  email             TEXT         UNIQUE,
  phone             TEXT,
  notes             TEXT,
  tags              JSONB        DEFAULT '[]',
  total_spend_cents INTEGER      DEFAULT 0,
  visit_count       INTEGER      DEFAULT 0,
  last_visited_at   TIMESTAMPTZ,
  is_vip            BOOLEAN      DEFAULT false,
  marketing_opt_in  BOOLEAN      DEFAULT true,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_vehicles (
  id         INTEGER      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_id  INTEGER      REFERENCES clients(id) ON DELETE CASCADE,
  make       TEXT,
  model      TEXT,
  year       INTEGER,
  colour     TEXT,
  rego       TEXT,
  notes      TEXT,
  is_primary BOOLEAN      DEFAULT false,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);

-- ── SETTINGS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO settings (key, value, updated_at) VALUES
  ('cancellation_hours_notice',   '24',   NOW()),
  ('reschedule_hours_notice',     '24',   NOW()),
  ('cancellation_refund_policy',  'full', NOW()),
  ('customer_reschedule_enabled', 'true', NOW()),
  ('customer_cancel_enabled',     'true', NOW())
ON CONFLICT (key) DO NOTHING;

-- ── NOTIFICATION SETTINGS ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_settings (
  id                SERIAL       PRIMARY KEY,
  notification_type TEXT         UNIQUE NOT NULL,
  enabled           BOOLEAN      DEFAULT true,
  subject           TEXT,
  body              TEXT,
  send_offset_hours INTEGER      DEFAULT 0,
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO notification_settings (notification_type, enabled, subject, body, send_offset_hours) VALUES
  ('booking_confirmation',  true,
   'Your Vynl appointment is confirmed – {service_name}',
   'Hi {customer_name}, your Vynl appointment for {service_name} on {date} at {time} is confirmed. Your deposit of {deposit_amount} has been received. Remaining balance of {remaining_balance} is due on the day. We can''t wait to see you!',
   0),
  ('booking_reminder_24h',  true,
   'Reminder: Your Vynl appointment is tomorrow – {service_name}',
   'Hi {customer_name}, just a reminder that your {service_name} appointment at Vynl is tomorrow, {date} at {time}. Remaining balance due on the day: {remaining_balance}. See you soon!',
   24),
  ('booking_reminder_1h',   true,
   'Your Vynl appointment is in 1 hour – {service_name}',
   'Hi {customer_name}, your {service_name} appointment at Vynl starts in about 1 hour at {time} today. See you soon!',
   1),
  ('booking_cancellation',  true,
   'Your Vynl booking has been cancelled – {service_name}',
   'Hi {customer_name}, your booking for {service_name} on {date} at {time} has been cancelled. {refund_message}',
   0),
  ('booking_reschedule',    true,
   'Your Vynl booking has been rescheduled – {service_name}',
   'Hi {customer_name}, your booking has been rescheduled to {date} at {time}. If you have any questions please contact us.',
   0),
  ('admin_new_booking',     true,
   'New Vynl booking – {service_name}',
   'New booking from {customer_name} for {service_name} on {date} at {time}. Deposit paid: {deposit_amount}.',
   0)
ON CONFLICT (notification_type) DO NOTHING;

-- ── BUSINESS PROFILE ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_profile (
  id                      INTEGER      PRIMARY KEY DEFAULT 1,
  business_name           TEXT         DEFAULT 'Vynl',
  business_email          TEXT,
  business_phone          TEXT,
  business_address        TEXT,
  timezone                TEXT         DEFAULT 'Australia/Sydney',
  booking_lead_time_hours INTEGER      DEFAULT 2,
  booking_advance_days    INTEGER      DEFAULT 60,
  updated_at              TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO business_profile (id, business_name, timezone)
VALUES (1, 'Vynl', 'Australia/Sydney')
ON CONFLICT (id) DO NOTHING;

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── SEED: VYNL NAIL SERVICES ──────────────────────────────────
-- Adjust prices/durations to match your actual Square catalog.

INSERT INTO services (name, description, category, duration_minutes, price_cents, deposit_cents, deposit_type, online_booking_enabled) VALUES
  ('Gel-X Full Set',        'Full Gel-X extension set with your choice of shape and length.',               'Nail Services', 90,  12000, 5000, 'fixed', true),
  ('Gel-X Infill',          'Gel-X infill / maintenance appointment.',                                      'Nail Services', 60,  8000,  4000, 'fixed', true),
  ('Gel-X + Nail Art',      'Full Gel-X set with custom nail art design.',                                  'Nail Services', 120, 18000, 6000, 'fixed', true),
  ('Soak Off',              'Safe removal of existing Gel-X or gel product.',                               'Nail Services', 30,  3000,  0,    'fixed', true),
  ('Gel Polish',            'Gel polish application on natural nails.',                                     'Nail Services', 45,  5500,  0,    'fixed', true)
ON CONFLICT DO NOTHING;
