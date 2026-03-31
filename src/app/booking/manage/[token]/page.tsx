'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCentsAUD } from '@/types/database';

type DayState = 'available' | 'full' | 'closed';

interface BookingData {
  id: string;
  service_id: string | null;
  service_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  deposit_amount_cents: number;
  amount_paid_cents: number;
  price_cents: number;
  customer_name: string;
  customer_email: string;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  refund_status: string | null;
  rescheduled_from_date: string | null;
  rescheduled_from_time: string | null;
}

interface PolicyData {
  cancellationHoursNotice: number;
  rescheduleHoursNotice: number;
  cancellationRefundPolicy: 'full' | 'deposit_only' | 'none';
  customerRescheduleEnabled: boolean;
  customerCancelEnabled: boolean;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${p}`;
}

function addMins(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function toLabel(date: string, time: string): string {
  const d = new Date(`${date}T00:00:00`);
  const t = time.slice(0, 5);
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })} at ${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function ManageBookingPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [isPast, setIsPast] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [calendarDays, setCalendarDays] = useState<Record<string, DayState>>({});
  const [newDate, setNewDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('');
  const [mode, setMode] = useState<'idle' | 'reschedule' | 'cancel'>('idle');
  const [success, setSuccess] = useState<string | null>(null);
  const [reason, setReason] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  // Mobile-specific state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileWeekOffset, setMobileWeekOffset] = useState(0);
  const [isNextAvailableDate, setIsNextAvailableDate] = useState(false);
  const [serviceDurationMinutes, setServiceDurationMinutes] = useState(0);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Detect mobile viewport once on mount (setTimeout keeps setState out of the sync effect body)
  useEffect(() => {
    const id = window.setTimeout(() => setIsMobile(window.innerWidth < 768), 0);
    return () => window.clearTimeout(id);
  }, []);

  // Load booking + policy
  useEffect(() => {
    if (!token) return;
    fetch(`/api/bookings/manage/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) { setError(d.error ?? 'Could not load booking.'); return; }
        setBooking(d.booking);
        setPolicy(d.policy);
        setIsPast(Boolean(d.isPast));
      })
      .catch(() => setError('Could not load booking.'))
      .finally(() => setLoading(false));
  }, [token]);

  // Fetch service duration for mobile end-time display
  useEffect(() => {
    if (!booking?.service_id) return;
    const id = booking.service_id;
    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.services)) {
          const svc = d.services.find(
            (s: { id: string; duration_minutes: number }) => s.id === id,
          );
          if (svc?.duration_minutes) setServiceDurationMinutes(svc.duration_minutes);
        }
      })
      .catch(() => {});
  }, [booking?.service_id]);

  // Desktop: calendar availability by selected month (replaces calendarDays)
  useEffect(() => {
    if (!booking?.id || !booking?.service_id || mode !== 'reschedule' || isMobile) return;
    const q = new URLSearchParams({
      serviceId: booking.service_id,
      month: calendarMonth,
      excludeBookingId: booking.id,
    });
    fetch(`/api/bookings/calendar-availability?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setCalendarDays(d.days ?? {}); })
      .catch(() => {});
  }, [booking, calendarMonth, mode, isMobile]);

  // Available time slots for selected date
  useEffect(() => {
    if (!booking || !newDate || mode !== 'reschedule') return;
    const serviceId = booking.service_id;
    if (!serviceId) return;
    const q = new URLSearchParams({ date: newDate, serviceId, excludeBookingId: booking.id });
    fetch(`/api/bookings/available-slots?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setSlots((d.slots ?? []).map((s: { time: string }) => s.time));
      })
      .catch(() => setSlots([]));
  }, [booking, newDate, mode]);

  // Mobile: auto-select next available date when reschedule opens
  useEffect(() => {
    if (mode !== 'reschedule' || !booking?.service_id || !isMobile) return;
    const serviceId = booking.service_id;
    fetch(`/api/bookings/next-available?serviceId=${encodeURIComponent(serviceId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.date) {
          setNewDate(d.date as string);
          setIsNextAvailableDate(true);
          // Compute which week row shows this date so we can jump straight to it
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const stripSunday = new Date(today);
          stripSunday.setDate(today.getDate() - today.getDay());
          const [ty, tm, td] = (d.date as string).split('-').map(Number);
          const target = new Date(ty, tm - 1, td);
          const diffDays = Math.round((target.getTime() - stripSunday.getTime()) / 86_400_000);
          setMobileWeekOffset(Math.max(0, Math.floor(diffDays / 7)));
          setTimeout(() => {
            document.getElementById('reschedule-slots')?.scrollIntoView({ behavior: 'smooth' });
          }, 200);
        }
      })
      .catch(() => {});
  }, [mode, booking?.service_id, isMobile]);

  // ── Derived values (useMemo) ───────────────────────────────────────────────

  const todayStr = useMemo(() => ymd(new Date()), []);

  // Months visible in the mobile 4-week strip (1 or 2 months)
  const mobileStripMonths = useMemo(() => {
    if (!isMobile) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + mobileWeekOffset * 7);
    const months = new Set<string>();
    for (let i = 0; i < 28; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return [...months];
  }, [isMobile, mobileWeekOffset]);

  // Mobile: fetch availability for all months in the visible strip (merges into calendarDays)
  useEffect(() => {
    if (!isMobile || !booking?.id || !booking?.service_id || mode !== 'reschedule' || !mobileStripMonths.length) return;
    for (const month of mobileStripMonths) {
      const q = new URLSearchParams({
        serviceId: booking.service_id,
        month,
        excludeBookingId: booking.id,
      });
      fetch(`/api/bookings/calendar-availability?${q.toString()}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) setCalendarDays((prev) => ({ ...prev, ...(d.days ?? {}) }));
        })
        .catch(() => {});
    }
  }, [isMobile, mobileStripMonths, booking, mode]);

  // 28 date strings in the current mobile strip (Sunday-first)
  const mobileStripDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + mobileWeekOffset * 7);
    return Array.from({ length: 28 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return ymd(d);
    });
  }, [mobileWeekOffset]);

  // Month/year label for the mobile strip header
  const mobileStripLabel = useMemo(() => {
    if (!mobileStripDays.length) return '';
    const first = new Date(`${mobileStripDays[0]}T00:00:00`);
    const last = new Date(`${mobileStripDays[27]}T00:00:00`);
    if (first.getMonth() === last.getMonth()) {
      return first.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
    }
    return `${first.toLocaleDateString('en-AU', { month: 'short' })} – ${last.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}`;
  }, [mobileStripDays]);

  // Grouped slots (Morning / Afternoon / Evening) with non-overlapping ranges
  const groupedSlots = useMemo(() => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];
    for (const s of slots) {
      const h = parseInt(s.split(':')[0], 10);
      if (h >= 7 && h < 12) morning.push(s);
      else if (h >= 12 && h < 17) afternoon.push(s);
      else if (h >= 17 && h < 20) evening.push(s);
    }
    return [
      { label: 'Morning', values: morning },
      { label: 'Afternoon', values: afternoon },
      { label: 'Evening', values: evening },
    ];
  }, [slots]);

  const bookingAt = useMemo(() => {
    if (!booking) return 0;
    return new Date(`${booking.booking_date}T${booking.booking_time.slice(0, 8)}`).getTime();
  }, [booking]);

  const noChangeWindow = useMemo(() => {
    if (!policy || !bookingAt) return false;
    const hours = Math.max(policy.cancellationHoursNotice, policy.rescheduleHoursNotice);
    return bookingAt - nowMs < hours * 60 * 60 * 1000;
  }, [policy, bookingAt, nowMs]);

  const canAct = Boolean(booking) && !isPast && booking?.status !== 'cancelled' && !noChangeWindow;
  const remaining = booking ? Math.max(0, booking.price_cents - booking.amount_paid_cents) : 0;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleDateSelect(day: string) {
    setNewDate(day);
    setIsNextAvailableDate(false);
    setTimeout(() => {
      document.getElementById('reschedule-slots')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async function confirmReschedule() {
    if (!token || !newDate || !newTime) return;
    setBusy(true);
    const res = await fetch(`/api/bookings/manage/${encodeURIComponent(token)}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newDate, newTime }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) return setError(data.error ?? 'Could not reschedule booking.');
    setBooking((prev) =>
      prev
        ? {
            ...prev,
            booking_date: data.booking.booking_date,
            booking_time: data.booking.booking_time,
            rescheduled_from_date: prev.booking_date,
            rescheduled_from_time: prev.booking_time,
          }
        : prev,
    );
    setMode('idle');
    setSuccess(`Your appointment has been rescheduled to ${toLabel(newDate, `${newTime}:00`)}.`);
  }

  async function confirmCancel() {
    if (!token) return;
    setBusy(true);
    const res = await fetch(`/api/bookings/manage/${encodeURIComponent(token)}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || null }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) return setError(data.error ?? 'Could not cancel booking.');
    setBooking((prev) => (prev ? { ...prev, status: 'cancelled', cancellation_reason: reason || null } : prev));
    setMode('idle');
    const refundMsg =
      data.refundAmountCents > 0
        ? ` Your refund of ${formatCentsAUD(data.refundAmountCents)} will appear in 5–10 business days.`
        : '';
    setSuccess(`Your booking has been cancelled.${refundMsg}`);
  }

  // ── Early returns ──────────────────────────────────────────────────────────

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading booking...</div>;
  if (error && !booking) return <div className="p-8 text-center">{error}</div>;
  if (!booking || !policy) return <div className="p-8 text-center">This link has expired. Please contact us.</div>;
  if (isPast) return <div className="p-8 text-center">This appointment has already passed.</div>;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      {error && (
        <p className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          {success}
        </p>
      )}

      {/* Booking details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Manage Booking</span>
            <Badge>{booking.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Service:</strong> {booking.service_name}</p>
          <p><strong>Date & Time:</strong> {toLabel(booking.booking_date, booking.booking_time)}</p>
          <p><strong>Price:</strong> {formatCentsAUD(booking.price_cents)}</p>
          <p><strong>Deposit paid:</strong> {formatCentsAUD(booking.amount_paid_cents)}</p>
          <p><strong>Remaining balance:</strong> {formatCentsAUD(remaining)}</p>
          <p><strong>Business:</strong> Premium Mobile Detailing</p>
          <p><strong>Contact:</strong> {booking.customer_email}</p>
        </CardContent>
      </Card>

      {/* Actions */}
      {booking.status === 'cancelled' ? (
        <Card>
          <CardContent className="pt-6 text-sm">
            Cancelled{booking.cancellation_reason ? `: ${booking.cancellation_reason}` : '.'}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-3 pt-6">
            {!policy.customerRescheduleEnabled && !policy.customerCancelEnabled ? (
              <p className="text-sm text-muted-foreground">
                Please contact us to make changes to your booking.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {policy.customerRescheduleEnabled && (
                    <Button
                      disabled={!canAct}
                      onClick={() => setMode(mode === 'reschedule' ? 'idle' : 'reschedule')}
                    >
                      Reschedule
                    </Button>
                  )}
                  {policy.customerCancelEnabled && (
                    <Button
                      variant="destructive"
                      disabled={!canAct}
                      onClick={() => setMode(mode === 'cancel' ? 'idle' : 'cancel')}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Changes can be made up to {policy.cancellationHoursNotice} hours before your appointment.
                </p>
                {noChangeWindow && (
                  <p className="text-sm text-muted-foreground">
                    It&apos;s too close to your appointment to make changes online. Please call us to reschedule or cancel.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Reschedule flow ── */}
      {mode === 'reschedule' && policy.customerRescheduleEnabled && (
        <Card>
          <CardHeader><CardTitle>Reschedule</CardTitle></CardHeader>
          <CardContent className="space-y-4">

            {isMobile ? (
              /* ── Mobile: compact 4-week strip calendar ── */
              <div>
                {/* "Showing next available" caption */}
                {isNextAvailableDate && newDate && (
                  <p className="mb-3 text-xs text-gray-500">
                    Showing next available ·{' '}
                    {new Date(`${newDate}T00:00:00`).toLocaleDateString('en-AU', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                )}

                {/* Week navigation header */}
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={mobileWeekOffset === 0}
                    onClick={() => setMobileWeekOffset((o) => Math.max(0, o - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-30"
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <span className="text-sm font-semibold text-gray-800">{mobileStripLabel}</span>
                  <button
                    type="button"
                    onClick={() => setMobileWeekOffset((o) => o + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200"
                    aria-label="Next week"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </button>
                </div>

                {/* Day-of-week header row: S M T W T F S */}
                <div className="grid grid-cols-7 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={`hdr-${i}`} className="py-1 text-xs font-medium text-gray-400">
                      {d}
                    </div>
                  ))}
                </div>

                {/* 28-day grid */}
                <div className="grid grid-cols-7">
                  {mobileStripDays.map((date) => {
                    const state = calendarDays[date] ?? 'closed';
                    const isPastDate = date < todayStr;
                    const isDisabled = isPastDate || state !== 'available';
                    const isSelected = newDate === date;
                    const isToday = date === todayStr;
                    const dayNum = parseInt(date.split('-')[2], 10);

                    return (
                      <div key={date} className="flex flex-col items-center py-0.5">
                        <button
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            setNewDate(date);
                            setIsNextAvailableDate(false);
                            setNewTime('');
                            setTimeout(() => {
                              document.getElementById('reschedule-slots')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className={[
                            'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition',
                            isSelected
                              ? 'bg-gray-900 text-white'
                              : isDisabled
                                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                : 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50',
                          ].join(' ')}
                        >
                          {dayNum}
                        </button>
                        {/* Today dot indicator */}
                        {isToday && (
                          <div className="mt-0.5 h-1 w-1 rounded-full bg-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── Desktop: original list-of-available-days calendar (unchanged) ── */
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium">Step 1: Choose Date</p>
                  <input
                    type="month"
                    value={calendarMonth}
                    onChange={(e) => setCalendarMonth(e.target.value)}
                    className="rounded border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Available days this month</p>
                  <div className="grid w-full grid-cols-3 gap-2 md:grid-cols-5">
                    {Object.entries(calendarDays)
                      .filter(([, s]) => s === 'available')
                      .slice(0, 20)
                      .map(([day]) => (
                        <Button
                          key={day}
                          type="button"
                          variant={newDate === day ? 'default' : 'outline'}
                          className="min-h-[44px] min-w-[44px] cursor-pointer"
                          onClick={() => handleDateSelect(day)}
                        >
                          {new Date(`${day}T00:00:00`).toLocaleDateString('en-AU', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Slot grid ── */}
            <div id="reschedule-slots">
              <p className="mb-2 text-sm font-medium">
                {isMobile ? 'Choose Time' : 'Step 2: Choose Time'}
              </p>

              {isMobile ? (
                /* Mobile: 3-column pill grid grouped by period */
                <div className="space-y-3">
                  {groupedSlots.map(({ label, values }) => {
                    if (!values.length) return null;
                    return (
                      <div key={label}>
                        <p className="mb-1.5 text-xs font-medium text-gray-500">{label}</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {values.map((s) => {
                            const isSelected = newTime === s;
                            const endHhmm =
                              serviceDurationMinutes > 0 ? addMins(s, serviceDurationMinutes) : null;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setNewTime(s)}
                                className={[
                                  'rounded-full border px-1 py-2 text-xs font-medium transition',
                                  isSelected
                                    ? 'border-gray-900 bg-gray-900 text-white'
                                    : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50',
                                ].join(' ')}
                              >
                                {fmtTime(s)}
                                {isSelected && endHhmm && (
                                  <span className="mt-0.5 block text-[10px] opacity-80">
                                    → {fmtTime(endHhmm)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Desktop: original Button-based slot columns (unchanged) */
                <div className="grid gap-3 md:grid-cols-3">
                  {(['Morning', 'Afternoon', 'Evening'] as const).map((group) => {
                    const values = slots.filter((s) => {
                      const h = parseInt(s.split(':')[0], 10);
                      if (group === 'Morning') return h >= 7 && h < 12;
                      if (group === 'Afternoon') return h >= 12 && h < 17;
                      return h >= 17 && h < 20;
                    });
                    return (
                      <div key={group}>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">{group}</p>
                        <div className="space-y-1">
                          {values.map((s) => (
                            <Button
                              key={s}
                              type="button"
                              variant={newTime === s ? 'default' : 'outline'}
                              className="min-h-[44px] w-full cursor-pointer"
                              onClick={() => setNewTime(s)}
                            >
                              {toLabel('2026-01-01', `${s}:00`).split(' at ')[1]}
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Confirm step ── */}
            {newDate && newTime && (
              <div className="rounded border p-3 text-sm">
                <p><strong>Step 3: Confirm</strong></p>
                <p>Old: {toLabel(booking.booking_date, booking.booking_time)}</p>
                <p>New: {toLabel(newDate, `${newTime}:00`)}</p>
                <Button type="button" className="mt-3" disabled={busy} onClick={confirmReschedule}>
                  {busy ? 'Saving...' : 'Confirm Reschedule'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Cancel flow ── */}
      {mode === 'cancel' && policy.customerCancelEnabled && (
        <Card>
          <CardHeader><CardTitle>Cancel Booking</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Are you sure you want to cancel?</p>
            <p>{booking.service_name} - {toLabel(booking.booking_date, booking.booking_time)}</p>
            <p>
              {booking.amount_paid_cents <= 0
                ? 'No charge - your booking will be cancelled.'
                : policy.cancellationRefundPolicy === 'full'
                  ? `You will receive a full refund of ${formatCentsAUD(booking.amount_paid_cents)}`
                  : policy.cancellationRefundPolicy === 'deposit_only'
                    ? `Your deposit of ${formatCentsAUD(booking.deposit_amount_cents)} is non-refundable`
                    : 'This booking is non-refundable'}
            </p>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Cancellation reason (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Change of plans">Change of plans</SelectItem>
                <SelectItem value="Found another time">Found another time</SelectItem>
                <SelectItem value="Vehicle issue">Vehicle issue</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="destructive" disabled={busy} onClick={confirmCancel}>
              {busy ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
