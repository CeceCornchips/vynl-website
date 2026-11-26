import { NextRequest, NextResponse } from 'next/server';
import { isInboxSignedIn, newOAuthState } from '@/lib/concierge/inbox-auth';
import { instagramLoginUrl, instagramRedirectUri } from '@/lib/concierge/instagram-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** "Connect Instagram": sends you to Meta to log in and share the studio's Instagram account. */
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  if (!(await isInboxSignedIn())) return NextResponse.redirect(new URL('/dm-inbox', origin));
  const url = instagramLoginUrl(instagramRedirectUri(origin), newOAuthState());
  if (!url) return NextResponse.redirect(new URL('/dm-inbox?instagram=not-configured', origin));
  return NextResponse.redirect(url);
}
