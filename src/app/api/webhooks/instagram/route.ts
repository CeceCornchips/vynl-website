import { after } from 'next/server';
import { draftReplyAfterQuiet } from '@/lib/concierge/agent';
import { ensureConciergeSchema } from '@/lib/concierge/schema';
import {
  getOrCreateConversation,
  recordEcho,
  recordInboundMessage,
  setConversationProfile,
  type StoredAttachment,
} from '@/lib/concierge/store';
import {
  getInstagramProfile,
  instagramVerifyToken,
  messagingEvents,
  verifyInstagramSignature,
  type IgWebhookPayload,
} from '@/lib/instagram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Drafting runs after the response is sent (see after() below) and can take a
// little while with photos.
export const maxDuration = 60;

/** Meta's one-time check when you subscribe the webhook in the App Dashboard. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const expected = instagramVerifyToken();
  const challenge = url.searchParams.get('hub.challenge');
  if (
    url.searchParams.get('hub.mode') === 'subscribe' &&
    expected &&
    url.searchParams.get('hub.verify_token') === expected &&
    challenge
  ) {
    return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new Response('Forbidden', { status: 403 });
}

/**
 * Instagram sends every DM here. Each one is saved once (Meta retries, so
 * message ids keep repeats out), the response goes back straight away, and
 * the draft is written afterwards.
 */
export async function POST(request: Request) {
  const raw = Buffer.from(await request.arrayBuffer());
  if (!verifyInstagramSignature(raw, request.headers.get('x-hub-signature-256'))) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: IgWebhookPayload;
  try {
    payload = JSON.parse(raw.toString('utf8')) as IgWebhookPayload;
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
  }
  const events = messagingEvents(payload);
  if (events.length === 0) {
    // Log the shape (never the content) so unexpected formats show up in Vercel logs.
    console.log('[instagram webhook] no DM events in delivery', {
      object: payload.object,
      entryKeys: (payload.entry ?? []).map((e) => Object.keys(e)),
      fields: (payload.entry ?? []).flatMap((e) => (e.changes ?? []).map((c) => c.field)),
    });
    return Response.json({ received: true });
  }

  // conversation id -> newest client message saved in this delivery
  const toDraft = new Map<number, number>();
  const newChats: { conversationId: number; igUserId: string }[] = [];

  try {
    await ensureConciergeSchema();

    {
      for (const event of events) {
        const msg = event.message;
        // Reactions, read receipts and button taps aren't handled yet.
        if (!msg?.mid || msg.is_deleted || msg.is_unsupported) continue;

        const isEcho = msg.is_echo === true;
        const clientIgId = isEcho ? event.recipient?.id : event.sender?.id;
        if (!clientIgId) continue;

        const attachments: StoredAttachment[] = (msg.attachments ?? []).map((a) => ({
          type: a.type,
          ...(a.payload?.url ? { url: a.payload.url } : {}),
        }));
        const text = msg.text?.trim() ? msg.text : null;
        const sentAt = new Date(Number.isFinite(event.timestamp) ? event.timestamp : Date.now());

        const { conversation, created } = await getOrCreateConversation(clientIgId);
        if (created) newChats.push({ conversationId: conversation.id, igUserId: clientIgId });

        if (isEcho) {
          // A message from your account: either one the inbox sent, or you
          // replying in the Instagram app (which pauses the assistant).
          await recordEcho({
            conversationId: conversation.id,
            igMessageId: msg.mid,
            text,
            attachments,
            sentAt,
          });
          continue;
        }

        const saved = await recordInboundMessage({
          conversationId: conversation.id,
          igMessageId: msg.mid,
          text,
          attachments,
          sentAt,
        });
        if (saved && saved.id > (toDraft.get(conversation.id) ?? 0)) {
          toDraft.set(conversation.id, saved.id);
        }
      }
    }
  } catch (error) {
    console.error('[instagram webhook] failed to save messages:', error);
    // A 500 makes Meta retry later; saved messages won't be duplicated.
    return Response.json({ ok: false }, { status: 500 });
  }

  if (toDraft.size > 0 || newChats.length > 0) {
    after(async () => {
      await Promise.all(
        newChats.map(async ({ conversationId, igUserId }) => {
          const profile = await getInstagramProfile(igUserId);
          if (profile) await setConversationProfile(conversationId, profile);
        }),
      );
      await Promise.all(
        [...toDraft].map(([conversationId, messageId]) =>
          draftReplyAfterQuiet(conversationId, messageId).catch((err) =>
            console.error('[instagram webhook] drafting failed:', err),
          ),
        ),
      );
    });
  }

  return Response.json({ received: true });
}
