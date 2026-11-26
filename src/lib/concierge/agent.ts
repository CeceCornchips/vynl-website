import Anthropic from '@anthropic-ai/sdk';
import { formatInTimeZone } from 'date-fns-tz';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { BUSINESS_TIMEZONE } from '@/lib/booking-settings';
import { fetchInstagramImage } from '@/lib/instagram';
import { buildSystemPrompt } from '@/lib/concierge/brain';
import { CONCIERGE, estimateCostUsd, OWNER_NAME } from '@/lib/concierge/config';
import { findBlockedContent } from '@/lib/concierge/guards';
import { alertOwner } from '@/lib/concierge/notify';
import { findOpenSlots } from '@/lib/concierge/slots';
import {
  createDraft,
  getConversation,
  getRecentMessages,
  hasReplyAfter,
  isPaused,
  latestInboundMessageId,
  markNeedsOwner,
  type DmConversation,
  type DmDraft,
  type DmMessage,
} from '@/lib/concierge/store';

// ─── Tools ────────────────────────────────────────────────────────────────────

const DM_TYPES = [
  'price_photo',
  'price',
  'availability',
  'question',
  'booking_change',
  'location',
  'special_request',
  'problem',
  'spam',
  'other',
] as const;

const SubmitReplyInput = z.object({
  reply: z.string(),
  dm_type: z.enum(DM_TYPES),
  needs_owner: z.boolean(),
  urgency: z.enum(['normal', 'urgent']),
  owner_note: z.string(),
});
type SubmitReply = z.infer<typeof SubmitReplyInput>;

const FindSlotsInput = z.object({
  service_id: z.string(),
  add_on_ids: z.array(z.string()),
  date_from: z.string(),
  days: z.number(),
});

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'find_open_slots',
    description:
      "Look up real open appointment start times in Vynl's Square booking calendar for one service plus any add-ons. " +
      'Call this before offering any time. Checks up to 31 days from date_from. ' +
      'Returns dates with open start times in Sydney time; an empty list means fully booked.',
    input_schema: {
      type: 'object',
      properties: {
        service_id: { type: 'string', description: 'The id of one service (not an add-on) from the live menu.' },
        add_on_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ids of add-ons from the live menu the client wants (e.g. a soak-off or an art level). Empty if none.',
        },
        date_from: {
          type: 'string',
          description: 'First date to check, YYYY-MM-DD. Use today if the client has no preference.',
        },
        days: { type: 'integer', description: 'How many days to check, from 1 to 31.' },
      },
      required: ['service_id', 'add_on_ids', 'date_from', 'days'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'submit_reply',
    description:
      `Save your reply for ${OWNER_NAME} to review and send. Call this exactly once, as your last step.`,
    input_schema: {
      type: 'object',
      properties: {
        reply: {
          type: 'string',
          description:
            'The DM to send the client: plain text, no markdown. Use an empty string only for spam or harassment.',
        },
        dm_type: {
          type: 'string',
          enum: [...DM_TYPES],
          description: 'What the client mainly wants.',
        },
        needs_owner: {
          type: 'boolean',
          description: `true when ${OWNER_NAME} must handle this personally (see "Always hand to the owner").`,
        },
        urgency: {
          type: 'string',
          enum: ['normal', 'urgent'],
          description: 'urgent for pain, swelling, a reaction or an upset client; otherwise normal.',
        },
        owner_note: {
          type: 'string',
          description: `One line for ${OWNER_NAME}: what the client wants and anything you couldn't answer. Empty if there's nothing to add.`,
        },
      },
      required: ['reply', 'dm_type', 'needs_owner', 'urgency', 'owner_note'],
      additionalProperties: false,
    },
    strict: true,
  },
];

// ─── Transcript ───────────────────────────────────────────────────────────────

function senderLabel(m: DmMessage): string {
  if (m.sender === 'client') return 'Client';
  if (m.sender === 'owner') return `${OWNER_NAME} (sent personally)`;
  return 'Assistant (sent)';
}

/** Client text can't close or reopen the transcript wrapper. */
function clean(text: string): string {
  return text.replace(/<\/?\s*chat\s*>/gi, '');
}

