import { NextRequest, NextResponse } from 'next/server';
import {
  INBOX_COOKIE,
  INBOX_COOKIE_MAX_AGE,
  inboxLoginConfigured,
  isInboxSignedIn,
  newInboxSession,
  passwordMatches,
} from '@/lib/concierge/inbox-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple per-IP limit on wrong passwords. Resets on cold starts, which is
// fine for slowing down guessing on a one-person inbox.
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60_000;
const attempts = new Map<string, { count: number; first: number; blockedUntil: number | null }>();

function ip(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
}

/** Whether this browser is signed in to the DM inbox. */
export async function GET() {
  return NextResponse.json({ signedIn: await isInboxSignedIn(), configured: inboxLoginConfigured() });
}

/** Sign in with the inbox password. */
export async function POST(req: NextRequest) {
  if (!inboxLoginConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'The inbox password isn’t set up yet (DM_INBOX_PASSWORD in Vercel).' },
      { status: 503 },
    );
  }

  const key = ip(req);
  const now = Date.now();
  const record = attempts.get(key);
  if (record?.blockedUntil && now < record.blockedUntil) {
    return NextResponse.json(
      { ok: false, error: 'Too many wrong passwords. Try again in 15 minutes.' },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!passwordMatches(password)) {
    const next =
      record && now - record.first < BLOCK_MS
        ? { ...record, count: record.count + 1 }
        : { count: 1, first: now, blockedUntil: null };
    if (next.count >= MAX_ATTEMPTS) next.blockedUntil = now + BLOCK_MS;
    attempts.set(key, next);
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ ok: false, error: 'That password isn’t right.' }, { status: 401 });
  }

  attempts.delete(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(INBOX_COOKIE, await newInboxSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: INBOX_COOKIE_MAX_AGE,
  });
  return res;
}

/** Sign out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(INBOX_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
