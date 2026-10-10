'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Car,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  type Client,
  type ClientVehicle,
  type ClientTag,
  type Booking,
  computeClientTags,
  formatCentsAUD,
  BOOKING_STATUS_COLOURS,
  BOOKING_STATUS_LABELS,
  type BookingStatus,
} from '@/types/database';

type ClientWithTags = Client & { computed_tags: ClientTag[] };

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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function paymentStatusBadge(status?: string) {
  if (status === 'deposit_paid')
    return <Badge className="bg-blue-100 text-blue-800">Deposit Paid</Badge>;
  if (status === 'paid_in_full')
    return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
  if (status === 'failed') return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
  if (status === 'cancelled')
    return <Badge className="bg-muted text-muted-foreground">Cancelled</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
}

type VehicleFormState = {
  make: string;
  model: string;
  year: string;
  colour: string;
  rego: string;
  notes: string;
  is_primary: boolean;
};

const EMPTY_VEHICLE: VehicleFormState = {
  make: '',
  model: '',
  year: '',
  colour: '',
  rego: '',
  notes: '',
  is_primary: false,
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientWithTags | null>(null);
  const [vehicles, setVehicles] = useState<ClientVehicle[]>([]);
  const [bookings, setBookings] = useState<Partial<Booking>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile editing
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    notes: '',
    is_vip: false,
    marketing_opt_in: true,
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // Vehicle state
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState>(EMPTY_VEHICLE);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<ClientVehicle | null>(null);
  const [editVehicleForm, setEditVehicleForm] = useState<VehicleFormState>(EMPTY_VEHICLE);
  const [deleteVehicleTarget, setDeleteVehicleTarget] = useState<ClientVehicle | null>(null);
  const [vehicleDeleteLoading, setVehicleDeleteLoading] = useState(false);

  const fetchClient = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to load client');
      const c = data.client as Client;
      setClient({ ...c, computed_tags: computeClientTags(c) });
      setProfileForm({
        full_name: c.full_name,
        email: c.email ?? '',
        phone: c.phone ?? '',
        notes: c.notes ?? '',
        is_vip: c.is_vip,
        marketing_opt_in: c.marketing_opt_in,
      });
      setVehicles(data.vehicles as ClientVehicle[]);
      setBookings(data.bookings as Partial<Booking>[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load client');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profileForm.full_name.trim(),
          email: profileForm.email.trim() || null,
          phone: profileForm.phone.trim() || null,
          notes: profileForm.notes.trim() || null,
          is_vip: profileForm.is_vip,
          marketing_opt_in: profileForm.marketing_opt_in,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Save failed');
      const c = data.client as Client;
      setClient({ ...c, computed_tags: computeClientTags(c) });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVehicle = async () => {
    setVehicleLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vehicleForm,
          year: vehicleForm.year ? parseInt(vehicleForm.year, 10) : null,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to add vehicle');
      setVehicles((prev) => {
        const updated = data.vehicle.is_primary
          ? prev.map((v) => ({ ...v, is_primary: false }))
          : prev;
        return [...updated, data.vehicle as ClientVehicle].sort((a, b) =>
          a.is_primary ? -1 : b.is_primary ? 1 : 0,
        );
      });
      setVehicleForm(EMPTY_VEHICLE);
      setAddingVehicle(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to add vehicle');
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleEditVehicle = async () => {
    if (!editingVehicle) return;
    setVehicleLoading(true);
    try {
      const res = await fetch(
        `/api/admin/clients/${clientId}/vehicles/${editingVehicle.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editVehicleForm,
            year: editVehicleForm.year ? parseInt(editVehicleForm.year, 10) : null,
          }),
        },
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to update vehicle');
      setVehicles((prev) => {
        const updated = data.vehicle.is_primary
          ? prev.map((v) => ({ ...v, is_primary: false }))
          : prev;
        return updated
          .map((v) => (v.id === editingVehicle.id ? (data.vehicle as ClientVehicle) : v))
          .sort((a, b) => (a.is_primary ? -1 : b.is_primary ? 1 : 0));
      });
      setEditingVehicle(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update vehicle');
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!deleteVehicleTarget) return;
    setVehicleDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/admin/clients/${clientId}/vehicles/${deleteVehicleTarget.id}`,
        { method: 'DELETE' },
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Delete failed');
      setVehicles((prev) => prev.filter((v) => v.id !== deleteVehicleTarget.id));
      setDeleteVehicleTarget(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setVehicleDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <p className="text-destructive">{error ?? 'Client not found.'}</p>
      </div>
    );
  }

  const avgSpend =
    client.visit_count > 0
      ? Math.round(client.total_spend_cents / client.visit_count)
      : 0;

  const firstBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null;

  return (
    <div className="space-y-6 pb-16">
      {/* Back nav */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/admin/clients" className="hover:text-foreground transition-colors">
          Clients
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{client.full_name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left column — Profile */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Client Profile</CardTitle>
                <div className="flex items-center gap-2">
                  {client.computed_tags.map((tag) => (
                    <TagPill key={tag} tag={tag} />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  value={profileForm.full_name}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, full_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={profileForm.notes}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  onBlur={saveProfile}
                  rows={3}
                  placeholder="Free-text notes about this client..."
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Star
                    className={`size-4 ${profileForm.is_vip ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                  />
                  <Label htmlFor="vip_toggle" className="cursor-pointer font-normal">
                    VIP Client
                  </Label>
                </div>
                <Switch
                  id="vip_toggle"
                  checked={profileForm.is_vip}
                  onCheckedChange={(v) => setProfileForm((p) => ({ ...p, is_vip: v }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="marketing_toggle" className="cursor-pointer font-normal">
                  Marketing Opt-In
                </Label>
                <Switch
                  id="marketing_toggle"
                  checked={profileForm.marketing_opt_in}
                  onCheckedChange={(v) =>
                    setProfileForm((p) => ({ ...p, marketing_opt_in: v }))
                  }
                />
              </div>
              <Button className="w-full" onClick={saveProfile} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {savedMsg ? 'Saved!' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Spend</p>
                <p className="text-xl font-bold">{formatCentsAUD(client.total_spend_cents)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Visits</p>
                <p className="text-xl font-bold">{client.visit_count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">First Visit</p>
                <p className="text-xl font-bold">
                  {firstBooking?.booking_date
                    ? formatDate(String(firstBooking.booking_date))
                    : '—'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Avg / Visit</p>
                <p className="text-xl font-bold">{formatCentsAUD(avgSpend)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Vehicles */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="size-4" />
                  Vehicles
                </CardTitle>
                {!addingVehicle && (
                  <Button size="sm" variant="outline" onClick={() => setAddingVehicle(true)}>
                    <Plus className="mr-1 size-3.5" />
                    Add Vehicle
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {vehicles.length === 0 && !addingVehicle && (
                <p className="text-sm text-muted-foreground">No vehicles saved yet.</p>
              )}

              {vehicles.map((v) =>
                editingVehicle?.id === v.id ? (
                  <VehicleForm
                    key={v.id}
                    form={editVehicleForm}
                    onChange={setEditVehicleForm}
                    onSave={handleEditVehicle}
                    onCancel={() => setEditingVehicle(null)}
                    loading={vehicleLoading}
                    saveLabel="Save Changes"
                  />
                ) : (
                  <div
                    key={v.id}
                    className="flex items-start justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {[v.year, v.make, v.model].filter(Boolean).join(' ') || 'Unknown vehicle'}
                        </p>
                        {v.is_primary && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-800">
                            <Star className="size-2.5 fill-current" />
                            Primary
                          </span>
                        )}
                      </div>
                      {v.colour && (
                        <p className="text-xs text-muted-foreground">Colour: {v.colour}</p>
                      )}
                      {v.rego && (
                        <p className="text-xs font-mono text-muted-foreground">
                          Rego: {v.rego}
                        </p>
                      )}
                      {v.notes && (
                        <p className="text-xs text-muted-foreground">{v.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => {
                          setEditingVehicle(v);
                          setEditVehicleForm({
                            make: v.make ?? '',
                            model: v.model ?? '',
                            year: v.year ? String(v.year) : '',
                            colour: v.colour ?? '',
                            rego: v.rego ?? '',
                            notes: v.notes ?? '',
                            is_primary: v.is_primary,
                          });
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteVehicleTarget(v)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ),
              )}

              {addingVehicle && (
                <VehicleForm
                  form={vehicleForm}
                  onChange={setVehicleForm}
                  onSave={handleAddVehicle}
                  onCancel={() => {
                    setAddingVehicle(false);
                    setVehicleForm(EMPTY_VEHICLE);
                  }}
                  loading={vehicleLoading}
                  saveLabel="Add Vehicle"
                />
              )}
            </CardContent>
          </Card>

          {/* Booking History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Booking History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {bookings.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No bookings yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow
                        key={b.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/admin/bookings?search=${encodeURIComponent(b.id ?? '')}`)}
                      >
                        <TableCell className="text-sm">
                          {formatDate(b.booking_date ? String(b.booking_date) : null)}
                          {b.booking_time && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              {formatTime(String(b.booking_time))}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{b.service_name ?? '—'}</TableCell>
                        <TableCell className="text-sm">
                          {formatCentsAUD(b.deposit_amount_cents ?? 0)}
                        </TableCell>
                        <TableCell>
                          {b.status && (
                            <Badge className={BOOKING_STATUS_COLOURS[b.status as BookingStatus]}>
                              {BOOKING_STATUS_LABELS[b.status as BookingStatus]}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{paymentStatusBadge(b.payment_status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete vehicle dialog */}
      <Dialog open={!!deleteVehicleTarget} onOpenChange={(o) => !o && setDeleteVehicleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete vehicle?</DialogTitle>
            <DialogDescription>
              This will permanently remove the{' '}
              {[deleteVehicleTarget?.year, deleteVehicleTarget?.make, deleteVehicleTarget?.model]
                .filter(Boolean)
                .join(' ') || 'vehicle'}{' '}
              from this client&apos;s profile.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVehicleTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVehicle}
              disabled={vehicleDeleteLoading}
            >
              {vehicleDeleteLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VehicleForm({
  form,
  onChange,
  onSave,
  onCancel,
  loading,
  saveLabel,
}: {
  form: VehicleFormState;
  onChange: (f: VehicleFormState) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  saveLabel: string;
}) {
  const patch = (key: keyof VehicleFormState, value: string | boolean) =>
    onChange({ ...form, [key]: value });

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Make</Label>
          <Input
            value={form.make}
            onChange={(e) => patch('make', e.target.value)}
            placeholder="Toyota"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Model</Label>
          <Input
            value={form.model}
            onChange={(e) => patch('model', e.target.value)}
            placeholder="Camry"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Year</Label>
          <Input
            type="number"
            value={form.year}
            onChange={(e) => patch('year', e.target.value)}
            placeholder="2022"
            className="h-8 text-sm"
            min={1900}
            max={new Date().getFullYear() + 1}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Colour</Label>
          <Input
            value={form.colour}
            onChange={(e) => patch('colour', e.target.value)}
            placeholder="White"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Rego</Label>
          <Input
            value={form.rego}
            onChange={(e) => patch('rego', e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="h-8 text-sm font-mono"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Notes</Label>
        <Input
          value={form.notes}
          onChange={(e) => patch('notes', e.target.value)}
          placeholder="Any notes about this vehicle..."
          className="h-8 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="vehicle_primary"
          checked={form.is_primary}
          onCheckedChange={(v) => patch('is_primary', v)}
        />
        <Label htmlFor="vehicle_primary" className="cursor-pointer text-sm font-normal">
          Set as primary vehicle
        </Label>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={loading}>
          {loading ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <Save className="mr-1 size-3.5" />}
          {saveLabel}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="mr-1 size-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
