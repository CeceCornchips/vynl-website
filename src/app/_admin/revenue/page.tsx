'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDown, ArrowUp, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DateRangePicker } from '@/components/date-range-picker';
import { formatCentsAUD } from '@/types/database';

type RangePreset = 'this-week' | 'this-month' | 'last-3-months' | 'this-year' | 'custom';
type GroupBy = 'day' | 'week' | 'month';

type SummaryResponse = {
  ok: boolean;
  summary?: {
    month_revenue_cents: number;
    month_bookings: number;
    month_avg_booking_value_cents: number;
    month_deposits_collected_cents: number;
    month_outstanding_balance_cents: number;
    last_month_revenue_cents: number;
    percent_change_vs_last_month: number;
  };
  error?: string;
};

type Transaction = {
  id: string;
  booking_date: string;
  customer_name: string;
  service_name: string;
  price_cents: number;
  deposit_cents: number;
  amount_paid_cents: number;
  balance_cents: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: 'deposit_paid' | 'paid_in_full' | 'failed' | 'unpaid' | 'cancelled';
};

type ChartPoint = {
  date: string;
  revenue: number;
};

type ServiceRevenue = {
  service_name: string;
  total_revenue: number;
  booking_count: number;
};

function toYmd(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function getPresetRange(preset: RangePreset): { from: string; to: string } {
  const now = new Date();
  const today = toYmd(now);

  if (preset === 'this-week') {
    return { from: toYmd(startOfWeek(now)), to: today };
  }
  if (preset === 'this-month') {
    return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: today };
  }
  if (preset === 'last-3-months') {
    return {
      from: `${new Date(now.getFullYear(), now.getMonth() - 2, 1).getFullYear()}-${String(new Date(now.getFullYear(), now.getMonth() - 2, 1).getMonth() + 1).padStart(2, '0')}-01`,
      to: today,
    };
  }
  if (preset === 'this-year') {
    return { from: `${now.getFullYear()}-01-01`, to: today };
  }
  return { from: today, to: today };
}

function statusBadge(status: Transaction['payment_status']) {
  if (status === 'deposit_paid') return <Badge className="bg-blue-100 text-blue-800">Deposit Paid</Badge>;
  if (status === 'paid_in_full') return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
  if (status === 'failed') return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
  if (status === 'cancelled') return <Badge className="bg-muted text-muted-foreground">Cancelled</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
}

