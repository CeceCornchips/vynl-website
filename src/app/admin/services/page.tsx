'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import type { Service } from '@/types/database';
import { formatCentsAUD } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Loader2,
  XCircle,
  Pencil,
  Check,
  X,
  PlusCircle,
  Wrench,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function dollarsToCents(value: string): number {
  return Math.round(parseFloat(value || '0') * 100);
}

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

const inputClass =
  'w-full rounded-lg border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50';

// ── Edit row ──────────────────────────────────────────────────────────────────

interface EditState {
  name: string;
  description: string;
  duration_minutes: string;
  price_cents: string;
  deposit_cents: string;
}

function EditRow({
  service,
  onSave,
  onCancel,
  saving,
}: {
  service: Service;
  onSave: (data: EditState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<EditState>({
    name: service.name,
    description: service.description ?? '',
    duration_minutes: String(service.duration_minutes),
    price_cents: centsToDollars(service.price_cents),
    deposit_cents: centsToDollars(service.deposit_cents),
  });

  const set = (k: keyof EditState, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <tr className="bg-blue-50/50 dark:bg-blue-950/10">
      <td className="px-4 py-3" colSpan={7}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Name *</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Service name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Duration (minutes) *</label>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={form.duration_minutes}
              onChange={(e) => set('duration_minutes', e.target.value)}
              placeholder="90"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Price (AUD) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.price_cents}
              onChange={(e) => set('price_cents', e.target.value)}
              placeholder="99.00"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Deposit (AUD) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.deposit_cents}
              onChange={(e) => set('deposit_cents', e.target.value)}
              placeholder="20.00"
            />
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input
              className={inputClass}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional description…"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => onSave(form)} disabled={saving}>
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            <Check className="size-3.5" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
            <X className="size-3.5" />
            Cancel
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ── New service row ────────────────────────────────────────────────────────────

function NewServiceRow({
  onSave,
  onCancel,
  saving,
}: {
  onSave: (data: EditState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<EditState>({
    name: '',
    description: '',
    duration_minutes: '',
    price_cents: '',
    deposit_cents: '',
  });

  const set = (k: keyof EditState, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <tr className="bg-green-50/50 dark:bg-green-950/10">
      <td className="px-4 py-3" colSpan={7}>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">New Service</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Name *</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Full Detail"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Duration (minutes) *</label>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={form.duration_minutes}
              onChange={(e) => set('duration_minutes', e.target.value)}
              placeholder="90"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Price (AUD) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.price_cents}
              onChange={(e) => set('price_cents', e.target.value)}
              placeholder="99.00"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Deposit (AUD) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.deposit_cents}
              onChange={(e) => set('deposit_cents', e.target.value)}
              placeholder="20.00"
            />
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input
              className={inputClass}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional description…"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => onSave(form)} disabled={saving}>
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            <PlusCircle className="size-3.5" />
            Create Service
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
            <X className="size-3.5" />
            Cancel
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to load services.');
      setServices(data.services);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const toggleActive = async (service: Service) => {
    setTogglingId(service.id);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: service.id, is_active: !service.is_active }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, is_active: !s.is_active } : s)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update.');
    } finally {
      setTogglingId(null);
    }
  };

  const saveEdit = async (id: string, form: EditState) => {
    if (!form.name.trim()) return alert('Name is required.');
    setSavingId(id);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          duration_minutes: parseInt(form.duration_minutes, 10),
          price_cents: dollarsToCents(form.price_cents),
          deposit_cents: dollarsToCents(form.deposit_cents),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setServices((prev) => prev.map((s) => (s.id === id ? data.service : s)));
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSavingId(null);
    }
  };

  const createService = async (form: EditState) => {
    if (!form.name.trim()) return alert('Name is required.');
    setCreatingNew(true);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          duration_minutes: parseInt(form.duration_minutes, 10) || 60,
          price_cents: dollarsToCents(form.price_cents),
          deposit_cents: dollarsToCents(form.deposit_cents),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setServices((prev) => [...prev, data.service]);
      setShowNew(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create service.');
    } finally {
      setCreatingNew(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your detailing services
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => { setShowNew(true); setEditingId(null); }}
            disabled={showNew}
          >
            <PlusCircle className="size-3.5" />
            New Service
          </Button>
          <Button variant="outline" size="sm" onClick={fetchServices} disabled={loading}>
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm">Loading services…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24">
            <XCircle className="size-8 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchServices}>Try again</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Duration</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deposit</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {showNew && (
                  <NewServiceRow
                    onSave={createService}
                    onCancel={() => setShowNew(false)}
                    saving={creatingNew}
                  />
                )}
                {services.length === 0 && !showNew && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <Wrench className="size-8 opacity-30" />
                        <p>No services yet. Create one to get started.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {services.map((service) => (
                  <Fragment key={service.id}>
                    <tr
                      className={`hover:bg-muted/20 transition-colors ${!service.is_active ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 max-w-[280px] truncate">
                            {service.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatDuration(service.duration_minutes)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        {formatCentsAUD(service.price_cents)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {formatCentsAUD(service.deposit_cents)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => toggleActive(service)}
                          disabled={togglingId === service.id}
                          className="inline-flex items-center gap-1.5 text-sm transition-colors"
                          title={service.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {togglingId === service.id ? (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          ) : service.is_active ? (
                            <ToggleRight className="size-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="size-5 text-muted-foreground" />
                          )}
                          <span className={service.is_active ? 'text-green-700 font-medium' : 'text-muted-foreground'}>
                            {service.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setEditingId(editingId === service.id ? null : service.id)}
                        >
                          <Pencil className="size-3" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                    {editingId === service.id && (
                      <EditRow
                        service={service}
                        onSave={(form) => saveEdit(service.id, form)}
                        onCancel={() => setEditingId(null)}
                        saving={savingId === service.id}
                      />
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
