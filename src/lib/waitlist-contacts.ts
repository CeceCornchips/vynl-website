import type { Resend } from "resend";

export type WaitlistType = "academy" | "supply";

/**
 * Each waitlist is a Resend segment, so the full list lives in the Resend
 * dashboard (Audience → Contacts, filter by segment): searchable, exportable as
 * CSV, and ready to email with a Broadcast when the course or supply drop
 * launches, with unsubscribe handled by Resend.
 *
 * Segments are found by name and created on first use, so nothing needs
 * setting up by hand. Rename them in Resend and a new one will be created.
 */
const SEGMENT_NAMES: Record<WaitlistType, string> = {
  academy: "Academy waitlist",
  supply: "Supply waitlist",
};

// Warm serverless instances reuse this, saving a lookup per signup.
const segmentIds = new Map<WaitlistType, string>();

async function getSegmentId(resend: Resend, type: WaitlistType): Promise<string> {
  const cached = segmentIds.get(type);
  if (cached) return cached;

  const name = SEGMENT_NAMES[type];
  const { data: list, error: listError } = await resend.segments.list();
  if (listError) throw new Error(`Listing Resend segments failed: ${listError.message}`);

  let id = list?.data.find((segment) => segment.name === name)?.id;
  if (!id) {
    const { data: created, error: createError } = await resend.segments.create({ name });
    if (createError || !created) {
      throw new Error(`Creating Resend segment "${name}" failed: ${createError?.message}`);
    }
    id = created.id;
  }

  segmentIds.set(type, id);
  return id;
}

/** Adds (or re-adds) a signup to the matching Resend segment. */
export async function addWaitlistContact(
  resend: Resend,
  signup: { email: string; name: string | null; type: WaitlistType }
): Promise<void> {
  const segmentId = await getSegmentId(resend, signup.type);

  const { error: createError } = await resend.contacts.create({
    email: signup.email,
    ...(signup.name ? { firstName: signup.name } : {}),
    unsubscribed: false,
    segments: [{ id: segmentId }],
  });
  if (!createError) return;

  // Usually "contact already exists" (e.g. on both waitlists): add the existing
  // contact to this segment instead.
  const { error: addError } = await resend.contacts.segments.add({ email: signup.email, segmentId });
  if (addError) {
    throw new Error(`Adding contact to Resend segment failed: ${createError.message} / ${addError.message}`);
  }
}
