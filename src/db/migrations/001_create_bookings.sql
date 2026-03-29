-- Migration 001: Create bookings table
-- Run against Neon project: bold-cake-96619135 (vynl-website)

CREATE TABLE IF NOT EXISTS bookings (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Square IDs
  square_payment_id  TEXT        NOT NULL,
  square_booking_id  TEXT,                        -- NULL until Square Bookings API succeeds
  square_customer_id TEXT,

  -- Customer info
  customer_name      TEXT        NOT NULL,
  customer_email     TEXT        NOT NULL,

  -- Appointment details
  service_name       TEXT        NOT NULL,
  add_ons            TEXT[],
  preferred_date     TEXT        NOT NULL,
  preferred_time     TEXT        NOT NULL,
  notes              TEXT,
  deposit_cents      INTEGER     NOT NULL,

  -- Sync state: true when Square Bookings API failed; cleared on successful manual sync
  sync_pending       BOOLEAN     NOT NULL DEFAULT false,
  sync_error         TEXT,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_email_idx
  ON bookings (customer_email);

CREATE INDEX IF NOT EXISTS bookings_square_booking_id_idx
  ON bookings (square_booking_id);

-- Partial index so sync queries stay fast even with a large table
CREATE INDEX IF NOT EXISTS bookings_sync_pending_idx
  ON bookings (sync_pending)
  WHERE sync_pending = true;
