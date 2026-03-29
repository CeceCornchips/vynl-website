import { NextRequest, NextResponse } from "next/server";
import { SquareClient, SquareEnvironment } from "square";
import { randomUUID } from "crypto";
import { sql } from "@/lib/db";

// ── Square client ─────────────────────────────────────────────────────────────

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN ?? "",
  environment:
    process.env.NEXT_PUBLIC_SQUARE_ENV === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the ISO start time for a Square booking.
 * Accepts either an ISO timestamp from the availability API (preferred)
 * or the legacy "2:00 PM" string format.
 */
function toSquareStartAt(date: string, time: string): string {
  // ISO timestamp — use directly (comes from /api/square/availability)
  if (time.includes("T")) return time;
  // Legacy "h:mm AM/PM" format fallback
  const [timePart, period] = time.split(" ");
  const [hourStr, minStr] = timePart.split(":");
  let hour = parseInt(hourStr, 10);
  const min = parseInt(minStr, 10);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  const hh = String(hour).padStart(2, "0");
  const mm = String(min).padStart(2, "0");
  return `${date}T${hh}:${mm}:00+10:00`;
}

/**
 * Formats a time string for human-readable notes / DB records.
 * Handles both ISO timestamps and legacy "h:mm AM/PM" strings.
 */
function formatTimeForDisplay(time: string): string {
  if (!time) return "";
  if (!time.includes("T")) return time; // already formatted
  try {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(time));
  } catch {
    return time;
  }
}

/**
 * Finds an existing Square customer by email or creates a new one.
 * Returns the Square customer ID.
 */
async function findOrCreateSquareCustomer(
  name: string,
  email: string
): Promise<{ id: string; existing: boolean }> {
  // Search first to avoid duplicates
  const searchRes = await square.customers.search({
    query: { filter: { emailAddress: { exact: email } } },
  });

  const existing = searchRes.customers?.[0];
  if (existing?.id) return { id: existing.id, existing: true };

  // Split "First Last" → given/family name (best-effort)
  const parts = name.trim().split(/\s+/);
  const givenName = parts[0] ?? name;
  const familyName = parts.slice(1).join(" ") || undefined;

  const createRes = await square.customers.create({
    idempotencyKey: randomUUID(),
    givenName,
    familyName,
    emailAddress: email,
  });

  if (!createRes.customer?.id) {
    throw new Error("Square Customers API did not return a customer ID.");
  }
  return { id: createRes.customer.id, existing: false };
}

interface AddOnSegment {
  variationId: string;
  durationMinutes: number;
}

/**
 * Creates a Square appointment booking with one segment per service/add-on.
 * Returns the Square booking ID.
 */
async function createSquareBooking(opts: {
  customerId: string;
  serviceVariationId: string;
  durationMinutes: number;
  addOns: AddOnSegment[];
  startAt: string;
  customerNote?: string;
  sellerNote?: string;
}): Promise<string> {
  const teamMemberId = process.env.SQUARE_TEAM_MEMBER_ID;
  if (!teamMemberId) throw new Error("SQUARE_TEAM_MEMBER_ID is not configured.");

  const appointmentSegments = [
    {
      durationMinutes: opts.durationMinutes,
      serviceVariationId: opts.serviceVariationId,
      teamMemberId,
    },
    ...opts.addOns.map((a) => ({
      durationMinutes: a.durationMinutes,
      serviceVariationId: a.variationId,
      teamMemberId,
    })),
  ];

  const res = await square.bookings.create({
    idempotencyKey: randomUUID(),
    booking: {
      startAt: opts.startAt,
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "",
      customerId: opts.customerId,
      customerNote: opts.customerNote ?? undefined,
      sellerNote: opts.sellerNote ?? undefined,
      appointmentSegments,
    },
  });

  if (!res.booking?.id) {
    throw new Error("Square Bookings API did not return a booking ID.");
  }
  return res.booking.id;
}

// ── Request body ──────────────────────────────────────────────────────────────

interface PaymentBody {
  sourceId: string;
  amountCents: number;
  customerName: string;
  customerEmail: string;
  serviceVariationId: string;      // Square catalog variation ID
  serviceName: string;
  addOnVariationIds?: string[];    // Square catalog variation IDs from /api/services
  addOnNames?: string[];
  addOnDurations?: number[];       // parallel to addOnVariationIds, in minutes
  durationMinutes?: number;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

// ── POST /api/payments ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let squarePaymentId: string | null = null;

