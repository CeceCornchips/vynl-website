 'use client';

import { Fragment, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
} from 'lucide-react';
import { CustomerSearch } from '@/components/admin/customer-search';
import { DateRangePicker } from '@/components/date-range-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAdminTimezone, formatTimestamp } from '@/contexts/timezone-context';
import {
  type Booking,
  type BookingStatus,
  type Service,
  BOOKING_STATUS_COLOURS,
  BOOKING_STATUS_LABELS,
  formatCentsAUD,
} from '@/types/database';
import { DatePicker } from '@/components/date-picker';

type SortKey = 'booking_date' | 'customer_name' | 'service_name' | 'status';
type SortDir = 'asc' | 'desc';

type BookingWithInspo = Booking & { inspo_images?: string[] | null };

type BookingListResponse = {
  ok: boolean;
  bookings: BookingWithInspo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  services: { id: string; name: string }[];
  error?: string;
};

const STATUS_TABS: Array<{ id: 'all' | BookingStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];
const PAGE_SIZE = 20;
const ALL_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'paid_in_full', label: 'Paid' },
  { value: 'unpaid', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function exportCSV(bookings: Booking[]) {
  const headers = [
    'ID', 'Customer Name', 'Email', 'Phone', 'Service', 'Date', 'Time',
    'Address', 'Status', 'Deposit Paid', 'Deposit Amount', 'Notes', 'Created At',
  ];
  const rows = bookings.map((b) => [
    b.id,
    b.customer_name,
    b.customer_email,
    b.customer_phone,
    b.service_name,
    b.booking_date?.toString().split('T')[0],
    b.booking_time?.toString().split('.')[0],
    b.address,
    b.status,
    b.deposit_paid ? 'Yes' : 'No',
    formatCentsAUD(b.deposit_amount_cents),
    b.notes ?? '',
    new Date(b.created_at).toISOString(),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function statusBadge(status: BookingStatus) {
  return (
    <Badge className={BOOKING_STATUS_COLOURS[status]}>{BOOKING_STATUS_LABELS[status]}</Badge>
  );
}

function paymentStatusBadge(status?: Booking['payment_status']) {
  if (status === 'deposit_paid') return <Badge className="bg-blue-100 text-blue-800">Deposit Paid</Badge>;
  if (status === 'paid_in_full') return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
  if (status === 'failed') return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
  if (status === 'cancelled') return <Badge className="bg-muted text-muted-foreground">Cancelled</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
}

function refundStatusBadge(status?: string | null) {
  if (status === 'refunded') return <Badge className="bg-green-100 text-green-800">Refunded</Badge>;
  if (status === 'none') return <Badge className="bg-muted text-muted-foreground">No Refund</Badge>;
  if (status === 'pending') return <Badge className="bg-yellow-100 text-yellow-800">Refund Pending</Badge>;
  return null;
}

function BookingsPageContent() {
  const { timezone } = useAdminTimezone();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<BookingWithInspo[]>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [inspoLightbox, setInspoLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const search = searchParams.get('search') ?? '';
  const status = (searchParams.get('status') as 'all' | BookingStatus | null) ?? 'all';
  const service = searchParams.get('service') ?? 'all';
  const paymentStatus = searchParams.get('payment_status') ?? 'all';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const includeCancelled = searchParams.get('includeCancelled') === 'true';
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10) || 1;
  const sort = (searchParams.get('sort') as SortKey | null) ?? 'booking_date';
  const dir = (searchParams.get('dir') as SortDir | null) ?? 'desc';

  const setParams = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === 'all' || v === '') next.delete(k);
      else next.set(k, v);
    }
    if (!('page' in patch)) next.delete('page');
    router.replace(`${pathname}?${next.toString()}`);
  }, [pathname, router, searchParams]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/admin/bookings', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (status && status !== 'all') url.searchParams.set('status', status);
      if (service && service !== 'all') url.searchParams.set('service', service);
      if (paymentStatus && paymentStatus !== 'all') url.searchParams.set('payment_status', paymentStatus);
      if (startDate) url.searchParams.set('startDate', startDate);
      if (endDate) url.searchParams.set('endDate', endDate);
      url.searchParams.set('includeCancelled', String(includeCancelled));
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(PAGE_SIZE));
      const res = await fetch(url.toString());
      const data = (await res.json()) as BookingListResponse;
      if (!data.ok) throw new Error(data.error ?? 'Failed to load bookings.');
      setBookings(data.bookings ?? []);
      setServices(data.services ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setSelected(new Set());
      setExpanded(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [includeCancelled, page, paymentStatus, search, service, startDate, endDate, status]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetch('/api/admin/services')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setAllServices((data.services as Service[]).filter((s) => s.is_active));
      })
      .catch(() => {});
  }, []);

  const sorted = useMemo(() => {
    const items = [...bookings];
    items.sort((a, b) => {
      let av = '';
      let bv = '';
      if (sort === 'booking_date') {
        av = `${a.booking_date} ${a.booking_time}`;
        bv = `${b.booking_date} ${b.booking_time}`;
      } else {
        av = String(a[sort] ?? '').toLowerCase();
        bv = String(b[sort] ?? '').toLowerCase();
      }
      const cmp = av.localeCompare(bv);
      return dir === 'asc' ? cmp : -cmp;
    });
    return items;
  }, [bookings, dir, sort]);

  const allSelected = sorted.length > 0 && sorted.every((b) => selected.has(b.id));

  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setParams({ dir: dir === 'asc' ? 'desc' : 'asc' });
      return;
    }
    setParams({ sort: key, dir: 'asc' });
  };

  const patchBooking = (id: string, patch: Partial<Booking>) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const updateBooking = async (id: string, patch: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/admin/bookings/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Update failed');
      if (data.booking) {
        patchBooking(id, data.booking as Booking);
      } else {
        patchBooking(id, patch as Partial<Booking>);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const bulkStatus = async (target: BookingStatus) => {
    if (selected.size === 0) return;
    setBulkUpdating(true);
    try {
      const res = await fetch('/api/admin/bookings/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), status: target }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Bulk status failed');
      setBookings((prev) => prev.map((b) => (selected.has(b.id) ? { ...b, status: target } : b)));
      setSelected(new Set());
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Bulk status failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  const selectedRows = useMemo(() => sorted.filter((b) => selected.has(b.id)), [selected, sorted]);

  const openEdit = (booking: Booking) => {
    setEditing(booking);
    setSheetOpen(true);
  };

  const loadSlots = useCallback(async (serviceId: string | null, date: string) => {
    if (!serviceId || !date) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/booking/availability?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`);
      const data = await res.json();
      if (data.ok) setAvailableSlots(data.slots ?? []);
      else setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (!editing) return;
    loadSlots(editing.service_id, String(editing.booking_date));
  }, [editing, loadSlots]);

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booking management</h1>
          <p className="text-sm text-muted-foreground">Showing {total} bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/admin/bookings/new">Create booking</Link>
          </Button>
          <Button variant="outline" size="icon" onClick={fetchBookings} disabled={loading}>
            <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by customer, email, phone, address, reference..."
                value={search}
                onChange={(e) => setParams({ search: e.target.value })}
              />
            </div>
            <Select value={service} onValueChange={(value) => setParams({ service: value })}>
              <SelectTrigger className="w-full lg:w-64">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentStatus} onValueChange={(value) => setParams({ payment_status: value })}>
              <SelectTrigger className="w-full lg:w-52">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangePicker
              from={startDate}
              to={endDate}
              onChange={(next) => setParams({ startDate: next.from, endDate: next.to })}
            />
            <Button
              variant="outline"
              onClick={() => setParams({ includeCancelled: includeCancelled ? null : 'true' })}
            >
              {includeCancelled ? <Eye className="mr-2 size-4" /> : <EyeOff className="mr-2 size-4" />}
              Show Cancelled
            </Button>
            <Button
              variant="ghost"
              onClick={() => setParams({ search: null, status: null, service: null, payment_status: null, startDate: null, endDate: null, includeCancelled: null, page: null })}
            >
              Clear all filters
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.id}
                variant={status === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setParams({ status: tab.id })}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card><CardContent className="py-20 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 size-6 animate-spin" />Loading bookings...</CardContent></Card>
      ) : error ? (
        <Card><CardContent className="py-20 text-center text-destructive">{error}</CardContent></Card>
      ) : sorted.length === 0 && total === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-16 text-center">
            <p className="text-lg font-semibold">No bookings yet</p>
            <p className="text-sm text-muted-foreground">Create your first booking to get started.</p>
            <Button asChild><Link href="/admin/bookings/new">Create your first booking</Link></Button>
          </CardContent>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-16 text-center">
            <p className="text-lg font-semibold">No bookings match your filters</p>
            <Button variant="outline" onClick={() => setParams({ search: null, status: null, service: null, payment_status: null, startDate: null, endDate: null, includeCancelled: null })}>Clear filters</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
            <div className="max-h-[68vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => {
                          if (allSelected) setSelected(new Set());
                          else setSelected(new Set(sorted.map((b) => b.id)));
                        }}
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('customer_name')}>Customer {sort === 'customer_name' ? (dir === 'asc' ? <ChevronUp className="ml-1 inline size-3" /> : <ChevronDown className="ml-1 inline size-3" />) : <ChevronsUpDown className="ml-1 inline size-3" />}</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('service_name')}>Service {sort === 'service_name' ? (dir === 'asc' ? <ChevronUp className="ml-1 inline size-3" /> : <ChevronDown className="ml-1 inline size-3" />) : <ChevronsUpDown className="ml-1 inline size-3" />}</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('booking_date')}>Date & Time {sort === 'booking_date' ? (dir === 'asc' ? <ChevronUp className="ml-1 inline size-3" /> : <ChevronDown className="ml-1 inline size-3" />) : <ChevronsUpDown className="ml-1 inline size-3" />}</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Inspo</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('status')}>Status {sort === 'status' ? (dir === 'asc' ? <ChevronUp className="ml-1 inline size-3" /> : <ChevronDown className="ml-1 inline size-3" />) : <ChevronsUpDown className="ml-1 inline size-3" />}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((booking) => {
                    const isExpanded = expanded.has(booking.id);
                    const isCancelled = booking.status === 'cancelled';
                    return (
                      <Fragment key={booking.id}>
                        <TableRow
                          data-state={selected.has(booking.id) ? 'selected' : undefined}
                          className={isCancelled ? 'opacity-60' : ''}
                          onClick={() => setExpanded((prev) => {
                            const next = new Set(prev);
                            if (next.has(booking.id)) next.delete(booking.id); else next.add(booking.id);
                            return next;
                          })}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selected.has(booking.id)}
                              onCheckedChange={(checked) => setSelected((prev) => {
                                const next = new Set(prev);
                                if (checked) next.add(booking.id); else next.delete(booking.id);
                                return next;
                              })}
                            />
                          </TableCell>
                          <TableCell>
                            {(booking as Booking & { client_id?: number | null }).client_id ? (
                              <Link
                                href={`/admin/clients/${(booking as Booking & { client_id?: number | null }).client_id}`}
                                className={`font-medium hover:underline underline-offset-2 ${isCancelled ? 'italic' : ''}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {booking.customer_name}
                              </Link>
                            ) : (
                              <p className={isCancelled ? 'italic font-medium' : 'font-medium'}>{booking.customer_name}</p>
                            )}
                            <p className="text-xs text-muted-foreground">{booking.customer_email}</p>
                            <p className="text-xs text-muted-foreground">{booking.customer_phone}</p>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{booking.service_name}</p>
                            <p className="text-xs text-muted-foreground">{booking.calendar_duration_minutes ?? allServices.find((s) => s.id === booking.service_id)?.duration_minutes ?? 0} mins</p>
                          </TableCell>
                          <TableCell>
                            <p>{formatDate(String(booking.booking_date))}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(String(booking.booking_time))}</p>
                          </TableCell>
                          <TableCell className="max-w-56 truncate">{booking.address}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {(booking as BookingWithInspo).inspo_images && (booking as BookingWithInspo).inspo_images!.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => setInspoLightbox({ images: (booking as BookingWithInspo).inspo_images!, index: 0 })}
                                className="relative group"
                                title={`${(booking as BookingWithInspo).inspo_images!.length} inspo image(s)`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={(booking as BookingWithInspo).inspo_images![0]}
                                  alt="Inspo"
                                  className="h-10 w-10 rounded object-cover border hover:opacity-80 transition-opacity"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                                {(booking as BookingWithInspo).inspo_images!.length > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-medium">
                                    {(booking as BookingWithInspo).inspo_images!.length}
                                  </span>
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-1">
                              {paymentStatusBadge(booking.payment_status)}
                              <p className="text-xs text-muted-foreground">
                                {formatCentsAUD(booking.amount_paid_cents ?? 0)} / {formatCentsAUD(booking.deposit_amount_cents)}
                              </p>
                              {booking.stripe_payment_intent_id ? (
                                <a
                                  href={`https://dashboard.stripe.com/payments/${encodeURIComponent(booking.stripe_payment_intent_id)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs underline underline-offset-2"
                                >
                                  {booking.stripe_payment_intent_id}
                                </a>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-1">
                              {isCancelled ? statusBadge(booking.status) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">{statusBadge(booking.status)}</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  {ALL_STATUSES.filter((s) => s !== 'cancelled').map((s) => (
                                    <DropdownMenuItem key={s} onClick={() => updateBooking(booking.id, { status: s })}>
                                      {s === booking.status ? <Check className="size-4" /> : <span className="size-4" />} {BOOKING_STATUS_LABELS[s]}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              )}
                              {booking.rescheduled_from_date ? (
                                <Badge className="bg-purple-100 text-purple-800">Rescheduled</Badge>
                              ) : null}
                              {booking.status === 'cancelled' && booking.cancellation_reason ? (
                                <Badge className="bg-zinc-100 text-zinc-700">Cancelled by client</Badge>
                              ) : null}
                              {booking.status === 'cancelled' ? refundStatusBadge(booking.refund_status) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(booking)}>Edit booking</DropdownMenuItem>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    {ALL_STATUSES.map((s) => (
                                      <DropdownMenuItem key={s} onClick={() => updateBooking(booking.id, { status: s })} disabled={isCancelled}>{BOOKING_STATUS_LABELS[s]}</DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuItem onClick={async () => {
                                  const res = await fetch('/api/admin/bookings/send-reminder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: booking.id }) });
                                  const data = await res.json();
                                  if (!data.ok) alert(data.error ?? 'Reminder failed');
                                }}>
                                  Send reminder email
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href={`/admin/clients?search=${encodeURIComponent(booking.customer_email)}`}>View customer</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(booking.id)}>Copy booking reference</DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={isCancelled}
                                  onClick={() => {
                                    setCancelTargetId(booking.id);
                                    setConfirmCancelOpen(true);
                                  }}
                                  variant="destructive"
                                >
                                  Cancel booking
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={9}>
                              <div className="grid gap-4 p-3 md:grid-cols-3">
                                <div><p className="text-xs text-muted-foreground">Details</p><p>{booking.service_name}</p><p>{booking.address}</p></div>
                                <div><p className="text-xs text-muted-foreground">Notes</p><p className="whitespace-pre-wrap text-sm">{booking.notes || 'No notes'}</p></div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Reference</p><p className="font-mono text-xs">{booking.id}</p>
                                  <p className="mt-2 text-xs text-muted-foreground">Created</p><p className="text-sm">{formatTimestamp(booking.created_at, timezone)}</p>
                                  <div className="mt-3 flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => openEdit(booking)}>Edit</Button>
                                    <Button size="sm" variant="destructive" disabled={isCancelled} onClick={() => {
                                      setCancelTargetId(booking.id);
                                      setConfirmCancelOpen(true);
                                    }}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid gap-3 lg:hidden">
            {sorted.map((booking) => (
              <Card key={booking.id} className={booking.status === 'cancelled' ? 'opacity-60' : ''}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={booking.status === 'cancelled' ? 'italic font-semibold' : 'font-semibold'}>{booking.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{booking.customer_email}</p>
                    </div>
                    {statusBadge(booking.status)}
                  </div>
                  <p className="text-sm">{booking.service_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(String(booking.booking_date))} at {formatTime(String(booking.booking_time))}</p>
                  <p className="text-xs text-muted-foreground">{booking.address}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(booking)}>Edit</Button>
                    {paymentStatusBadge(booking.payment_status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {sorted.length} bookings</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setParams({ page: String(page + 1) })}>Next</Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
            <p className="mr-2 text-sm font-medium">{selected.size} bookings selected</p>
            <Button size="sm" onClick={() => bulkStatus('confirmed')} disabled={bulkUpdating}>Mark Confirmed</Button>
            <Button size="sm" onClick={() => bulkStatus('completed')} disabled={bulkUpdating}>Mark Completed</Button>
            <Button size="sm" variant="destructive" onClick={() => setBulkCancelOpen(true)} disabled={bulkUpdating}>Mark Cancelled</Button>
            <Button size="sm" variant="outline" onClick={() => exportCSV(selectedRows)}>Export selected CSV</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Deselect all</Button>
          </div>
        </div>
      )}

      <Dialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking?</DialogTitle>
            <DialogDescription>This action sets the booking status to cancelled.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancelOpen(false)}>Keep booking</Button>
            <Button variant="destructive" onClick={async () => {
              if (cancelTargetId) await updateBooking(cancelTargetId, { status: 'cancelled' });
              setConfirmCancelOpen(false);
              setCancelTargetId(null);
            }}>Cancel booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkCancelOpen} onOpenChange={setBulkCancelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel selected bookings?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkCancelOpen(false)}>Go back</Button>
            <Button variant="destructive" onClick={async () => { await bulkStatus('cancelled'); setBulkCancelOpen(false); }}>Cancel selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspo Lightbox */}
      <Dialog open={!!inspoLightbox} onOpenChange={(o) => { if (!o) setInspoLightbox(null); }}>
        <DialogContent className="max-w-3xl p-4">
          {inspoLightbox && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Inspo Images ({inspoLightbox.index + 1} / {inspoLightbox.images.length})
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inspoLightbox.images[inspoLightbox.index]}
                alt={`Inspo ${inspoLightbox.index + 1}`}
                className="w-full max-h-[60vh] object-contain rounded"
              />
              {inspoLightbox.images.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {inspoLightbox.images.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInspoLightbox({ ...inspoLightbox, index: i })}
                      className={`h-14 w-14 rounded border-2 overflow-hidden transition-all ${inspoLightbox.index === i ? 'border-primary' : 'border-transparent'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Inspo ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader><SheetTitle>Edit booking</SheetTitle></SheetHeader>
          {editing && (
            <div className="mt-4 space-y-4 px-4">
              <CustomerSearch
                label="Customer"
                customerId={editing.customer_id}
                selectionLabel={editing.customer_name}
                onCustomerSelect={(c) => setEditing((prev) => prev ? { ...prev, customer_id: c.id, customer_name: c.name, customer_email: c.email, customer_phone: c.phone } : prev)}
                onClear={() => {}}
              />
              <div className="space-y-1.5">
                <Label>Service</Label>
                <Select value={editing.service_id ?? ''} onValueChange={(value) => setEditing((prev) => prev ? { ...prev, service_id: value } : prev)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allServices.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <DatePicker value={String(editing.booking_date).split('T')[0]} onChange={(v) => setEditing((prev) => prev ? { ...prev, booking_date: v } : prev)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Time slot</Label>
                  <Select value={String(editing.booking_time).slice(0, 8)} onValueChange={(v) => setEditing((prev) => prev ? { ...prev, booking_time: v } : prev)}>
                    <SelectTrigger><SelectValue placeholder={loadingSlots ? 'Loading...' : 'Select time'} /></SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => <SelectItem key={slot} value={slot}>{formatTime(slot)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Address</Label><Input value={editing.address} onChange={(e) => setEditing((prev) => prev ? { ...prev, address: e.target.value } : prev)} /></div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing((prev) => prev ? { ...prev, status: v as BookingStatus } : prev)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-sm text-muted-foreground">Payment</p>
                <div className="flex items-center gap-2">
                  {paymentStatusBadge(editing.payment_status)}
                  {editing.stripe_payment_intent_id ? (
                    <a
                      href={`https://dashboard.stripe.com/payments/${encodeURIComponent(editing.stripe_payment_intent_id)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline underline-offset-2"
                    >
                      {editing.stripe_payment_intent_id}
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="space-y-1.5"><Label>Notes</Label><Textarea value={editing.notes ?? ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, notes: e.target.value } : prev)} /></div>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={async () => {
                  await updateBooking(editing.id, {
                    customer_id: editing.customer_id,
                    customer_name: editing.customer_name,
                    customer_email: editing.customer_email,
                    customer_phone: editing.customer_phone,
                    service_id: editing.service_id,
                    booking_date: String(editing.booking_date).split('T')[0],
                    booking_time: String(editing.booking_time).slice(0, 8),
                    address: editing.address,
                    status: editing.status,
                    notes: editing.notes,
                  });
                  setSheetOpen(false);
                }}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={async () => {
                  const res = await fetch('/api/admin/bookings/send-reminder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id }) });
                  const data = await res.json();
                  if (!data.ok) alert(data.error ?? 'Failed to send reminder');
                }}>
                  Send Reminder
                </Button>
                <Button variant="destructive" onClick={async () => {
                  if (!confirm('Cancel this booking?')) return;
                  await updateBooking(editing.id, { status: 'cancelled' });
                  setSheetOpen(false);
                }}>
                  Cancel Booking
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 pb-24">
          <Card>
            <CardContent className="py-20 text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-2 size-6 animate-spin" />
              Loading bookings...
            </CardContent>
          </Card>
        </div>
      }
    >
      <BookingsPageContent />
    </Suspense>
  );
}
