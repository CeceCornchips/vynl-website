'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  type Booking,
  type BookingStatus,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLOURS,
  formatCentsAUD,
} from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Clock,
  Loader2,
  XCircle,
  CalendarCheck,
  Users,
  TrendingUp,
  CalendarDays,
  PlusCircle,
  BookOpen,
  Activity,
} from 'lucide-react';
import { useAdminTimezone, todayIn, daysFromToday, formatTimestamp } from '@/contexts/timezone-context';

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Monday of the current week in the given timezone, as YYYY-MM-DD. */
function weekStartIn(tz: string): string {
  const now = new Date();
  // Find the local weekday (0=Sun … 6=Sat) in the given timezone
  const dayOfWeek = parseInt(
    new Intl.DateTimeFormat('en', { timeZone: tz, weekday: 'short' })
      .formatToParts(now)
      .find((p) => p.type === 'weekday')?.value === 'Sun'
      ? '0'
      : new Intl.DateTimeFormat('en', { timeZone: tz, weekday: 'narrow' })
          .format(now) === 'S'
        ? '0'
        : '1', // fallback
    10,
  );
  // Simpler: just use JS date and adjust by tz offset
  const tzToday = todayIn(tz);
  const [y, m, d] = tzToday.split('-').map(Number);
  const localDate = new Date(y, m - 1, d);
  const dow = localDate.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  void dayOfWeek; // suppress unused warning
  const monday = new Date(y, m - 1, d + mondayOffset);
  return [
    monday.getFullYear(),
    String(monday.getMonth() + 1).padStart(2, '0'),
    String(monday.getDate()).padStart(2, '0'),
  ].join('-');
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BOOKING_STATUS_COLOURS[status]}`}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  colour,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  colour: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 flex items-start justify-between gap-4 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1 tabular-nums truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${colour}`}
      >
        {icon}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { timezone } = useAdminTimezone();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/bookings');
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to load bookings.');
      setBookings(data.bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ── Derived data — all date maths use the selected timezone ──────────────

  const today = todayIn(timezone);
  const sevenDaysOut = daysFromToday(7, timezone);
  const weekStart = weekStartIn(timezone);

  const todayBookings = bookings.filter(
    (b) => b.booking_date?.toString().split('T')[0] === today && b.status !== 'cancelled',
  );

  const upcomingBookings = bookings
    .filter((b) => {
      const d = b.booking_date?.toString().split('T')[0];
      return d >= today && d <= sevenDaysOut && b.status !== 'cancelled';
    })
    .sort((a, b) => {
      const da = a.booking_date.toString().split('T')[0];
      const db = b.booking_date.toString().split('T')[0];
      return da < db ? -1 : da > db ? 1 : 0;
    })
    .slice(0, 8);

  const weekRevenue = bookings
    .filter((b) => {
      const d = b.booking_date?.toString().split('T')[0];
      return (
        ['confirmed', 'completed'].includes(b.status) &&
        d >= weekStart &&
        d <= today
      );
    })
    .reduce((sum, b) => sum + (b.deposit_amount_cents || 0), 0);

  const recentActivity = [...bookings]
    .filter((b) => b.updated_at)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const counts = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-AU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchBookings} disabled={loading}>
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <XCircle className="size-4 shrink-0" />
          {error}
          <button onClick={fetchBookings} className="ml-auto underline text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Jobs"
          value={loading ? '—' : todayBookings.length}
          sub="active bookings"
          icon={<CalendarDays className="size-5 text-primary" />}
          colour="bg-primary/10"
        />
        <StatCard
          label="This Week's Revenue"
          value={loading ? '—' : formatCentsAUD(weekRevenue)}
          sub="deposits collected"
          icon={<TrendingUp className="size-5 text-green-700" />}
          colour="bg-green-100"
        />
        <StatCard
          label="Pending"
          value={loading ? '—' : counts.pending}
          sub="awaiting confirmation"
          icon={<Clock className="size-5 text-yellow-700" />}
          colour="bg-yellow-100"
        />
        <StatCard
          label="Total Bookings"
          value={loading ? '—' : counts.total}
          sub={`${counts.completed} completed`}
          icon={<Users className="size-5 text-blue-700" />}
          colour="bg-blue-100"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="default">
          <Link href="/admin/bookings">
            <BookOpen className="size-4" />
            View All Bookings
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/bookings/new">
            <PlusCircle className="size-4" />
            Add Manual Booking
          </Link>
        </Button>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's jobs */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <CalendarCheck className="size-4 text-muted-foreground" />
              Today&apos;s Jobs
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {loading ? '…' : `${todayBookings.length} booking${todayBookings.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="size-4 animate-spin mr-2" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : todayBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CalendarCheck className="size-8 opacity-30 mb-2" />
                <p className="text-sm">No jobs today</p>
              </div>
            ) : (
              todayBookings.map((b) => (
                <div key={b.id} className="px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{b.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.service_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{b.address}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs font-medium tabular-nums">
                        {formatTime(String(b.booking_time))}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming bookings */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              Upcoming – Next 7 Days
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {loading ? '…' : `${upcomingBookings.length} booking${upcomingBookings.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="size-4 animate-spin mr-2" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CalendarDays className="size-8 opacity-30 mb-2" />
                <p className="text-sm">No upcoming bookings</p>
              </div>
            ) : (
              upcomingBookings.map((b) => (
                <div key={b.id} className="px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{b.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.service_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs font-medium">
                        {formatDate(String(b.booking_date))}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatTime(String(b.booking_time))}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            Recent Activity
          </h2>
        </div>
        <div className="divide-y">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin mr-2" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              No recent activity
            </div>
          ) : (
            recentActivity.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                <div
                  className={`size-2 rounded-full shrink-0 ${
                    b.status === 'pending'
                      ? 'bg-yellow-400'
                      : b.status === 'confirmed'
                        ? 'bg-blue-400'
                        : b.status === 'in_progress'
                          ? 'bg-purple-400'
                          : b.status === 'completed'
                            ? 'bg-green-400'
                            : 'bg-red-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="font-medium">{b.customer_name}</span>
                    {' — '}
                    <span className="text-muted-foreground">{b.service_name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={b.status} />
                  <span className="text-xs text-muted-foreground tabular-nums" title={formatTimestamp(b.updated_at, timezone)}>
                    {timeAgo(new Date(b.updated_at))}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
