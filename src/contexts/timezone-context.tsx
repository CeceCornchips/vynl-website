'use client';

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'admin_timezone';

function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Australia/Sydney';
  }
}

// ── Helpers (exported so any client component can use them) ───────────────────

/**
 * Returns today's date as YYYY-MM-DD in the given IANA timezone.
 * Always uses the local wall-clock date in that zone — never UTC midnight.
 */
export function todayIn(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Returns a YYYY-MM-DD string N days after today in the given timezone.
 */
export function daysFromToday(n: number, tz: string): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Format a UTC Date (or ISO string) as a readable date in the given timezone.
 * e.g. "Tue, 25 Mar 2026"
 */
export function formatTimestampDate(date: Date | string, tz: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a UTC Date (or ISO string) as a readable date+time in the given timezone.
 * e.g. "25 Mar 2026, 9:41 AM"
 */
export function formatTimestamp(date: Date | string, tz: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: tz,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Returns the UTC offset label for a timezone at this moment,
 * e.g. "GMT+11" or "GMT-5".
 */
export function getUTCOffset(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

/** Human-friendly timezone label, e.g. "Australia/Sydney (GMT+11)". */
export function tzLabel(tz: string): string {
  const offset = getUTCOffset(tz);
  const name = tz.replace(/_/g, ' ');
  return offset ? `${name} (${offset})` : name;
}

/** All IANA timezone IDs, sorted alphabetically. */
export function getAllTimezones(): string[] {
  try {
    return [...Intl.supportedValuesOf('timeZone')].sort();
  } catch {
    // Fallback for environments without Intl.supportedValuesOf
    return [
      'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
      'America/Anchorage', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/New_York', 'America/Phoenix', 'America/Sao_Paulo', 'America/Toronto',
      'America/Vancouver',
      'Asia/Bangkok', 'Asia/Dubai', 'Asia/Hong_Kong', 'Asia/Jakarta', 'Asia/Karachi',
      'Asia/Kolkata', 'Asia/Kuwait', 'Asia/Riyadh', 'Asia/Seoul', 'Asia/Shanghai',
      'Asia/Singapore', 'Asia/Taipei', 'Asia/Tehran', 'Asia/Tokyo',
      'Atlantic/Azores',
      'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Darwin', 'Australia/Hobart',
      'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
      'Europe/Amsterdam', 'Europe/Athens', 'Europe/Berlin', 'Europe/Brussels',
      'Europe/Budapest', 'Europe/Copenhagen', 'Europe/Dublin', 'Europe/Helsinki',
      'Europe/Istanbul', 'Europe/Lisbon', 'Europe/London', 'Europe/Madrid',
      'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris', 'Europe/Prague',
      'Europe/Rome', 'Europe/Stockholm', 'Europe/Vienna', 'Europe/Warsaw',
      'Europe/Zurich',
      'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Guam', 'Pacific/Honolulu',
      'Pacific/Noumea', 'Pacific/Pago_Pago', 'Pacific/Tahiti',
      'UTC',
    ];
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface TimezoneContextValue {
  /** Currently selected IANA timezone, e.g. "Australia/Sydney". */
  timezone: string;
  /** IANA timezone auto-detected from the browser. */
  browserTimezone: string;
  /** Persist a new timezone choice. */
  setTimezone: (tz: string) => void;
}

const TimezoneContext = createContext<TimezoneContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function TimezoneProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start with a sensible default, hydrate on the client.
  const [timezone, setTimezoneState] = useState('Australia/Sydney');
  const [browserTimezone, setBrowserTimezone] = useState('Australia/Sydney');

  useEffect(() => {
    startTransition(() => {
      const detected = detectBrowserTimezone();
      setBrowserTimezone(detected);
      const stored = localStorage.getItem(STORAGE_KEY);
      setTimezoneState(stored ?? detected);
    });
  }, []);

  const setTimezone = useCallback((tz: string) => {
    localStorage.setItem(STORAGE_KEY, tz);
    setTimezoneState(tz);
  }, []);

  return (
    <TimezoneContext.Provider value={{ timezone, browserTimezone, setTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAdminTimezone(): TimezoneContextValue {
  const ctx = useContext(TimezoneContext);
  if (!ctx) throw new Error('useAdminTimezone must be used inside <TimezoneProvider>');
  return ctx;
}
