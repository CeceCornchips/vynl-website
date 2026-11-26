/**
 * Settings for the Instagram DM concierge. Everything here can be changed with
 * an environment variable in Vercel, so switching models or timings needs no
 * code change.
 */

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw == null || raw === '' ? NaN : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const CONCIERGE = {
  /** Model for everyday text DMs. */
  chatModel: process.env.CONCIERGE_MODEL?.trim() || 'claude-haiku-5-5',
  /** Model used when the client has sent a photo (reads inspo better). */
  photoModel: process.env.CONCIERGE_PHOTO_MODEL?.trim() || 'claude-sonnet-5-5',
  /** Wait this long after the last client message before drafting, so a burst
   * of "hi" / "how much" / photo gets one reply. */
  debounceMs: envNumber('CONCIERGE_DEBOUNCE_MS', 6000),
  /** When you reply yourself from the Instagram app, the assistant stays quiet
   * in that chat for this many hours. */
  humanPauseHours: envNumber('CONCIERGE_PAUSE_HOURS', 12),
  /** How many recent messages the assistant reads. */
  maxHistoryMessages: 30,
  /** How many of the most recent client photos it looks at. */
  maxImages: 4,
  /** Safety cap on model calls per draft. */
  maxAgentIterations: 6,
  /** Instagram rejects longer text messages. */
  maxReplyChars: 1000,
} as const;

/** Owner name used in the opening line and holding replies. */
export const OWNER_NAME = process.env.CONCIERGE_OWNER_NAME?.trim() || 'Cece';

/** This site's address. An empty NEXT_PUBLIC_APP_URL counts as unset. */
function siteBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return base.replace(/\/$/, '');
}

/**
 * Where clients book: CONCIERGE_BOOKING_URL if set, otherwise the booking site
 * Square reports, otherwise this site's Book page.
 */
export function bookingUrl(squareBookingSiteUrl: string | null): string {
  return (
    process.env.CONCIERGE_BOOKING_URL?.trim() || squareBookingSiteUrl || `${siteBaseUrl()}/book`
  );
}

export function inboxUrl(conversationId?: number): string {
  const url = `${siteBaseUrl()}/dm-inbox`;
  return conversationId ? `${url}?c=${conversationId}` : url;
}

/** Approximate list prices in US$ per million tokens, for the cost log only. */
const PRICES: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
};

export function estimateCostUsd(
  model: string,
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number },
): number | null {
  const p = PRICES[model];
  if (!p) return null;
  return (
    (usage.input * p.input +
      usage.output * p.output +
      usage.cacheRead * p.cacheRead +
      usage.cacheWrite * p.cacheWrite) /
    1_000_000
  );
}
