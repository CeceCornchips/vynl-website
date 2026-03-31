'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  RefreshCw,
  Search,
  Plus,
  Star,
  Trash2,
  Eye,
  Users,
  TrendingUp,
  UserCheck,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { type Client, type ClientTag, computeClientTags, formatCentsAUD } from '@/types/database';

type ClientWithTags = Client & { computed_tags: ClientTag[] };

type Stats = {
  totalClients: number;
  newThisMonth: number;
  vipClients: number;
  avgSpendCents: number;
};

const TAG_COLOURS: Record<ClientTag, string> = {
  VIP: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Regular: 'bg-blue-100 text-blue-800 border-blue-200',
  New: 'bg-green-100 text-green-800 border-green-200',
  Inactive: 'bg-gray-100 text-gray-600 border-gray-200',
};

function TagPill({ tag }: { tag: ClientTag }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TAG_COLOURS[tag]}`}
    >
      {tag === 'VIP' && <Star className="mr-0.5 size-2.5 fill-current" />}
      {tag}
    </span>
  );
}

function formatLastVisit(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithTags[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('created_at');

  const [deleteTarget, setDeleteTarget] = useState<ClientWithTags | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    notes: '',
    is_vip: false,
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/admin/clients', window.location.origin);
      url.searchParams.set('filter', filter);
      url.searchParams.set('sort', sort);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to load clients');
      setClients(
        (data.clients as Client[]).map((c) => ({
          ...c,
          computed_tags: computeClientTags(c),
        })),
      );
      setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [filter, sort]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => {
      return (
        c.full_name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q)
      );
    });
  }, [clients, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Delete failed');
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.full_name.trim()) {
      setAddError('Full name is required.');
      return;
    }
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to create client');
      const newClient = data.client as Client;
      setClients((prev) => [
        { ...newClient, computed_tags: computeClientTags(newClient) },
        ...prev,
      ]);
      setAddOpen(false);
      setAddForm({ full_name: '', email: '', phone: '', notes: '', is_vip: false });
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to create client');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Client
          </Button>
          <Button variant="outline" size="icon" onClick={fetchClients} disabled={loading}>
            <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold">{stats.newThisMonth}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-100">
                <Star className="size-5 text-yellow-600 fill-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">VIP Clients</p>
                <p className="text-2xl font-bold">{stats.vipClients}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100">
                <DollarSign className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Spend / Client</p>
                <p className="text-2xl font-bold">{formatCentsAUD(stats.avgSpendCents)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="space-y-3 pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Added</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="total_spend">Total Spend</SelectItem>
                <SelectItem value="visit_count">Visit Count</SelectItem>
                <SelectItem value="last_visit">Last Visit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'vip', 'new', 'inactive'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'vip' ? 'VIP' : f === 'new' ? 'New' : 'Inactive'}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-2 size-6 animate-spin" />
            Loading clients...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-20 text-center text-destructive">{error}</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-16 text-center">
            <UserCheck className="mx-auto size-10 text-muted-foreground/40" />
            <p className="text-lg font-semibold">No clients found</p>
            <p className="text-sm text-muted-foreground">
              {search ? 'Try adjusting your search.' : 'Add your first client to get started.'}
            </p>
            {!search && (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 size-4" />
                Add Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Visits</TableHead>
                <TableHead>Total Spend</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <p className="font-medium">{client.full_name}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.email ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.phone ?? '—'}
                  </TableCell>
                  <TableCell className="text-center font-medium">{client.visit_count}</TableCell>
                  <TableCell className="font-medium">
                    {formatCentsAUD(client.total_spend_cents)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatLastVisit(client.last_visited_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.computed_tags.map((tag) => (
                        <TagPill key={tag} tag={tag} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/clients/${client.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(client)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete client?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteTarget?.full_name}</strong>. Their
              booking history will be kept but unlinked from this client record. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add client sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Client</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4 px-1">
            <div className="space-y-1.5">
              <Label>
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={addForm.full_name}
                onChange={(e) => setAddForm((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={addForm.phone}
                onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="0400 000 000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={addForm.notes}
                onChange={(e) => setAddForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Any notes about this client..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="is_vip"
                checked={addForm.is_vip}
                onCheckedChange={(v) => setAddForm((p) => ({ ...p, is_vip: v }))}
              />
              <Label htmlFor="is_vip" className="cursor-pointer">
                Mark as VIP
              </Label>
            </div>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleAdd} disabled={addLoading}>
                {addLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save
              </Button>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
