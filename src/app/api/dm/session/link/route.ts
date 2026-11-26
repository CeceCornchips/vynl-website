import { NextRequest, NextResponse } from 'next/server';
import {
  emailLinkTokenValid,
  INBOX_COOKIE,
  INBOX_COOKIE_MAX_AGE,
  newInboxSession,
} from '@/lib/concierge/inbox-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Opened from the emailed sign-in link: signs this browser in and opens the inbox. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get('t') ?? '';
  if (!emailLinkTokenValid(token)) {
    return NextResponse.redirect(new URL('/dm-inbox?signin=expired', url.origin));
  }
  const res = NextResponse.redirect(new URL('/dm-inbox', url.origin));
  res.cookies.set(INBOX_COOKIE, await newInboxSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: INBOX_COOKIE_MAX_AGE,
  });
  return res;
}
