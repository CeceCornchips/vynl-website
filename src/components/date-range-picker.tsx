'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function toDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toYmd(date: Date | undefined): string | null {
  if (!date) return null;
  return format(date, 'yyyy-MM-dd');
}

export function DateRangePicker({
  from,
  to,
  onChange,
  className,
}: {
  from: string | null;
  to: string | null;
  onChange: (next: { from: string | null; to: string | null }) => void;
  className?: string;
}) {
  const range: DateRange | undefined = useMemo(() => {
    const fromDate = toDate(from);
    const toDateValue = toDate(to);
    if (!fromDate && !toDateValue) return undefined;
    return { from: fromDate, to: toDateValue };
  }, [from, to]);

  const label = useMemo(() => {
    if (!from && !to) return 'Date range';
    if (from && to) {
      return `${format(toDate(from) ?? new Date(), 'dd MMM yyyy')} - ${format(toDate(to) ?? new Date(), 'dd MMM yyyy')}`;
    }
    if (from) return `From ${format(toDate(from) ?? new Date(), 'dd MMM yyyy')}`;
    return `Until ${format(toDate(to) ?? new Date(), 'dd MMM yyyy')}`;
  }, [from, to]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal">
            <CalendarIcon className="mr-2 size-4" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            onSelect={(selected) =>
              onChange({
                from: toYmd(selected?.from),
                to: toYmd(selected?.to),
              })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {(from || to) && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange({ from: null, to: null })}
          aria-label="Clear date range"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
