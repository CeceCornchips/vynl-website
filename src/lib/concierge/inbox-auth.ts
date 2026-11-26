import { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { createSession, verifySession } from '@/lib/session';

/**
 * Sign-in for the DM inbox. The rest of the admin area is switched off, so the
 * inbox has its own password: DM_INBOX_PASSWORD, or ADMIN_PASSWORD if that
 * isn't set. Sessions are signed cookies (see src/lib/session.ts).
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
  return Boolean(inboxPassword() && sessionSecret());
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
