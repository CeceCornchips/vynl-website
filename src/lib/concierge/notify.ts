import { Resend } from 'resend';
import { EMAIL_FROM } from '@/lib/email-sender';
import { adminInboxUrl } from '@/lib/concierge/config';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Emails you (ADMIN_EMAIL) when a chat needs you personally. */
export async function alertOwner(input: {
  conversationId: number;
  who: string;
  reason: string;
  urgent: boolean;
  lastClientMessage: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL;
  if (!apiKey || !to) return;

  const link = adminInboxUrl(input.conversationId);
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
