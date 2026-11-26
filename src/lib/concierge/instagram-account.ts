import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { sql } from '@/lib/db';
import { ensureConciergeSchema } from '@/lib/concierge/schema';

/**
 * The connected Instagram account.
 *
 * New Meta apps use "Instagram API with Unified Login": you log in through a
 * Facebook Login for Business configuration and get a system-user token that
 * doesn't expire, used on graph.facebook.com. "Connect Instagram" in the DM
 * inbox runs that login and stores the token here, encrypted.
 *
 * INSTAGRAM_ACCESS_TOKEN (an Instagram-login user token for graph.instagram.com)
 * still works as a fallback for older apps.
 */

export const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || 'v27.0';
const KEY_NAME = 'instagram_connection';

export type InstagramApi = 'facebook' | 'instagram';

export interface InstagramConnection {
  api: InstagramApi;
  accessToken: string;
  /** The Instagram professional account id (used in /{id}/messages). */
  igUserId: string | null;
  username: string | null;
  connectedAt: string;
}

export interface InstagramCredentials {
  api: InstagramApi;
  accessToken: string;
  igUserId: string | null;
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

async function saveInstagramConnection(input: Omit<InstagramConnection, 'connectedAt'>): Promise<void> {
  await ensureConciergeSchema();
  const value = JSON.stringify({
    api: input.api,
    token: encrypt(input.accessToken),
    igUserId: input.igUserId,
    username: input.username,
    connectedAt: new Date().toISOString(),
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
      api?: InstagramApi;
      token: string;
      igUserId: string | null;
      username: string | null;
      connectedAt: string;
    };
    const accessToken = decrypt(v.token);
    if (!accessToken) return null;
    return {
      api: v.api ?? 'facebook',
      accessToken,
      igUserId: v.igUserId,
      username: v.username,
      connectedAt: v.connectedAt,
    };
  } catch {
    return null;
  }
}

/** What to call Instagram with: the connected account, else the env token. */
export async function getInstagramCredentials(): Promise<InstagramCredentials | null> {
  const conn = await getInstagramConnection();
  if (conn) return { api: conn.api, accessToken: conn.accessToken, igUserId: conn.igUserId };
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  return envToken ? { api: 'instagram', accessToken: envToken, igUserId: null } : null;
}

export function graphBase(api: InstagramApi): string {
  return api === 'facebook'
    ? `https://graph.facebook.com/${GRAPH_VERSION}`
    : `https://graph.instagram.com/${GRAPH_VERSION}`;
}

// ─── Connect Instagram (Unified Login) ───────────────────────────────────────

export function metaAppId(): string | null {
  return process.env.META_APP_ID?.trim() || null;
}

export function loginConfigId(): string | null {
  return process.env.INSTAGRAM_LOGIN_CONFIG_ID?.trim() || null;
}

export function canConnectInstagram(): boolean {
  return Boolean(metaAppId() && loginConfigId() && process.env.INSTAGRAM_APP_SECRET);
}

/** The studio's Instagram username. Only this account can be connected. */
export function studioInstagramUsername(): string {
  return (process.env.INSTAGRAM_USERNAME?.trim() || 'au.vynl').replace(/^@/, '').toLowerCase();
}

/** Thrown when the Meta login shared accounts, but not the studio's. */
export class WrongInstagramAccountError extends Error {
  constructor(shared: string[]) {
    super(
      `Meta shared ${shared.map((u) => `@${u}`).join(', ') || 'no named account'}, not @${studioInstagramUsername()}.`,
    );
    this.name = 'WrongInstagramAccountError';
  }
}

/** Where Meta sends you back after logging in. Must be registered on the login configuration. */
export function instagramRedirectUri(requestOrigin: string): string {
  const base = process.env.CONCIERGE_SITE_URL?.trim() || requestOrigin;
  return `${base.replace(/\/$/, '')}/api/dm/instagram/callback`;
}

export function instagramLoginUrl(redirectUri: string, state: string): string | null {
  const appId = metaAppId();
  const configId = loginConfigId();
  if (!appId || !configId) return null;
  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set('client_id', appId);
  url.searchParams.set('config_id', configId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  return url.toString();
}

async function graphJson<T>(res: Response): Promise<T & { error?: { message?: string } }> {
  return (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
}

/**
 * Swaps the login code for a system-user token, finds the studio's Instagram
 * account among the ones shared, and turns on DM webhooks for it.
 */
export async function completeInstagramLogin(code: string, redirectUri: string): Promise<{ username: string | null }> {
  const appId = metaAppId();
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appId || !appSecret) throw new Error('META_APP_ID and INSTAGRAM_APP_SECRET must be set.');
  const base = graphBase('facebook');

  const tokenUrl = new URL(`${base}/oauth/access_token`);
  tokenUrl.searchParams.set('client_id', appId);
  tokenUrl.searchParams.set('client_secret', appSecret);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);
  tokenUrl.searchParams.set('code', code);
  const tokenRes = await fetch(tokenUrl, { signal: AbortSignal.timeout(15_000) });
  const tokenJson = await graphJson<{ access_token?: string }>(tokenRes);
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(`Meta login failed: ${tokenJson.error?.message ?? `HTTP ${tokenRes.status}`}`);
  }
  const token = tokenJson.access_token;
  const auth = { Authorization: `Bearer ${token}` };

  const accountsRes = await fetch(`${base}/me/assigned_instagram_accounts?fields=id,username`, {
    headers: auth,
    signal: AbortSignal.timeout(15_000),
  });
  const accountsJson = await graphJson<{ data?: { id: string; username?: string }[] }>(accountsRes);
  const accounts = accountsJson.data ?? [];
  if (!accountsRes.ok || accounts.length === 0) {
    throw new Error(
      `No Instagram account was shared during login: ${accountsJson.error?.message ?? 'pick the studio account when asked'}`,
    );
  }
  // Logging in also signs you in to the DM inbox, so only the studio's own
  // account is accepted: proving you can share it is the sign-in.
  const wanted = studioInstagramUsername();
  const account = accounts.find((a) => a.username?.toLowerCase() === wanted);
  if (!account) throw new WrongInstagramAccountError(accounts.map((a) => a.username ?? '').filter(Boolean));

  // Without this subscription Meta doesn't send the account's DMs to the webhook.
  const sub = await fetch(`${base}/${encodeURIComponent(account.id)}/subscribed_apps`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ subscribed_fields: 'messages' }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!sub.ok) {
    const subJson = await graphJson<object>(sub);
    throw new Error(`Connected, but couldn't turn on DM notifications: ${subJson.error?.message ?? `HTTP ${sub.status}`}`);
  }

  await saveInstagramConnection({
    api: 'facebook',
    accessToken: token,
    igUserId: account.id,
    username: account.username ?? null,
  });
  return { username: account.username ?? null };
}
