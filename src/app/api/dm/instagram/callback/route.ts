import { NextRequest, NextResponse } from 'next/server';
import {
  IG_STATE_COOKIE,
  INBOX_COOKIE,
  INBOX_COOKIE_MAX_AGE,
  newInboxSession,
  oauthStateValid,
} from '@/lib/concierge/inbox-auth';
import {
  completeInstagramLogin,
  instagramRedirectUri,
  WrongInstagramAccountError,
} from '@/lib/concierge/instagram-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Meta sends you back here after you log in. Saves the Instagram connection
 * and signs this browser in to the DM inbox.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const back = (q: string) => {
    const res = NextResponse.redirect(new URL(`/dm-inbox?instagram=${q}`, url.origin));
    res.cookies.set(IG_STATE_COOKIE, '', { path: '/api/dm/instagram', maxAge: 0 });
    return res;
  };

  if (url.searchParams.get('error')) return back('cancelled');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') ?? '';
  const startedHere = req.cookies.get(IG_STATE_COOKIE)?.value === state;
  if (!code || !state || !startedHere || !oauthStateValid(state)) return back('expired');

  try {
    await completeInstagramLogin(code, instagramRedirectUri(url.origin));
  } catch (err) {
    console.error('[dm inbox] Instagram connect failed:', err);
    return back(err instanceof WrongInstagramAccountError ? 'wrong-account' : 'failed');
  }

  const res = back('connected');
  res.cookies.set(INBOX_COOKIE, await newInboxSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: INBOX_COOKIE_MAX_AGE,
  });
  return res;
}
