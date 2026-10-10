import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { sql } from "@/lib/db";
import { EMAIL_FROM, SUPPORT_EMAIL } from "@/lib/email-config";
import { addWaitlistContact, type WaitlistType } from "@/lib/waitlist-contacts";

export const runtime = "nodejs";

const VALID_TYPES: readonly WaitlistType[] = ["academy", "supply"];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id          SERIAL PRIMARY KEY,
      name        TEXT,
      email       TEXT NOT NULL,
      type        TEXT NOT NULL,
      notified    BOOLEAN DEFAULT FALSE,
      notified_at TIMESTAMPTZ,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(email, type)
    )
  `;
}

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

  const { name, email, type } = body as Record<string, unknown>;

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type as WaitlistType)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}.` },
      { status: 400 }
    );
  }

  const cleanName = typeof name === "string" && name.trim() ? name.trim().slice(0, 200) : null;
  const cleanEmail = email.trim().toLowerCase().slice(0, 500);
  const cleanType = type as WaitlistType;
  const label = cleanType === "academy" ? "Academy" : "Supply";

  const resend = new Resend(apiKey);

  // The signup is stored twice: in the database (the backup record, and how
  // duplicates are detected) and as a Resend contact (the list she actually
  // works from). Either one succeeding is enough; a signup is only rejected
  // when both fail, so a database outage no longer loses people.
  let savedToDb = false;
  try {
    await ensureTable();
    await sql`
      INSERT INTO waitlist (name, email, type)
      VALUES (${cleanName}, ${cleanEmail}, ${cleanType})
    `;
    savedToDb = true;
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === "23505") {
      return NextResponse.json({ error: "Already on waitlist." }, { status: 409 });
    }
    console.error("[waitlist] DB insert error:", err);
    Sentry.captureException(err, { tags: { waitlist: "db" } });
  }

  let savedToResend = false;
  try {
    await addWaitlistContact(resend, { email: cleanEmail, name: cleanName, type: cleanType });
    savedToResend = true;
  } catch (err: unknown) {
    console.error("[waitlist] Resend contact error:", err);
    Sentry.captureException(err, { tags: { waitlist: "resend" } });
  }

  if (!savedToDb && !savedToResend) {
    return NextResponse.json(
      { error: "We couldn't save your signup. Please try again in a moment." },
      { status: 500 }
    );
  }

  const timestamp = new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    dateStyle: "long",
    timeStyle: "short",
  });

  const ownerHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px;">
  <h2 style="margin-top:0;">New Waitlist Signup — Vynl ${escapeHtml(label)}</h2>
  <table style="border-collapse:collapse;width:100%;">
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;width:120px;">Name</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${cleanName ? escapeHtml(cleanName) : "—"}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">Email</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(cleanEmail)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">List</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">Vynl ${escapeHtml(label)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;font-weight:600;">Signed up</td>
      <td style="padding:8px 0;">${escapeHtml(timestamp)} (AEDT)</td>
    </tr>
  </table>
</body>
</html>`.trim();

  const confirmationHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px;">
  <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:24px;">Vynl ${escapeHtml(label)}</p>
  <h2 style="margin-top:0;font-size:24px;">You&rsquo;re on the list${cleanName ? `, ${escapeHtml(cleanName)}` : ""}.</h2>
  <p style="color:#444;">
    Thanks for joining the Vynl ${escapeHtml(label)} waitlist. You&rsquo;ll be the first to know when we launch &mdash; before anyone else.
  </p>
  <p style="color:#444;">
    We&rsquo;re putting a lot of care into this, and we can&rsquo;t wait to share it with you.
  </p>
  <p style="color:#444;">Talk soon,</p>
  <p style="color:#111;font-weight:600;">The Vynl Team</p>
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
  <p style="font-size:11px;color:#aaa;">
    You signed up for the Vynl ${escapeHtml(label)} waitlist at vynl.com.au. If this wasn&rsquo;t you, you can safely ignore this email.
  </p>
</body>
</html>`.trim();

  const [ownerResult, userResult] = await Promise.allSettled([
    resend.emails.send({
      from: EMAIL_FROM,
      to: SUPPORT_EMAIL,
      subject: `New Waitlist Signup — Vynl ${label}${cleanName ? ` — ${cleanName}` : ""}`,
      html: ownerHtml,
      replyTo: cleanEmail,
    }),
    resend.emails.send({
      from: EMAIL_FROM,
      to: cleanEmail,
      replyTo: SUPPORT_EMAIL,
      subject: `You're on the Vynl ${label} waitlist!`,
      html: confirmationHtml,
    }),
  ]);

  if (ownerResult.status === "rejected") {
    console.error("[waitlist] owner email failed:", ownerResult.reason);
  }
  if (userResult.status === "rejected") {
    console.error("[waitlist] confirmation email failed:", userResult.reason);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
