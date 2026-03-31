'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Service } from '@/types/database';
import { formatCentsAUD } from '@/types/database';
import { Button } from '@/components/ui/button';
import { DatePicker, formatDateDisplay } from '@/components/date-picker';
import { CustomerSearch } from '@/components/admin/customer-search';
import { ArrowLeft, Loader2, CheckCircle, CalendarDays, Clock, Globe } from 'lucide-react';
import { useAdminTimezone, todayIn, tzLabel } from '@/contexts/timezone-context';

// ── Time slot options (08:00 – 18:00, 30-min steps) ──────────────────────────

const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 18; h++) {
  for (const m of [0, 30]) {
    if (h === 18 && m === 30) break;
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

function formatTimeDisplay(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}


// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewBookingPage() {
  const router = useRouter();
  const { timezone } = useAdminTimezone();
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    service_id: '',
    booking_date: '',   // always YYYY-MM-DD string or ''
    booking_time: '09:00',
    address: '',
    notes: '',
    deposit_paid: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/services')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setServices(data.services.filter((s: Service) => s.is_active));
      })
      .catch(() => {})
      .finally(() => setServicesLoading(false));
  }, []);

  const selectedService = services.find((s) => s.id === form.service_id);

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.booking_date) {
      setSubmitError('Please select a booking date.');
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...(selectedCustomerId ? { customer_id: selectedCustomerId } : {}),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to create booking.');
      setSuccess(true);
      setTimeout(() => router.push('/admin/bookings'), 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="size-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold">Booking Created!</h2>
        <p className="text-sm text-muted-foreground">Redirecting to bookings…</p>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="outline" size="icon-sm">
          <Link href="/admin/bookings">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Manual Booking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a booking without Stripe payment
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Customer details ─────────────────────────────────────────────── */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Customer Details
          </h2>
          <CustomerSearch
            label="Search existing customer or enter new"
            customerId={selectedCustomerId}
            selectionLabel={selectedCustomerId ? form.customer_name : null}
            onCustomerSelect={(p) => {
              setSelectedCustomerId(p.id);
              setForm((prev) => ({
                ...prev,
                customer_name: p.name,
                customer_email: p.email,
                customer_phone: p.phone,
              }));
            }}
            onClear={() => {
              setSelectedCustomerId(null);
              setForm((prev) => ({
                ...prev,
                customer_name: '',
                customer_email: '',
                customer_phone: '',
              }));
            }}
            onNewCustomerManual={() => {
              setSelectedCustomerId(null);
            }}
            placeholder="Search by name, email, or phone…"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <input
                type="text"
                className={inputClass}
                placeholder="Jane Smith"
                value={form.customer_name}
                onChange={(e) => set('customer_name', e.target.value)}
                required
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                className={inputClass}
                placeholder="jane@example.com"
                value={form.customer_email}
                onChange={(e) => set('customer_email', e.target.value)}
                required
              />
            </Field>
            <Field label="Phone" required>
              <input
                type="tel"
                className={inputClass}
                placeholder="04xx xxx xxx"
                value={form.customer_phone}
                onChange={(e) => set('customer_phone', e.target.value)}
                required
              />
            </Field>
          </div>
        </div>

        {/* ── Booking details ──────────────────────────────────────────────── */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Booking Details
          </h2>

          {/* Service */}
          <Field label="Service" required>
            {servicesLoading ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading services…
              </div>
            ) : (
              <select
                className={inputClass}
                value={form.service_id}
                onChange={(e) => set('service_id', e.target.value)}
                required
              >
                <option value="">Select a service…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {formatCentsAUD(s.price_cents)}
                  </option>
                ))}
              </select>
            )}
          </Field>

          {/* Service info card */}
          {selectedService && (
            <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm space-y-1">
              <p className="font-medium">{selectedService.name}</p>
              {selectedService.description && (
                <p className="text-muted-foreground text-xs">{selectedService.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-1 text-xs">
                <span>Duration: <strong>{selectedService.duration_minutes} min</strong></span>
                <span>Price: <strong>{formatCentsAUD(selectedService.price_cents)}</strong></span>
                <span>Deposit: <strong>{formatCentsAUD(selectedService.deposit_cents)}</strong></span>
              </div>
            </div>
          )}

          {/* Timezone context pill */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Globe className="size-3.5 shrink-0 text-primary" />
            <span>
              Booking times are in{' '}
              <strong className="text-foreground">{tzLabel(timezone)}</strong>
            </span>
          </div>

          {/* Date picker */}
          <Field
            label="Date"
            required
            hint="Click to open the calendar and pick a date."
          >
            <DatePicker
              value={form.booking_date}
              onChange={(dateStr) => set('booking_date', dateStr)}
              min={todayIn(timezone)}
              placeholder="Pick a booking date…"
            />
          </Field>

          {/* Time */}
          <Field label="Time" required>
            <select
              className={inputClass}
              value={form.booking_time}
              onChange={(e) => set('booking_time', e.target.value)}
              required
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{formatTimeDisplay(t)}</option>
              ))}
            </select>
          </Field>

          {/* Confirmed date + time banner — shown as soon as both are selected */}
          {form.booking_date && form.booking_time && (
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="size-4 text-primary" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-primary">Booking scheduled for:</p>
                <p className="text-foreground mt-0.5">
                  {formatDateDisplay(form.booking_date)}
                </p>
                <p className="text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                  <Clock className="size-3.5" />
                  {formatTimeDisplay(form.booking_time)}
                </p>
              </div>
            </div>
          )}

          {/* Address — defaults to Vynl Studio for in-studio appointments */}
          <Field label="Location">
            <input
              type="text"
              className={inputClass}
              placeholder="Vynl Studio"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder="Any special instructions or notes…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
            />
          </Field>
        </div>

        {/* ── Payment ──────────────────────────────────────────────────────── */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
            Payment
          </h2>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.deposit_paid}
              onChange={(e) => set('deposit_paid', e.target.checked)}
              className="mt-0.5 rounded border"
            />
            <div>
              <p className="text-sm font-medium">Deposit already paid</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Check this if the customer has paid the deposit outside of the system
                {selectedService && ` (${formatCentsAUD(selectedService.deposit_cents)})`}.
              </p>
            </div>
          </label>
          <p className="mt-3 text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
            Status will be set to <strong>Pending</strong>. No Stripe payment is created for manual bookings.
          </p>
        </div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {submitError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 justify-end pb-6">
          <Button asChild variant="outline">
            <Link href="/admin/bookings">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Create Booking
          </Button>
        </div>
      </form>
    </div>
  );
}
