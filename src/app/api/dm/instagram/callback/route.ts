import { NextRequest, NextResponse } from 'next/server';
import { isInboxSignedIn, oauthStateValid } from '@/lib/concierge/inbox-auth';
import { completeInstagramLogin, instagramRedirectUri } from '@/lib/concierge/instagram-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Instagram sends you back here after you log in; this saves the connection. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const back = (q: string) => NextResponse.redirect(new URL(`/dm-inbox?instagram=${q}`, url.origin));

  if (!(await isInboxSignedIn())) return NextResponse.redirect(new URL('/dm-inbox', url.origin));
  if (url.searchParams.get('error')) return back('cancelled');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') ?? '';
  if (!code || !oauthStateValid(state)) return back('expired');

  try {
    await completeInstagramLogin(code, instagramRedirectUri(url.origin));
    return back('connected');
  } catch (err) {
    console.error('[dm inbox] Instagram connect failed:', err);
    return back('failed');
  }
}
