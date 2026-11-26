import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { createSession, verifySession } from '@/lib/session';

/**
 * Sign-in for the DM inbox. The rest of the admin area is switched off, so the
 * inbox has its own sign-in: an emailed link sent only to the studio inbox
 * (DM_INBOX_EMAIL, else SUPPORT_EMAIL), or a password (DM_INBOX_PASSWORD, else
 * ADMIN_PASSWORD). Sessions are signed cookies (see src/lib/session.ts).
 */

export const INBOX_COOKIE = 'vynl_dm_inbox';
export const INBOX_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function sessionSecret(): string {
  const base = process.env.DM_INBOX_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || '';
  // Separate from any admin session signed with the same secret.
  return base ? `${base}:dm-inbox` : '';
}

function inboxPassword(): string {
  return process.env.DM_INBOX_PASSWORD || process.env.ADMIN_PASSWORD || '';
}

export function inboxLoginConfigured(): boolean {
  return Boolean(sessionSecret());
}

export function inboxPasswordEnabled(): boolean {
  return Boolean(inboxPassword());
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** A sign-in token for an emailed link, valid for 15 minutes. */
export function newEmailLinkToken(): string {
  const exp = Date.now() + 15 * 60_000;
  return `${exp}.${sign(`email-link:${exp}`)}`;
}

export function emailLinkTokenValid(token: string): boolean {
  const [expRaw, sig] = token.split('.');
  const exp = Number(expRaw);
  if (!sessionSecret() || !sig || !Number.isFinite(exp) || exp < Date.now()) return false;
  return safeEqual(sig, sign(`email-link:${exp}`));
}

/** Signed state for the Instagram login round trip, valid for 15 minutes. */
export function newOAuthState(): string {
  const exp = Date.now() + 15 * 60_000;
  return `${exp}.${sign(`ig-oauth:${exp}`)}`;
}

export function oauthStateValid(state: string): boolean {
  const [expRaw, sig] = state.split('.');
  const exp = Number(expRaw);
  if (!sessionSecret() || !sig || !Number.isFinite(exp) || exp < Date.now()) return false;
  return safeEqual(sig, sign(`ig-oauth:${exp}`));
}

export function passwordMatches(given: string): boolean {
  const expected = inboxPassword();
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function newInboxSession(): Promise<string> {
  return createSession(sessionSecret());
}

export async function isInboxSignedIn(): Promise<boolean> {
  const secret = sessionSecret();
  if (!secret) return false;
  const value = (await cookies()).get(INBOX_COOKIE)?.value;
  return verifySession(value, secret);
}

/** For API routes: null when signed in, otherwise a 401 response to return. */
export async function requireInboxSession(): Promise<Response | null> {
  if (await isInboxSignedIn()) return null;
  return Response.json({ ok: false, error: 'Please sign in to the DM inbox.' }, { status: 401 });
}
