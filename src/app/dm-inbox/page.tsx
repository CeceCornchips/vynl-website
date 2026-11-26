'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Hand,
  Loader2,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface ConversationRow {
  id: number;
  ig_username: string | null;
  display_name: string | null;
  status: 'open' | 'needs_owner';
  handoff_reason: string | null;
  bot_paused_until: string | null;
  last_client_message_at: string | null;
  last_message_at: string | null;
  last_text: string | null;
  last_sender: 'client' | 'assistant' | 'owner' | null;
  last_attachment_count: number;
  has_draft: boolean;
  draft_urgency: 'normal' | 'urgent' | null;
}

interface Setup {
  instagramConnected: boolean;
  instagramUsername: string | null;
  canConnectInstagram: boolean;
  dryRun: boolean;
  assistantKeySet: boolean;
  chatModel: string;
  photoModel: string;
  pauseHours: number;
}

interface Message {
  id: number;
  direction: 'inbound' | 'outbound';
  sender: 'client' | 'assistant' | 'owner';
  text: string | null;
  attachments: { type: string; url?: string }[];
  sent_at: string;
}

interface Draft {
  id: number;
  text: string;
  dm_type: string | null;
  needs_owner: boolean;
  urgency: 'normal' | 'urgent';
  owner_note: string | null;
  blocked_reason: string | null;
  model: string | null;
  created_at: string;
}

interface Detail {
  conversation: ConversationRow & { greeted: boolean };
  messages: Message[];
  draft: Draft | null;
  lastRun: { draft_id: number | null; error: string | null; created_at: string } | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TZ = 'Australia/Sydney';

function chatName(c: Pick<ConversationRow, 'display_name' | 'ig_username'>): string {
  return c.display_name || (c.ig_username ? `@${c.ig_username}` : 'Instagram user');
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: TZ });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  });
}

function isPaused(c: Pick<ConversationRow, 'bot_paused_until'>): boolean {
  return c.bot_paused_until != null && new Date(c.bot_paused_until).getTime() > Date.now();
}

const DM_TYPE_LABELS: Record<string, string> = {
  price_photo: 'Price from photo',
  price: 'Price',
  availability: 'Availability',
  question: 'Question',
  booking_change: 'Booking change',
  location: 'Location',
  special_request: 'Special request',
  problem: 'Problem',
  spam: 'Spam',
  other: 'Other',
};

