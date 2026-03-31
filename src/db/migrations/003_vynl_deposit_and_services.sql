-- =============================================================
-- Migration 003: Vynl Deposit Settings + Updated Services
-- Idempotent — safe to re-run.
-- =============================================================

-- ── DEPOSIT SETTINGS ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS deposit_settings (
  id                     INT          PRIMARY KEY DEFAULT 1,
  default_deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 30.00,
  deposit_type           TEXT         NOT NULL DEFAULT 'fixed'
                           CHECK (deposit_type IN ('fixed', 'percentage')),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO deposit_settings (id, default_deposit_amount, deposit_type)
VALUES (1, 30.00, 'fixed')
ON CONFLICT (id) DO NOTHING;

-- ── ADDONS COLUMN ON BOOKINGS ────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS addons UUID[] DEFAULT ARRAY[]::UUID[];

-- ── SYNC COLUMNS ────────────────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS square_booking_id TEXT;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS sync_pending BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- ── UPDATE SERVICES SEED ─────────────────────────────────────
-- Clear old placeholder services and insert the real Vynl menu.
-- We only touch rows that look like the original seed placeholders
-- (by name). Real bookings reference service_id, not service_name,
-- so renaming/replacing services here is safe as long as booking rows
-- keep their service_name snapshot.

-- Remove old generic placeholder services if they still exist
DELETE FROM services
WHERE name IN (
  'Gel-X Full Set',
  'Gel-X Infill',
  'Gel-X + Nail Art',
  'Soak Off',
  'Gel Polish'
)
AND NOT EXISTS (
  SELECT 1 FROM bookings WHERE bookings.service_id = services.id LIMIT 1
);

-- Insert the real Vynl nail menu (idempotent via ON CONFLICT DO NOTHING on name)
-- We use a unique index on name for the upsert guard.
CREATE UNIQUE INDEX IF NOT EXISTS uq_services_name ON services (name);

INSERT INTO services
  (name, description, category, duration_minutes, price_cents, deposit_cents, deposit_type, online_booking_enabled, display_order, is_active)
VALUES
  -- Nail Services
  ('Soak Off Only (No New Set)',
   'Safe removal of your existing product with no new set applied.',
   'nail_service', 50, 6000, 3000, 'fixed', true, 10, true),

  ('Gel X Extension',
   'Full Gel-X extension set — pricing varies by length, shape, and design.',
   'nail_service', 60, 10000, 3000, 'fixed', true, 20, true),

  -- Add Ons
  ('Foreign Soak Off',
   'Removal of product not applied by Vynl (e.g. from another salon).',
   'addon', 20, 3000, 0, 'fixed', true, 30, true),

  ('French Tips',
   'Classic French tip finish added to your set.',
   'addon', 30, 2000, 0, 'fixed', true, 40, true),

  ('Full Colour',
   'Full gel colour application — price quoted at appointment.',
   'addon', 10, 0, 0, 'fixed', true, 50, true),

  ('LVL 1 Nail Art',
   'Entry-level nail art — simple patterns, minimal detail. $10–$40.',
   'addon', 30, 0, 0, 'fixed', true, 60, true),

  ('LVL 2 Nail Art',
   'Intermediate nail art — more detail, custom designs. $50–$100.',
   'addon', 60, 0, 0, 'fixed', true, 70, true),

  ('LVL 3 Nail Art',
   'Advanced/intricate nail art. $100–$250.',
   'addon', 90, 0, 0, 'fixed', true, 80, true),

  ('Soak Off',
   'Removal of previously applied Vynl product.',
   'addon', 20, 2000, 0, 'fixed', true, 90, true)

ON CONFLICT (name) DO UPDATE SET
  description             = EXCLUDED.description,
  category                = EXCLUDED.category,
  duration_minutes        = EXCLUDED.duration_minutes,
  price_cents             = EXCLUDED.price_cents,
  deposit_cents           = EXCLUDED.deposit_cents,
  deposit_type            = EXCLUDED.deposit_type,
  online_booking_enabled  = EXCLUDED.online_booking_enabled,
  display_order           = EXCLUDED.display_order,
  is_active               = EXCLUDED.is_active,
  updated_at              = NOW();
