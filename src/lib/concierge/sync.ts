import { sql } from '@/lib/db';
import { draftReplyIfNeeded } from '@/lib/concierge/agent';
import { CONCIERGE } from '@/lib/concierge/config';
import { getInstagramConnection, graphBase } from '@/lib/concierge/instagram-account';
import { ensureConciergeSchema } from '@/lib/concierge/schema';
import {
  getOrCreateConversation,
  recordEcho,
  recordInboundMessage,
  setConversationProfile,
  type StoredAttachment,
} from '@/lib/concierge/store';

/**
 * Pulls recent chats from Instagram's Conversations API and saves any messages
 * the webhook didn't deliver. Meta recommends this for webhook gaps, and it
 * also brings in chats Meta won't send to the webhook yet (before App Review).
 *
 * Runs at most every few minutes, triggered by the inbox loading its list.
 */

const SYNC_KEY = 'instagram_last_sync';
const SYNC_EVERY_MS = 2 * 60_000;
const MAX_CONVERSATIONS = 10;
const MAX_MESSAGES = 20;
/** Only chats with a client message this recent get an automatic draft. */
const AUTO_DRAFT_WITHIN_MS = 24 * 60 * 60_000;
/** A synced message this close in time to a saved one with the same text is treated as the same message. */
const SAME_MESSAGE_WINDOW_S = 30;

interface GraphUser {
  id?: string;
  username?: string;
}

interface GraphMessage {
  id?: string;
  created_time?: string;
  from?: GraphUser;
  to?: { data?: GraphUser[] };
  message?: string;
  attachments?: {
    data?: { image_data?: { url?: string }; video_data?: { url?: string }; file_url?: string }[];
  };
}

interface GraphConversation {
  id?: string;
  participants?: { data?: GraphUser[] };
  messages?: { data?: GraphMessage[] };
}

export interface SyncResult {
  at: string;
  ok: boolean;
  conversations: number;
  newMessages: number;
  error?: string;
}

/** Claims the sync slot so only one sync runs every few minutes. */
async function claimSyncSlot(): Promise<boolean> {
  const rows = (await sql`
    INSERT INTO dm_settings (key, value, updated_at) VALUES (${SYNC_KEY}, '{}', NOW())
    ON CONFLICT (key) DO UPDATE SET updated_at = NOW()
    WHERE dm_settings.updated_at < NOW() - make_interval(secs => ${SYNC_EVERY_MS / 1000})
    RETURNING key
  `) as { key: string }[];
  return rows.length > 0;
}

async function saveSyncResult(result: SyncResult): Promise<void> {
  await sql`UPDATE dm_settings SET value = ${JSON.stringify(result)} WHERE key = ${SYNC_KEY}`;
}

export async function getLastSync(): Promise<SyncResult | null> {
  try {
    await ensureConciergeSchema();
    const rows = (await sql`SELECT value FROM dm_settings WHERE key = ${SYNC_KEY}`) as { value: string }[];
    const parsed = rows[0] ? (JSON.parse(rows[0].value) as Partial<SyncResult>) : null;
    return parsed?.at ? (parsed as SyncResult) : null;
  } catch {
    return null;
  }
}

/** Meta writes times like 2026-11-26T04:17:29+0000. */
function parseGraphTime(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return Number.isNaN(d.getTime()) ? null : d;
}

function attachmentsOf(m: GraphMessage): StoredAttachment[] {
  return (m.attachments?.data ?? []).map((a) => {
    if (a.image_data?.url) return { type: 'image', url: a.image_data.url };
    if (a.video_data?.url) return { type: 'video', url: a.video_data.url };
    return a.file_url ? { type: 'file', url: a.file_url } : { type: 'file' };
  });
}

async function alreadySaved(
  conversationId: number,
  direction: 'inbound' | 'outbound',
  text: string | null,
  sentAt: Date,
): Promise<boolean> {
  const rows = (await sql`
    SELECT 1 FROM dm_messages
    WHERE conversation_id = ${conversationId}
      AND direction = ${direction}
      AND text IS NOT DISTINCT FROM ${text}
      AND ABS(EXTRACT(EPOCH FROM (sent_at - ${sentAt.toISOString()}::timestamptz))) < ${SAME_MESSAGE_WINDOW_S}
    LIMIT 1
  `) as unknown[];
  return rows.length > 0;
}