/** Exported for tests. */
export async function buildTranscript(
  messages: DmMessage[],
): Promise<{ content: Anthropic.Beta.BetaContentBlockParam[]; imageCount: number }> {
  // Only the most recent client photos are shown to the model.
  const imageUrls = new Set<string>();
  for (let i = messages.length - 1; i >= 0 && imageUrls.size < CONCIERGE.maxImages; i -= 1) {
    const m = messages[i];
    if (m.sender !== 'client') continue;
    for (const a of [...m.attachments].reverse()) {
      if (a.type === 'image' && a.url && imageUrls.size < CONCIERGE.maxImages) imageUrls.add(a.url);
    }
  }

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  let buffer = '<chat>\n';
  let imageCount = 0;
  const flush = () => {
    if (buffer) content.push({ type: 'text', text: buffer });
    buffer = '';
  };

  for (const m of messages) {
    const when = formatInTimeZone(new Date(m.sent_at), BUSINESS_TIMEZONE, 'EEE d MMM, h:mm a');
    buffer += `[${senderLabel(m)} · ${when}] ${m.text ? clean(m.text) : ''}\n`;
    for (const a of m.attachments) {
      if (a.type === 'image' && a.url && imageUrls.has(a.url)) {
        const image = await fetchInstagramImage(a.url);
        if (image) {
          buffer += '[photo:]\n';
          flush();
          content.push({
            type: 'image',
            source: { type: 'base64', media_type: image.mediaType, data: image.base64 },
          });
          imageCount += 1;
          continue;
        }
        buffer += "[photo that couldn't be loaded]\n";
      } else {
        buffer += `[${a.type === 'image' ? 'older photo' : `${a.type} attachment`}]\n`;
      }
    }
  }
  buffer += '</chat>';
  flush();
  return { content, imageCount };
}

/** Exported for tests. */
export function contextNote(conversation: DmConversation, messages: DmMessage[]): string {
  const now = new Date();
  const newChat = !conversation.greeted && !messages.some((m) => m.direction === 'outbound');
  const who =
    conversation.display_name ||
    (conversation.ig_username ? `@${conversation.ig_username}` : 'unknown (no name yet)');
  return [
    'Context for this reply, from the Vynl system (not from the client):',
    `- Now: ${formatInTimeZone(now, BUSINESS_TIMEZONE, "EEEE d MMMM yyyy, h:mm a")} Sydney time. Today is ${formatInTimeZone(now, BUSINESS_TIMEZONE, 'yyyy-MM-dd')}.`,
    `- New chat: ${newChat ? 'yes, so start with the opening line' : 'no, so skip the opening line'}.`,
    `- Client's Instagram name: ${who}.`,
    'Reply to the client\'s latest messages, then call submit_reply.',
  ].join('\n');
}

// ─── Run ──────────────────────────────────────────────────────────────────────

let anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  anthropic ??= new Anthropic();
  return anthropic;
}

/** Just the part of the SDK client the loop uses, so tests can pass a fake. */
export type ModelClient = Pick<Anthropic, 'beta'>;

export interface RunLog {
  model: string;
  modelCalls: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  toolCalls: { name: string; ok: boolean }[];
  stopReason: string | null;
  error: string | null;
}

async function saveRun(conversationId: number, draftId: number | null, log: RunLog, startedAt: number) {
  try {
    await sql`
      INSERT INTO dm_agent_runs (
        conversation_id, draft_id, model, model_calls, input_tokens, output_tokens,
        cache_read_tokens, cache_write_tokens, cost_usd, tool_calls, stop_reason,
        duration_ms, error
      )
      VALUES (
        ${conversationId}, ${draftId}, ${log.model}, ${log.modelCalls}, ${log.input}, ${log.output},
        ${log.cacheRead}, ${log.cacheWrite},
        ${estimateCostUsd(log.model, log)},
        ${JSON.stringify(log.toolCalls)}::jsonb, ${log.stopReason},
        ${Date.now() - startedAt}, ${log.error}
      )
    `;
  } catch (err) {
    console.error('[concierge] could not save run log:', err);
  }
}

