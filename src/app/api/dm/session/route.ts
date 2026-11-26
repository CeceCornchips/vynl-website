import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { EMAIL_FROM, SUPPORT_EMAIL } from '@/lib/email-config';
import { siteBaseUrl } from '@/lib/concierge/config';
import {
  INBOX_COOKIE,
  INBOX_COOKIE_MAX_AGE,
  inboxLoginConfigured,
  inboxPasswordEnabled,
  isInboxSignedIn,
  newEmailLinkToken,
  newInboxSession,
  passwordMatches,
} from '@/lib/concierge/inbox-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Per-instance limits. They reset on cold starts, which is fine for slowing
// down guessing and link spam on a one-person inbox.
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60_000;
const attempts = new Map<string, { count: number; first: number; blockedUntil: number | null }>();
let lastLinkSentAt = 0;

function ip(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
}

function inboxEmail(): string {
  return process.env.DM_INBOX_EMAIL?.trim() || SUPPORT_EMAIL;
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}…@${domain}`;
}

/** Whether this browser is signed in, and which sign-in options exist. */
export async function GET() {
  return NextResponse.json({
    signedIn: await isInboxSignedIn(),
    configured: inboxLoginConfigured(),
    passwordEnabled: inboxPasswordEnabled(),
    emailTo: maskEmail(inboxEmail()),
  });
}

/** Sign in with the password, or ask for a sign-in link by email. */
export async function POST(req: NextRequest) {
  if (!inboxLoginConfigured()) {
    return NextResponse.json({ ok: false, error: 'Inbox sign-in isn’t set up yet.' }, { status: 503 });
  }
  const body = (await req.json().catch(() => null)) as { password?: unknown; method?: unknown } | null;

  if (body?.method === 'email') {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: 'Email isn’t set up on this site.' }, { status: 503 });
    if (Date.now() - lastLinkSentAt < 60_000) {
      return NextResponse.json({ ok: false, error: 'A link was just sent. Check your email, or try again in a minute.' }, { status: 429 });
    }
    lastLinkSentAt = Date.now();
    const base = process.env.CONCIERGE_SITE_URL?.trim() || new URL(req.url).origin || siteBaseUrl();
    const link = `${base.replace(/\/$/, '')}/api/dm/session/link?t=${encodeURIComponent(newEmailLinkToken())}`;
    const { error } = await new Resend(apiKey).emails.send({
      from: EMAIL_FROM,
      to: inboxEmail(),
      subject: 'Your Vynl DM inbox sign-in link',
      html: `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:480px">
  <p>Tap to sign in to your Vynl DM inbox. The link works for 15 minutes.</p>
  <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;border-radius:8px;text-decoration:none">Sign in to the DM inbox</a></p>
  <p style="color:#666;font-size:13px">If you didn't ask for this, you can ignore it.</p>
</div>`,
    });
    if (error) {
      console.error('[dm inbox] sign-in email failed:', error.message);
      return NextResponse.json({ ok: false, error: 'The sign-in email couldn’t be sent.' }, { status: 502 });
    }
    return NextResponse.json({ ok: true, sentTo: maskEmail(inboxEmail()) });
  }

  if (!inboxPasswordEnabled()) {
    return NextResponse.json({ ok: false, error: 'Use the emailed sign-in link instead.' }, { status: 400 });
  }
  const key = ip(req);
  const now = Date.now();
  const record = attempts.get(key);
  if (record?.blockedUntil && now < record.blockedUntil) {
    return NextResponse.json({ ok: false, error: 'Too many wrong passwords. Try again in 15 minutes.' }, { status: 429 });
  }
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
