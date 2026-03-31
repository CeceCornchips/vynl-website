import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const TO = "vynlau@gmail.com";
const FROM = "onboarding@resend.dev";

export const runtime = "nodejs";

type InspoImage = {
  filename: string;
  contentType: string;
  base64: string;
};

type Body = {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceName?: string;
  addOnNames?: string[];
  appointmentDate?: string;
  appointmentTime?: string;
  notes?: string;
  skipped?: boolean;
  images?: InspoImage[];
  /** Vynl booking ID (from /api/bookings/create) */
  bookingId?: string;
  /** Legacy Square fields — kept for backward compatibility */
  squareBookingId?: string;
  squarePaymentId?: string;
};

function sanitizeSubjectPart(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim().slice(0, 200) || "—";
}

function safeFilename(name: string, i: number, contentType: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || `inspo-${i + 1}`;
  if (/\.(jpe?g|png|webp)$/i.test(base)) return base;
  if (contentType === "image/png") return `${base}.png`;
  if (contentType === "image/webp") return `${base}.webp`;
  return `${base}.jpg`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email is not configured." }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const clientName = typeof body.clientName === "string" ? body.clientName.trim() : "";
  const clientEmail = typeof body.clientEmail === "string" ? body.clientEmail.trim() : "";
  const clientPhone = typeof body.clientPhone === "string" ? body.clientPhone.trim() : "";
  const serviceName = typeof body.serviceName === "string" ? body.serviceName.trim() : "";
  const addOnNames = Array.isArray(body.addOnNames)
    ? body.addOnNames.filter((x): x is string => typeof x === "string")
    : [];
  const appointmentDate = typeof body.appointmentDate === "string" ? body.appointmentDate.trim() : "";
  const appointmentTime = typeof body.appointmentTime === "string" ? body.appointmentTime.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const skipped = body.skipped === true;
  const images = Array.isArray(body.images) ? body.images : [];
  const bookingId =
    typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  const squareBookingId =
    typeof body.squareBookingId === "string" ? body.squareBookingId.trim() : "";
  const squarePaymentId =
    typeof body.squarePaymentId === "string" ? body.squarePaymentId.trim() : "";

  const refId = bookingId || squareBookingId || squarePaymentId;

  if (!clientName || !clientEmail || !serviceName) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!refId) {
    return NextResponse.json(
      { error: "A booking ID is required." },
      { status: 400 }
    );
  }

  if (!skipped && images.length === 0) {
    return NextResponse.json({ error: "No inspiration images and not skipped." }, { status: 400 });
  }

  if (images.length > 4) {
    return NextResponse.json({ error: "Too many images." }, { status: 400 });
  }

  const buffers: { buf: Buffer; filename: string; contentType: string; index: number }[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!img || typeof img.base64 !== "string") continue;
    const contentType =
      typeof img.contentType === "string" && img.contentType.startsWith("image/")
        ? img.contentType
        : "image/jpeg";
    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
      return NextResponse.json({ error: "Invalid image type." }, { status: 400 });
    }
    let buf: Buffer;
    try {
      buf = Buffer.from(img.base64, "base64");
    } catch {
      return NextResponse.json({ error: "Invalid image data." }, { status: 400 });
    }
    if (buf.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large." }, { status: 400 });
    }
    const filename = safeFilename(
      typeof img.filename === "string" ? img.filename : "",
      i,
      contentType
    );
    buffers.push({ buf, filename, contentType, index: i });
  }

  if (!skipped && buffers.length === 0) {
    return NextResponse.json({ error: "Could not decode images." }, { status: 400 });
  }

  const baseSubject = `New Vynl Booking — ${sanitizeSubjectPart(clientName)} — ${sanitizeSubjectPart(serviceName)} — ${sanitizeSubjectPart(appointmentDate || "Date TBD")}`;
  const subject = `${baseSubject} — Ref: ${sanitizeSubjectPart(refId)}`;

  const addOnsHtml =
    addOnNames.length > 0
      ? `<ul>${addOnNames.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>`
      : "<p><em>None</em></p>";

  const inspoSection = skipped
    ? "<p><strong>Inspiration:</strong> No inspo uploaded</p>"
    : `<p><strong>Inspiration photos:</strong></p>${buffers
        .map(
          (b) =>
            `<p><img src="cid:inspo-${b.index}" alt="Inspo ${b.index + 1}" style="max-width:100%;height:auto;border:1px solid #eee;" /></p>`
        )
        .join("")}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
  <h2>New Vynl Booking</h2>
  <p><strong>Booking ref:</strong> ${escapeHtml(refId)}</p>
  <p><strong>Name:</strong> ${escapeHtml(clientName)}</p>
  <p><strong>Email:</strong> ${escapeHtml(clientEmail)}</p>
  <p><strong>Phone:</strong> ${clientPhone ? escapeHtml(clientPhone) : "<em>Not provided</em>"}</p>
  <p><strong>Service:</strong> ${escapeHtml(serviceName)}</p>
  <p><strong>Add-ons:</strong></p>
  ${addOnsHtml}
  <p><strong>Appointment date:</strong> ${escapeHtml(appointmentDate || "—")}</p>
  <p><strong>Appointment time:</strong> ${escapeHtml(appointmentTime || "—")}</p>
  ${notes ? `<p><strong>Notes:</strong><br/>${escapeHtml(notes).replace(/\n/g, "<br/>")}</p>` : ""}
  ${inspoSection}
</body>
</html>
`.trim();

  const attachments: {
    filename: string;
    content: Buffer;
    contentType?: string;
    contentId?: string;
  }[] = [];

  for (const b of buffers) {
    attachments.push({
      filename: b.filename,
      content: b.buf,
      contentType: b.contentType,
      contentId: `inspo-${b.index}`,
    });
    attachments.push({
      filename: b.filename,
      content: b.buf,
      contentType: b.contentType,
    });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject,
    html,
    replyTo: clientEmail || undefined,
    attachments: attachments.length ? attachments : undefined,
  });

  if (error) {
    console.error("[inspo-email]", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to send email." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
