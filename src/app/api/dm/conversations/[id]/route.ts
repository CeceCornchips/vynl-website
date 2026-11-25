import { auth } from '@clerk/nextjs/server';
import { after } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { draftReplyIfNeeded } from '@/lib/concierge/agent';
import { CONCIERGE } from '@/lib/concierge/config';
import { findBlockedContent } from '@/lib/concierge/guards';
import { ensureConciergeSchema } from '@/lib/concierge/schema';
import {
  closeDraft,
  confirmOutgoingMessage,
  deleteOutgoingMessage,
  getConversation,
  getDraft,
  getPendingDraft,
  getRecentMessages,
  insertOutgoingMessage,
  pauseConversation,
  resumeConversation,
  supersedePendingDrafts,
} from '@/lib/concierge/store';
import { InstagramSendError, sendInstagramText } from '@/lib/instagram';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const HOUR = 60 * 60 * 1000;

async function requireAdmin(): Promise<Response | null> {
  const { userId } = await auth();
  return userId ? null : Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}

async function parseId(params: Promise<{ id: string }>): Promise<number | null> {
  const id = Number.parseInt((await params).id, 10);
  return Number.isFinite(id) ? id : null;
}

/** One chat: its messages, the waiting draft and the last drafting attempt. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = await parseId(params);
  if (id == null) return Response.json({ ok: false, error: 'Invalid chat id.' }, { status: 400 });

  try {
    await ensureConciergeSchema();
    const conversation = await getConversation(id);
    if (!conversation) return Response.json({ ok: false, error: 'Chat not found.' }, { status: 404 });

    const [messages, draft, runs] = await Promise.all([
      getRecentMessages(id, 100),
      getPendingDraft(id),
      sql`
        SELECT id, draft_id, model, error, cost_usd::float AS cost_usd, duration_ms,
               created_at::text AS created_at
        FROM dm_agent_runs
        WHERE conversation_id = ${id}
        ORDER BY created_at DESC
        LIMIT 1
      `,
    ]);

    return Response.json({ ok: true, conversation, messages, draft, lastRun: runs[0] ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

const ActionBody = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('send'),
    text: z.string(),
    draftId: z.number().int().optional(),
  }),
  z.object({ action: z.literal('discard'), draftId: z.number().int() }),
  z.object({ action: z.literal('take_over') }),
  z.object({ action: z.literal('hand_back') }),
  z.object({ action: z.literal('redraft') }),
]);

/**
 * Inbox buttons: send (a draft, edited or not, or your own message), discard,
 * take over (pause the assistant here), hand back, and redraft.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = await parseId(params);
  if (id == null) return Response.json({ ok: false, error: 'Invalid chat id.' }, { status: 400 });

  const parsed = ActionBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  const body = parsed.data;

  try {
    await ensureConciergeSchema();
    const conversation = await getConversation(id);
    if (!conversation) return Response.json({ ok: false, error: 'Chat not found.' }, { status: 404 });

    switch (body.action) {
      case 'send': {
        const text = body.text.trim();
        if (!text) return Response.json({ ok: false, error: 'The message is empty.' }, { status: 400 });

        const draft = body.draftId != null ? await getDraft(body.draftId) : null;
        if (body.draftId != null && (!draft || draft.conversation_id !== id || draft.status !== 'pending')) {
          return Response.json(
            { ok: false, error: 'That draft has changed. Refresh to see the latest one.' },
            { status: 409 },
          );
        }

        // Instagram only allows replies to someone who messaged you: free for
        // 24 hours, then human replies only, up to 7 days.
        const lastClient = conversation.last_client_message_at
          ? new Date(conversation.last_client_message_at).getTime()
          : null;
        if (lastClient == null) {
          return Response.json(
            { ok: false, error: "Instagram only allows replies once the client has messaged you." },
            { status: 422 },
          );
        }
        const sinceClient = Date.now() - lastClient;
        if (sinceClient > 7 * 24 * HOUR) {
          return Response.json(
            {
              ok: false,
              error: "It's been more than 7 days since their last message, so Instagram won't allow a reply from here. Message them from the Instagram app.",
            },
            { status: 422 },
          );
        }

        const unedited = draft != null && text === draft.text.trim();
        const blocked = await findBlockedContent(text, { aiWritten: unedited });
        if (blocked) {
          return Response.json({ ok: false, error: `Not sent. ${blocked}` }, { status: 422 });
        }

        const messageId = await insertOutgoingMessage({
          conversationId: id,
          sender: unedited ? 'assistant' : 'owner',
          text,
        });
        let result: { messageId: string; dryRun: boolean };
        try {
          result = await sendInstagramText(conversation.ig_user_id, text, {
            humanAgentTag: sinceClient > 24 * HOUR,
          });
        } catch (err) {
          await deleteOutgoingMessage(messageId);
          const message = err instanceof InstagramSendError ? err.message : 'Instagram send failed.';
          console.error('[dm inbox] send failed:', err);
          return Response.json({ ok: false, error: message }, { status: 502 });
        }
        await confirmOutgoingMessage(messageId, result.messageId);

        if (draft) {
          await closeDraft(draft.id, 'sent', { text, edited: !unedited });
        } else {
          // Your own message, not a draft: you've taken this chat over.
          await supersedePendingDrafts(id);
          await pauseConversation(id, CONCIERGE.humanPauseHours);
        }
        return Response.json({ ok: true, dryRun: result.dryRun });
      }

      case 'discard': {
        const draft = await getDraft(body.draftId);
        if (!draft || draft.conversation_id !== id) {
          return Response.json({ ok: false, error: 'Draft not found.' }, { status: 404 });
        }
        await closeDraft(draft.id, 'discarded');
        return Response.json({ ok: true });
      }

      case 'take_over':
        await pauseConversation(id, CONCIERGE.humanPauseHours);
        return Response.json({ ok: true });

      case 'hand_back':
        await resumeConversation(id);
        // If the client is still waiting on a reply, draft one now.
        after(() =>
          draftReplyIfNeeded(id)
            .then(() => undefined)
            .catch((err) => console.error('[dm inbox] draft after hand back failed:', err)),
        );
        return Response.json({ ok: true });

      case 'redraft': {
        const outcome = await draftReplyIfNeeded(id, { force: true });
        if (outcome.status === 'failed') {
          return Response.json({ ok: false, error: outcome.error }, { status: 502 });
        }
        return Response.json({ ok: true, outcome: outcome.status });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
