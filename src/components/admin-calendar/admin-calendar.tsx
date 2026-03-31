'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DraggableProvided,
  type DropResult,
} from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminTimezone } from '@/contexts/timezone-context';
import type { Service } from '@/types/database';
import type { BookingStatus } from '@/types/database';
import { BOOKING_STATUS_LABELS } from '@/types/database';
import { parseWorkingHours, dayKeyFromDateStr, type WorkingHours } from '@/lib/booking-settings';
import { TimeGrid } from './time-grid';
import { timeStrToMinutes, formatTimeLabel } from './time-math';
import type { CalBooking } from './calendar-types';
import { STATUS_BLOCK, STATUS_DOT } from './status-styles';
import { BookingDrawer } from './booking-drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Calendar as CalIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

function weekGridBounds(dates: string[], wh: WorkingHours): { startMin: number; endMin: number } {
  let startMin = 24 * 60;
  let endMin = 0;
  for (const d of dates) {
    const dk = dayKeyFromDateStr(d);
    const day = wh[dk];
    if (!day?.enabled) continue;
    const s = timeStrToMinutes(`${day.start}:00`);
    const e = timeStrToMinutes(`${day.end}:00`);
    startMin = Math.min(startMin, s);
    endMin = Math.max(endMin, e);
  }
  if (startMin >= endMin) return { startMin: 8 * 60, endMin: 18 * 60 };
  return { startMin, endMin };
}

const AGENDA_CLICK_MAX_PX = 5;

function AgendaList({
  agendaOrder,
  onDragEnd,
  openEdit,
}: {
  agendaOrder: CalBooking[];
  onDragEnd: (result: DropResult) => void;
  openEdit: (b: CalBooking) => void;
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="agenda-list">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2 rounded-xl border bg-card p-3"
          >
            {agendaOrder.map((b, index) => (
              <Draggable key={b.id} draggableId={b.id} index={index}>
                {(dragProvided) => (
                  <AgendaRow b={b} dragProvided={dragProvided} openEdit={openEdit} />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

function AgendaRow({
  b,
  dragProvided,
  openEdit,
}: {
  b: CalBooking;
  dragProvided: DraggableProvided;
  openEdit: (b: CalBooking) => void;
}) {
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const { innerRef, draggableProps, dragHandleProps } = dragProvided;

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between',
        STATUS_BLOCK[b.status],
        'transition-colors hover:brightness-[1.06]',
      )}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('[data-agenda-drag-handle]')) return;
        if ((e.target as HTMLElement).closest('button')) return;
        downRef.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        if ((e.target as HTMLElement).closest('[data-agenda-drag-handle]')) return;
        if ((e.target as HTMLElement).closest('button')) return;
        if (!downRef.current) return;
        const dx = Math.abs(e.clientX - downRef.current.x);
        const dy = Math.abs(e.clientY - downRef.current.y);
        downRef.current = null;
        if (dx <= AGENDA_CLICK_MAX_PX && dy <= AGENDA_CLICK_MAX_PX) openEdit(b);
      }}
    >
      <div
        {...dragHandleProps}
        data-agenda-drag-handle
        className="cursor-grab shrink-0 text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="min-w-0 flex-1 cursor-pointer">
        <p className="font-medium text-sm">
          {b.booking_date} · {formatTimeLabel(b.booking_time)}
        </p>
        <p className="text-sm">{b.customer_name}</p>
        <p className="text-xs text-muted-foreground">{b.service_name}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs capitalize text-muted-foreground">{b.status}</span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(b);
          }}
        >
          Edit
        </Button>
      </div>
    </div>
  );
}