async function postAction(id: number, body: Record<string, unknown>) {
  const res = await fetch(`/api/dm/conversations/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; dryRun?: boolean };
  if (!res.ok || !json.ok) throw new Error(json.error ?? `Request failed (${res.status}).`);
  return json;
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function StatusBadges({ c }: { c: ConversationRow }) {
  return (
    <div className="flex flex-wrap gap-1">
      {c.status === 'needs_owner' && (
        <Badge
          variant="outline"
          className={cn(
            'border-amber-300 bg-amber-50 text-amber-800',
            c.draft_urgency === 'urgent' && 'border-red-300 bg-red-50 text-red-700',
          )}
        >
          {c.draft_urgency === 'urgent' ? 'Urgent' : 'Needs you'}
        </Badge>
      )}
      {c.has_draft && c.status !== 'needs_owner' && (
        <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
          Draft ready
        </Badge>
      )}
      {isPaused(c) && <Badge variant="secondary">Paused</Badge>}
    </div>
  );
}

/** Instagram's limit is in bytes, so emoji and accents count as several. */
const MAX_REPLY_BYTES = 1000;
const byteLength = (s: string) => new TextEncoder().encode(s).length;

const INSTAGRAM_NOTICES: Record<string, string> = {
  connected: 'Instagram is connected. New DMs will appear here.',
  cancelled: 'Instagram connection was cancelled.',
  expired: 'That Instagram login took too long. Tap Connect Instagram to try again.',
  failed: "Instagram couldn't be connected. Tap Connect Instagram to try again.",
  'wrong-account': 'That login shared a different Instagram account. Try again and choose the studio account.',
  'not-configured': "The Instagram app details aren't set up on the site yet.",
};

interface ConnectionStatus {
  ok: boolean;
  connected: boolean;
  checks?: Record<string, { ok: boolean; detail: string }>;
  webhookActivity?: {
    lastDeliveryAt: string | null;
    lastDmAt: string | null;
    lastRejectedAt: string | null;
  };
  lastSync?: { at: string; ok: boolean; conversations: number; newMessages: number; error?: string } | null;
}

const CHECK_LABELS: Record<string, string> = {
  appWebhook: 'Meta app sends DMs to this site',
  account: 'Instagram account readable',
  webhooks: 'Account subscribed to DMs',
  conversations: 'Chats readable',
};

/** Runs /api/dm/instagram/status and lists what's working. */
function ConnectionCheck() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ConnectionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCheck() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/dm/instagram/status', { cache: 'no-store' });
      if (!res.ok) throw new Error(`The check didn't run (${res.status}).`);
      setResult((await res.json()) as ConnectionStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The check didn't run.");
    } finally {
      setBusy(false);
    }
  }

  const when = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('en-AU') : 'never');
  const activity = result?.webhookActivity;
  return (
    <div className="space-y-1">
      <button type="button" onClick={() => void runCheck()} disabled={busy} className="underline disabled:opacity-60">
        {busy ? 'Checking…' : 'Check connection'}
      </button>
      {error && <p className="text-red-700">{error}</p>}
      {result && (
        <ul className="space-y-0.5 text-xs">
          {Object.entries(result.checks ?? {}).map(([key, c]) => (
            <li key={key}>
              {c.ok ? '✓' : '✗'} {CHECK_LABELS[key] ?? key}: <span className="opacity-80">{c.detail}</span>
            </li>
          ))}
          {activity && (
            <li>
              Last DM received: {when(activity.lastDmAt)} · last message from Meta: {when(activity.lastDeliveryAt)}
              {activity.lastRejectedAt && ` · last rejected (app secret mismatch?): ${when(activity.lastRejectedAt)}`}
            </li>
          )}
          {result.lastSync && (
            <li>
              {result.lastSync.ok ? '✓' : '✗'} Last chat sync: {when(result.lastSync.at)} ·{' '}
              {result.lastSync.ok
                ? `${result.lastSync.conversations} chats checked, ${result.lastSync.newMessages} new messages`
                : result.lastSync.error}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function SetupBanner({ setup, instagramNotice }: { setup: Setup | null; instagramNotice: string | null }) {
  if (!setup) return null;
  const notes: string[] = [];
  if (instagramNotice && INSTAGRAM_NOTICES[instagramNotice]) notes.push(INSTAGRAM_NOTICES[instagramNotice]);
  if (setup.dryRun) {
    notes.push("Test mode: Instagram isn't connected, so Send saves the message here but doesn't deliver it.");
  } else if (!setup.instagramConnected && !setup.canConnectInstagram) {
    notes.push("Instagram isn't connected yet. DMs appear here once the Meta app is set up.");
  }
  if (!setup.assistantKeySet) {
    notes.push('No Claude API key is set, so the assistant may not be able to draft replies.');
  }
  const showConnect = setup.canConnectInstagram && !setup.instagramUsername;
  if (notes.length === 0 && !showConnect && !setup.instagramUsername) return null;
  return (
    <div className="mb-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {notes.map((n) => (
        <p key={n}>{n}</p>
      ))}
      {setup.instagramUsername && (
        <p>
          Connected to Instagram as <strong>@{setup.instagramUsername}</strong>.{' '}
          <a href="/api/dm/instagram/connect" className="underline">
            Reconnect
          </a>
        </p>
      )}
      {setup.instagramUsername && <ConnectionCheck />}
      {showConnect && (
        <a
          href="/api/dm/instagram/connect"
          className="inline-flex items-center rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
        >
          Connect Instagram
        </a>
      )}
    </div>
  );
}

function MessageBubble({ m }: { m: Message }) {
  const mine = m.direction === 'outbound';
  const images = m.attachments.filter((a) => a.type === 'image' && a.url);
  const others = m.attachments.filter((a) => !(a.type === 'image' && a.url));
  return (
    <div className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words',
          mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        )}
      >
        {images.map((a) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={a.url}
            src={a.url}
            alt="Photo from the chat"
            className="mb-1.5 max-h-64 rounded-lg object-cover"
          />
        ))}
        {m.text}
        {others.map((a, i) => (
          <span key={i} className="block text-xs opacity-75">
            [{a.type}]
          </span>
        ))}
        {!m.text && images.length === 0 && others.length === 0 && (
          <span className="opacity-75">[no text]</span>
        )}
      </div>
      <span className="px-1 text-[11px] text-muted-foreground">
        {m.sender === 'assistant' ? 'Assistant draft, sent by you · ' : m.sender === 'owner' ? 'You · ' : ''}
        {formatTime(m.sent_at)}
      </span>
    </div>
  );
}

