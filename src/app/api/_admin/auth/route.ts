import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, COOKIE_MAX_AGE, createSession } from "@/lib/session";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

/**
 * In-memory rate limiter keyed by IP.
 * NOTE: In a serverless environment this resets on cold starts.
 * For production hardening, replace with Redis / Vercel KV.
 */
const attemptMap = new Map<string, AttemptRecord>();

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): { blocked: boolean; remaining: number } {
  const now = Date.now();
  const record = attemptMap.get(ip);

  if (!record) {
    return { blocked: false, remaining: MAX_ATTEMPTS };
  }

  // Blocked?
  if (record.blockedUntil !== null && now < record.blockedUntil) {
    return { blocked: true, remaining: 0 };
  }

  // Block window expired — reset
  if (now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    attemptMap.delete(ip);
    return { blocked: false, remaining: MAX_ATTEMPTS };
  }

  return {
    blocked: record.count >= MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - record.count),
  };
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = attemptMap.get(ip);

  if (!record) {
    attemptMap.set(ip, { count: 1, firstAttempt: now, blockedUntil: null });
    return;
  }

  const newCount = record.count + 1;
  attemptMap.set(ip, {
    count: newCount,
    firstAttempt: record.firstAttempt,
    blockedUntil: newCount >= MAX_ATTEMPTS ? now + BLOCK_MS : null,
  });
}

function clearAttempts(ip: string): void {
  attemptMap.delete(ip);
}

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    return NextResponse.json({ error: "Admin not configured." }, { status: 503 });
  }

  const ip = getIp(req);
  const { blocked } = checkRateLimit(ip);

  if (blocked) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { password } = (body as Record<string, unknown>);

  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  // Artificial 1-second delay on every attempt — prevents brute-force timing
  await new Promise((r) => setTimeout(r, 1000));

  // Constant-time password comparison
  const providedBuf = Buffer.from(password);
  const expectedBuf = Buffer.from(adminPassword);
  const match =
    providedBuf.length === expectedBuf.length &&
    require("crypto").timingSafeEqual(providedBuf, expectedBuf);

  if (!match) {
    recordFailedAttempt(ip);
    const { remaining } = checkRateLimit(ip);
    const msg =
      remaining <= 0
        ? "Incorrect password. Account locked for 15 minutes."
        : `Incorrect password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`;
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  // Success — clear rate limit and issue session
  clearAttempts(ip);

  const sessionToken = await createSession(sessionSecret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return res;
}
