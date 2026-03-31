'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CustomerSearch } from '@/components/admin/customer-search';
import type { Service } from '@/types/database';
import type { BookingStatus } from '@/types/database';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLOURS, formatCentsAUD } from '@/types/database';
import type { CalBooking } from './calendar-types';
import { Loader2, ImageIcon } from 'lucide-react';

const STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

export function BookingDrawer({
  open,
  onOpenChange,
  mode,
  initialBooking,
  initialDate,
  initialSlotIndex,
  gridStartMin,
  services,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: 'create' | 'edit';
  initialBooking: CalBooking | null;
  initialDate: string;
  initialSlotIndex: number;
  gridStartMin: number;
  services: Service[];
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showChangeCustomer, setShowChangeCustomer] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00:00');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<BookingStatus>('pending');
  const [depositPaid, setDepositPaid] = useState(false);
  /** Empty string = use service default; number = calendar override (minutes). */
  const [calendarDurationMins, setCalendarDurationMins] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setError(null);
    setShowChangeCustomer(false);
    if (mode === 'edit' && initialBooking) {
      setSelectedCustomerId(initialBooking.customer_id ?? null);
      setCustomerName(initialBooking.customer_name);
      setEmail(initialBooking.customer_email);
      setPhone(initialBooking.customer_phone);
      setServiceId(initialBooking.service_id ?? '');
      setBookingDate(initialBooking.booking_date);
      setBookingTime(initialBooking.booking_time.slice(0, 8));
      setAddress(initialBooking.address);
      setNotes(initialBooking.notes ?? '');
      setStatus(initialBooking.status);
      setDepositPaid(initialBooking.deposit_paid);
      setCalendarDurationMins(
        initialBooking.calendar_duration_minutes != null
          ? String(initialBooking.calendar_duration_minutes)
          : '',
      );
    } else {
      setSelectedCustomerId(null);
      setCustomerName('');
      setEmail('');
      setPhone('');
      setServiceId(services[0]?.id ?? '');
      setBookingDate(initialDate);
      const m = gridStartMin + initialSlotIndex * 30;
      const h = Math.floor(m / 60);
      const mm = m % 60;
      setBookingTime(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
      setAddress('');
      setNotes('');
      setStatus('pending');
      setDepositPaid(false);
      setCalendarDurationMins('');
    }
  }, [open, mode, initialBooking, initialDate, initialSlotIndex, gridStartMin, services]);

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'create') {
        const res = await fetch('/api/admin/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: customerName,
            customer_email: email,
            customer_phone: phone,
            ...(selectedCustomerId ? { customer_id: selectedCustomerId } : {}),
            service_id: serviceId,
            booking_date: bookingDate,
            booking_time: bookingTime,
            address,
            notes: notes || undefined,
            deposit_paid: depositPaid,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? 'Failed to create');
      } else if (initialBooking) {
        const trimmedDur = calendarDurationMins.trim();
        const calendar_duration_minutes =
          trimmedDur === ''
            ? null
            : (() => {
                const n = Number.parseInt(trimmedDur, 10);
                return Number.isFinite(n) && n > 0 ? n : null;
              })();
        const res = await fetch('/api/admin/bookings/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: initialBooking.id,
            customer_id: selectedCustomerId,
            customer_name: customerName,
            customer_email: email,
            customer_phone: phone,
            service_id: serviceId,
            booking_date: bookingDate,
            booking_time: bookingTime,
            address,
            notes,
            status,
            deposit_paid: depositPaid,
            calendar_duration_minutes,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? 'Failed to update');
      }
      onOpenChange(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking() {
    if (!initialBooking || !confirm('Cancel this booking?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: initialBooking.id, status: 'cancelled' }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed');
      onOpenChange(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReminder() {
    if (!initialBooking) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: initialBooking.id }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to send');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{mode === 'create' ? 'New booking' : 'Edit booking'}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 px-1">
          {mode === 'create' && (
            <CustomerSearch
              label="Customer"
              customerId={selectedCustomerId}
              selectionLabel={selectedCustomerId ? customerName : null}
              onCustomerSelect={(p) => {
                setSelectedCustomerId(p.id);
                setCustomerName(p.name);
                setEmail(p.email);
                setPhone(p.phone);
              }}
              onClear={() => {
                setSelectedCustomerId(null);
                setCustomerName('');
                setEmail('');
                setPhone('');
              }}
              onNewCustomerManual={() => {
                setSelectedCustomerId(null);
              }}
              placeholder="Search by name, email, or phone…"
            />
          )}

          {mode === 'edit' && !showChangeCustomer && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Current customer</Label>
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <p className="font-medium">{customerName || '—'}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
                <p className="text-xs text-muted-foreground">{phone}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowChangeCustomer(true)}
              >
                Change Customer
              </Button>
            </div>
          )}

          {mode === 'edit' && showChangeCustomer && (
            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <CustomerSearch
                label="Search customer"
                customerId={selectedCustomerId}
                selectionLabel={selectedCustomerId ? customerName : null}
                onCustomerSelect={(p) => {
                  setSelectedCustomerId(p.id);
                  setCustomerName(p.name);
                  setEmail(p.email);
                  setPhone(p.phone);
                  setShowChangeCustomer(false);
                }}
                onClear={() => {
                  setSelectedCustomerId(null);
                }}
                onNewCustomerManual={() => {
                  setSelectedCustomerId(null);
                }}
                placeholder="Search by name, email, or phone…"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowChangeCustomer(false)}
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Customer name</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Service</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input
                type="time"
                value={bookingTime.slice(0, 5)}
                onChange={(e) => setBookingTime(`${e.target.value}:00`)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          {mode === 'edit' && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {BOOKING_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {mode === 'edit' && (
            <div className="space-y-1.5">
              <Label htmlFor="cal-dur">Calendar duration (minutes)</Label>
              <Input
                id="cal-dur"
                type="number"
                min={15}
                step={15}
                placeholder="Default from service"
                value={calendarDurationMins}
                onChange={(e) => setCalendarDurationMins(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Overrides block height on the calendar only. Leave empty to use the service duration.
              </p>
            </div>
          )}
          {mode === 'edit' && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="dep">Deposit paid</Label>
              <Switch id="dep" checked={depositPaid} onCheckedChange={setDepositPaid} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          {/* ── Inspo Images (read-only) ── */}
          {mode === 'edit' && initialBooking?.inspo_images && initialBooking.inspo_images.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="size-4 text-muted-foreground" />
                Inspo Images ({initialBooking.inspo_images.length})
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {initialBooking.inspo_images.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxUrl(url)}
                    className="relative aspect-square overflow-hidden rounded-md border bg-muted hover:opacity-90 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Inspo ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Add-ons (read-only summary) ── */}
          {mode === 'edit' && initialBooking && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Booking Details</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Deposit paid</span>
                <Badge className={depositPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {depositPaid ? 'Yes' : 'No'} · {formatCentsAUD(initialBooking.deposit_amount_cents)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge className={BOOKING_STATUS_COLOURS[initialBooking.status]}>
                  {BOOKING_STATUS_LABELS[initialBooking.status]}
                </Badge>
              </div>
              {initialBooking.created_at && (
                <p className="text-xs text-muted-foreground">
                  Booked: {new Date(initialBooking.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Lightbox */}
        <Dialog open={!!lightboxUrl} onOpenChange={(o) => { if (!o) setLightboxUrl(null); }}>
          <DialogContent className="max-w-3xl p-2">
            {lightboxUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lightboxUrl} alt="Inspo" className="w-full h-auto max-h-[80vh] object-contain rounded" />
            )}
          </DialogContent>
        </Dialog>

        <SheetFooter className="mt-6 flex-col gap-2 sm:flex-col">
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
          </Button>
          {mode === 'edit' && initialBooking && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSendReminder}
                disabled={loading}
              >
                Send reminder email
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleCancelBooking}
                disabled={loading || initialBooking.status === 'cancelled'}
              >
                Cancel booking
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
