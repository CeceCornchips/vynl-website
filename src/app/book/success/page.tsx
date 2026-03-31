'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Car } from 'lucide-react';
import { formatCentsAUD } from '@/types/database';

interface BookingDetails {
  id: string;
  customer_name: string;
  customer_email: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  address: string;
  deposit_amount_cents: number;
  amount_paid_cents: number;
  payment_status: string;
  price_cents: number;
}

function formatTimeLabel(time: string): string {
  const match = time.match(/^(\d{2}):(\d{2})/);
  if (!match) return time;
  const hour = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

function formatDateLabel(date: string): string {
  return new Date(date).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get('payment_intent');
  const bookingIdParam = searchParams.get('bookingId');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [paymentIntentStatus, setPaymentIntentStatus] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingIdParam) {
      return;
    }

    const query = new URLSearchParams({ bookingId: bookingIdParam });
    if (paymentIntent) query.set('payment_intent', paymentIntent);

    fetch(`/api/bookings/success?${query.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setBooking(data.booking);
          setPaymentIntentStatus(data.paymentIntentStatus ?? null);
          setStatus('success');
        } else {
          setErrorMessage(data.error ?? 'Could not confirm your payment.');
          setStatus('error');
        }
      })
      .catch(() => {
        setErrorMessage('Could not reach the server. Please contact us to confirm your booking.');
        setStatus('error');
      });
  }, [bookingIdParam, paymentIntent]);

  if (!bookingIdParam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="size-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">Booking Not Found</h1>
          <p className="mb-6 text-sm text-zinc-500">
            Missing booking reference. If you completed payment, please contact us with your booking reference.
          </p>
          <a
            href="/book"
            className="text-sm font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
          >
            Return to booking
          </a>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-800" />
          <p className="text-sm text-zinc-500">Confirming your payment…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="size-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">Payment Not Confirmed</h1>
          <p className="mb-6 text-sm text-zinc-500">{errorMessage}</p>
          <a
            href="/book"
            className="text-sm font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
          >
            Return to booking
          </a>
        </div>
      </div>
    );
  }

  const rows: [string, string][] = [
    ['Service', booking?.service_name ?? ''],
    ['Deposit Paid', formatCentsAUD(booking?.amount_paid_cents ?? 0)],
    ['Remaining Balance', formatCentsAUD(Math.max(0, (booking?.price_cents ?? 0) - (booking?.amount_paid_cents ?? 0)))],
    ['Date', formatDateLabel(booking?.booking_date ?? '')],
    ['Time', formatTimeLabel(booking?.booking_time ?? '')],
    ['Address', booking?.address ?? ''],
    ['Name', booking?.customer_name ?? ''],
    ['Email', booking?.customer_email ?? ''],
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="size-8 text-green-600" />
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-zinc-900">Booking Confirmed!</h1>
        <p className="mb-7 text-center text-sm text-zinc-500">
          {paymentIntentStatus === 'succeeded' || booking?.payment_status === 'deposit_paid'
            ? 'Your deposit has been received. We will send a confirmation email shortly.'
            : 'Your booking is confirmed. If payment is still processing, this page will update after Stripe completes it.'}
        </p>

        {/* Summary */}
        <div className="mb-6 space-y-3 rounded-xl bg-zinc-50 p-5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-3 text-sm">
              <span className="shrink-0 text-zinc-400">{label}</span>
              <span className="text-right font-medium text-zinc-800">{value}</span>
            </div>
          ))}
        </div>

        {/* Reference */}
        <div>
          <p className="mb-1.5 text-center text-xs text-zinc-400">Booking Reference</p>
          <p className="break-all rounded-lg bg-zinc-100 px-3 py-2 text-center font-mono text-sm text-zinc-600">
            {booking?.id}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
          <Car className="size-3.5" />
          <span>Mobile Car Detailing</span>
        </div>
        <p className="mt-3 text-center text-xs text-zinc-500">
          Need to reschedule or cancel? Use the link in your confirmation email.
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-800" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
