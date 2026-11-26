import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { getInstagramAccessToken } from '@/lib/concierge/instagram-account';

/**
 * Instagram API with Instagram Login: webhook checks and the Send API.
 * Docs: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api
 */

const GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_VERSION?.trim() || 'v24.0';
const GRAPH_BASE = `https://graph.instagram.com/${GRAPH_VERSION}`;

// ─── Webhook payload ──────────────────────────────────────────────────────────

export interface IgAttachment {
  type: string;
  payload?: { url?: string; title?: string };
}

export interface IgMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: IgAttachment[];
    is_echo?: boolean;
    is_deleted?: boolean;
    is_unsupported?: boolean;
    quick_reply?: { payload?: string };
    reply_to?: { mid?: string; story?: { url?: string; id?: string } };
  };
  postback?: { mid: string; title?: string; payload?: string };
}

export interface IgWebhookPayload {
  object?: string;
  entry?: { id: string; time: number; messaging?: IgMessagingEvent[] }[];
}

/**
 * Meta signs every webhook with the app secret (X-Hub-Signature-256). Anything
 * that fails this check is dropped.
 */
export function verifyInstagramSignature(rawBody: Buffer, header: string | null): boolean {
  const secret = process.env.INSTAGRAM_APP_SECRET;
  if (!secret || !header) return false;
  const match = /^sha256=([0-9a-f]{64})$/i.exec(header.trim());
  if (!match) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const given = Buffer.from(match[1], 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// ─── Sending ──────────────────────────────────────────────────────────────────

export class InstagramSendError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'InstagramSendError';
  }
}

/**
 * Without an access token, local development "sends" nothing and returns a
 * made-up message id, so the inbox can be tried before Instagram is connected.
 */
async function dryRun(): Promise<boolean> {
  return process.env.NODE_ENV !== 'production' && !(await getInstagramAccessToken());
}

export async function instagramIsDryRun(): Promise<boolean> {
  return dryRun();
}

/**
 * The webhook handshake value Meta sends back when you subscribe. It isn't a
 * secret (every webhook is still checked against the app secret), so a fixed
 * default works; INSTAGRAM_VERIFY_TOKEN overrides it.
 */
export function instagramVerifyToken(): string {
  return process.env.INSTAGRAM_VERIFY_TOKEN?.trim() || 'vynl-dm-concierge';
}

/**
 * Sends a text DM. `humanAgentTag` marks a reply sent by a person between 24
 * hours and 7 days after the client's last message, which Meta allows only for
 * human replies.
 */
export async function sendInstagramText(
  recipientId: string,
  text: string,
  options: { humanAgentTag?: boolean } = {},
): Promise<{ messageId: string; dryRun: boolean }> {
  if (await dryRun()) {
    return { messageId: `dryrun_${randomBytes(8).toString('hex')}`, dryRun: true };
  }
  const token = await getInstagramAccessToken();
  if (!token) throw new InstagramSendError('Instagram isn’t connected yet (use Connect Instagram in the inbox).', 500);

  const body: Record<string, unknown> = {
    recipient: { id: recipientId },
    message: { text },
  };
  if (options.humanAgentTag) {
    body.messaging_type = 'MESSAGE_TAG';
    body.tag = 'HUMAN_AGENT';
  }

  const res = await fetch(`${GRAPH_BASE}/me/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as {
    message_id?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json.message_id) {
    throw new InstagramSendError(
      `Instagram didn't accept the message: ${json.error?.message ?? `HTTP ${res.status}`}`,
      res.status,
    );
  }
  return { messageId: json.message_id, dryRun: false };
}

/** Best-effort name and @handle for a new chat. */
export async function getInstagramProfile(
  igsid: string,
): Promise<{ name: string | null; username: string | null } | null> {
  const token = await getInstagramAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(
      `${GRAPH_BASE}/${encodeURIComponent(igsid)}?fields=name,username`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8_000) },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { name?: string; username?: string };
    return { name: json.name ?? null, username: json.username ?? null };
  } catch {
    return null;
  }
}

// ─── Photos ───────────────────────────────────────────────────────────────────

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
export type ImageMediaType = (typeof IMAGE_TYPES)[number];

const ALLOWED_IMAGE_HOSTS = ['fbcdn.net', 'fbsbx.com', 'cdninstagram.com', 'instagram.com'];

function isAllowedImageUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  // Local testing with the DM simulator can use any https image.
  if (process.env.NODE_ENV !== 'production') return true;
  return ALLOWED_IMAGE_HOSTS.some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
  );
}

/** Downloads a DM photo so the model can see it. Returns null if it can't. */
export async function fetchInstagramImage(
  url: string,
): Promise<{ mediaType: ImageMediaType; base64: string } | null> {
  if (!isAllowedImageUrl(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!(IMAGE_TYPES as readonly string[]).includes(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 4.5 * 1024 * 1024) return null;
    return { mediaType: type as ImageMediaType, base64: buf.toString('base64') };
  } catch {
    return null;
  }
}
