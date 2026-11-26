import { sql } from '@/lib/db';
import { CONCIERGE } from '@/lib/concierge/config';
import { ensureConciergeSchema } from '@/lib/concierge/schema';
import { instagramIsDryRun } from '@/lib/instagram';
import { getInstagramConnection, instagramAppId } from '@/lib/concierge/instagram-account';
import { requireInboxSession } from '@/lib/concierge/inbox-auth';

export const dynamic = 'force-dynamic';

/** The DM inbox list: every chat, newest first, with what it's waiting on. */
export async function GET() {
  const denied = await requireInboxSession();
  if (denied) return denied;

  try {
    await ensureConciergeSchema();
    const conversations = await sql`
      SELECT
        c.id, c.ig_user_id, c.ig_username, c.display_name, c.status, c.handoff_reason,
        c.bot_paused_until::text AS bot_paused_until,
        c.last_client_message_at::text AS last_client_message_at,
        c.last_message_at::text AS last_message_at,
        last.text AS last_text,
        last.sender AS last_sender,
        COALESCE(jsonb_array_length(last.attachments), 0)::int AS last_attachment_count,
        EXISTS (
          SELECT 1 FROM dm_drafts d WHERE d.conversation_id = c.id AND d.status = 'pending'
        ) AS has_draft,
        (
          SELECT d.urgency FROM dm_drafts d
          WHERE d.conversation_id = c.id AND d.status = 'pending'
          ORDER BY d.created_at DESC LIMIT 1
        ) AS draft_urgency
      FROM dm_conversations c
      LEFT JOIN LATERAL (
        SELECT m.text, m.sender, m.attachments
        FROM dm_messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.sent_at DESC, m.id DESC
        LIMIT 1
      ) last ON true
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
      LIMIT 200
    `;

    const connection = await getInstagramConnection();
    return Response.json({
      ok: true,
      conversations,
      setup: {
        instagramConnected: Boolean(
          (connection || process.env.INSTAGRAM_ACCESS_TOKEN) && process.env.INSTAGRAM_APP_SECRET,
        ),
        instagramUsername: connection?.username ?? null,
        canConnectInstagram: Boolean(instagramAppId() && process.env.INSTAGRAM_APP_SECRET),
        dryRun: await instagramIsDryRun(),
        assistantKeySet: Boolean(process.env.ANTHROPIC_API_KEY),
        chatModel: CONCIERGE.chatModel,
        photoModel: CONCIERGE.photoModel,
        pauseHours: CONCIERGE.humanPauseHours,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
