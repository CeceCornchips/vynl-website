'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Globe, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAdminTimezone,
  getAllTimezones,
  getUTCOffset,
  tzLabel,
} from '@/contexts/timezone-context';

// ── Region grouping ───────────────────────────────────────────────────────────

const REGION_ORDER = [
  'Australia', 'Pacific', 'Asia', 'Europe', 'America',
  'Africa', 'Atlantic', 'Indian', 'Arctic', 'Antarctica', 'Etc', 'UTC',
];

function regionOf(tz: string): string {
  if (tz === 'UTC') return 'UTC';
  return tz.split('/')[0] ?? 'Other';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TimezoneSelector() {
  const { timezone, browserTimezone, setTimezone } = useAdminTimezone();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Focus search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const allTimezones = useMemo(() => getAllTimezones(), []);

  // Filtered + grouped
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? allTimezones.filter(
          (tz) =>
            tz.toLowerCase().includes(q) ||
            getUTCOffset(tz).toLowerCase().includes(q),
        )
      : allTimezones;

    const map = new Map<string, string[]>();
    for (const tz of filtered) {
      const region = regionOf(tz);
      const arr = map.get(region) ?? [];
      arr.push(tz);
      map.set(region, arr);
    }

    // Sort regions by preferred order
    return [...map.entries()].sort(([a], [b]) => {
      const ia = REGION_ORDER.indexOf(a);
      const ib = REGION_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [allTimezones, search]);

  const offset = getUTCOffset(timezone);
  const shortName = timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone;

  return (
    <div ref={containerRef} className="relative px-3 py-2">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors',
          'text-muted-foreground hover:bg-muted hover:text-foreground',
          open && 'bg-muted text-foreground',
        )}
      >
        <Globe className="size-3.5 shrink-0" />
        <span className="flex-1 truncate text-left font-medium">{shortName}</span>
        <span className="shrink-0 tabular-nums opacity-70">{offset}</span>
        <ChevronDown className={cn('size-3 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-1 rounded-xl border bg-card shadow-xl overflow-hidden">
          {/* Search bar */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Globe className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search timezone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs placeholder:text-muted-foreground focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Browser auto-detect shortcut */}
          {browserTimezone !== timezone && (
            <button
              type="button"
              onClick={() => { setTimezone(browserTimezone); setOpen(false); setSearch(''); }}
              className="flex w-full items-center gap-2 border-b px-3 py-2 text-xs hover:bg-muted transition-colors text-muted-foreground"
            >
              <Globe className="size-3 shrink-0 text-primary" />
              <span>Use my location: <strong className="text-foreground">{browserTimezone.replace(/_/g, ' ')}</strong></span>
              <span className="ml-auto tabular-nums">{getUTCOffset(browserTimezone)}</span>
            </button>
          )}

          {/* Timezone list */}
          <div className="max-h-60 overflow-y-auto">
            {grouped.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No timezones found.</p>
            ) : (
              grouped.map(([region, zones]) => (
                <div key={region}>
                  <div className="sticky top-0 bg-muted/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                    {region}
                  </div>
                  {zones.map((tz) => {
                    const isSelected = tz === timezone;
                    return (
                      <button
                        key={tz}
                        type="button"
                        onClick={() => { setTimezone(tz); setOpen(false); setSearch(''); }}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors',
                          isSelected
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted text-foreground',
                        )}
                      >
                        {isSelected
                          ? <Check className="size-3 shrink-0 text-primary" />
                          : <span className="size-3 shrink-0" />
                        }
                        <span className="flex-1 truncate text-left">
                          {tzLabel(tz)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
