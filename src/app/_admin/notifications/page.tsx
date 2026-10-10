'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Send, Bell } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationSetting {
  id: number;
  notification_type: string;
  enabled: boolean;
  subject: string;
  body: string;
  send_offset_hours: number;
  updated_at: string;
}

interface SaveState {
  loading: boolean;
  saved: boolean;
  error: string | null;
}

interface PreviewState {
  loading: boolean;
  sent: boolean;
  error: string | null;
}

// ─── Metadata per notification type ──────────────────────────────────────────

const TYPE_META: Record<
  string,
  { label: string; description: string; audience: 'Customer' | 'Admin'; isReminder?: boolean }
> = {
  booking_confirmation: {
    label: 'Booking Confirmation',
    description: 'Sent to the customer immediately after their deposit payment is processed.',
    audience: 'Customer',
  },
  booking_reminder_24h: {
    label: '24-Hour Reminder',
    description: 'Sent to the customer 24 hours before their appointment.',
    audience: 'Customer',
    isReminder: true,
  },
  booking_reminder_1h: {
    label: '1-Hour Reminder',
    description: 'Sent to the customer 1 hour before their appointment.',
    audience: 'Customer',
    isReminder: true,
  },
  booking_cancellation: {
    label: 'Booking Cancellation',
    description: 'Sent to the customer when their booking is cancelled.',
    audience: 'Customer',
  },
  booking_reschedule: {
    label: 'Booking Rescheduled',
    description: 'Sent to the customer when their booking is rescheduled.',
    audience: 'Customer',
  },
  admin_new_booking: {
    label: 'New Booking Alert',
    description: 'Sent to the admin email when a new booking is confirmed.',
    audience: 'Admin',
  },
};

const TEMPLATE_VARS = [
  '{customer_name}',
  '{service_name}',
  '{date}',
  '{time}',
  '{deposit_amount}',
  '{remaining_balance}',
  '{refund_message}',
  '{manage_link}',
];

// ─── Hook: per-card save state ────────────────────────────────────────────────

function useSaveState() {
  const [state, setState] = useState<SaveState>({ loading: false, saved: false, error: null });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSaving = () => setState({ loading: true, saved: false, error: null });
  const setSaved = () => {
    setState({ loading: false, saved: true, error: null });
    timerRef.current = setTimeout(() => setState((s) => ({ ...s, saved: false })), 2500);
  };
  const setError = (error: string) => setState({ loading: false, saved: false, error });

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { state, setSaving, setSaved, setError };
}

function usePreviewState() {
  const [state, setState] = useState<PreviewState>({ loading: false, sent: false, error: null });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSending = () => setState({ loading: true, sent: false, error: null });
  const setSent = () => {
    setState({ loading: false, sent: true, error: null });
    timerRef.current = setTimeout(() => setState((s) => ({ ...s, sent: false })), 3000);
  };
  const setError = (error: string) => setState({ loading: false, sent: false, error });

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { state, setSending, setSent, setError };
}

// ─── NotificationCard ─────────────────────────────────────────────────────────

function NotificationCard({ setting }: { setting: NotificationSetting }) {
  const meta = TYPE_META[setting.notification_type] ?? {
    label: setting.notification_type,
    description: '',
    audience: 'Customer' as const,
  };

  const [enabled, setEnabled] = useState(setting.enabled);
  const [subject, setSubject] = useState(setting.subject ?? '');
  const [body, setBody] = useState(setting.body ?? '');
  const [offsetHours, setOffsetHours] = useState(setting.send_offset_hours ?? 0);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const { state: saveState, setSaving, setSaved, setError: setSaveError } = useSaveState();
  const { state: previewState, setSending, setSent, setError: setPreviewError } = usePreviewState();

  function insertVar(v: string) {
    const ta = bodyRef.current;
    if (!ta) {
      setBody((prev) => prev + v);
      return;
    }
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const next = body.slice(0, start) + v + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + v.length, start + v.length);
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving();
    try {
      const res = await fetch(`/api/admin/notifications/${setting.notification_type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          subject,
          body,
          send_offset_hours: offsetHours,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to save');
      setSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  async function handlePreview() {
    setSending();
    try {
      const res = await fetch(`/api/admin/notifications/${setting.notification_type}/preview`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to send preview');
      setSent();
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to send preview');
    }
  }

  return (
    <Card className={enabled ? '' : 'opacity-60'}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              aria-label={`Toggle ${meta.label}`}
            />
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">{meta.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{meta.description}</p>
            </div>
          </div>
          <Badge
            variant={meta.audience === 'Admin' ? 'secondary' : 'outline'}
            className="shrink-0 text-xs"
          >
            {meta.audience}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`subject-${setting.id}`} className="text-xs font-medium">
              Subject line
            </Label>
            <Input
              id={`subject-${setting.id}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject…"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`body-${setting.id}`} className="text-xs font-medium">
              Message body
            </Label>
            <Textarea
              id={`body-${setting.id}`}
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Email body…"
              className="text-sm resize-y"
            />
          </div>

          {meta.isReminder && (
            <div className="flex items-center gap-3">
              <Label htmlFor={`offset-${setting.id}`} className="text-xs font-medium shrink-0">
                Send
              </Label>
              <Input
                id={`offset-${setting.id}`}
                type="number"
                min={1}
                max={168}
                value={offsetHours}
                onChange={(e) => setOffsetHours(Number(e.target.value))}
                className="w-20 text-sm"
              />
              <span className="text-xs text-muted-foreground">hours before appointment</span>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Available variables</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVar(v)}
                  className="px-2 py-0.5 rounded-md text-xs font-mono bg-muted hover:bg-primary/10 hover:text-primary border border-border transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {saveState.error && (
            <p className="text-xs text-destructive">{saveState.error}</p>
          )}
          {previewState.error && (
            <p className="text-xs text-destructive">{previewState.error}</p>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={previewState.loading}
              className="gap-1.5"
            >
              {previewState.loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : previewState.sent ? (
                <Check className="size-3.5" />
              ) : (
                <Send className="size-3.5" />
              )}
              {previewState.sent ? 'Test sent!' : 'Send test email'}
            </Button>

            <Button type="submit" size="sm" disabled={saveState.loading} className="min-w-[80px]">
              {saveState.loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : saveState.saved ? (
                <>
                  <Check className="size-3.5 mr-1" />
                  Saved
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to load');
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto pt-8">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Bell className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Manage automated emails sent to customers and yourself. Toggle any notification off to
          stop sending it entirely. Click a variable chip to insert it into the message body at your
          cursor position.
        </p>
      </div>

      <div className="grid gap-4">
        {settings.map((s) => (
          <NotificationCard key={s.id} setting={s} />
        ))}
      </div>
    </div>
  );
}
