import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { sql } from '@/lib/db';
import { ensureConciergeSchema } from '@/lib/concierge/schema';

/**
 * The connected Instagram account. "Connect Instagram" in the DM inbox stores
 * a long-lived access token here (encrypted), and it's renewed automatically,
 * so nobody has to copy tokens into Vercel. INSTAGRAM_ACCESS_TOKEN in the
 * environment still works as a fallback.
 */

const GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_VERSION?.trim() || 'v24.0';
const KEY_NAME = 'instagram_connection';
const REFRESH_AFTER_MS = 7 * 86_400_000;

export interface InstagramConnection {
  accessToken: string;
  userId: string | null;
  username: string | null;
  expiresAt: string | null;
  refreshedAt: string;
}

function encryptionKey(): Buffer | null {
  const secret = process.env.INSTAGRAM_APP_SECRET || process.env.ADMIN_SESSION_SECRET;
  return secret ? createHash('sha256').update(`${secret}:instagram-token`).digest() : null;
}

function encrypt(plain: string): string {
  const key = encryptionKey();
  if (!key) throw new Error('INSTAGRAM_APP_SECRET is not set.');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.');
}

function decrypt(stored: string): string | null {
  const key = encryptionKey();
  if (!key) return null;
  try {
    const [iv, tag, data] = stored.split('.').map((s) => Buffer.from(s, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export async function saveInstagramConnection(input: {
  accessToken: string;
  userId: string | null;
  username: string | null;
  expiresInSeconds: number | null;
}): Promise<void> {
  await ensureConciergeSchema();
  const value = JSON.stringify({
    token: encrypt(input.accessToken),
    userId: input.userId,
    username: input.username,
    expiresAt: input.expiresInSeconds
      ? new Date(Date.now() + input.expiresInSeconds * 1000).toISOString()
      : null,
    refreshedAt: new Date().toISOString(),
  });
  await sql`
    INSERT INTO dm_settings (key, value, updated_at) VALUES (${KEY_NAME}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}

export async function getInstagramConnection(): Promise<InstagramConnection | null> {
  try {
    await ensureConciergeSchema();
    const rows = (await sql`SELECT value FROM dm_settings WHERE key = ${KEY_NAME}`) as { value: string }[];
    if (!rows[0]) return null;
    const v = JSON.parse(rows[0].value) as {
      token: string;
      userId: string | null;
      username: string | null;
      expiresAt: string | null;
      refreshedAt: string;
    };
    const accessToken = decrypt(v.token);
    if (!accessToken) return null;
    return { accessToken, userId: v.userId, username: v.username, expiresAt: v.expiresAt, refreshedAt: v.refreshedAt };
  } catch {
    return null;
  }
}

/** Renews the long-lived token about weekly (Instagram allows this once it's a day old). */
async function refreshIfDue(conn: InstagramConnection): Promise<InstagramConnection> {
  if (Date.now() - new Date(conn.refreshedAt).getTime() < REFRESH_AFTER_MS) return conn;
  try {
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(conn.accessToken)}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    const json = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
    if (!res.ok || !json.access_token) return conn;
    await saveInstagramConnection({
      accessToken: json.access_token,
      userId: conn.userId,
      username: conn.username,
      expiresInSeconds: json.expires_in ?? null,
    });
    return { ...conn, accessToken: json.access_token, refreshedAt: new Date().toISOString() };
  } catch {
    return conn;
  }
}

/** The token to call Instagram with: the connected account's, else the env var. */
export async function getInstagramAccessToken(): Promise<string | null> {
  const conn = await getInstagramConnection();
  if (conn) return (await refreshIfDue(conn)).accessToken;
  return process.env.INSTAGRAM_ACCESS_TOKEN || null;
}

// ─── OAuth ("Connect Instagram") ──────────────────────────────────────────────

export const INSTAGRAM_SCOPES = ['instagram_business_basic', 'instagram_business_manage_messages'];

/** Where Instagram sends you back after logging in. Must match the app's OAuth redirect URI in Meta. */
export function instagramRedirectUri(requestOrigin: string): string {
  const base = process.env.CONCIERGE_SITE_URL?.trim() || requestOrigin;
  return `${base.replace(/\/$/, '')}/api/dm/instagram/callback`;
}

export function instagramAppId(): string | null {
  return process.env.INSTAGRAM_APP_ID?.trim() || null;
}

/** Swaps the one-time login code for a long-lived token, then turns on DM webhooks for the account. */
export async function completeInstagramLogin(code: string, redirectUri: string): Promise<{ username: string | null }> {
  const appId = instagramAppId();
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appId || !appSecret) throw new Error('INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET must be set.');

  const form = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code: code.replace(/#_$/, ''),
  });
  const shortRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(15_000),
  });
  const shortJson = (await shortRes.json().catch(() => ({}))) as {
    access_token?: string;
    user_id?: string | number;
    data?: { access_token?: string; user_id?: string | number }[];
    error_message?: string;
    error?: { message?: string };
  };
  const short = shortJson.data?.[0] ?? shortJson;
  if (!shortRes.ok || !short.access_token) {
    throw new Error(
      `Instagram login failed: ${shortJson.error_message ?? shortJson.error?.message ?? `HTTP ${shortRes.status}`}`,
    );
  }

  const longRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(short.access_token)}`,
    { signal: AbortSignal.timeout(15_000) },
  );
  const longJson = (await longRes.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!longRes.ok || !longJson.access_token) {
    throw new Error(`Couldn't get a long-lived Instagram token: ${longJson.error?.message ?? `HTTP ${longRes.status}`}`);
  }
  const token = longJson.access_token;

  let username: string | null = null;
  let userId: string | null = short.user_id != null ? String(short.user_id) : null;
  try {
    const me = await fetch(`https://graph.instagram.com/${GRAPH_VERSION}/me?fields=user_id,username`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    const meJson = (await me.json()) as { username?: string; user_id?: string | number };
    username = meJson.username ?? null;
    userId = meJson.user_id != null ? String(meJson.user_id) : userId;
  } catch {
    // Name is only for display.
  }

  // Without this subscription Instagram doesn't send this account's DMs to the webhook.
  const sub = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me/subscribed_apps?subscribed_fields=messages`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) },
  );
  if (!sub.ok) {
    const subJson = (await sub.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(`Connected, but couldn't turn on DM notifications: ${subJson.error?.message ?? `HTTP ${sub.status}`}`);
  }

  await saveInstagramConnection({
    accessToken: token,
    userId,
    username,
    expiresInSeconds: longJson.expires_in ?? null,
  });
  return { username };
}
