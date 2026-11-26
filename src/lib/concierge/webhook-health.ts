import { sql } from '@/lib/db';
import { ensureConciergeSchema } from '@/lib/concierge/schema';

/**
 * A running note of what reached the Instagram webhook, so the inbox's
 * connection check can show whether Meta is delivering at all. Only times and
 * counts are kept, never message text or ids.
 */

const KEY = 'instagram_webhook_health';
/** Rejected deliveries are noted at most this often, so junk traffic can't hammer the database. */
const REJECTED_NOTE_EVERY_MS = 60_000;

export interface WebhookHealth {
  /** Latest signed delivery from Meta, DM or not. */
  lastDeliveryAt: string | null;
  /** Latest delivery that contained at least one DM event. */
  lastDmAt: string | null;
  /** Latest delivery whose signature didn't match the app secret. */
  lastRejectedAt: string | null;
  deliveries: number;
  dmEvents: number;
  rejected: number;
}

const EMPTY: WebhookHealth = {
  lastDeliveryAt: null,
  lastDmAt: null,
  lastRejectedAt: null,
  deliveries: 0,
  dmEvents: 0,
  rejected: 0,
};

async function load(): Promise<WebhookHealth> {
  const rows = (await sql`SELECT value FROM dm_settings WHERE key = ${KEY}`) as { value: string }[];
  if (!rows[0]) return { ...EMPTY };
  try {
    return { ...EMPTY, ...(JSON.parse(rows[0].value) as Partial<WebhookHealth>) };
  } catch {
    return { ...EMPTY };
  }
}

async function save(health: WebhookHealth): Promise<void> {
  const value = JSON.stringify(health);
  await sql`
    INSERT INTO dm_settings (key, value, updated_at) VALUES (${KEY}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}

/** Notes a signed delivery and how many DM events it held. Never throws. */
export async function noteWebhookDelivery(dmEvents: number, now = new Date()): Promise<void> {
  try {
    await ensureConciergeSchema();
    const h = await load();
    const at = now.toISOString();
    h.lastDeliveryAt = at;
    h.deliveries += 1;
    if (dmEvents > 0) {
      h.lastDmAt = at;
      h.dmEvents += dmEvents;
    }
    await save(h);
  } catch (err) {
    console.error('[instagram webhook] could not note delivery:', err);
  }
}

/**
 * Notes a delivery that failed the signature check. A steady stream of these
 * usually means INSTAGRAM_APP_SECRET doesn't match the Meta app. Never throws.
 */
export async function noteWebhookRejected(now = new Date()): Promise<void> {
  try {
    await ensureConciergeSchema();
    const h = await load();
    const last = h.lastRejectedAt ? Date.parse(h.lastRejectedAt) : 0;
    if (now.getTime() - last < REJECTED_NOTE_EVERY_MS) return;
    h.lastRejectedAt = now.toISOString();
    h.rejected += 1;
    await save(h);
  } catch (err) {
    console.error('[instagram webhook] could not note rejected delivery:', err);
  }
}

export async function getWebhookHealth(): Promise<WebhookHealth> {
  try {
    await ensureConciergeSchema();
    return await load();
  } catch {
    return { ...EMPTY };
  }
}
