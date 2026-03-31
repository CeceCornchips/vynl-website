'use client';

import { useState, useRef, useEffect, useCallback, startTransition } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_INITIALS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD using local time. Never uses UTC. */
function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Parses YYYY-MM-DD into a local Date without any timezone shift. */
function fromDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Long human-readable label, e.g. "Wednesday, 25 March 2026". */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  return fromDateStr(dateStr).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface DatePickerProps {
  /** Current value as YYYY-MM-DD string, or '' if nothing selected. */
  value: string;
  /** Called with the new YYYY-MM-DD string when the user picks a day. */
  onChange: (dateStr: string) => void;
  /** Earliest selectable date as YYYY-MM-DD. Days before this are greyed out. */
  min?: string;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  placeholder = 'Pick a date…',
  className,
}: DatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  /** true = popover opens above the trigger (viewport-flip). */
  const [openAbove, setOpenAbove] = useState(false);

  // Calendar view state — tracks which month/year is displayed.
  // Initialised from value if present, otherwise from today.
  const todayDate = new Date();
  const todayStr = toDateStr(todayDate);

  const initialYear = value ? fromDateStr(value).getFullYear() : todayDate.getFullYear();
  const initialMonth = value ? fromDateStr(value).getMonth() : todayDate.getMonth();
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  // When an external value change jumps us to a different month, sync the view.
  useEffect(() => {
    if (value) {
      const d = fromDateStr(value);
      startTransition(() => {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      });
    }
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Open/close — also measure available space to decide flip direction.
  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Flip upward when less than 310px remains below the trigger.
        setOpenAbove(window.innerHeight - rect.bottom < 310);
      }
      return !prev;
    });
  }, []);

  // Month navigation.
  const prevMonth = () => {
    setViewYear((y) => (viewMonth === 0 ? y - 1 : y));
    setViewMonth((m) => (m === 0 ? 11 : m - 1));
  };
  const nextMonth = () => {
    setViewYear((y) => (viewMonth === 11 ? y + 1 : y));
    setViewMonth((m) => (m === 11 ? 0 : m + 1));
  };

  // Grid data.
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  /**
   * Day-click handler.
   * Reads the exact YYYY-MM-DD from the button's data-date attribute so
   * there is no dependency on viewYear/viewMonth closure values.
   */
  const handleDayClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const dateStr = e.currentTarget.dataset.date;
      if (!dateStr) return;
      if (min && dateStr < min) return; // should already be disabled, but guard
      onChange(dateStr);
      setOpen(false);
    },
    [min, onChange],
  );

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* ── Trigger row ──────────────────────────────────────────────────── */}
      {/*
        A styled <div> containing two sibling <button>s.
        <button> inside <button> is invalid HTML and causes hydration errors.
      */}
      <div
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg border bg-background px-3 py-2 text-sm transition-colors',
          open && 'ring-2 ring-ring/50',
          !value && 'text-muted-foreground',
        )}
      >
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus:outline-none"
        >
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">
            {value ? formatDateDisplay(value) : placeholder}
          </span>
        </button>

        {value && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={() => onChange('')}
            className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Calendar popover ─────────────────────────────────────────────── */}
      {open && (
        <div
          role="dialog"
          aria-label="Date picker"
          className={cn(
            'absolute left-0 z-50 w-72 rounded-xl border bg-card p-3 shadow-xl select-none',
            openAbove ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          {/* Month navigation + "Today" shortcut */}
          <div className="mb-3 flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted"
            >
              <ChevronLeft className="size-4" />
            </button>

            <span className="flex-1 text-center text-sm font-semibold tabular-nums">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* "Today" shortcut — lives in the header so it's never near day cells */}
          {(!min || todayStr >= min) && todayStr.slice(0, 7) !== `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}` && (
            <div className="mb-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  // Navigate view to today's month then select it
                  setViewYear(todayDate.getFullYear());
                  setViewMonth(todayDate.getMonth());
                  onChange(todayStr);
                  setOpen(false);
                }}
                className="rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                Jump to today
              </button>
            </div>
          )}

          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7">
            {DAY_INITIALS.map((d) => (
              <div
                key={d}
                className="flex h-7 items-center justify-center text-[11px] font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before the 1st of the month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`pad-${i}`} aria-hidden="true" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              // Build the date string HERE in the render, stored in data-date.
              // The click handler reads it back from the DOM — no stale closure risk.
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              const isDisabled = !!(min && dateStr < min);

              return (
                <button
                  key={day}
                  type="button"
                  data-date={dateStr}
                  onClick={handleDayClick}
                  disabled={isDisabled}
                  aria-label={dateStr}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex h-8 w-full items-center justify-center rounded-lg text-sm transition-colors',
                    isDisabled && 'cursor-not-allowed text-muted-foreground/35',
                    isSelected && 'bg-primary font-semibold text-primary-foreground shadow-sm',
                    !isSelected && isToday && 'border border-primary font-semibold text-primary',
                    !isSelected && !isDisabled && 'hover:bg-muted',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
