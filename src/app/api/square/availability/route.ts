import { NextRequest, NextResponse } from "next/server";
import { SquareClient, SquareEnvironment } from "square";

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN ?? "",
  environment:
    process.env.NEXT_PUBLIC_SQUARE_ENV === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the boundary of a calendar day in Australia/Sydney time as an
 * RFC-3339 string, correctly handling AEST (UTC+10) vs AEDT (UTC+11).
 */
function sydneyBoundary(dateStr: string, isEnd: boolean): string {
  const testDate = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    timeZoneName: "short",
  }).formatToParts(testDate);
  const tzShort = parts.find((p) => p.type === "timeZoneName")?.value ?? "AEST";
  const offset = tzShort === "AEDT" ? "+11:00" : "+10:00";
  return isEnd
    ? `${dateStr}T23:59:59${offset}`
    : `${dateStr}T00:00:00${offset}`;
}

/** Square rejects start_at in the past — use UTC now + 1h when the natural range start is not in the future. */
function resolveStartAt(startDate: string): string {
  const naturalStart = sydneyBoundary(startDate, false);
  const naturalMs = new Date(naturalStart).getTime();
  const minFutureMs = Date.now() + 60 * 60 * 1000;
  if (naturalMs <= minFutureMs) {
    return new Date(minFutureMs).toISOString();
  }
  return naturalStart;
}

// ── POST /api/square/availability ─────────────────────────────────────────────
//
// Proxies to Square Bookings SearchAvailability for a date range.
// locationId and teamMemberId are injected server-side from env vars —
// the client only needs to send service IDs and the date range.
//
// Request body:
// {
//   serviceVariationId: string          — required
//   addOnVariationIds?: string[]        — optional
//   startDate: string                   — YYYY-MM-DD, required
//   endDate:   string                   — YYYY-MM-DD, required
// }
//
// Response: { slots: string[] }  — ISO timestamps of available start times

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    serviceVariationId,
    addOnVariationIds = [],
    startDate,
    endDate,
  } = body as {
    serviceVariationId?: string;
    addOnVariationIds?: string[];
    startDate?: string;
    endDate?: string;
  };

  if (!serviceVariationId || !startDate || !endDate) {
    return NextResponse.json(
      { error: "serviceVariationId, startDate, and endDate are required." },
      { status: 400 }
    );
  }

  const dateRx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRx.test(startDate) || !dateRx.test(endDate)) {
    return NextResponse.json(
      { error: "startDate and endDate must be YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "";
  const teamMemberId = process.env.SQUARE_TEAM_MEMBER_ID;

  const allVariationIds = [serviceVariationId, ...addOnVariationIds];
  const segmentFilters = allVariationIds.map((id) => ({
    serviceVariationId: id,
    ...(teamMemberId ? { teamMemberIdFilter: { any: [teamMemberId] } } : {}),
  }));

  const startAt = resolveStartAt(startDate);
  const endAt = sydneyBoundary(endDate, true);

  try {
    const res = await square.bookings.searchAvailability({
      query: {
        filter: {
          startAtRange: { startAt, endAt },
          locationId,
          segmentFilters,
        },
      },
    });

    const slots: string[] = (res.availabilities ?? [])
      .map((a) => a.startAt)
      .filter((s): s is string => typeof s === "string" && s.length > 0);

    return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[POST /api/square/availability]", error);
    return NextResponse.json(
      { error: "Failed to fetch availability from Square." },
      { status: 500 }
    );
  }
}