// ── Chat view ────────────────────────────────────────────────────────────────

function ChatView({
  id,
  setup,
  onBack,
  onChanged,
}: {
  id: number;
  setup: Setup | null;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const loadedDraftId = useRef<number | null | undefined>(undefined);
  const dirty = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/dm/conversations/${id}`, { cache: 'no-store' });
      const json = (await res.json()) as { ok: boolean; error?: string } & Partial<Detail>;
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not load this chat.');
      const next = json as Detail;
      setDetail(next);
      setLoadError(null);
      // A new draft fills the text box, unless you've started typing.
      const draftId = next.draft?.id ?? null;
      if (loadedDraftId.current !== draftId) {
        if (!dirty.current) setText(next.draft?.text ?? '');
        loadedDraftId.current = draftId;
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load this chat.');
    }
  }, [id]);

  useEffect(() => {
    loadedDraftId.current = undefined;
    dirty.current = false;
    setDetail(null);
    setText('');
    setActionError(null);
    setNotice(null);
    void load();
    const timer = setInterval(() => void load(), 10_000);
    return () => clearInterval(timer);
  }, [id, load]);

  useEffect(() => {
    const count = detail?.messages.length ?? 0;
    if (count !== lastCount.current) {
      lastCount.current = count;
      bottomRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [detail?.messages.length]);

  async function run(label: string, body: Record<string, unknown>, done?: (r: { dryRun?: boolean }) => void) {
    setBusy(label);
    setActionError(null);
    setNotice(null);
    try {
      const result = await postAction(id, body);
      done?.(result);
      dirty.current = false;
      loadedDraftId.current = undefined;
      await load();
      onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        {loadError ?? <Loader2 className="size-5 animate-spin" />}
      </div>
    );
  }

  const { conversation: c, messages, draft, lastRun } = detail;
  const paused = isPaused(c);
  const failed = lastRun?.error && (!draft || new Date(lastRun.created_at) > new Date(draft.created_at));
  const edited = draft != null && text.trim() !== draft.text.trim();

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onBack} aria-label="Back to chats">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{chatName(c)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {paused
              ? `Assistant paused until ${formatTime(c.bot_paused_until!)}`
              : c.status === 'needs_owner'
                ? `Waiting for you${c.handoff_reason ? `: ${c.handoff_reason}` : ''}`
                : 'Assistant drafting replies'}
          </p>
        </div>
        {paused || c.status === 'needs_owner' ? (
          <Button
            variant="outline"
            size="sm"
            disabled={busy != null}
            onClick={() => run('hand_back', { action: 'hand_back' })}
          >
            {busy === 'hand_back' ? <Loader2 className="animate-spin" /> : <PlayCircle />}
            Hand back to assistant
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={busy != null}
            onClick={() => run('take_over', { action: 'take_over' })}
          >
            {busy === 'take_over' ? <Loader2 className="animate-spin" /> : <PauseCircle />}
            Take over
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="space-y-2 border-t bg-background px-4 py-3">
        {draft && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Badge variant="outline">{DM_TYPE_LABELS[draft.dm_type ?? 'other'] ?? draft.dm_type}</Badge>
            {draft.needs_owner && (
              <Badge
                variant="outline"
                className={cn(
                  'border-amber-300 bg-amber-50 text-amber-800',
                  draft.urgency === 'urgent' && 'border-red-300 bg-red-50 text-red-700',
                )}
              >
                <Hand /> {draft.urgency === 'urgent' ? 'Urgent: needs you' : 'Needs you'}
              </Badge>
            )}
            <span className="text-muted-foreground">Assistant draft · {timeAgo(draft.created_at)} ago</span>
          </div>
        )}
        {draft?.owner_note && <p className="text-sm text-muted-foreground">{draft.owner_note}</p>}
        {draft?.blocked_reason && !edited && (
          <p className="flex items-start gap-1.5 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            Can&apos;t send as written. {draft.blocked_reason} Edit it first.
          </p>
        )}
        {draft && !draft.text && (
          <p className="text-sm text-muted-foreground">
            The assistant suggests not replying. Discard it, or write your own reply.
          </p>
        )}
        {failed && (
          <p className="flex items-start gap-1.5 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            The last draft attempt failed: {lastRun!.error}
          </p>
        )}

        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            dirty.current = true;
          }}
          placeholder={draft ? 'Edit the draft…' : 'Write your own reply…'}
          rows={3}
          maxLength={1000}
          className="max-h-60"
        />

        {actionError && <p className="text-sm text-red-700">{actionError}</p>}
        {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={busy != null || !text.trim() || byteLength(text) > MAX_REPLY_BYTES}
            onClick={() =>
              run('send', { action: 'send', text, ...(draft ? { draftId: draft.id } : {}) }, (r) => {
                if (r.dryRun) setNotice("Saved in test mode: it wasn't delivered to Instagram.");
              })
            }
          >
            {busy === 'send' ? <Loader2 className="animate-spin" /> : <Send />}
            {draft ? (edited ? 'Send edited reply' : 'Approve and send') : 'Send'}
          </Button>
          {draft && (
            <Button
              variant="outline"
              disabled={busy != null}
              onClick={() => run('discard', { action: 'discard', draftId: draft.id })}
            >
              {busy === 'discard' ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Discard
            </Button>
          )}
          <Button
            variant="ghost"
            disabled={busy != null}
            onClick={() => run('redraft', { action: 'redraft' })}
          >
            {busy === 'redraft' ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            {draft ? 'Redraft' : 'Draft a reply'}
          </Button>
          <Button
            variant="ghost"
            disabled={!text.trim()}
            onClick={() =>
              void navigator.clipboard
                .writeText(text)
                .then(() => setNotice('Copied. Paste it into the chat in the Instagram app to send it yourself.'))
                .catch(() => setNotice("Couldn't copy. Select the text and copy it instead."))
            }
          >
            <Copy />
            Copy
          </Button>
          <span
            className={cn(
              'ml-auto text-xs tabular-nums',
              byteLength(text) > MAX_REPLY_BYTES ? 'text-red-700' : 'text-muted-foreground',
            )}
          >
            {byteLength(text)}/{MAX_REPLY_BYTES}
          </span>
        </div>
        {!draft && (
          <p className="text-xs text-muted-foreground">
            Sending your own message pauses the assistant in this chat for {setup?.pauseHours ?? 12} hours.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Sign-in ──────────────────────────────────────────────────────────────────

function LoginForm({
  onSignedIn,
  expired,
  instagramNotice,
}: {
  onSignedIn: () => void;
  expired: boolean;
  instagramNotice: string | null;
}) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [options, setOptions] = useState<{
    passwordEnabled: boolean;
    instagramLogin: boolean;
    emailTo: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/dm/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j: { passwordEnabled?: boolean; instagramLogin?: boolean; emailTo?: string }) =>
        setOptions({
          passwordEnabled: Boolean(j.passwordEnabled),
          instagramLogin: Boolean(j.instagramLogin),
          emailTo: j.emailTo ?? 'the studio inbox',
        }),
      )
      .catch(() => setOptions({ passwordEnabled: false, instagramLogin: false, emailTo: 'the studio inbox' }));
  }, []);

  async function emailLink() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/dm/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'email' }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; sentTo?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not send the link.');
      setSentTo(json.sentTo ?? options?.emailTo ?? 'your email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the link.');
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/dm/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not sign in.');
      setPassword('');
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3 rounded-xl border bg-background p-6">
      <h2 className="text-lg font-semibold">Sign in to the DM inbox</h2>
      {expired && <p className="text-sm text-red-700">That sign-in link has expired. Send a new one.</p>}
      {instagramNotice && instagramNotice !== 'connected' && INSTAGRAM_NOTICES[instagramNotice] && (
        <p className="text-sm text-red-700">{INSTAGRAM_NOTICES[instagramNotice]}</p>
      )}
      {options?.instagramLogin && (
        <>
          <a
            href="/api/dm/instagram/connect"
            className="inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
          >
            Continue with Instagram
          </a>
          <p className="text-xs text-muted-foreground">
            Log in with Facebook and choose the studio&apos;s Instagram account. This also connects it.
          </p>
          <p className="pt-1 text-center text-xs text-muted-foreground">or</p>
        </>
      )}
      {sentTo ? (
        <p className="text-sm">
          Sent! Open the email to <strong>{sentTo}</strong> on this device and tap the link.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            We&apos;ll email a sign-in link to {options?.emailTo ?? 'the studio inbox'}.
          </p>
          <Button
            type="button"
            variant={options?.instagramLogin ? 'outline' : 'default'}
            onClick={() => void emailLink()}
            disabled={busy}
            className="w-full"
          >
            {busy ? <Loader2 className="animate-spin" /> : null}
            Email me a sign-in link
          </Button>
        </>
      )}
      {options?.passwordEnabled && (
        <details className="pt-2 text-sm">
          <summary className="cursor-pointer text-muted-foreground">Use a password instead</summary>
          <div className="mt-2 space-y-2">
      <input
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-lg border px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <Button type="submit" variant="outline" disabled={busy || !password} className="w-full">
        Sign in with password
      </Button>
          </div>
        </details>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function Inbox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = Number.parseInt(searchParams.get('c') ?? '', 10);
  const selectedId = Number.isFinite(selected) ? selected : null;

  const [rows, setRows] = useState<ConversationRow[] | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'waiting'>('all');
  const [needsLogin, setNeedsLogin] = useState(false);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/dm/conversations', { cache: 'no-store' });
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      setNeedsLogin(false);
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        conversations?: ConversationRow[];
        setup?: Setup;
      };
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not load chats.');
      setRows(json.conversations ?? []);
      setSetup(json.setup ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load chats.');
    }
  }, []);

  useEffect(() => {
    void loadList();
    const timer = setInterval(() => void loadList(), 15_000);
    return () => clearInterval(timer);
  }, [loadList]);

  const select = (id: number | null) => {
    router.replace(id ? `${pathname}?c=${id}` : pathname, { scroll: false });
  };

  const visible = (rows ?? []).filter(
    (r) => filter === 'all' || r.has_draft || r.status === 'needs_owner',
  );
  const waitingCount = (rows ?? []).filter((r) => r.has_draft || r.status === 'needs_owner').length;

  async function signOut() {
    await fetch('/api/dm/session', { method: 'DELETE' }).catch(() => null);
    setRows(null);
    setNeedsLogin(true);
  }

  if (needsLogin) {
    return (
      <LoginForm
        onSignedIn={() => void loadList()}
        expired={searchParams.get('signin') === 'expired'}
        instagramNotice={searchParams.get('instagram')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">DM inbox</h1>
          <p className="text-sm text-muted-foreground">
            The assistant drafts a reply to each Instagram DM. Nothing is sent until you approve it.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>

      <SetupBanner setup={setup} instagramNotice={searchParams.get('instagram')} />
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex h-[calc(100vh-13rem)] min-h-[480px] overflow-hidden rounded-xl border bg-background">
        {/* Chat list */}
        <div
          className={cn(
            'flex w-full flex-col border-r lg:w-80 lg:shrink-0',
            selectedId != null && 'hidden lg:flex',
          )}
        >
          <div className="flex gap-1 border-b p-2">
            {(['all', 'waiting'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'secondary' : 'ghost'}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : `Waiting on you${waitingCount ? ` (${waitingCount})` : ''}`}
              </Button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {rows == null && (
              <div className="flex justify-center p-6">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {rows != null && visible.length === 0 && (
              <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
                <MessageCircle className="size-6" />
                {filter === 'waiting' ? 'Nothing is waiting on you.' : 'No DMs yet.'}
              </div>
            )}
            {visible.map((r) => (
              <button
                key={r.id}
                onClick={() => select(r.id)}
                className={cn(
                  'flex w-full flex-col gap-1 border-b px-3 py-2.5 text-left transition-colors hover:bg-muted/60',
                  selectedId === r.id && 'bg-muted',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{chatName(r)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(r.last_message_at)}</span>
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {r.last_sender && r.last_sender !== 'client' ? 'You: ' : ''}
                  {r.last_text ?? (r.last_attachment_count > 0 ? 'Sent a photo' : '')}
                </span>
                <StatusBadges c={r} />
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className={cn('min-w-0 flex-1', selectedId == null && 'hidden lg:block')}>
          {selectedId != null ? (
            <ChatView id={selectedId} setup={setup} onBack={() => select(null)} onChanged={loadList} />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
              Pick a chat to see the assistant&apos;s draft.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DmInboxPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-28 pb-16 sm:px-6">
      <Suspense fallback={null}>
        <Inbox />
      </Suspense>
    </section>
  );
}
