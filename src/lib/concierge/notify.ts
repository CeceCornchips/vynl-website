import { Resend } from 'resend';
import { sql } from '@/lib/db';
import { EMAIL_FROM, SUPPORT_EMAIL } from '@/lib/email-config';
import { inboxUrl } from '@/lib/concierge/config';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Emails the studio inbox (SUPPORT_EMAIL) when a chat needs you personally. */
export async function alertOwner(input: {
  conversationId: number;
  who: string;
  reason: string;
  urgent: boolean;
  lastClientMessage: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = SUPPORT_EMAIL;
  if (!apiKey) return;

  const link = inboxUrl(input.conversationId);
  const subject = `${input.urgent ? 'URGENT: ' : ''}Instagram DM needs you: ${input.who}`.slice(0, 180);
  const html = `
<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:520px">
  <p style="margin:0 0 12px"><strong>${escapeHtml(input.who)}</strong> needs you on Instagram.</p>
  <p style="margin:0 0 12px">${escapeHtml(input.reason)}</p>
  ${
    input.lastClientMessage
      ? `<p style="margin:0 0 12px;padding:12px;background:#f4f4f5;border-radius:8px">${escapeHtml(input.lastClientMessage)}</p>`
      : ''
  }
  <p style="margin:0"><a href="${escapeHtml(link)}">Open the DM inbox</a></p>
</div>`.trim();

  try {
    const { error } = await new Resend(apiKey).emails.send({ from: EMAIL_FROM, to, subject, html });
    if (error) console.error('[concierge] owner alert email failed:', error.message);
  } catch (err) {
    console.error('[concierge] owner alert email failed:', err);
  }
}

const DRAFT_EMAIL_KEY = 'draft_email_last';
/** At most one "replies ready" email this often; each lists everything waiting. */
const DRAFT_EMAIL_EVERY_MS = 10 * 60_000;

/** Claims the email slot, so a burst of DMs sends one email, not one each. */
async function claimDraftEmailSlot(): Promise<boolean> {
  const rows = (await sql`
    INSERT INTO dm_settings (key, value, updated_at) VALUES (${DRAFT_EMAIL_KEY}, '', NOW())
    ON CONFLICT (key) DO UPDATE SET updated_at = NOW()
    WHERE dm_settings.updated_at < NOW() - make_interval(secs => ${DRAFT_EMAIL_EVERY_MS / 1000})
    RETURNING key
  `) as { key: string }[];
  return rows.length > 0;
}

/**
 * Emails the studio inbox when replies are waiting for approval, so clients
 * aren't left waiting. Chats that need you personally get their own email
 * (alertOwner), so they're not repeated here. CONCIERGE_DRAFT_EMAILS=off
 * turns this off.
 */
export async function notifyDraftsWaiting(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || process.env.CONCIERGE_DRAFT_EMAILS?.trim().toLowerCase() === 'off') return;
  try {
    const waiting = (await sql`
      SELECT c.id, c.display_name, c.ig_username, d.text
      FROM dm_drafts d
      JOIN dm_conversations c ON c.id = d.conversation_id
      WHERE d.status = 'pending' AND c.status <> 'needs_owner'
      ORDER BY d.created_at DESC
    `) as { id: number; display_name: string | null; ig_username: string | null; text: string }[];
    if (waiting.length === 0 || !(await claimDraftEmailSlot())) return;

    const who = (w: (typeof waiting)[number]) =>
      w.display_name || (w.ig_username ? `@${w.ig_username}` : 'A client');
    const subject =
      waiting.length === 1
        ? `Instagram reply ready to approve: ${who(waiting[0])}`.slice(0, 180)
        : `${waiting.length} Instagram replies ready to approve`;
    const items = waiting
      .slice(0, 5)
      .map(
        (w) => `
  <li style="margin:0 0 10px">
    <a href="${escapeHtml(inboxUrl(w.id))}"><strong>${escapeHtml(who(w))}</strong></a><br>
    <span style="color:#555">${escapeHtml(w.text.length > 160 ? `${w.text.slice(0, 157)}…` : w.text)}</span>
  </li>`,
      )
      .join('');
    const more = waiting.length > 5 ? `<p style="margin:0 0 12px">…and ${waiting.length - 5} more.</p>` : '';
    const html = `
<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:520px">
  <p style="margin:0 0 12px">The assistant has drafted ${waiting.length === 1 ? 'a reply' : 'replies'}. Nothing is sent until you approve.</p>
  <ul style="margin:0 0 12px;padding-left:18px">${items}</ul>
  ${more}
  <p style="margin:0"><a href="${escapeHtml(inboxUrl())}">Open the DM inbox</a></p>
</div>`.trim();

    const { error } = await new Resend(apiKey).emails.send({ from: EMAIL_FROM, to: SUPPORT_EMAIL, subject, html });
    if (error) console.error('[concierge] drafts-waiting email failed:', error.message);
  } catch (err) {
    console.error('[concierge] drafts-waiting email failed:', err);
  }
}
