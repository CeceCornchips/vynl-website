import { Resend } from 'resend';
import { getNotificationSetting } from '@/lib/notifications-migration';
import { interpolateTemplate } from '@/lib/notification-template';
import { getBusinessProfile } from '@/lib/business-profile';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = 'Vynl Nail Studio <onboarding@resend.dev>';
const FALLBACK_BUSINESS_NAME = 'Vynl';

async function getBusinessName(): Promise<string> {
  try {
    const profile = await getBusinessProfile();
    return profile.business_name ?? FALLBACK_BUSINESS_NAME;
  } catch {
    return FALLBACK_BUSINESS_NAME;
  }
}

export interface BookingEmailData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  bookingDate: string | Date;
  bookingTime: string;
  address?: string;
  depositAmountCents: number;
  totalAmountCents?: number;
  manageToken?: string | null;
  customerRescheduleEnabled?: boolean;
  customerCancelEnabled?: boolean;
}

// ─── Formatting helpers ────────────────────────────────────────────────────────

function formatDate(dateStr: string | Date): string {
  let date: Date;
  if (dateStr instanceof Date) {
    date = new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());
  } else {
    const [year, month, day] = dateStr.split('-').map(Number);
    date = new Date(year, month - 1, day);
  }
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatAUD(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100);
}

function getManageUrl(manageToken?: string | null): string | null {
  if (!manageToken) return null;
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return `${base.replace(/\/$/, '')}/booking/manage/${encodeURIComponent(manageToken)}`;
}

function buildEmailHtml(bodyText: string, businessName: string, manageButtonHtml?: string): string {
  const paragraphs = bodyText
    .split('\n')
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 14px;font-size:15px;color:#374151;">${line}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#0f172a;padding:28px 40px;text-align:center;">
              <p style="margin:0;font-size:16px;font-weight:700;color:#C9A96E;letter-spacing:0.15em;text-transform:uppercase;">${businessName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              ${paragraphs}
              ${manageButtonHtml ?? ''}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">${businessName} — Premium Nail Studio</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Notification-settings-driven send ────────────────────────────────────────

/**
 * Send an email driven by the notification_settings table.
 * Fetches subject + body template for the given type, interpolates vars,
 * and sends via Resend. Returns early if the notification type is disabled.
 *
 * For admin_new_booking, sends to ADMIN_EMAIL env var instead of toEmail.
 */
export async function sendNotificationEmail(
  type: string,
  vars: Record<string, string>,
  toEmail: string,
  options?: { manageButtonHtml?: string },
): Promise<void> {
  const setting = await getNotificationSetting(type);
  if (!setting || !setting.enabled) return;

  const subject = interpolateTemplate(setting.subject ?? '', vars);
  const bodyText = interpolateTemplate(setting.body ?? '', vars);

  const recipient =
    type === 'admin_new_booking' ? (process.env.ADMIN_EMAIL ?? toEmail) : toEmail;

  const businessName = await getBusinessName();
  const html = buildEmailHtml(bodyText, businessName, options?.manageButtonHtml);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: recipient,
    subject,
    html,
  });
}

// ─── Public email functions (called from route handlers) ──────────────────────

export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  const {
    bookingId,
    customerName,
    customerEmail,
    serviceName,
    bookingDate,
    bookingTime,
    depositAmountCents,
    totalAmountCents,
    manageToken,
    customerRescheduleEnabled = true,
    customerCancelEnabled = true,
  } = data;

  const manageUrl = getManageUrl(manageToken);
  const showManageButton = !!manageUrl && !!(customerRescheduleEnabled || customerCancelEnabled);
  const manageSubtext =
    customerRescheduleEnabled && customerCancelEnabled
      ? 'Reschedule or cancel your appointment online.'
      : customerRescheduleEnabled
        ? 'Reschedule your appointment online.'
        : 'Cancel your appointment online.';

  const depositFormatted = formatAUD(depositAmountCents);
  const remaining =
    totalAmountCents != null
      ? formatAUD(Math.max(0, totalAmountCents - depositAmountCents))
      : formatAUD(0);

  const vars: Record<string, string> = {
    customer_name: customerName,
    service_name: serviceName,
    date: formatDate(bookingDate),
    time: formatTime(bookingTime),
    deposit_amount: depositFormatted,
    remaining_balance: remaining,
    manage_link: manageUrl ?? '',
    refund_message: '',
    booking_id: bookingId,
  };

  const manageButtonHtml = showManageButton
    ? `<div style="text-align:center;margin:28px 0;">
        <a href="${manageUrl}"
           style="display:inline-block;background:#111827;color:#ffffff;
                  padding:14px 32px;border-radius:8px;text-decoration:none;
                  font-weight:600;font-size:15px;letter-spacing:0.3px;">
          Manage Your Booking
        </a>
        <p style="margin-top:10px;color:#6b7280;font-size:13px;">${manageSubtext}</p>
      </div>`
    : undefined;

  await sendNotificationEmail('booking_confirmation', vars, customerEmail, { manageButtonHtml });
}

