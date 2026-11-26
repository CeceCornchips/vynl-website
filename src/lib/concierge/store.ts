import { sql } from '@/lib/db';
import { CONCIERGE } from '@/lib/concierge/config';

export type ConversationStatus = 'open' | 'needs_owner';
export type MessageSender = 'client' | 'assistant' | 'owner';
export type DraftStatus = 'pending' | 'sent' | 'discarded' | 'superseded';

export interface StoredAttachment {
  type: string;
  url?: string;
}

export interface DmConversation {
  id: number;
  ig_user_id: string;
  ig_username: string | null;
  display_name: string | null;
  client_id: number | null;
  status: ConversationStatus;
  handoff_reason: string | null;
  bot_paused_until: string | null;
  greeted: boolean;
  last_client_message_at: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DmMessage {
  id: number;
  conversation_id: number;
  ig_message_id: string | null;
  direction: 'inbound' | 'outbound';
  sender: MessageSender;
  text: string | null;
  attachments: StoredAttachment[];
  sent_at: string;
}

export interface DmDraft {
  id: number;
  conversation_id: number;
  reply_to_message_id: number | null;
  text: string;
  dm_type: string | null;
  needs_owner: boolean;
  urgency: 'normal' | 'urgent';
  owner_note: string | null;
  blocked_reason: string | null;
  status: DraftStatus;
  sent_text: string | null;
  edited: boolean;
  model: string | null;
  created_at: string;
  decided_at: string | null;
}

// Static column lists (trusted strings) reused across queries.
const CONVERSATION_COLUMNS = sql.unsafe(`
  id, ig_user_id, ig_username, display_name, client_id, status, handoff_reason,
  bot_paused_until::text AS bot_paused_until, greeted,
  last_client_message_at::text AS last_client_message_at,
  last_message_at::text AS last_message_at,
  created_at::text AS created_at, updated_at::text AS updated_at
`);

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getOrCreateConversation(
  igUserId: string,
): Promise<{ conversation: DmConversation; created: boolean }> {
  const rows = (await sql`
    INSERT INTO dm_conversations (ig_user_id)
    VALUES (${igUserId})
    ON CONFLICT (ig_user_id) DO UPDATE SET updated_at = NOW()
    RETURNING (xmax = 0) AS created, id
  `) as { created: boolean; id: number }[];
  const conversation = await getConversation(rows[0].id);
  if (!conversation) throw new Error('Conversation vanished after insert.');
  return { conversation, created: rows[0].created };
}

export async function getConversation(id: number): Promise<DmConversation | null> {
  const rows = (await sql`
    SELECT ${CONVERSATION_COLUMNS} FROM dm_conversations WHERE id = ${id}
  `) as DmConversation[];
  return rows[0] ?? null;
}

export async function setConversationProfile(
  id: number,
  profile: { name: string | null; username: string | null },
): Promise<void> {
  await sql`
    UPDATE dm_conversations
    SET display_name = COALESCE(${profile.name}, display_name),
        ig_username = COALESCE(${profile.username}, ig_username),
        updated_at = NOW()
    WHERE id = ${id}
  `;
}

export function isPaused(conversation: DmConversation, now = new Date()): boolean {
  return (
    conversation.bot_paused_until != null && new Date(conversation.bot_paused_until) > now
  );
}

/** Stops drafting in this chat for `hours` and clears any waiting draft. */
export async function pauseConversation(id: number, hours: number): Promise<void> {
  await sql`
    UPDATE dm_conversations
    SET bot_paused_until = NOW() + make_interval(secs => ${Math.round(hours * 3600)}),
        status = 'open',
        handoff_reason = NULL,
        updated_at = NOW()
    WHERE id = ${id}
  `;
  await supersedePendingDrafts(id);
}

export async function resumeConversation(id: number): Promise<void> {
  await sql`
    UPDATE dm_conversations
    SET bot_paused_until = NULL, status = 'open', handoff_reason = NULL, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function markNeedsOwner(id: number, reason: string): Promise<void> {
  await sql`
    UPDATE dm_conversations
    SET status = 'needs_owner', handoff_reason = ${reason}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

/** Saves a client DM once. Returns null when Meta re-delivers one we have. */
export async function recordInboundMessage(input: {
  conversationId: number;
  igMessageId: string;
  text: string | null;
  attachments: StoredAttachment[];
  sentAt: Date;
}): Promise<DmMessage | null> {
  const rows = (await sql`
    INSERT INTO dm_messages (conversation_id, ig_message_id, direction, sender, text, attachments, sent_at)
    VALUES (
      ${input.conversationId}, ${input.igMessageId}, 'inbound', 'client',
      ${input.text}, ${JSON.stringify(input.attachments)}::jsonb, ${input.sentAt.toISOString()}
    )
    ON CONFLICT (ig_message_id) DO NOTHING
    RETURNING id, conversation_id, ig_message_id, direction, sender, text, attachments,
              sent_at::text AS sent_at
  `) as DmMessage[];
  if (!rows[0]) return null;
  await sql`
    UPDATE dm_conversations
    SET last_client_message_at = GREATEST(COALESCE(last_client_message_at, ${input.sentAt.toISOString()}::timestamptz), ${input.sentAt.toISOString()}::timestamptz),
        last_message_at = GREATEST(COALESCE(last_message_at, ${input.sentAt.toISOString()}::timestamptz), ${input.sentAt.toISOString()}::timestamptz),
        updated_at = NOW()
    WHERE id = ${input.conversationId}
  `;
  return rows[0];
}

/**
 * Saves a reply before it goes to Instagram, without a message id yet. The id
 * is filled in after the send, and the webhook echo can match on it, so our own
 * sends are never mistaken for you replying from the app.
 */
export async function insertOutgoingMessage(input: {
  conversationId: number;
  sender: Exclude<MessageSender, 'client'>;
  text: string;
}): Promise<number> {
  const rows = (await sql`
    INSERT INTO dm_messages (conversation_id, ig_message_id, direction, sender, text, sent_at)
    VALUES (${input.conversationId}, NULL, 'outbound', ${input.sender}, ${input.text}, NOW())
    RETURNING id
  `) as { id: number }[];
  return rows[0].id;
}

export async function confirmOutgoingMessage(messageId: number, igMessageId: string): Promise<void> {
  await sql`
    UPDATE dm_messages SET ig_message_id = ${igMessageId}, sent_at = NOW() WHERE id = ${messageId}
  `;
  await sql`
    UPDATE dm_conversations c
    SET last_message_at = NOW(), greeted = true, updated_at = NOW()
    FROM dm_messages m
    WHERE m.id = ${messageId} AND c.id = m.conversation_id
  `;
}

export async function deleteOutgoingMessage(messageId: number): Promise<void> {
  await sql`DELETE FROM dm_messages WHERE id = ${messageId} AND ig_message_id IS NULL`;
}

/**
 * Handles Instagram's copy ("echo") of a message sent from your account.
 * Returns 'ours' for replies sent from the inbox, 'owner' when you replied in
 * the Instagram app, and 'duplicate' for repeats. `pause: false` saves an
 * older reply (found by the chat sync) without pausing the assistant.
 */
export async function recordEcho(input: {
  conversationId: number;
  igMessageId: string;
  text: string | null;
  attachments: StoredAttachment[];
  sentAt: Date;
  pause?: boolean;
}): Promise<'ours' | 'owner' | 'duplicate'> {
  const known = (await sql`
    SELECT id FROM dm_messages WHERE ig_message_id = ${input.igMessageId} LIMIT 1
  `) as { id: number }[];
  if (known[0]) return 'duplicate';

  const pending = (await sql`
    UPDATE dm_messages
    SET ig_message_id = ${input.igMessageId}
    WHERE id = (
      SELECT id FROM dm_messages
      WHERE conversation_id = ${input.conversationId}
        AND direction = 'outbound'
        AND ig_message_id IS NULL
        AND text IS NOT DISTINCT FROM ${input.text}
        AND created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY created_at ASC
      LIMIT 1
    )
    RETURNING id
  `) as { id: number }[];
  if (pending[0]) return 'ours';

  const inserted = (await sql`
    INSERT INTO dm_messages (conversation_id, ig_message_id, direction, sender, text, attachments, sent_at)
    VALUES (
      ${input.conversationId}, ${input.igMessageId}, 'outbound', 'owner',
      ${input.text}, ${JSON.stringify(input.attachments)}::jsonb, ${input.sentAt.toISOString()}
    )
    ON CONFLICT (ig_message_id) DO NOTHING
    RETURNING id
  `) as { id: number }[];
  if (!inserted[0]) return 'duplicate';

  await sql`
    UPDATE dm_conversations
    SET last_message_at = GREATEST(COALESCE(last_message_at, ${input.sentAt.toISOString()}::timestamptz), ${input.sentAt.toISOString()}::timestamptz),
        greeted = true,
        updated_at = NOW()
    WHERE id = ${input.conversationId}
  `;
  if (input.pause !== false) await pauseConversation(input.conversationId, CONCIERGE.humanPauseHours);
  return 'owner';
}

export async function getRecentMessages(conversationId: number, limit: number): Promise<DmMessage[]> {
  const rows = (await sql`
    SELECT id, conversation_id, ig_message_id, direction, sender, text, attachments,
           sent_at::text AS sent_at
    FROM dm_messages
    WHERE conversation_id = ${conversationId}
    ORDER BY sent_at DESC, id DESC
    LIMIT ${limit}
  `) as DmMessage[];
  return rows.reverse();
}

/** The newest client message by arrival order (each one schedules its own draft run). */
export async function latestInboundMessageId(conversationId: number): Promise<number | null> {
  const rows = (await sql`
    SELECT id FROM dm_messages
    WHERE conversation_id = ${conversationId} AND direction = 'inbound'
    ORDER BY id DESC
    LIMIT 1
  `) as { id: number }[];
  return rows[0]?.id ?? null;
}

/** True when a reply has already gone out after this client message. */
export async function hasReplyAfter(conversationId: number, messageId: number): Promise<boolean> {
  const rows = (await sql`
    SELECT 1 FROM dm_messages o, dm_messages i
    WHERE i.id = ${messageId}
      AND o.conversation_id = ${conversationId}
      AND o.direction = 'outbound'
      AND (o.sent_at > i.sent_at OR o.ig_message_id IS NULL)
    LIMIT 1
  `) as unknown[];
  return rows.length > 0;
}

// ─── Drafts ───────────────────────────────────────────────────────────────────

const DRAFT_COLUMNS = sql.unsafe(`
  id, conversation_id, reply_to_message_id, text, dm_type, needs_owner, urgency,
  owner_note, blocked_reason, status, sent_text, edited, model,
  created_at::text AS created_at, decided_at::text AS decided_at
`);

export async function supersedePendingDrafts(conversationId: number): Promise<void> {
  await sql`
    UPDATE dm_drafts SET status = 'superseded', decided_at = NOW()
    WHERE conversation_id = ${conversationId} AND status = 'pending'
  `;
}

export async function createDraft(input: {
  conversationId: number;
  replyToMessageId: number | null;
  text: string;
  dmType: string;
  needsOwner: boolean;
  urgency: 'normal' | 'urgent';
  ownerNote: string | null;
  blockedReason: string | null;
  model: string;
}): Promise<DmDraft> {
  await supersedePendingDrafts(input.conversationId);
  const rows = (await sql`
    INSERT INTO dm_drafts (
      conversation_id, reply_to_message_id, text, dm_type, needs_owner, urgency,
      owner_note, blocked_reason, model
    )
    VALUES (
      ${input.conversationId}, ${input.replyToMessageId}, ${input.text}, ${input.dmType},
      ${input.needsOwner}, ${input.urgency}, ${input.ownerNote}, ${input.blockedReason},
      ${input.model}
    )
    RETURNING ${DRAFT_COLUMNS}
  `) as DmDraft[];
  return rows[0];
}

export async function getPendingDraft(conversationId: number): Promise<DmDraft | null> {
  const rows = (await sql`
    SELECT ${DRAFT_COLUMNS} FROM dm_drafts
    WHERE conversation_id = ${conversationId} AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  `) as DmDraft[];
  return rows[0] ?? null;
}

export async function getDraft(id: number): Promise<DmDraft | null> {
  const rows = (await sql`SELECT ${DRAFT_COLUMNS} FROM dm_drafts WHERE id = ${id}`) as DmDraft[];
  return rows[0] ?? null;
}

export async function closeDraft(
  id: number,
  status: Exclude<DraftStatus, 'pending'>,
  sent?: { text: string; edited: boolean },
): Promise<void> {
  await sql`
    UPDATE dm_drafts
    SET status = ${status},
        sent_text = ${sent?.text ?? null},
        edited = ${sent?.edited ?? false},
        decided_at = NOW()
    WHERE id = ${id} AND status = 'pending'
  `;
}