export function AdminCalendar() {
  const { timezone } = useAdminTimezone();
  const [view, setView] = useState<CalendarView>('week');
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setView('agenda');
    }
  }, []);

  const [anchor, setAnchor] = useState(() => new Date());
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [showCancelled, setShowCancelled] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [editBooking, setEditBooking] = useState<CalBooking | null>(null);
  const [quickDate, setQuickDate] = useState('');
  const [quickSlot, setQuickSlot] = useState(0);

  const [moveDialog, setMoveDialog] = useState<{
    id: string;
    newDate: string;
    newTime: string;
  } | null>(null);

  const range = useMemo(() => {
    if (view === 'month') {
      const start = startOfMonth(anchor);
      const end = endOfMonth(anchor);
      return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
    }
    if (view === 'week') {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      const end = endOfWeek(anchor, { weekStartsOn: 1 });
      return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
    }
    if (view === 'day') {
      const d = format(anchor, 'yyyy-MM-dd');
      return { start: d, end: d };
    }
    const start = anchor;
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(addDays(start, 90), 'yyyy-MM-dd'),
    };
  }, [anchor, view]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, sRes, svcRes] = await Promise.all([
        fetch(`/api/admin/bookings/range?start=${range.start}&end=${range.end}`),
        fetch('/api/admin/settings'),
        fetch('/api/admin/services'),
      ]);
      const bData = await bRes.json();
      const sData = await sRes.json();
      const svcData = await svcRes.json();
      if (!bData.ok) throw new Error(bData.error ?? 'Bookings failed');
      if (!sData.ok) throw new Error(sData.error ?? 'Settings failed');
      if (!svcData.ok) throw new Error(svcData.error ?? 'Services failed');
      setBookings(bData.bookings as CalBooking[]);
      setWorkingHours(parseWorkingHours(sData.settings?.working_hours ?? null));
      setServices((svcData.services as Service[]).filter((x) => x.is_active));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end]);

  useEffect(() => {
    load();
  }, [load]);

  const wh = workingHours ?? parseWorkingHours(null);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (!showCancelled && b.status === 'cancelled') return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (serviceFilter !== 'all' && b.service_id !== serviceFilter) return false;
      return true;
    });
  }, [bookings, statusFilter, serviceFilter, showCancelled]);

  const weekDates = useMemo(() => {
    const start = startOfWeek(anchor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
  }, [anchor]);

  const dayDate = format(anchor, 'yyyy-MM-dd');

  const gridDates = useMemo(
    () => (view === 'day' ? [dayDate] : weekDates),
    [view, dayDate, weekDates],
  );
  const { startMin, endMin } = weekGridBounds(gridDates, wh);

  const nowLineY = useMemo(() => {
    if (view !== 'week' && view !== 'day') return null;
    const todayStr = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
    if (!gridDates.includes(todayStr)) return null;
    const hm = formatInTimeZone(new Date(), timezone, 'HH:mm');
    const [hh, mm] = hm.split(':').map(Number);
    const mins = hh * 60 + mm;
    if (mins < startMin || mins > endMin) return null;
    return ((mins - startMin) / 30) * 28;
  }, [gridDates, startMin, endMin, timezone, view]);

  const headerLabel = useMemo(() => {
    if (view === 'month') return format(anchor, 'MMMM yyyy');
    if (view === 'week') {
      const a = startOfWeek(anchor, { weekStartsOn: 1 });
      const b = endOfWeek(anchor, { weekStartsOn: 1 });
      return `${format(a, 'd MMM')} – ${format(b, 'd MMM yyyy')}`;
    }
    if (view === 'day') return format(anchor, 'EEEE d MMMM yyyy');
    return `From ${format(new Date(), 'd MMM yyyy')} · upcoming`;
  }, [anchor, view]);

  function goToday() {
    setAnchor(new Date());
  }

  function goPrev() {
    if (view === 'month') setAnchor((a) => addMonths(a, -1));
    else if (view === 'week') setAnchor((a) => addDays(a, -7));
    else if (view === 'day') setAnchor((a) => addDays(a, -1));
    else setAnchor((a) => addDays(a, -7));
  }

  function goNext() {
    if (view === 'month') setAnchor((a) => addMonths(a, 1));
    else if (view === 'week') setAnchor((a) => addDays(a, 7));
    else if (view === 'day') setAnchor((a) => addDays(a, 1));
    else setAnchor((a) => addDays(a, 7));
  }

  const onRequestMove = (id: string, newDate: string, newTime: string) => {
    setMoveDialog({ id, newDate, newTime });
  };

  async function confirmMove() {
    if (!moveDialog) return;
    const res = await fetch('/api/admin/bookings/reschedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: moveDialog.id,
        newDate: moveDialog.newDate,
        newTime: moveDialog.newTime,
      }),
    });
    const data = await res.json();
    if (!data.ok) setError(data.error ?? 'Move failed');
    setMoveDialog(null);
    load();
  }

  async function onResizeEnd(bookingId: string, newDurationMins: number) {
    const res = await fetch('/api/admin/bookings/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookingId, calendar_duration_minutes: newDurationMins }),
    });
    const data = await res.json();
    if (!data.ok) setError(data.error ?? 'Resize failed');
    load();
  }

  function openCreate(date: string, slotIdx: number) {
    setDrawerMode('create');
    setEditBooking(null);
    setQuickDate(date);
    setQuickSlot(slotIdx);
    setDrawerOpen(true);
  }

  function openEdit(b: CalBooking) {
    setDrawerMode('edit');
    setEditBooking(b);
    setQuickDate(b.booking_date);
    setQuickSlot(0);
    setDrawerOpen(true);
  }

  const agendaSorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const da = a.booking_date.localeCompare(b.booking_date);
      if (da !== 0) return da;
      return a.booking_time.localeCompare(b.booking_time);
    });
  }, [filtered]);

  const [agendaOrder, setAgendaOrder] = useState<CalBooking[]>([]);
  useEffect(() => {
    setAgendaOrder(agendaSorted);
  }, [agendaSorted]);

  const onAgendaDragEnd = (result: DropResult) => {
    const dest = result.destination;
    if (!dest) return;
    setAgendaOrder((prev) => reorder(prev, result.source.index, dest.index));
  };

  const monthCells = useMemo(() => {
    const y = anchor.getFullYear();
    const m = anchor.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const mondayPad = (firstDow + 6) % 7;
    const lastDate = new Date(y, m + 1, 0).getDate();
    const cells: Date[] = [];
    for (let i = mondayPad; i > 0; i--) cells.push(new Date(y, m, 1 - i));
    for (let d = 1; d <= lastDate; d++) cells.push(new Date(y, m, d));
    let x = 0;
    while (cells.length % 7 !== 0) {
      x++;
      cells.push(new Date(y, m, lastDate + x));
    }
    return cells;
  }, [anchor]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CalBooking[]>();
    for (const b of filtered) {
      const k = b.booking_date?.toString().split('T')[0];
      if (!k) continue;
      const arr = map.get(k) ?? [];
      arr.push(b);
      map.set(k, arr);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalIcon className="size-6" />
            Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{headerLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border bg-muted/40 p-0.5">
            {(['month', 'week', 'day', 'agenda'] as const).map((v) => (
              <Button
                key={v}
                type="button"
                variant={view === v ? 'default' : 'ghost'}
                size="sm"
                className="capitalize"
                onClick={() => setView(v)}
              >
                {v}
              </Button>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={goPrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={goNext}>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => openCreate(format(anchor, 'yyyy-MM-dd'), 8)}
          >
            <Plus className="size-4 mr-1" />
            New booking
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {BOOKING_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowCancelled((v) => !v)}
          aria-pressed={showCancelled}
        >
          {showCancelled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          Show Cancelled
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="size-6 animate-spin" />
          Loading…
        </div>
      ) : view === 'month' ? (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground py-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthCells.map((d, i) => {
              const inMonth = d.getMonth() === anchor.getMonth() && d.getFullYear() === anchor.getFullYear();
              const ds = format(d, 'yyyy-MM-dd');
              const list = bookingsByDate.get(ds) ?? [];
              const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd') === ds;
              return (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setAnchor(d);
                    setView('day');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setAnchor(d);
                      setView('day');
                    }
                  }}
                  className={cn(
                    'min-h-[88px] cursor-default border-b border-r p-1 text-left text-xs transition-colors hover:bg-muted/40',
                    !inMonth && 'bg-muted/20 text-muted-foreground',
                    today && 'ring-1 ring-inset ring-primary/40',
                  )}
                >
                  <div className="mb-1 flex justify-between">
                    <span
                      className={cn(
                        'inline-flex size-6 items-center justify-center rounded-full',
                        today && 'bg-primary text-primary-foreground font-semibold',
                      )}
                    >
                      {d.getDate()}
                    </span>
                    {list.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">{list.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {list.slice(0, 3).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(b);
                        }}
                        className={cn(
                          'block w-full cursor-pointer truncate rounded border px-1 py-0.5 text-left text-[10px] font-medium transition-colors hover:brightness-[1.06]',
                          STATUS_BLOCK[b.status],
                        )}
                      >
                        {formatTimeLabel(b.booking_time)} {b.customer_name}
                      </button>
                    ))}
                    {list.length > 3 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="text-[10px] font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                            onClick={(e) => e.stopPropagation()}
                          >
                            +{list.length - 3} more
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-72 max-h-72 overflow-y-auto p-2"
                          align="start"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            {format(d, 'EEEE d MMM')}
                          </p>
                          <div className="flex flex-col gap-1">
                            {list.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => openEdit(b)}
                                className={cn(
                                  'w-full rounded border px-2 py-1.5 text-left text-xs font-medium transition-colors hover:brightness-[1.06]',
                                  STATUS_BLOCK[b.status],
                                )}
                              >
                                <span className="block">
                                  {formatTimeLabel(b.booking_time)} · {b.customer_name}
                                </span>
                                <span className="block truncate text-[10px] opacity-90">{b.service_name}</span>
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : view === 'agenda' ? (
        <AgendaList
          agendaOrder={agendaOrder}
          onDragEnd={onAgendaDragEnd}
          openEdit={openEdit}
        />
      ) : (
        <TimeGrid
          dates={gridDates}
          gridStartMin={startMin}
          gridEndMin={endMin}
          bookings={filtered}
          hideCancelled={!showCancelled}
          onBookingClick={openEdit}
          onRequestMove={onRequestMove}
          onEmptySlotClick={openCreate}
          onResizeEnd={onResizeEnd}
          nowLineY={nowLineY}
        />
      )}

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(Object.keys(STATUS_DOT) as BookingStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', STATUS_DOT[s])} />
            {BOOKING_STATUS_LABELS[s]}
          </span>
        ))}
      </div>

      <BookingDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        initialBooking={editBooking}
        initialDate={quickDate}
        initialSlotIndex={quickSlot}
        gridStartMin={startMin}
        services={services}
        onSaved={load}
      />

      <Dialog open={!!moveDialog} onOpenChange={(o) => !o && setMoveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move booking?</DialogTitle>
            <DialogDescription>
              {moveDialog && (
                <>
                  Move this booking to{' '}
                  <strong>{moveDialog.newDate}</strong> at{' '}
                  <strong>{formatTimeLabel(moveDialog.newTime)}</strong>?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setMoveDialog(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmMove}>
              Confirm move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