  try {
    const body = (await req.json()) as PaymentBody;
    const {
      sourceId,
      amountCents,
      customerName,
      customerEmail,
      serviceVariationId,
      serviceName,
      addOnVariationIds = [],
      addOnNames,
      addOnDurations = [],
      durationMinutes = 60,
      preferredDate,
      preferredTime,
      notes,
    } = body;

    if (!sourceId || !amountCents || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // TEMPORARY: $1.00 real-card test — revert to `amountCents` after production E2E check.
    const chargeAmountCents = 100;

    // ── 1. Charge deposit via Square Payments API ──────────────────────────

    const noteLines = [
      `Deposit – ${serviceName}`,
      addOnNames?.length ? `Add-ons: ${addOnNames.join(", ")}` : null,
      `Date: ${preferredDate} ${formatTimeForDisplay(preferredTime)}`,
      notes ? `Notes: ${notes}` : null,
      `Client: ${customerName}`,
    ].filter(Boolean);

    const paymentRes = await square.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: { amount: BigInt(chargeAmountCents), currency: "AUD" },
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "",
      note: noteLines.join(" · "),
      buyerEmailAddress: customerEmail,
    });

    squarePaymentId = paymentRes.payment?.id ?? null;
    if (!squarePaymentId) throw new Error("Square payment did not return an ID.");

    // ── 2. Find or create Square Customer ──────────────────────────────────

    let squareCustomerId: string | null = null;
    let squareBookingId: string | null = null;
    let syncPending = false;
    let syncError: string | null = null;

    try {
      const { id } = await findOrCreateSquareCustomer(customerName, customerEmail);
      squareCustomerId = id;

      // ── 3. Create Square Booking ─────────────────────────────────────────

      if (!serviceVariationId) {
        throw new Error("Service variation ID is missing from request.");
      }

      // Add-on variation IDs come directly from the Square catalog via /api/services
      const addOnSegments: AddOnSegment[] = addOnVariationIds.map((vid, i) => ({
        variationId: vid,
        durationMinutes: addOnDurations[i] ?? 30,
      }));

      squareBookingId = await createSquareBooking({
        customerId: squareCustomerId,
        serviceVariationId,
        durationMinutes,
        addOns: addOnSegments,
        startAt: toSquareStartAt(preferredDate, preferredTime),
        customerNote: notes,
        sellerNote: `Service: ${serviceName}${addOnNames?.length ? ` + ${addOnNames.join(", ")}` : ""}`,
      });
    } catch (bookingErr: unknown) {
      // Payment already succeeded — flag for manual sync rather than failing the request
      syncPending = true;
      syncError =
        bookingErr instanceof Error ? bookingErr.message : "Square Bookings API failed.";
      console.warn("[/api/payments] Square Bookings API error (payment succeeded):", syncError);
    }

    // ── 4. Persist to Neon database ────────────────────────────────────────

    await sql`
      INSERT INTO bookings (
        square_payment_id,
        square_booking_id,
        square_customer_id,
        customer_name,
        customer_email,
        service_name,
        add_ons,
        preferred_date,
        preferred_time,
        notes,
        deposit_cents,
        sync_pending,
        sync_error
      ) VALUES (
        ${squarePaymentId},
        ${squareBookingId},
        ${squareCustomerId},
        ${customerName},
        ${customerEmail},
        ${serviceName},
        ${addOnNames ?? []},
        ${preferredDate},
        ${preferredTime},
        ${notes ?? null},
        ${chargeAmountCents},
        ${syncPending},
        ${syncError}
      )
    `;

    return NextResponse.json({
      paymentId: squarePaymentId,
      bookingId: squareBookingId,
      syncPending,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[/api/payments]", error);

    // If payment was charged but DB write failed, still return the paymentId so the
    // client can show the confirmation screen; log prominently for ops visibility.
    if (squarePaymentId) {
      console.error(
        "[/api/payments] CRITICAL: payment charged but DB save failed. Payment ID:",
        squarePaymentId
      );
      return NextResponse.json({ paymentId: squarePaymentId, syncPending: true });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
