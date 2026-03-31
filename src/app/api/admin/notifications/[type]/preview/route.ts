import { auth } from '@clerk/nextjs/server';
import { sendNotificationEmail } from '@/lib/email';

interface Params {
  params: Promise<{ type: string }>;
}

const PREVIEW_VARS: Record<string, string> = {
  customer_name: 'Alex Smith',
  service_name: 'Full Detail Package',
  date: 'Friday, 28 March 2026',
  time: '10:00 AM',
  deposit_amount: '$50.00',
  remaining_balance: '$150.00',
  refund_message: 'A full refund of $50.00 will be processed.',
  manage_link: `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'}/booking/manage/preview-token`,
  booking_id: 'PREVIEW-001',
};

export async function POST(_req: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type } = await params;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return Response.json(
        { ok: false, error: 'ADMIN_EMAIL env var is not set.' },
        { status: 500 },
      );
    }

    const manageButtonHtml =
      type === 'booking_confirmation' || type === 'booking_reschedule'
        ? `<div style="text-align:center;margin:28px 0;">
            <a href="${PREVIEW_VARS.manage_link}"
               style="display:inline-block;background:#111827;color:#ffffff;
                      padding:14px 32px;border-radius:8px;text-decoration:none;
                      font-weight:600;font-size:15px;letter-spacing:0.3px;">
              Manage Your Booking
            </a>
          </div>`
        : undefined;

    // For preview: temporarily override the recipient so it always goes to admin
    // We achieve this by using 'admin_new_booking' override pattern manually.
    // sendNotificationEmail already routes admin_new_booking → ADMIN_EMAIL.
    // For other types, we pass adminEmail as toEmail directly.
    await sendNotificationEmail(type, PREVIEW_VARS, adminEmail, { manageButtonHtml });

    return Response.json({ ok: true, sentTo: adminEmail });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