async function fetchConversations(base: string, igId: string, token: string): Promise<GraphConversation[]> {
  const fields = `participants,messages.limit(${MAX_MESSAGES}){id,created_time,from,to,message,attachments}`;
  const query = `fields=${encodeURIComponent(fields)}&limit=${MAX_CONVERSATIONS}`;
  let lastError = 'unknown error';
  // Some Meta setups want platform=instagram here; try without first.
  for (const extra of ['', '&platform=instagram']) {
    const res = await fetch(`${base}/${encodeURIComponent(igId)}/conversations?${query}${extra}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await res.json().catch(() => ({}))) as {
      data?: GraphConversation[];
      error?: { message?: string };
    };
    if (res.ok) return json.data ?? [];
    lastError = json.error?.message ?? `HTTP ${res.status}`;
  }
  throw new Error(lastError);
}

/**
 * Saves messages from the account's recent chats that aren't in the inbox yet,
 * then drafts replies for chats with a new client message from the last day.
 */
export async function syncInstagramChats(options: { force?: boolean; now?: Date } = {}): Promise<SyncResult | null> {
  const now = options.now ?? new Date();
  await ensureConciergeSchema();
  const conn = await getInstagramConnection();
  // Only the Unified Login connection knows the account id the API needs.
  if (!conn || conn.api !== 'facebook' || !conn.igUserId) return null;
  const claimed = await claimSyncSlot();
  if (!claimed && !options.force) return null;

  const ownId = conn.igUserId;
  const ownUsername = conn.username?.toLowerCase() ?? null;
  const isOwn = (u: GraphUser | undefined) =>
    Boolean(u && (u.id === ownId || (ownUsername && u.username?.toLowerCase() === ownUsername)));

  const result: SyncResult = { at: now.toISOString(), ok: true, conversations: 0, newMessages: 0 };
  const toDraft = new Set<number>();
  try {
    const chats = await fetchConversations(graphBase('facebook'), ownId, conn.accessToken);
    for (const chat of chats) {
      const client = (chat.participants?.data ?? []).find((p) => p.id && !isOwn(p));
      if (!client?.id) continue;
      result.conversations += 1;

      const { conversation, created } = await getOrCreateConversation(client.id);
      if (created || !conversation.ig_username) {
        await setConversationProfile(conversation.id, { name: null, username: client.username ?? null });
      }

      // The API lists newest first; save oldest first so the chat reads in order.
      const messages = [...(chat.messages?.data ?? [])].reverse();
      for (const m of messages) {
        const sentAt = parseGraphTime(m.created_time);
        if (!m.id || !sentAt) continue;
        const text = m.message?.trim() ? m.message : null;
        const attachments = attachmentsOf(m);
        if (!text && attachments.length === 0) continue;

        if (isOwn(m.from)) {
          if (await alreadySaved(conversation.id, 'outbound', text, sentAt)) continue;
          // Only a recent reply from the Instagram app should pause the assistant.
          const recent = now.getTime() - sentAt.getTime() < CONCIERGE.humanPauseHours * 3600_000;
          const outcome = await recordEcho({
            conversationId: conversation.id,
            igMessageId: m.id,
            text,
            attachments,
            sentAt,
            pause: recent,
          });
          if (outcome === 'owner') result.newMessages += 1;
          continue;
        }

        if (await alreadySaved(conversation.id, 'inbound', text, sentAt)) continue;
        const saved = await recordInboundMessage({
          conversationId: conversation.id,
          igMessageId: m.id,
          text,
          attachments,
          sentAt,
        });
        if (!saved) continue;
        result.newMessages += 1;
        if (now.getTime() - sentAt.getTime() < AUTO_DRAFT_WITHIN_MS) toDraft.add(conversation.id);
      }
    }
  } catch (err) {
    result.ok = false;
    result.error = err instanceof Error ? err.message : String(err);
    console.error('[instagram sync] failed:', err);
  }

  await saveSyncResult(result).catch(() => undefined);

  // draftReplyIfNeeded skips chats that are paused, already answered or waiting for you.
  for (const id of toDraft) {
    await draftReplyIfNeeded(id).catch((err) => console.error('[instagram sync] drafting failed:', err));
  }
  return result;
}
