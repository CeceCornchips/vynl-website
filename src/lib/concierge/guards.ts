import { CONCIERGE } from '@/lib/concierge/config';
import { loadStudioAddressLines } from '@/lib/concierge/square';

/**
 * Checks enforced in code on every reply before it can go to Instagram, so they
 * don't depend on the AI's judgement. Returns a reason when the text must not
 * be sent, or null when it's fine.
 *
 * `aiWritten` adds stricter pattern checks for unedited assistant drafts. Text
 * you wrote or edited yourself only gets the exact-address and length checks.
 */

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const STREET_TYPES =
  /\b\d{1,5}[a-z]?\s+[a-z][a-z'\- ]{1,40}\s(street|st|road|rd|avenue|ave|drive|dr|place|pl|close|cl|crescent|cres|court|ct|parade|pde|way|lane|ln|circuit|cct|boulevard|blvd|terrace|tce|grove|gr)\b/i;

export async function findBlockedContent(
  text: string,
  { aiWritten }: { aiWritten: boolean },
): Promise<string | null> {
  if (text.length > CONCIERGE.maxReplyChars) {
    return `It's longer than Instagram allows (${text.length} of ${CONCIERGE.maxReplyChars} characters).`;
  }

  // The studio's street address (from Square) never goes out in chat.
  const addressLines = await loadStudioAddressLines().catch(() => [] as string[]);
  const said = normalise(text);
  if (addressLines.some((line) => normalise(line).length >= 4 && said.includes(normalise(line)))) {
    return 'It contains the studio address, which is never sent in a DM.';
  }
  if (!aiWritten) return null;

  if (STREET_TYPES.test(text)) {
    return 'It looks like it contains a street address, which is never sent in a DM.';
  }

  // Card numbers never belong in a DM.
  const digits = text.replace(/[\s-]/g, '');
  if (/\d{13,19}/.test(digits)) {
    return 'It contains a long number that could be a card number.';
  }

  return null;
}