function buildCsv(rows: Transaction[]): string {
  const headers = ['Date', 'Client', 'Service', 'Price', 'Deposit', 'Balance', 'Status'];
  const body = rows.map((r) => [
    r.booking_date.split('T')[0],
    r.customer_name,
    r.service_name,
    formatCentsAUD(r.price_cents),
    formatCentsAUD(r.deposit_cents),
    formatCentsAUD(r.balance_cents),
    r.payment_status,
  ]);
  return [headers, ...body]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export default function RevenueReportsPage() {
  const [summary, setSummary] = useState<SummaryResponse['summary'] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [serviceRevenue, setServiceRevenue] = useState<ServiceRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [preset, setPreset] = useState<RangePreset>('this-month');
  const [customFrom, setCustomFrom] = useState<string | null>(null);
  const [customTo, setCustomTo] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const activeRange = useMemo(() => {
    if (preset === 'custom' && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return getPresetRange(preset);
  }, [customFrom, customTo, preset]);

  const fetchRevenueData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, txRes, chartRes, serviceRes] = await Promise.all([
        fetch('/api/admin/revenue/summary'),
        fetch(`/api/admin/revenue/transactions?from=${encodeURIComponent(activeRange.from)}&to=${encodeURIComponent(activeRange.to)}`),
        fetch(`/api/admin/revenue/chart?from=${encodeURIComponent(activeRange.from)}&to=${encodeURIComponent(activeRange.to)}&groupBy=${groupBy}`),
        fetch(`/api/admin/revenue/by-service?from=${encodeURIComponent(activeRange.from)}&to=${encodeURIComponent(activeRange.to)}`),
      ]);

      const summaryJson = (await summaryRes.json()) as SummaryResponse;
      const txJson = (await txRes.json()) as { ok: boolean; transactions?: Transaction[]; error?: string };
      const chartJson = (await chartRes.json()) as { ok: boolean; points?: ChartPoint[]; error?: string };
      const serviceJson = (await serviceRes.json()) as { ok: boolean; services?: ServiceRevenue[]; error?: string };

      if (!summaryJson.ok) throw new Error(summaryJson.error ?? 'Failed to load summary');
      if (!txJson.ok) throw new Error(txJson.error ?? 'Failed to load transactions');
      if (!chartJson.ok) throw new Error(chartJson.error ?? 'Failed to load chart');
      if (!serviceJson.ok) throw new Error(serviceJson.error ?? 'Failed to load service revenue');

      setSummary(summaryJson.summary ?? null);
      setTransactions(txJson.transactions ?? []);
      setChartPoints(chartJson.points ?? []);
      setServiceRevenue(serviceJson.services ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, [activeRange.from, activeRange.to, groupBy]);

  useEffect(() => {
    void fetchRevenueData();
  }, [fetchRevenueData]);

  const filteredTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? transactions.filter((row) =>
          `${row.customer_name} ${row.service_name}`.toLowerCase().includes(term),
        )
      : transactions;

    return [...filtered].sort((a, b) => {
      const compare = sortBy === 'date'
        ? a.booking_date.localeCompare(b.booking_date)
        : a.price_cents - b.price_cents;
      return sortDir === 'asc' ? compare : -compare;
    });
  }, [search, sortBy, sortDir, transactions]);

  const upcomingRows = useMemo(() => {
    const today = toYmd(new Date());
    return transactions
      .filter((row) => row.booking_date.split('T')[0] > today && row.status === 'confirmed')
      .sort((a, b) => a.booking_date.localeCompare(b.booking_date));
  }, [transactions]);

  const projectedRevenue = useMemo(
    () => upcomingRows.reduce((sum, row) => sum + row.price_cents, 0),
    [upcomingRows],
  );

  const totalRangeBookings = transactions.length;
  const rangeAvgBookingValue =
    totalRangeBookings > 0
      ? Math.round(transactions.reduce((sum, row) => sum + row.price_cents, 0) / totalRangeBookings)
      : 0;
  const rangeDeposits = transactions.reduce((sum, row) => sum + row.deposit_cents, 0);
  const rangeOutstanding = transactions
    .filter((row) => row.status !== 'completed' && row.status !== 'cancelled')
    .reduce((sum, row) => sum + row.balance_cents, 0);

  const kpis = [
    {
      label: 'Total Revenue this month',
      value: formatCentsAUD(summary?.month_revenue_cents ?? 0),
      sub: `vs last month ${summary?.percent_change_vs_last_month ?? 0}%`,
      trend: summary?.percent_change_vs_last_month ?? 0,
    },
    {
      label: 'Total Bookings this month',
      value: String(summary?.month_bookings ?? 0),
      sub: `${totalRangeBookings} in selected range`,
    },
    {
      label: 'Average Booking Value',
      value: formatCentsAUD(summary?.month_avg_booking_value_cents ?? rangeAvgBookingValue),
      sub: 'confirmed + completed',
    },
    {
      label: 'Total Deposits Collected',
      value: formatCentsAUD(summary?.month_deposits_collected_cents ?? rangeDeposits),
      sub: 'month to date',
    },
    {
      label: 'Outstanding Balance',
      value: formatCentsAUD(summary?.month_outstanding_balance_cents ?? rangeOutstanding),
      sub: 'not yet paid',
    },
  ];

  const exportCsv = () => {
    const csv = buildCsv(filteredTransactions);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue-transactions-${activeRange.from}_to_${activeRange.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue & Reports</h1>
        <p className="text-sm text-muted-foreground">Track revenue, transactions, and projected bookings.</p>
      </div>

      {error && <Card><CardContent className="py-4 text-sm text-destructive">{error}</CardContent></Card>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-2xl font-semibold tabular-nums">{loading ? '—' : kpi.value}</p>
              <p
                className={`text-xs ${
                  kpi.label === 'Total Revenue this month'
                    ? (kpi.trend ?? 0) >= 0
                      ? 'text-green-700'
                      : 'text-red-700'
                    : 'text-muted-foreground'
                }`}
              >
                {kpi.label === 'Total Revenue this month' && (kpi.trend ?? 0) >= 0 ? (
                  <ArrowUp className="mr-1 inline size-3" />
                ) : null}
                {kpi.label === 'Total Revenue this month' && (kpi.trend ?? 0) < 0 ? (
                  <ArrowDown className="mr-1 inline size-3" />
                ) : null}
                {loading ? 'Loading...' : kpi.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date range</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button variant={preset === 'this-week' ? 'default' : 'outline'} size="sm" onClick={() => setPreset('this-week')}>This Week</Button>
            <Button variant={preset === 'this-month' ? 'default' : 'outline'} size="sm" onClick={() => setPreset('this-month')}>This Month</Button>
            <Button variant={preset === 'last-3-months' ? 'default' : 'outline'} size="sm" onClick={() => setPreset('last-3-months')}>Last 3 Months</Button>
            <Button variant={preset === 'this-year' ? 'default' : 'outline'} size="sm" onClick={() => setPreset('this-year')}>This Year</Button>
            <Button variant={preset === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => setPreset('custom')}>Custom Range</Button>
          </div>
          {preset === 'custom' && (
            <DateRangePicker
              from={customFrom}
              to={customTo}
              onChange={(next) => {
                setCustomFrom(next.from);
                setCustomTo(next.to);
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Revenue Over Time</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant={groupBy === 'day' ? 'default' : 'outline'} onClick={() => setGroupBy('day')}>Daily</Button>
            <Button size="sm" variant={groupBy === 'week' ? 'default' : 'outline'} onClick={() => setGroupBy('week')}>Weekly</Button>
            <Button size="sm" variant={groupBy === 'month' ? 'default' : 'outline'} onClick={() => setGroupBy('month')}>Monthly</Button>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartPoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `$${Math.round(value / 100)}`} />
              <Tooltip formatter={(value) => formatCentsAUD(Number(value ?? 0))} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Service</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serviceRevenue} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${Math.round(value / 100)}`} />
              <YAxis type="category" dataKey="service_name" width={160} />
              <Tooltip
                formatter={(value, _name, item) => [
                  formatCentsAUD(Number(value ?? 0)),
                  `${String((item?.payload as { booking_count?: number } | undefined)?.booking_count ?? 0)} bookings`,
                ]}
              />
              <Bar dataKey="total_revenue" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by client or service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={sortBy === 'date' ? 'default' : 'outline'} onClick={() => setSortBy('date')}>Sort Date</Button>
              <Button size="sm" variant={sortBy === 'price' ? 'default' : 'outline'} onClick={() => setSortBy('price')}>Sort Price</Button>
              <Button size="sm" variant="outline" onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}>
                {sortDir === 'asc' ? 'Asc' : 'Desc'}
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Deposit</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No transactions for this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.booking_date.split('T')[0]}</TableCell>
                      <TableCell>{row.customer_name}</TableCell>
                      <TableCell>{row.service_name}</TableCell>
                      <TableCell>{formatCentsAUD(row.price_cents)}</TableCell>
                      <TableCell>{formatCentsAUD(row.deposit_cents)}</TableCell>
                      <TableCell>{formatCentsAUD(row.balance_cents)}</TableCell>
                      <TableCell>{statusBadge(row.payment_status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Revenue</CardTitle>
          <p className="text-sm text-muted-foreground">
            Projected total: <span className="font-medium text-foreground">{formatCentsAUD(projectedRevenue)}</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Expected Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No upcoming confirmed revenue in this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  upcomingRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.booking_date.split('T')[0]}</TableCell>
                      <TableCell>{row.customer_name}</TableCell>
                      <TableCell>{row.service_name}</TableCell>
                      <TableCell>{formatCentsAUD(row.price_cents)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