async function runTool(name: string, input: unknown): Promise<{ content: string; ok: boolean }> {
  try {
    if (name === 'find_open_slots') {
      const parsed = FindSlotsInput.safeParse(input);
      if (!parsed.success) return { content: 'Invalid input for find_open_slots.', ok: false };
      const result = await findOpenSlots(
        parsed.data.service_id,
        parsed.data.add_on_ids,
        parsed.data.date_from,
        parsed.data.days,
      );
      return { content: JSON.stringify(result), ok: !('error' in result) };
    }
    return { content: `Unknown tool: ${name}`, ok: false };
  } catch (err) {
    console.error(`[concierge] tool ${name} failed:`, err);
    return {
      content: "The booking calendar couldn't be read just now. Don't offer times; say you'll confirm availability shortly.",
      ok: false,
    };
  }
}

function describeApiError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return 'Claude API key missing or invalid.';
  if (err instanceof Anthropic.RateLimitError) return 'Claude API rate limit hit; try again shortly.';
  if (err instanceof Anthropic.APIConnectionError) return "Couldn't reach the Claude API; try again shortly.";
  if (err instanceof Anthropic.BadRequestError) return `Claude API rejected the request: ${err.message}`;
  if (err instanceof Anthropic.APIError) return `Claude API error ${err.status ?? ''}: ${err.message}`.trim();
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * The model loop: asks Claude for a reply, runs the lookups it asks for, and
 * stops when it calls submit_reply. Touches no database itself except through
 * the find_open_slots tool.
 */
export async function generateReply(input: {
  client: ModelClient;
  model: string;
  system: string;
  transcript: Anthropic.Beta.BetaContentBlockParam[];
  context: string;
  effort: 'low' | 'medium';
}): Promise<{ result: SubmitReply | null; log: RunLog }> {
  const log: RunLog = {
    model: input.model,
    modelCalls: 0,
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    toolCalls: [],
    stopReason: null,
    error: null,
  };
  const thread: Anthropic.Beta.BetaMessageParam[] = [
    { role: 'user', content: input.transcript },
    { role: 'system', content: input.context },
  ];

  let result: SubmitReply | null = null;
  try {
    for (let i = 0; i < CONCIERGE.maxAgentIterations && !result; i += 1) {
      const response = await input.client.beta.messages.create({
        model: input.model,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: input.effort },
        cache_control: { type: 'ephemeral' },
        system: [{ type: 'text', text: input.system, cache_control: { type: 'ephemeral' } }],
        tools: TOOLS,
        messages: thread,
      });

      log.modelCalls += 1;
      log.input += response.usage.input_tokens;
      log.output += response.usage.output_tokens;
      log.cacheRead += response.usage.cache_read_input_tokens ?? 0;
      log.cacheWrite += response.usage.cache_creation_input_tokens ?? 0;
      log.stopReason = response.stop_reason;

      if (response.stop_reason === 'refusal') {
        result = {
          reply: `Thanks for your message. ${OWNER_NAME} will get back to you personally very soon.`,
          dm_type: 'other',
          needs_owner: true,
          urgency: 'normal',
          owner_note: "The assistant couldn't draft a reply to this one.",
        };
        break;
      }

      const toolUses = response.content.filter(
        (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use',
      );

      const submit = toolUses.find((t) => t.name === 'submit_reply');
      if (submit) {
        const parsed = SubmitReplyInput.safeParse(submit.input);
        log.toolCalls.push({ name: 'submit_reply', ok: parsed.success });
        if (parsed.success) {
          result = parsed.data;
          break;
        }
      }

      if (toolUses.length === 0) {
        // No tool call: keep any text as the draft.
        const text = response.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
          .trim();
        if (text) {
          result = { reply: text, dm_type: 'other', needs_owner: false, urgency: 'normal', owner_note: '' };
        } else {
          log.error = `The assistant stopped without a reply (${response.stop_reason ?? 'unknown'}).`;
        }
        break;
      }

      if (response.stop_reason === 'max_tokens') {
        log.error = 'The assistant ran out of room mid-reply.';
        break;
      }

      thread.push({ role: 'assistant', content: response.content });
      const toolResults: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const tool of toolUses) {
        if (tool.name === 'submit_reply') {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tool.id,
            is_error: true,
            content: 'Invalid submit_reply input. Check every field and call it again.',
          });
          continue;
        }
        const out = await runTool(tool.name, tool.input);
        log.toolCalls.push({ name: tool.name, ok: out.ok });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: out.content,
          ...(out.ok ? {} : { is_error: true }),
        });
      }
      thread.push({ role: 'user', content: toolResults });
    }

    if (!result && !log.error) log.error = 'The assistant used too many steps without replying.';
  } catch (err) {
    log.error = describeApiError(err);
    console.error('[concierge] draft failed:', err);
  }

  return { result, log };
}

