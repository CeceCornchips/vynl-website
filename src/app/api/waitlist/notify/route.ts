import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

const FROM = "onboarding@resend.dev";
const VALID_TYPES = ["academy", "supply"] as const;
type WaitlistType = (typeof VALID_TYPES)[number];

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { type, subject, previewText } = body as Record<string, unknown>;

  if (!VALID_TYPES.includes(type as WaitlistType)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}.` },
      { status: 400 }
    );
  }
  if (typeof subject !== "string" || !subject.trim()) {
    return NextResponse.json({ error: "subject is required." }, { status: 400 });
  }

  const cleanType = type as WaitlistType;
  const cleanSubject = subject.trim();
  const cleanPreview = typeof previewText === "string" ? previewText.trim() : "";
  const label = cleanType === "academy" ? "Academy" : "Supply";

  const rows = (await sql`
    SELECT id, name, email
    FROM waitlist
    WHERE type = ${cleanType} AND notified = FALSE
  `) as { id: number; name: string; email: string }[];

  if (rows.length === 0) {
    return NextResponse.json({ sent: 0, message: "No unnotified recipients." });
  }

  const resend = new Resend(apiKey);

  const previewMeta = cleanPreview
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${cleanPreview}</div>`
    : "";

  const emails = rows.map((row) => ({
    from: FROM,
    to: row.email,
    subject: cleanSubject,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px;">
  ${previewMeta}
  <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:24px;">Vynl ${label}</p>
  <h2 style="margin-top:0;font-size:24px;">${cleanSubject}</h2>
  <p style="color:#444;">Hi ${row.name},</p>
  <p style="color:#444;">
    The wait is over &mdash; Vynl ${label} is launching, and you&rsquo;re first to know.
  </p>
  <p style="color:#444;">
    As a waitlist member you get exclusive early access before we open to the public.
  </p>
  <p style="color:#444;">Stay tuned for details coming very soon.</p>
  <p style="color:#444;">Talk soon,</p>
  <p style="color:#111;font-weight:600;">The Vynl Team</p>
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
  <p style="font-size:11px;color:#aaa;">
    You&rsquo;re receiving this because you joined the Vynl ${label} waitlist. Reply to this email if you have any questions.
  </p>
</body>
</html>`.trim(),
  }));

  const { data, error } = await resend.batch.send(emails);

  if (error) {
    console.error("[waitlist/notify] Resend batch error:", error);
    return NextResponse.json({ error: "Failed to send emails." }, { status: 502 });
  }

  const sentCount = data?.data?.length ?? rows.length;

  const ids = rows.map((r) => r.id);
  await sql`
    UPDATE waitlist
    SET notified = TRUE, notified_at = NOW()
    WHERE id = ANY(${ids}::int[])
  `;

  return NextResponse.json({ sent: sentCount });
}
