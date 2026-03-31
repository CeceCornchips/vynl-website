'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CalBooking } from './calendar-types';
import { effectiveDurationMins } from './calendar-types';
import { assignOverlapLanes } from './overlap';
import {
  minutesToTimeStr,
  timeStrToMinutes,
  formatTimeLabel,
  formatHourGridLabel,
  formatWeekdayShort,
} from './time-math';
import { STATUS_BLOCK, STATUS_GHOST } from './status-styles';
import { cn } from '@/lib/utils';

const ROW_H = 28;
const SLOT_MIN = 30;
const CLICK_MAX_PX = 5;
/** Sticky day header height — must match `h-8` on time gutter. */
const GRID_HEADER_H = 32;

export function slotMinute(gridStartMin: number, slotIndex: number): number {
  return gridStartMin + slotIndex * SLOT_MIN;
}

type GridDragSession = {
  booking: CalBooking;
  sourceDate: string;
  lane: number;
  laneCount: number;
  durationMins: number;
};

export function TimeGrid({
  dates,
  gridStartMin,
  gridEndMin,
  bookings,
  hideCancelled,
  onBookingClick,
  onRequestMove,
  onEmptySlotClick,
  onResizeEnd,
  nowLineY,
}: {
  dates: string[];
  gridStartMin: number;
  gridEndMin: number;
  bookings: CalBooking[];
  hideCancelled: boolean;
  onBookingClick: (b: CalBooking) => void;
  onRequestMove: (bookingId: string, newDate: string, newTime: string) => void;
  onEmptySlotClick: (date: string, slotIndex: number) => void;
  onResizeEnd: (bookingId: string, newDurationMins: number) => void;
  nowLineY: number | null;
}) {
  const slotCount = Math.max(1, Math.ceil((gridEndMin - gridStartMin) / SLOT_MIN));
  const totalHeight = slotCount * ROW_H;
  const isWeekView = dates.length > 1;

  const [dragSession, setDragSession] = useState<GridDragSession | null>(null);
  const [hoverSlot, setHoverSlot] = useState<{ date: string; slotIndex: number } | null>(null);

  const dragSessionRef = useRef<GridDragSession | null>(null);
  const hoverSlotRef = useRef<{ date: string; slotIndex: number } | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  /** After a drag ends, the browser fires a click on the grid — suppress one empty-slot open. */
  const suppressEmptySlotClickRef = useRef(false);
  const suppressEmptySlotClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emptySlotClickGuard = useCallback(
    (slotDate: string, slotIndex: number) => {
      if (suppressEmptySlotClickRef.current) {
        suppressEmptySlotClickRef.current = false;
        if (suppressEmptySlotClickTimeoutRef.current) {
          clearTimeout(suppressEmptySlotClickTimeoutRef.current);
          suppressEmptySlotClickTimeoutRef.current = null;
        }
        return;
      }
      onEmptySlotClick(slotDate, slotIndex);
    },
    [onEmptySlotClick],
  );

  const bookingsByDate = useMemo(() => {
    const m = new Map<string, CalBooking[]>();
    for (const d of dates) m.set(d, []);
    for (const b of bookings) {
      const key = b.booking_date?.toString().split('T')[0];
      if (!key || !m.has(key)) continue;
      if (hideCancelled && b.status === 'cancelled') continue;
      m.get(key)!.push(b);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => timeStrToMinutes(a.booking_time) - timeStrToMinutes(b.booking_time));
    }
    return m;
  }, [bookings, dates, hideCancelled]);

  const handleDragBegin = useCallback(
    (
      booking: CalBooking,
      sourceDate: string,
      lane: number,
      laneCount: number,
      pointerEvent: PointerEvent,
    ) => {
      dragCleanupRef.current?.();

      const session: GridDragSession = {
        booking,
        sourceDate,
        lane,
        laneCount,
        durationMins: effectiveDurationMins(booking),
      };
      dragSessionRef.current = session;
      setDragSession(session);

      const updateHover = (ev: PointerEvent) => {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const col = el?.closest?.('[data-day-column]') as HTMLElement | null;
        if (!col) {
          hoverSlotRef.current = null;
          setHoverSlot(null);
          return;
        }
        const targetDate = col.getAttribute('data-day-column');
        if (!targetDate || !dates.includes(targetDate)) {
          hoverSlotRef.current = null;
          setHoverSlot(null);
          return;
        }
        const rect = col.getBoundingClientRect();
        const y = ev.clientY - rect.top;
        let slotIdx = Math.floor(y / ROW_H);
        slotIdx = Math.max(0, Math.min(slotCount - 1, slotIdx));
        const next = { date: targetDate, slotIndex: slotIdx };
        hoverSlotRef.current = next;
        setHoverSlot(next);
      };

      const move = (ev: PointerEvent) => {
        updateHover(ev);
      };

      const up = () => {
        if (suppressEmptySlotClickTimeoutRef.current) {
          clearTimeout(suppressEmptySlotClickTimeoutRef.current);
        }
        suppressEmptySlotClickRef.current = true;
        suppressEmptySlotClickTimeoutRef.current = setTimeout(() => {
          suppressEmptySlotClickRef.current = false;
          suppressEmptySlotClickTimeoutRef.current = null;
        }, 400);

        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        dragCleanupRef.current = null;

        const d = dragSessionRef.current;
        const h = hoverSlotRef.current;
        dragSessionRef.current = null;
        hoverSlotRef.current = null;
        setDragSession(null);
        setHoverSlot(null);

        if (!d || !h) return;
        const newMin = slotMinute(gridStartMin, h.slotIndex);
        const newTime = minutesToTimeStr(newMin);
        const oldNorm = normalizeTime(d.booking.booking_time);
        if (h.date === d.sourceDate && newTime === oldNorm) return;
        onRequestMove(d.booking.id, h.date, newTime);
      };

      dragCleanupRef.current = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
      };

      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      updateHover(pointerEvent);
    },
    [dates, gridStartMin, onRequestMove, slotCount],
  );

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
      if (suppressEmptySlotClickTimeoutRef.current) {
        clearTimeout(suppressEmptySlotClickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex min-h-[480px] w-full overflow-x-auto rounded-lg border bg-card">
      <div className="sticky left-0 z-30 w-14 shrink-0 border-r bg-muted/40">
        <div className="sticky top-0 z-20 h-8 border-b bg-muted/40" aria-hidden />
        <div className="relative" style={{ height: totalHeight }}>
          {Array.from({ length: slotCount }).map((_, i) => {
            const slotStart = gridStartMin + i * SLOT_MIN;
            const showHourLabel = slotStart % 60 === 0;
            return (
              <div
                key={i}
                className="absolute left-0 right-0 text-[10px] leading-none text-muted-foreground"
                style={{ top: i * ROW_H, height: ROW_H }}
              >
                {showHourLabel && (
                  <span className="absolute -top-px pl-1 font-medium tabular-nums">
                    {formatHourGridLabel(slotStart)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative min-w-0 flex-1 flex flex-row">
        <div
          className="pointer-events-none absolute left-0 right-0 z-0"
          style={{ top: GRID_HEADER_H, height: totalHeight }}
        >
          {Array.from({ length: slotCount }).map((_, i) => {
            const slotStart = gridStartMin + i * SLOT_MIN;
            const bottomTime = slotStart + SLOT_MIN;
            const isHourBoundary = bottomTime % 60 === 0;
            return (
              <div
                key={i}
                className={cn(
                  'absolute right-0 left-0',
                  isHourBoundary ? 'border-b border-slate-300' : 'border-b border-slate-200',
                )}
                style={{ top: i * ROW_H, height: ROW_H }}
              />
            );
          })}
        </div>

        {dates.map((date) => (
          <DayColumn
            key={date}
            date={date}
            gridStartMin={gridStartMin}
            slotCount={slotCount}
            totalHeight={totalHeight}
            dayBookings={bookingsByDate.get(date) ?? []}
            onBookingClick={onBookingClick}
            onDragBegin={handleDragBegin}
            dragSession={dragSession}
            hoverSlot={hoverSlot}
            isWeekView={isWeekView}
            onEmptySlotClick={emptySlotClickGuard}
            onResizeEnd={onResizeEnd}
            nowLineY={nowLineY}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  date,
  gridStartMin,
  slotCount,
  totalHeight,
  dayBookings,
  onBookingClick,
  onDragBegin,
  dragSession,
  hoverSlot,
  isWeekView,
  onEmptySlotClick,
  onResizeEnd,
  nowLineY,
}: {
  date: string;
  gridStartMin: number;
  slotCount: number;
  totalHeight: number;
  dayBookings: CalBooking[];
  onBookingClick: (b: CalBooking) => void;
  onDragBegin: (
    booking: CalBooking,
    sourceDate: string,
    lane: number,
    laneCount: number,
    pointerEvent: PointerEvent,
  ) => void;
  dragSession: GridDragSession | null;
  hoverSlot: { date: string; slotIndex: number } | null;
  isWeekView: boolean;
  onEmptySlotClick: (date: string, slotIndex: number) => void;
  onResizeEnd: (bookingId: string, newDurationMins: number) => void;
  nowLineY: number | null;
}) {
  const intervals = useMemo(() => {
    return dayBookings
      .filter((b) => b.status !== 'cancelled')
      .map((b) => {
        const st = timeStrToMinutes(b.booking_time);
        const dur = effectiveDurationMins(b);
        return { id: b.id, start: st, end: st + dur, b };
      });
  }, [dayBookings]);

  const lanes = useMemo(() => assignOverlapLanes(intervals), [intervals]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-booking-block]')) return;
    const col = e.currentTarget as HTMLElement;
    const r = col.getBoundingClientRect();
    const y = e.clientY - r.top;
    let slotIdx = Math.floor(y / ROW_H);
    slotIdx = Math.max(0, Math.min(slotCount - 1, slotIdx));
    onEmptySlotClick(date, slotIdx);
  };

  const showHoverHighlight = dragSession && hoverSlot?.date === date;

  return (
    <div className="relative z-10 min-w-[120px] flex-1 border-r border-border last:border-r-0">
      <div className="sticky top-0 z-20 h-8 border-b bg-muted/30 px-1 py-1 text-center text-xs font-medium leading-none">
        {formatDayHeader(date)}
      </div>
      <div
        data-day-column={date}
        data-grid-start={String(gridStartMin)}
        data-slot-count={String(slotCount)}
        className="relative z-10 cursor-crosshair"
        style={{ height: totalHeight }}
        onClick={handleBackgroundClick}
      >
        {showHoverHighlight && hoverSlot && (
          <div
            className="pointer-events-none absolute right-0 left-0 z-[15] bg-blue-50/90 dark:bg-slate-800/50"
            style={{
              top: hoverSlot.slotIndex * ROW_H,
              height: ROW_H,
            }}
          />
        )}

        {nowLineY !== null && nowLineY >= 0 && nowLineY <= totalHeight && (
          <div
            className="pointer-events-none absolute right-0 left-0 z-30 h-0.5 bg-red-500"
            style={{ top: nowLineY }}
          />
        )}

        {dragSession && hoverSlot?.date === date && (
          <DragGhost
            dragSession={dragSession}
            hoverSlot={hoverSlot}
            gridStartMin={gridStartMin}
            totalHeight={totalHeight}
            isWeekView={isWeekView}
          />
        )}

        {dayBookings.map((b) => (
          <BookingBlock
            key={b.id}
            booking={b}
            date={date}
            gridStartMin={gridStartMin}
            slotCount={slotCount}
            totalHeight={totalHeight}
            laneInfo={lanes.get(b.id)}
            onBookingClick={onBookingClick}
            onDragBegin={onDragBegin}
            isDraggingThis={dragSession?.booking.id === b.id}
            onResizeEnd={onResizeEnd}
          />
        ))}
      </div>
    </div>
  );
}

function DragGhost({
  dragSession,
  hoverSlot,
  gridStartMin,
  totalHeight,
  isWeekView,
}: {
  dragSession: GridDragSession;
  hoverSlot: { date: string; slotIndex: number };
  gridStartMin: number;
  totalHeight: number;
  isWeekView: boolean;
}) {
  const newMin = slotMinute(gridStartMin, hoverSlot.slotIndex);
  const timeStr = minutesToTimeStr(newMin);
  const label = isWeekView
    ? `${formatWeekdayShort(hoverSlot.date)} ${formatTimeLabel(timeStr)}`
    : formatTimeLabel(timeStr);
  const lane = dragSession.lane;
  const laneCount = dragSession.laneCount;
  const widthPct = 100 / laneCount;
  const leftPct = lane * widthPct;
  const dur = dragSession.durationMins;
  const ghostHeight = Math.max(
    ROW_H - 4,
    Math.min(
      Math.ceil(dur / SLOT_MIN) * ROW_H - 2,
      totalHeight - hoverSlot.slotIndex * ROW_H - 2,
    ),
  );

  return (
    <div
      className={cn(
        'pointer-events-none absolute z-50 rounded border-2 border-dashed px-1 py-0.5 text-[10px] shadow-sm',
        STATUS_GHOST[dragSession.booking.status],
      )}
      style={{
        top: hoverSlot.slotIndex * ROW_H,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        minHeight: ghostHeight,
      }}
    >
      <div className="font-semibold leading-tight">{label}</div>
    </div>
  );
}

function formatDayHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' });
}

function normalizeTime(t: string): string {
  const p = t.split(':').map((x) => Number(x));
  const h = p[0] ?? 0;
  const m = p[1] ?? 0;
  const s = p[2] ?? 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function BookingBlock({
  booking,
  date,
  gridStartMin,
  totalHeight,
  laneInfo,
  onBookingClick,
  onDragBegin,
  isDraggingThis,
  onResizeEnd,
}: {
  booking: CalBooking;
  date: string;
  gridStartMin: number;
  slotCount: number;
  totalHeight: number;
  laneInfo?: { lane: number; laneCount: number };
  onBookingClick: (b: CalBooking) => void;
  onDragBegin: (
    booking: CalBooking,
    sourceDate: string,
    lane: number,
    laneCount: number,
    pointerEvent: PointerEvent,
  ) => void;
  isDraggingThis: boolean;
  onResizeEnd: (bookingId: string, newDurationMins: number) => void;
}) {
  const dur = effectiveDurationMins(booking);
  const startM = timeStrToMinutes(booking.booking_time);
  const startSlot = Math.max(0, Math.round((startM - gridStartMin) / SLOT_MIN));
  const top = startSlot * ROW_H;

  const lane = laneInfo?.lane ?? 0;
  const laneCount = laneInfo?.laneCount ?? 1;
  const widthPct = 100 / laneCount;
  const leftPct = lane * widthPct;

  const [resizeDur, setResizeDur] = useState<number | null>(null);

  const onBlockPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    let exceededThreshold = false;

    const move = (ev: PointerEvent) => {
      const dx = Math.abs(ev.clientX - startX);
      const dy = Math.abs(ev.clientY - startY);
      if (dx > CLICK_MAX_PX || dy > CLICK_MAX_PX) {
        exceededThreshold = true;
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        if (booking.status !== 'cancelled') {
          onDragBegin(
            booking,
            date,
            lane,
            laneCount,
            ev,
          );
        }
      }
    };

    const up = (ev: PointerEvent) => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      const dx = Math.abs(ev.clientX - startX);
      const dy = Math.abs(ev.clientY - startY);

      if (!exceededThreshold && dx <= CLICK_MAX_PX && dy <= CLICK_MAX_PX) {
        onBookingClick(booking);
      }
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };

  const onResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const baseDur = dur;
    let lastDur = baseDur;
    setResizeDur(baseDur);

    const move = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      const rawEnd = startM + baseDur + Math.round(dy / ROW_H) * SLOT_MIN;
      const snappedEnd = Math.round(rawEnd / SLOT_MIN) * SLOT_MIN;
      lastDur = Math.max(SLOT_MIN, snappedEnd - startM);
      setResizeDur(lastDur);
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      setResizeDur(null);
      if (lastDur !== baseDur) onResizeEnd(booking.id, lastDur);
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };

  const displayDur = resizeDur ?? dur;
  const displayHeight = Math.max(
    ROW_H - 4,
    Math.min(Math.ceil(displayDur / SLOT_MIN) * ROW_H - 2, totalHeight - top - 2),
  );

  const endTimeLabel =
    resizeDur !== null
      ? formatTimeLabel(minutesToTimeStr(startM + resizeDur))
      : null;

  return (
    <div
      data-booking-block
      className={cn(
        'absolute z-20 rounded border px-1 py-0.5 text-[10px] shadow-sm transition-opacity duration-300 ease-out',
        STATUS_BLOCK[booking.status],
        isDraggingThis && 'pointer-events-none opacity-40',
        !isDraggingThis && 'cursor-pointer hover:brightness-[1.06]',
        resizeDur !== null && 'pb-3',
      )}
      style={{
        top,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        minHeight: displayHeight,
      }}
      onPointerDown={onBlockPointerDown}
    >
      <div className="pointer-events-none font-semibold truncate">
        {formatTimeLabel(booking.booking_time)} · {booking.customer_name}
      </div>
      <div className="pointer-events-none truncate text-[9px] opacity-90">{booking.service_name}</div>
      {endTimeLabel && (
        <div className="pointer-events-none absolute bottom-0.5 left-0 right-0 text-center text-[9px] font-semibold tabular-nums leading-none">
          {endTimeLabel}
        </div>
      )}
      {booking.status !== 'cancelled' && (
        <div
          data-resize-handle
          className="absolute bottom-0 left-0 right-0 z-10 h-1.5 cursor-ns-resize hover:bg-foreground/15"
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeDown(e);
          }}
        />
      )}
    </div>
  );
}
