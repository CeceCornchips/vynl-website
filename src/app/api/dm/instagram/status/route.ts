import { NextResponse } from 'next/server';
import { requireInboxSession } from '@/lib/concierge/inbox-auth';
import { getInstagramConnection, getInstagramCredentials, graphBase } from '@/lib/concierge/instagram-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Check = { ok: boolean; detail: string };

async function graphGet(url: string, token: string): Promise<{ ok: boolean; json: Record<string, unknown> }> {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
    return { ok: res.ok, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  } catch (err) {
    return { ok: false, json: { error: { message: err instanceof Error ? err.message : 'request failed' } } };
  }
}

const errorText = (json: Record<string, unknown>) =>
  String((json.error as { message?: string } | undefined)?.message ?? 'unknown error');

/**
 * Checks the Instagram connection without needing a DM: can we read the
 * account, is it subscribed to DM webhooks, and can we read its conversations.
 */
export async function GET() {
  const denied = await requireInboxSession();
  if (denied) return denied;

  const conn = await getInstagramConnection();
  const creds = await getInstagramCredentials();
  if (!creds) return NextResponse.json({ ok: false, connected: false });

  const base = graphBase(creds.api);
  const id = encodeURIComponent(creds.igUserId ?? 'me');

  const profile = await graphGet(`${base}/${id}?fields=id,username`, creds.accessToken);
  const subs = await graphGet(`${base}/${id}/subscribed_apps`, creds.accessToken);
  const convs = await graphGet(`${base}/${id}/conversations?platform=instagram&limit=5`, creds.accessToken);

  const checks: Record<string, Check> = {
    account: profile.ok
      ? { ok: true, detail: `@${String(profile.json.username ?? '?')} (${String(profile.json.id ?? '?')})` }
      : { ok: false, detail: errorText(profile.json) },
    webhooks: subs.ok
      ? (() => {
          const apps = (subs.json.data as { subscribed_fields?: string[] }[] | undefined) ?? [];
          const fields = apps.flatMap((a) => a.subscribed_fields ?? []);
          return { ok: fields.includes('messages'), detail: fields.length ? fields.join(', ') : 'not subscribed' };
        })()
      : { ok: false, detail: errorText(subs.json) },
    conversations: convs.ok
      ? { ok: true, detail: `${((convs.json.data as unknown[]) ?? []).length} recent chats readable` }
      : { ok: false, detail: errorText(convs.json) },
  };

  return NextResponse.json({
    ok: Object.values(checks).every((c) => c.ok),
    connected: true,
    username: conn?.username ?? null,
    connectedAt: conn?.connectedAt ?? null,
    checks,
  });
}
