// ============================================================
// Database TypeScript Types
// Mirrors the Neon Postgres schema in src/db/schema.sql
// ============================================================

// ── Booking status ─────────────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// ── Services ───────────────────────────────────────────────

/** A detailing service offered by the business. */
export interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  /** Duration of the service in minutes. */
  duration_minutes: number;
  /** Full service price in AUD cents (e.g. 9900 = $99.00). */
  price_cents: number;
  /** Required deposit amount in AUD cents. */
  deposit_cents: number;
  deposit_type: 'fixed' | 'percentage';
  buffer_time_mins: number;
  max_bookings_per_day: number | null;
  online_booking_enabled: boolean;
  whats_included: string[];
  preparation_notes: string | null;
  image_url: string | null;
  display_order: number;
  is_deleted: boolean;
  availability_override: {
    use_global_days: boolean;
    days: string[];
    use_global_slots: boolean;
    slots: string[];
  } | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Payload for inserting a new service. */
export type NewService = Omit<Service, 'id' | 'created_at' | 'updated_at'>;

/** Payload for updating an existing service. */
export type UpdateService = Partial<NewService>;

// ── Customers ──────────────────────────────────────────────

/** A customer record, optionally linked to a Clerk user. */
export interface Customer {
  id: string;
  /** Clerk user ID — null for guest (unauthenticated) bookings. */
  clerk_user_id: string | null;
  name: string;
  email: string;
  phone: string;
  created_at: Date;
  updated_at: Date;
}

/** Payload for inserting a new customer. */
export type NewCustomer = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;

/** Payload for updating an existing customer. */
export type UpdateCustomer = Partial<NewCustomer>;

// ── Bookings ───────────────────────────────────────────────

/**
 * A booking record.
 * customer_* and service_name are denormalised snapshots so that
 * historical records remain accurate if the related rows change.
 */
export interface Booking {
  id: string;

  // CRM client link (may be null for older bookings)
  client_id?: number | null;

  // Customer snapshot
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;

  // Service snapshot
  service_id: string | null;
  service_name: string;

  // Appointment
  /** ISO date string, e.g. "2026-04-01". */
  booking_date: string;
  /** Time string, e.g. "09:00:00". */
  booking_time: string;
  /** Optional calendar-only duration override (minutes); does not change the service definition. */
  calendar_duration_minutes: number | null;
  address: string;
  notes: string | null;

  // Workflow
  status: BookingStatus;

  // Payment
  deposit_paid: boolean;
  /** Deposit amount captured at booking time, in AUD cents. */
  deposit_amount_cents: number;
  stripe_payment_intent_id: string | null;
  stripe_customer_id?: string | null;
  payment_status?: 'unpaid' | 'deposit_paid' | 'paid_in_full' | 'failed' | 'cancelled';
  amount_paid_cents?: number;
  manage_token?: string | null;
  manage_token_expires_at?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  rescheduled_from_date?: string | null;
  rescheduled_from_time?: string | null;
  refund_status?: string | null;
  stripe_refund_id?: string | null;

  // Vehicle details (captured at booking time)
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  vehicle_colour?: string | null;
  vehicle_rego?: string | null;

  // Vynl-specific
  /** UUIDs of add-on services selected at booking time. */
  addons?: string[] | null;
  /** Nail inspiration image URLs uploaded by client. */
  inspo_images?: string[] | null;

  // Square sync
  square_booking_id?: string | null;
  sync_pending?: boolean;
  sync_error?: string | null;

  // Google Calendar
  google_calendar_event_id: string | null;

  // Notifications
  reminder_sent: boolean;

  created_at: Date;
  updated_at: Date;
}

// ── Deposit Settings ──────────────────────────────────────

export interface DepositSettings {
  id: number;
  default_deposit_amount: number;
  deposit_type: 'fixed' | 'percentage';
  updated_at?: string;
}

/** Payload for inserting a new booking. */
export type NewBooking = Omit<Booking, 'id' | 'created_at' | 'updated_at'>;

/** Payload for updating an existing booking. */
export type UpdateBooking = Partial<
  Pick<
    Booking,
    | 'status'
    | 'deposit_paid'
    | 'stripe_payment_intent_id'
    | 'google_calendar_event_id'
    | 'notes'
    | 'booking_date'
    | 'booking_time'
    | 'address'
  >
>;

// ── View / joined types ────────────────────────────────────

/** Booking with the full service and customer objects joined in. */
export interface BookingWithRelations extends Booking {
  service: Service | null;
  customer: Customer | null;
}

// ── Helper / display types ────────────────────────────────

/** Converts a cent value to a display string, e.g. 9900 → "$99.00". */
export function formatCentsAUD(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100);
}

/** Converts a dollar amount to cents for storage, e.g. 99.00 → 9900. */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Converts cents back to a plain number for display, e.g. 9900 → 99. */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** Human-readable label for each booking status. */
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Tailwind colour classes for each booking status badge. */
export const BOOKING_STATUS_COLOURS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// ── Clients (CRM) ─────────────────────────────────────────

export type ClientTag = 'VIP' | 'Regular' | 'New' | 'Inactive';

/** A CRM client record. */
export interface Client {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  tags: string[];
  total_spend_cents: number;
  visit_count: number;
  last_visited_at: string | null;
  is_vip: boolean;
  marketing_opt_in: boolean;
  created_at: string;
  updated_at: string;
  /** Computed at query time, not stored */
  computed_tags?: ClientTag[];
}

/** A vehicle linked to a client. */
export interface ClientVehicle {
  id: number;
  client_id: number;
  make: string | null;
  model: string | null;
  year: number | null;
  colour: string | null;
  rego: string | null;
  notes: string | null;
  is_primary: boolean;
  created_at: string;
}

export type NewClient = Pick<Client, 'full_name'> & Partial<Pick<Client, 'email' | 'phone' | 'notes' | 'is_vip' | 'marketing_opt_in'>>;
export type UpdateClient = Partial<Pick<Client, 'full_name' | 'email' | 'phone' | 'notes' | 'is_vip' | 'marketing_opt_in'>>;

export type NewClientVehicle = Omit<ClientVehicle, 'id' | 'created_at'>;
export type UpdateClientVehicle = Partial<Omit<ClientVehicle, 'id' | 'client_id' | 'created_at'>>;

/**
 * Compute auto-assigned tags for a client based on its data.
 * Tags are not stored — they are derived at runtime.
 */
export function computeClientTags(client: Client): ClientTag[] {
  const tags: ClientTag[] = [];
  const now = new Date();

  const createdAt = new Date(client.created_at);
  const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated <= 30) tags.push('New');

  if (client.is_vip || client.total_spend_cents >= 50000) tags.push('VIP');

  if (client.visit_count >= 3) tags.push('Regular');

  const lastVisit = client.last_visited_at ? new Date(client.last_visited_at) : null;
  const daysSinceVisit = lastVisit
    ? (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
    : null;
  if (daysSinceVisit === null || daysSinceVisit > 90) tags.push('Inactive');

  return tags;
}