/**
 * Writes a draft reply for the chat's latest client messages. Never sends
 * anything: every draft waits in the DM inbox for your approval.
 */
async function runAgent(
  conversation: DmConversation,
  replyToMessageId: number,
): Promise<{ draft: DmDraft | null; error: string | null }> {
  const startedAt = Date.now();
  const messages = await getRecentMessages(conversation.id, CONCIERGE.maxHistoryMessages);
  const { content: transcript, imageCount } = await buildTranscript(messages);
  const model = imageCount > 0 ? CONCIERGE.photoModel : CONCIERGE.chatModel;

  let system: string;
  try {
    system = await buildSystemPrompt();
  } catch (err) {
    const error = `Couldn't load the menu and settings: ${err instanceof Error ? err.message : String(err)}`;
    return { draft: null, error };
  }

  const { result, log } = await generateReply({
    client: getClient(),
    model,
    system,
    transcript,
    context: contextNote(conversation, messages),
    effort: imageCount > 0 ? 'medium' : 'low',
  });

  if (!result) {
    await saveRun(conversation.id, null, log, startedAt);
    return { draft: null, error: log.error };
  }

  const reply = result.reply.trim();
  const blockedReason = reply ? await findBlockedContent(reply, { aiWritten: true }) : null;
  const draft = await createDraft({
    conversationId: conversation.id,
    replyToMessageId,
    text: reply,
    dmType: result.dm_type,
    needsOwner: result.needs_owner,
    urgency: result.urgency,
    ownerNote: result.owner_note.trim() || null,
    blockedReason,
    model,
  });
  await saveRun(conversation.id, draft.id, log, startedAt);

  if (result.needs_owner) {
    const reason = result.owner_note.trim() || `Flagged as ${result.dm_type.replace(/_/g, ' ')}.`;
    await markNeedsOwner(conversation.id, reason);
    const lastClient = [...messages].reverse().find((m) => m.sender === 'client');
    await alertOwner({
      conversationId: conversation.id,
      who:
        conversation.display_name ||
        (conversation.ig_username ? `@${conversation.ig_username}` : 'A client'),
      reason,
      urgent: result.urgency === 'urgent',
      lastClientMessage: lastClient?.text ?? null,
    });
  }

  return { draft, error: null };
}

export type DraftOutcome =
  | { status: 'drafted'; draft: DmDraft }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string };

/**
 * Drafts a reply unless something says not to: you've paused the chat, it's
 * waiting for you, a newer message arrived (that one drafts instead), or a
 * reply already went out. `force` skips those checks (the Redraft button).
 */
export async function draftReplyIfNeeded(
  conversationId: number,
  options: { triggerMessageId?: number; force?: boolean } = {},
): Promise<DraftOutcome> {
  const conversation = await getConversation(conversationId);
  if (!conversation) return { status: 'skipped', reason: 'no such chat' };

  const latest = await latestInboundMessageId(conversationId);
  if (!latest) return { status: 'skipped', reason: 'no client messages' };

  if (!options.force) {
    if (isPaused(conversation)) return { status: 'skipped', reason: 'paused' };
    if (conversation.status === 'needs_owner') return { status: 'skipped', reason: 'waiting for you' };
    if (options.triggerMessageId && latest !== options.triggerMessageId) {
      return { status: 'skipped', reason: 'a newer message will be drafted instead' };
    }
    if (await hasReplyAfter(conversationId, latest)) {
      return { status: 'skipped', reason: 'already replied' };
    }
  }

  const { draft, error } = await runAgent(conversation, latest);
  if (!draft) return { status: 'failed', error: error ?? 'unknown error' };
  return { status: 'drafted', draft };
}

/** Waits for the client to finish typing, then drafts. Called from the webhook. */
export async function draftReplyAfterQuiet(
  conversationId: number,
  triggerMessageId: number,
): Promise<DraftOutcome> {
  await new Promise((resolve) => setTimeout(resolve, CONCIERGE.debounceMs));
  return draftReplyIfNeeded(conversationId, { triggerMessageId });
}
