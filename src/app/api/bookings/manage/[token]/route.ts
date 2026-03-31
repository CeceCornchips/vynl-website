import { fetchBookingByManageToken, fetchManagePolicy, getBookingDateTimeMillis } from '@/lib/manage-booking';

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { token } = await params;
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return Response.json({ ok: false, error: 'Invalid link.' }, { status: 400 });
    }

    const booking = await fetchBookingByManageToken(token);
    if (!booking) {
      return Response.json({ ok: false, error: 'This link has expired. Please contact us.' }, { status: 404 });
    }

    if (
      !booking.manage_token_expires_at ||
      new Date(booking.manage_token_expires_at).getTime() < Date.now()
    ) {
      return Response.json({ ok: false, error: 'This link has expired. Please contact us.' }, { status: 410 });
    }

    const bookingAt = getBookingDateTimeMillis(booking.booking_date, booking.booking_time);
    const isPast = bookingAt < Date.now();
    const policy = await fetchManagePolicy();

    return Response.json({ ok: true, booking, policy, isPast });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

