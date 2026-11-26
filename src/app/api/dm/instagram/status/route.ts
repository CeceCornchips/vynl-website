import { NextResponse } from 'next/server';
import { requireInboxSession } from '@/lib/concierge/inbox-auth';
import {
  getInstagramConnection,
  getInstagramCredentials,
  graphBase,
  metaAppId,
} from '@/lib/concierge/instagram-account';
import { getLastSync } from '@/lib/concierge/sync';
import { getWebhookHealth } from '@/lib/concierge/webhook-health';

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

/** Is the Meta app itself set to send Instagram DMs to this site? Uses the app token. */
async function appWebhookCheck(): Promise<Check> {
  const appId = metaAppId();
  const secret = process.env.INSTAGRAM_APP_SECRET;
  if (!appId || !secret) return { ok: false, detail: 'META_APP_ID or INSTAGRAM_APP_SECRET is not set' };
  const res = await graphGet(`${graphBase('facebook')}/${encodeURIComponent(appId)}/subscriptions`, `${appId}|${secret}`);
  if (!res.ok) return { ok: false, detail: errorText(res.json) };
  const subs =
    (res.json.data as { object?: string; callback_url?: string; active?: boolean; fields?: { name?: string }[] }[] | undefined) ??
    [];
  const ig = subs.find((s) => s.object === 'instagram');
  if (!ig) return { ok: false, detail: 'the Meta app has no Instagram webhook set up' };
  const fields = (ig.fields ?? []).map((f) => f.name ?? '').filter(Boolean);
  const url = ig.callback_url ?? '(no callback URL)';
  return {
    ok: ig.active !== false && fields.includes('messages') && url.endsWith('/api/webhooks/instagram'),
    detail: `${url} · ${fields.join(', ') || 'no fields'}${ig.active === false ? ' · inactive' : ''}`,
  };
}

/**
 * Checks the Instagram connection without needing a DM: is the Meta app's
 * webhook pointed here, can we read the account, is it subscribed to DMs, can
 * we read its chats, and what has actually reached the webhook.
 */
export async function GET() {
  const denied = await requireInboxSession();
  if (denied) return denied;

  const [conn, creds, appWebhook, webhookActivity, lastSync] = await Promise.all([
    getInstagramConnection(),
    getInstagramCredentials(),
    appWebhookCheck(),
    getWebhookHealth(),
    getLastSync(),
  ]);
  if (!creds) {
    return NextResponse.json({ ok: false, connected: false, checks: { appWebhook }, webhookActivity, lastSync });
  }

  const base = graphBase(creds.api);
  const id = encodeURIComponent(creds.igUserId ?? 'me');

  const [profile, subs, convsPlain] = await Promise.all([
    graphGet(`${base}/${id}?fields=id,username`, creds.accessToken),
    graphGet(`${base}/${id}/subscribed_apps`, creds.accessToken),
    graphGet(`${base}/${id}/conversations?limit=5`, creds.accessToken),
  ]);
  // Some Meta setups want platform=instagram on this call; try it before reporting a failure.
  const convs = convsPlain.ok
    ? convsPlain
    : await graphGet(`${base}/${id}/conversations?platform=instagram&limit=5`, creds.accessToken);

  const checks: Record<string, Check> = {
    appWebhook,
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
    webhookActivity,
    lastSync,
  });
}
