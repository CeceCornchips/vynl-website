import { NextRequest, NextResponse } from 'next/server';
import { isInboxSignedIn, newOAuthState } from '@/lib/concierge/inbox-auth';
import { INSTAGRAM_SCOPES, instagramAppId, instagramRedirectUri } from '@/lib/concierge/instagram-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** "Connect Instagram": sends you to Instagram to log in as the studio account. */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  if (!(await isInboxSignedIn())) return NextResponse.redirect(new URL('/dm-inbox', origin));
  const appId = instagramAppId();
  if (!appId) return NextResponse.redirect(new URL('/dm-inbox?instagram=not-configured', origin));

  const auth = new URL('https://www.instagram.com/oauth/authorize');
  auth.searchParams.set('enable_fb_login', '0');
  auth.searchParams.set('force_authentication', '1');
  auth.searchParams.set('client_id', appId);
  auth.searchParams.set('redirect_uri', instagramRedirectUri(origin));
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', INSTAGRAM_SCOPES.join(','));
  auth.searchParams.set('state', newOAuthState());
  return NextResponse.redirect(auth.toString());
}
