import { NextRequest, NextResponse } from 'next/server';
import { IG_STATE_COOKIE, inboxLoginConfigured, newOAuthState } from '@/lib/concierge/inbox-auth';
import { instagramLoginUrl, instagramRedirectUri } from '@/lib/concierge/instagram-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * "Continue with Instagram" / "Connect Instagram": sends you to Meta to log in
 * and share the studio's Instagram account. No inbox sign-in is needed first,
 * because the callback only accepts the studio's own account and then signs
 * you in.
 */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const state = inboxLoginConfigured() ? newOAuthState() : null;
  const url = state ? instagramLoginUrl(instagramRedirectUri(origin), state) : null;
  if (!state || !url) return NextResponse.redirect(new URL('/dm-inbox?instagram=not-configured', origin));

  const res = NextResponse.redirect(url);
  res.cookies.set(IG_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/dm/instagram',
    maxAge: 15 * 60,
  });
  return res;
}