export async function sendAdminNewBookingAlert(data: BookingEmailData): Promise<void> {
  const { customerName, customerEmail, serviceName, bookingDate, bookingTime, depositAmountCents } =
    data;

  const vars: Record<string, string> = {
    customer_name: customerName,
    service_name: serviceName,
    date: formatDate(bookingDate),
    time: formatTime(bookingTime),
    deposit_amount: formatAUD(depositAmountCents),
    remaining_balance: '',
    manage_link: '',
    refund_message: '',
    booking_id: '',
  };

  await sendNotificationEmail('admin_new_booking', vars, customerEmail);
}

export async function sendBookingReschedule(data: BookingEmailData): Promise<void> {
  const {
    customerName,
    customerEmail,
    serviceName,
    bookingDate,
    bookingTime,
    depositAmountCents,
    totalAmountCents,
    manageToken,
    customerRescheduleEnabled = true,
    customerCancelEnabled = true,
  } = data;

  const manageUrl = getManageUrl(manageToken);
  const showManageButton = !!manageUrl && !!(customerRescheduleEnabled || customerCancelEnabled);
  const remaining =
    totalAmountCents != null
      ? formatAUD(Math.max(0, totalAmountCents - depositAmountCents))
      : formatAUD(0);

  const vars: Record<string, string> = {
    customer_name: customerName,
    service_name: serviceName,
    date: formatDate(bookingDate),
    time: formatTime(bookingTime),
    deposit_amount: formatAUD(depositAmountCents),
    remaining_balance: remaining,
    manage_link: manageUrl ?? '',
    refund_message: '',
    booking_id: '',
  };

  const manageButtonHtml = showManageButton
    ? `<div style="text-align:center;margin:28px 0;">
        <a href="${manageUrl}"
           style="display:inline-block;background:#111827;color:#ffffff;
                  padding:14px 32px;border-radius:8px;text-decoration:none;
                  font-weight:600;font-size:15px;letter-spacing:0.3px;">
          Manage Your Booking
        </a>
      </div>`
    : undefined;

  await sendNotificationEmail('booking_reschedule', vars, customerEmail, { manageButtonHtml });
}

export async function sendBookingCancellation(
  data: BookingEmailData & { refundMessage?: string },
): Promise<void> {
  const {
    customerName,
    customerEmail,
    serviceName,
    bookingDate,
    bookingTime,
    depositAmountCents,
    totalAmountCents,
    refundMessage,
  } = data;

  const remaining =
    totalAmountCents != null
      ? formatAUD(Math.max(0, totalAmountCents - depositAmountCents))
      : formatAUD(0);

  const vars: Record<string, string> = {
    customer_name: customerName,
    service_name: serviceName,
    date: formatDate(bookingDate),
    time: formatTime(bookingTime),
    deposit_amount: formatAUD(depositAmountCents),
    remaining_balance: remaining,
    refund_message: refundMessage ?? '',
    manage_link: '',
    booking_id: '',
  };

  await sendNotificationEmail('booking_cancellation', vars, customerEmail);
}

export async function sendBookingReminder(data: BookingEmailData): Promise<void> {
  const {
    customerName,
    customerEmail,
    serviceName,
    bookingDate,
    bookingTime,
    depositAmountCents,
    totalAmountCents,
  } = data;

  const remaining =
    totalAmountCents != null
      ? formatAUD(Math.max(0, totalAmountCents - depositAmountCents))
      : formatAUD(0);

  const vars: Record<string, string> = {
    customer_name: customerName,
    service_name: serviceName,
    date: formatDate(bookingDate),
    time: formatTime(bookingTime),
    deposit_amount: formatAUD(depositAmountCents),
    remaining_balance: remaining,
    refund_message: '',
    manage_link: '',
    booking_id: '',
  };

  await sendNotificationEmail('booking_reminder_24h', vars, customerEmail);
}
