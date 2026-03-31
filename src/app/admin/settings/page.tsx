'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Building2, MapPin, ImageIcon, Share2, Clock, Globe,
  CalendarDays, CreditCard, XCircle, AlertTriangle,
  Loader2, Check, Download, Trash2, Plus, X, ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BusinessProfile, BusinessHour } from '@/lib/business-profile';
import {
  DAY_LABELS, DAY_ORDER, type DayKey, parseWorkingHours, type WorkingHours,
} from '@/lib/booking-settings';

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsMap = Record<string, string | null>;

interface SaveState { loading: boolean; saved: boolean; error: string | null }

type SectionId =
  | 'business' | 'location' | 'branding' | 'social' | 'hours'
  | 'regional' | 'booking' | 'payments' | 'cancellation' | 'danger';

interface SectionDef {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  danger?: boolean;
}

const SECTIONS: SectionDef[] = [
  { id: 'business',     label: 'Business Info',   icon: Building2 },
  { id: 'location',     label: 'Location',        icon: MapPin },
  { id: 'branding',     label: 'Branding',        icon: ImageIcon },
  { id: 'social',       label: 'Social & Links',  icon: Share2 },
  { id: 'hours',        label: 'Business Hours',  icon: Clock },
  { id: 'regional',     label: 'Regional',        icon: Globe },
  { id: 'booking',      label: 'Booking',         icon: CalendarDays },
  { id: 'payments',     label: 'Payments',        icon: CreditCard },
  { id: 'cancellation', label: 'Cancellation',    icon: XCircle },
  { id: 'danger',       label: 'Danger Zone',     icon: AlertTriangle, danger: true },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useSaveState() {
  const [state, setState] = useState<SaveState>({ loading: false, saved: false, error: null });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setSaving = () => setState({ loading: true, saved: false, error: null });
  const setSaved = () => {
    setState({ loading: false, saved: true, error: null });
    timer.current = setTimeout(() => setState((s) => ({ ...s, saved: false })), 2500);
  };
  const setError = (error: string) => setState({ loading: false, saved: false, error });
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { state, setSaving, setSaved, setError };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function patchProfile(fields: Partial<BusinessProfile>) {
  const res = await fetch('/api/admin/business-profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? 'Failed to save');
}

async function saveSetting(key: string, value: string | null) {
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? 'Failed to save');
}

async function saveMany(pairs: Array<[string, string | null]>) {
  for (const [key, val] of pairs) await saveSetting(key, val);
}

function SaveBtn({ state }: { state: SaveState }) {
  return (
    <Button type="submit" disabled={state.loading} className="min-w-[90px]">
      {state.loading ? <Loader2 className="size-4 animate-spin" />
        : state.saved ? <><Check className="size-4 mr-1.5" />Saved</>
        : 'Save'}
    </Button>
  );
}

function parseBlackoutDates(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter((x): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x));
  } catch { return []; }
}

function minutesFromHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function timeOptions(startH = 5, endH = 23): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (let mins = startH * 60; mins <= endH * 60; mins += 30) {
    const h24 = Math.floor(mins / 60);
    const m = mins % 60;
    const value = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const h12 = h24 % 12 || 12;
    const ap = h24 >= 12 ? 'pm' : 'am';
    out.push({ value, label: `${h12}:${String(m).padStart(2, '0')} ${ap}` });
  }
  return out;
}

const SLOT_TIME_OPTIONS = timeOptions(6, 20);
const HOURS_TIME_OPTIONS = timeOptions(5, 23);
const AU_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>('business');
  const [dirty, setDirty] = useState<Partial<Record<SectionId, boolean>>>({});

  const [settings, setSettings] = useState<SettingsMap>({});
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);

  const markDirty = useCallback((id: SectionId) => setDirty((p) => ({ ...p, [id]: true })), []);
  const markClean = useCallback((id: SectionId) => setDirty((p) => ({ ...p, [id]: false })), []);

  const loadAll = useCallback(async () => {
    try {
      const [sRes, bRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/business-profile'),
      ]);
      const [sData, bData] = await Promise.all([sRes.json(), bRes.json()]);
      if (sData.ok) setSettings(sData.settings ?? {});
      if (bData.ok) { setProfile(bData.profile); setHours(bData.hours ?? []); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const get = (key: string, fallback = '') => settings[key] ?? fallback;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sectionProps = { onDirty: markDirty, onSaved: markClean, onRefresh: loadAll };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your business profile, hours, booking rules, and more.
        </p>
      </div>

      {/* Mobile section picker */}
      <div className="lg:hidden mb-4">
        <Select value={active} onValueChange={(v) => setActive(v as SectionId)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SECTIONS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="flex items-center gap-2">
                  {s.label}
                  {dirty[s.id] && <span className="size-2 rounded-full bg-yellow-400 inline-block" />}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-48 shrink-0">
          <nav className="sticky top-6 space-y-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  className={cn(
                    'flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
                    active === s.id
                      ? s.danger ? 'bg-destructive/10 text-destructive' : 'bg-primary text-primary-foreground'
                      : s.danger ? 'text-destructive/80 hover:bg-destructive/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{s.label}</span>
                  {dirty[s.id] && (
                    <span className="size-2 rounded-full bg-yellow-400 shrink-0" title="Unsaved changes" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Section content */}
        <main className="flex-1 min-w-0">
          {active === 'business'     && profile && <BusinessInfoSection     profile={profile} {...sectionProps} />}
          {active === 'location'     && profile && <LocationSection         profile={profile} {...sectionProps} />}
          {active === 'branding'     && profile && <BrandingSection         profile={profile} {...sectionProps} />}
          {active === 'social'       && profile && <SocialSection           profile={profile} {...sectionProps} />}
          {active === 'hours'        && <BusinessHoursSection hours={hours} {...sectionProps} />}
          {active === 'regional'     && profile && <RegionalSection         profile={profile} {...sectionProps} />}
          {active === 'booking'      && profile && <BookingSection          profile={profile} settings={settings} get={get} {...sectionProps} />}
          {active === 'payments'     && <PaymentsSection {...sectionProps} />}
          {active === 'cancellation' && <CancellationSection get={get} {...sectionProps} />}
          {active === 'danger'       && <DangerSection />}
        </main>
      </div>
    </div>
  );
}

// ─── Shared props ─────────────────────────────────────────────────────────────

interface ProfileSectionProps {
  profile: BusinessProfile;
  onDirty: (id: SectionId) => void;
  onSaved: (id: SectionId) => void;
  onRefresh: () => void;
}

interface SettingsSectionProps {
  get: (key: string, fallback?: string) => string;
  onDirty: (id: SectionId) => void;
  onSaved: (id: SectionId) => void;
  onRefresh: () => void;
}

// ─── A. Business Info ─────────────────────────────────────────────────────────

function BusinessInfoSection({ profile, onDirty, onSaved, onRefresh }: ProfileSectionProps) {
  const { state, setSaving, setSaved, setError } = useSaveState();
  const sid: SectionId = 'business';

  const [name, setName]         = useState(profile.business_name ?? '');
  const [tagline, setTagline]   = useState(profile.tagline ?? '');
  const [desc, setDesc]         = useState(profile.description ?? '');
  const [abn, setAbn]           = useState(profile.abn ?? '');
  const [phone, setPhone]       = useState(profile.phone ?? '');
  const [email, setEmail]       = useState(profile.email ?? '');
  const [website, setWebsite]   = useState(profile.website ?? '');

  const touch = () => onDirty(sid);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Business name is required.'); return; }
    setSaving();
    try {
      await patchProfile({ business_name: name.trim(), tagline: tagline.trim() || null, description: desc.trim() || null, abn: abn.trim() || null, phone: phone.trim() || null, email: email.trim() || null, website: website.trim() || null });
      setSaved(); onSaved(sid); onRefresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save'); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2"><Building2 className="size-5 text-primary" /><CardTitle>Business Info</CardTitle></div>
        <CardDescription>Shown to customers on emails, invoices, and the booking page.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="biz-name">Business Name <span className="text-destructive">*</span></Label>
              <Input id="biz-name" value={name} onChange={(e) => { setName(e.target.value); touch(); }} placeholder="e.g. Shine Auto Detailing" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-tagline">Tagline</Label>
              <Input id="biz-tagline" value={tagline} onChange={(e) => { setTagline(e.target.value); touch(); }} placeholder="e.g. We come to you." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-phone">Phone <span className="text-destructive">*</span></Label>
              <Input id="biz-phone" type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); touch(); }} placeholder="0400 000 000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-email">Contact Email <span className="text-destructive">*</span></Label>
              <Input id="biz-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); touch(); }} placeholder="hello@business.com.au" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-abn">ABN</Label>
              <Input id="biz-abn" value={abn} onChange={(e) => { setAbn(e.target.value); touch(); }} placeholder="12 345 678 901" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="biz-website">Website</Label>
              <Input id="biz-website" type="url" value={website} onChange={(e) => { setWebsite(e.target.value); touch(); }} placeholder="https://yourbusiness.com.au" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-desc">Business Description</Label>
            <Textarea id="biz-desc" value={desc} rows={4} onChange={(e) => { setDesc(e.target.value); touch(); }} placeholder="Tell customers what makes you special..." />
            <p className="text-xs text-muted-foreground">Shown on the public booking page.</p>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end"><SaveBtn state={state} /></div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── B. Location ──────────────────────────────────────────────────────────────

function LocationSection({ profile, onDirty, onSaved, onRefresh }: ProfileSectionProps) {
  const { state, setSaving, setSaved, setError } = useSaveState();
  const sid: SectionId = 'location';

  const [line1, setLine1]     = useState(profile.address_line1 ?? '');
  const [line2, setLine2]     = useState(profile.address_line2 ?? '');
  const [suburb, setSuburb]   = useState(profile.suburb ?? '');
  const [st, setSt]           = useState(profile.state ?? '');
  const [post, setPost]       = useState(profile.postcode ?? '');
  const [country, setCountry] = useState(profile.country ?? 'Australia');
  const [note, setNote]       = useState(profile.getting_here_note ?? '');

  const touch = () => onDirty(sid);

  const fullAddress = [line1, suburb, st, post, country].filter(Boolean).join(', ');
  const mapUrl = fullAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving();
    try {
      await patchProfile({ address_line1: line1 || null, address_line2: line2 || null, suburb: suburb || null, state: st || null, postcode: post || null, country: country || 'Australia', getting_here_note: note || null });
      setSaved(); onSaved(sid); onRefresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save'); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2"><MapPin className="size-5 text-primary" /><CardTitle>Location</CardTitle></div>
        <CardDescription>Your service address and parking/access instructions.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="addr1">Address Line 1</Label>
              <Input id="addr1" value={line1} onChange={(e) => { setLine1(e.target.value); touch(); }} placeholder="123 Main Street" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr2">Address Line 2</Label>
              <Input id="addr2" value={line2} onChange={(e) => { setLine2(e.target.value); touch(); }} placeholder="Suite / Unit (optional)" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="col-span-2 sm:col-span-2 space-y-1.5">
                <Label htmlFor="suburb">Suburb</Label>
                <Input id="suburb" value={suburb} onChange={(e) => { setSuburb(e.target.value); touch(); }} placeholder="Sydney" />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Select value={st} onValueChange={(v) => { setSt(v); touch(); }}>
                  <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>{AU_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post">Postcode</Label>
                <Input id="post" value={post} onChange={(e) => { setPost(e.target.value); touch(); }} placeholder="2000" maxLength={4} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={country} onChange={(e) => { setCountry(e.target.value); touch(); }} placeholder="Australia" />
            </div>
          </div>

          {mapUrl && (
            <div className="rounded-lg overflow-hidden border aspect-video">
              <iframe
                src={mapUrl}
                className="w-full h-full"
                loading="lazy"
                title="Business location map"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="getting-here">Getting Here Note</Label>
            <Textarea id="getting-here" value={note} rows={3} onChange={(e) => { setNote(e.target.value); touch(); }} placeholder="e.g. Park in the rear car park. Ring the buzzer at gate 2." />
            <p className="text-xs text-muted-foreground">Parking tips, gate codes, or access instructions for customers.</p>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end"><SaveBtn state={state} /></div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── C. Branding ──────────────────────────────────────────────────────────────

function BrandingSection({ profile, onDirty, onSaved, onRefresh }: ProfileSectionProps) {
  const { state, setSaving, setSaved, setError } = useSaveState();
  const sid: SectionId = 'branding';

  const [logo, setLogo]       = useState(profile.logo_url ?? '');
  const [cover, setCover]     = useState(profile.cover_image_url ?? '');
  const [gallery, setGallery] = useState<string[]>(profile.gallery_urls ?? []);
  const [newUrl, setNewUrl]   = useState('');

  const touch = () => onDirty(sid);

  function addGallery() {
    const url = newUrl.trim();
    if (!url || gallery.length >= 10) return;
    setGallery((prev) => [...prev, url]);
    setNewUrl('');
    touch();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving();
    try {
      await patchProfile({ logo_url: logo.trim() || null, cover_image_url: cover.trim() || null, gallery_urls: gallery });
      setSaved(); onSaved(sid); onRefresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save'); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2"><ImageIcon className="size-5 text-primary" /><CardTitle>Branding</CardTitle></div>
        <CardDescription>Logo, cover image, and gallery photos shown on your booking page.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="logo-url">Logo URL <span className="text-xs text-muted-foreground">(200×200 recommended)</span></Label>
            <Input id="logo-url" type="url" value={logo} onChange={(e) => { setLogo(e.target.value); touch(); }} placeholder="https://..." />
            {logo && (
              <div className="flex items-center gap-3 mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="Logo preview" className="h-16 w-16 rounded-lg border object-contain bg-muted" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-xs text-muted-foreground">Logo preview</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cover-url">Cover Image URL <span className="text-xs text-muted-foreground">(banner, 1200×400 recommended)</span></Label>
            <Input id="cover-url" type="url" value={cover} onChange={(e) => { setCover(e.target.value); touch(); }} placeholder="https://..." />
            {cover && (
              <div className="mt-2 rounded-lg overflow-hidden border aspect-[3/1]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt="Cover preview" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label>Gallery <span className="text-xs text-muted-foreground">({gallery.length}/10 photos)</span></Label>
              <p className="text-xs text-muted-foreground mt-0.5">These photos appear on your booking page.</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {gallery.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg border overflow-hidden bg-muted group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  <button
                    type="button"
                    onClick={() => { setGallery((p) => p.filter((_, j) => j !== i)); touch(); }}
                    className="absolute top-1 right-1 size-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {gallery.length < 10 && (
              <div className="flex gap-2">
                <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://... (image URL)" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addGallery(); } }} />
                <Button type="button" variant="outline" onClick={addGallery}><Plus className="size-4" /></Button>
              </div>
            )}
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end"><SaveBtn state={state} /></div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── D. Social & Links ────────────────────────────────────────────────────────

function SocialSection({ profile, onDirty, onSaved, onRefresh }: ProfileSectionProps) {
  const { state, setSaving, setSaved, setError } = useSaveState();
  const sid: SectionId = 'social';

  const [fb, setFb]       = useState(profile.facebook_url ?? '');
  const [ig, setIg]       = useState(profile.instagram_url ?? '');
  const [tt, setTt]       = useState(profile.tiktok_url ?? '');
  const [gg, setGg]       = useState(profile.google_business_url ?? '');

  const touch = () => onDirty(sid);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving();
    try {
      await patchProfile({ facebook_url: fb.trim() || null, instagram_url: ig.trim() || null, tiktok_url: tt.trim() || null, google_business_url: gg.trim() || null });
      setSaved(); onSaved(sid); onRefresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save'); }
  }

  const fields = [
    { id: 'fb', icon: LinkIcon,     label: 'Facebook',               value: fb, set: setFb, placeholder: 'https://facebook.com/yourpage' },
    { id: 'ig', icon: LinkIcon,     label: 'Instagram',              value: ig, set: setIg, placeholder: 'https://instagram.com/yourhandle' },
    { id: 'tt', icon: Share2,       label: 'TikTok',                 value: tt, set: setTt, placeholder: 'https://tiktok.com/@yourhandle' },
    { id: 'gg', icon: ExternalLink, label: 'Google Business Profile',value: gg, set: setGg, placeholder: 'https://g.page/yourbusiness' },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2"><Share2 className="size-5 text-primary" /><CardTitle>Social &amp; Links</CardTitle></div>
        <CardDescription>Social media profiles and online listings shown to customers.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.id} className="space-y-1.5">
                <Label htmlFor={`social-${f.id}`} className="flex items-center gap-1.5">
                  <Icon className="size-4 text-muted-foreground" />{f.label}
                </Label>
                <Input
                  id={`social-${f.id}`}
                  type="url"
                  value={f.value}
                  onChange={(e) => { (f.set as (v: string) => void)(e.target.value); touch(); }}
                  placeholder={f.placeholder}
                />
              </div>
            );
          })}
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end"><SaveBtn state={state} /></div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── E. Business Hours ────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface HoursRow { day_of_week: string; is_open: boolean; open_time: string; close_time: string }

function BusinessHoursSection({ hours, onDirty, onSaved, onRefresh }: {
  hours: BusinessHour[];
  onDirty: (id: SectionId) => void;
  onSaved: (id: SectionId) => void;
  onRefresh: () => void;
}) {
  const { state, setSaving, setSaved, setError } = useSaveState();
  const sid: SectionId = 'hours';

  const [rows, setRows] = useState<HoursRow[]>(() => {
    const map = new Map(hours.map((h) => [h.day_of_week, h]));
    return DAYS_OF_WEEK.map((day) => ({
      day_of_week: day,
      is_open:    map.get(day)?.is_open ?? (day !== 'Sunday'),
      open_time:  map.get(day)?.open_time ?? '08:00',
      close_time: map.get(day)?.close_time ?? (day === 'Saturday' ? '13:00' : '17:00'),
    }));
  });

  const touch = () => onDirty(sid);

  function patch(index: number, patch: Partial<HoursRow>) {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, ...patch } : r));
    touch();
  }

  function copyToWeekdays(index: number) {
    const src = rows[index];
    setRows((prev) => prev.map((r) => {
      const isWeekday = !['Saturday', 'Sunday'].includes(r.day_of_week);
      return isWeekday ? { ...r, is_open: src.is_open, open_time: src.open_time, close_time: src.close_time } : r;
    }));
    touch();
  }

  function copyToAll(index: number) {
    const src = rows[index];
    setRows((prev) => prev.map((r) => ({ ...r, is_open: src.is_open, open_time: src.open_time, close_time: src.close_time })));
    touch();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const r of rows) {
      if (r.is_open && minutesFromHHMM(r.open_time) >= minutesFromHHMM(r.close_time)) {
        setError(`${r.day_of_week}: close time must be after open time.`);
        return;
      }
    }
    setSaving();
    try {
      const res = await fetch('/api/admin/business-hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: rows }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to save');
      setSaved(); onSaved(sid); onRefresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save'); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2"><Clock className="size-5 text-primary" /><CardTitle>Business Hours</CardTitle></div>
        <CardDescription>Days you are open. Closed days show as unavailable on the booking calendar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {rows.map((row, i) => (
            <div key={row.day_of_week} className={cn(
              'flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4',
              !row.is_open && 'opacity-60',
            )}>
              <div className="flex items-center justify-between gap-3 sm:w-36 shrink-0">
                <span className="text-sm font-medium">{row.day_of_week.slice(0, 3)}</span>
                <div className="flex items-center gap-2">
                  <Switch checked={row.is_open} onCheckedChange={(v) => patch(i, { is_open: v })} />
                  <span className="text-xs text-muted-foreground">{row.is_open ? 'Open' : 'Closed'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Select value={row.open_time} onValueChange={(v) => patch(i, { open_time: v })} disabled={!row.is_open}>
                  <SelectTrigger className="flex-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {HOURS_TIME_OPTIONS.map((o) => <SelectItem key={`o-${o.value}`} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground text-xs shrink-0">to</span>
                <Select value={row.close_time} onValueChange={(v) => patch(i, { close_time: v })} disabled={!row.is_open}>
                  <SelectTrigger className="flex-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {HOURS_TIME_OPTIONS.map((o) => <SelectItem key={`c-${o.value}`} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button type="button" variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => copyToWeekdays(i)} title="Copy to all weekdays">
                  Copy weekdays
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => copyToAll(i)} title="Copy to all days">
                  Copy all
                </Button>
              </div>
            </div>
          ))}
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end pt-2"><SaveBtn state={state} /></div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── F. Regional Settings ─────────────────────────────────────────────────────

const AU_TIMEZONES = [
  { value: 'Australia/Sydney',    label: 'AEST/AEDT — Sydney, Melbourne, Brisbane' },
  { value: 'Australia/Melbourne', label: 'AEST/AEDT — Melbourne' },
  { value: 'Australia/Brisbane',  label: 'AEST — Brisbane (no DST)' },
  { value: 'Australia/Adelaide',  label: 'ACST/ACDT — Adelaide' },
  { value: 'Australia/Darwin',    label: 'ACST — Darwin (no DST)' },
  { value: 'Australia/Perth',     label: 'AWST — Perth' },
  { value: 'Australia/Hobart',    label: 'AEST/AEDT — Hobart' },
];

function RegionalSection({ profile, onDirty, onSaved, onRefresh }: ProfileSectionProps) {
  const { state, setSaving, setSaved, setError } = useSaveState();
  const sid: SectionId = 'regional';

  const [tz, setTz]       = useState(profile.timezone ?? 'Australia/Sydney');
  const [curr, setCurr]   = useState(profile.currency ?? 'AUD');
  const [dateF, setDateF] = useState(profile.date_format ?? 'DD/MM/YYYY');
  const [timeF, setTimeF] = useState(profile.time_format ?? '12h');
  const [weekS, setWeekS] = useState(profile.week_starts_on ?? 'Monday');

  const touch = () => onDirty(sid);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving();
    try {
      await patchProfile({ timezone: tz, currency: curr, date_format: dateF, time_format: timeF, week_starts_on: weekS });
      setSaved(); onSaved(sid); onRefresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save'); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2"><Globe className="size-5 text-primary" /><CardTitle>Regional Settings</CardTitle></div>
        <CardDescription>Timezone, currency, and display format preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={tz} onValueChange={(v) => { setTz(v); touch(); }}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{AU_TIMEZONES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Used for slot availability and booking confirmation times.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={curr} onValueChange={(v) => { setCurr(v); touch(); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="NZD">NZD — New Zealand Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date Format</Label>
              <Select value={dateF} onValueChange={(v) => { setDateF(v); touch(); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (Australian)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Time Format</Label>
              <Select value={timeF} onValueChange={(v) => { setTimeF(v); touch(); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (1:00 PM)</SelectItem>
                  <SelectItem value="24h">24-hour (13:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Week Starts On</Label>
              <Select value={weekS} onValueChange={(v) => { setWeekS(v); touch(); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end"><SaveBtn state={state} /></div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── G. Booking Settings ──────────────────────────────────────────────────────

const SLOT_OPTS  = [{ v: '30', l: '30 min' }, { v: '45', l: '45 min' }, { v: '60', l: '1 hour' }, { v: '90', l: '1.5 hrs' }, { v: '120', l: '2 hours' }];
const BUFFER_OPTS = [{ v: '0', l: 'None' }, { v: '15', l: '15 min' }, { v: '30', l: '30 min' }, { v: '45', l: '45 min' }, { v: '60', l: '1 hour' }];
const LEAD_OPTS  = [{ v: '1', l: '1 hour' }, { v: '2', l: '2 hours' }, { v: '4', l: '4 hours' }, { v: '8', l: '8 hours' }, { v: '24', l: '24 hours' }, { v: '48', l: '48 hours' }];
const ADV_OPTS   = [{ v: '7', l: '1 week' }, { v: '14', l: '2 weeks' }, { v: '30', l: '1 month' }, { v: '60', l: '2 months' }, { v: '90', l: '3 months' }];

function BookingSection({ profile, settings, get, onDirty, onSaved, onRefresh }: ProfileSectionProps & { settings: SettingsMap; get: (key: string, fallback?: string) => string }) {
  const { state: stateProf, setSaving: setSavingProf, setSaved: setSavedProf, setError: setErrorProf } = useSaveState();
  const { state: stateSched, setSaving: setSavingSched, setSaved: setSavedSched, setError: setErrorSched } = useSaveState();
  const sid: SectionId = 'booking';

  // Profile fields
  const [online, setOnline]     = useState(profile.online_booking_enabled);
  const [lead, setLead]         = useState(String(profile.booking_lead_time_hours ?? 2));
  const [advance, setAdvance]   = useState(String(profile.booking_advance_days ?? 60));

  // Settings table fields
  const [workingHours, setWorkingHours] = useState<WorkingHours>(() => parseWorkingHours(settings.working_hours));
  const [slotDur, setSlotDur]   = useState(settings.slot_duration_mins ?? '60');
  const [buffer, setBuffer]     = useState(settings.buffer_time_mins ?? '0');
  const [maxDay, setMaxDay]     = useState(settings.max_bookings_per_day ?? '10');
  const [blackout, setBlackout] = useState<string[]>(() => parseBlackoutDates(settings.blackout_dates));
  const [blackoutOpen, setBlackoutOpen] = useState(false);
  const [pageTitle, setPageTitle]   = useState(get('booking_page_title', 'Book Your Detail'));
  const [pageDesc, setPageDesc]     = useState(get('booking_page_description', ''));
  const [showPrice, setShowPrice]   = useState((settings.booking_show_price ?? 'true') !== 'false');
  const [showDur, setShowDur]       = useState((settings.booking_show_duration ?? 'true') !== 'false');
  const [reqPhone, setReqPhone]     = useState((settings.booking_require_phone ?? 'true') === 'true');
  const [reqNotes, setReqNotes]     = useState((settings.booking_require_notes ?? 'false') === 'true');
  const [confirmMsg, setConfirmMsg] = useState(settings.booking_confirmation_message ?? '');

  const touch = () => onDirty(sid);

  function patchDay(day: DayKey, patch: Partial<WorkingHours[DayKey]>) {
    setWorkingHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
    touch();
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProf();
    try {
      await patchProfile({ online_booking_enabled: online, booking_lead_time_hours: Number(lead), booking_advance_days: Number(advance) });
      setSavedProf(); onSaved(sid); onRefresh();
    } catch (err) { setErrorProf(err instanceof Error ? err.message : 'Failed to save'); }
  }

  async function handleSaveSched(e: React.FormEvent) {
    e.preventDefault();
    for (const day of DAY_ORDER) {
      const d = workingHours[day];
      if (d.enabled && minutesFromHHMM(d.start) >= minutesFromHHMM(d.end)) {
        setErrorSched(`${DAY_LABELS[day]}: end must be after start.`); return;
      }
    }
    setSavingSched();
    try {
      await saveMany([
        ['working_hours', JSON.stringify(workingHours)],
        ['slot_duration_mins', slotDur],
        ['buffer_time_mins', buffer],
        ['max_bookings_per_day', maxDay],
        ['blackout_dates', JSON.stringify([...blackout].sort())],
        ['booking_page_title', pageTitle],
        ['booking_page_description', pageDesc],
        ['booking_show_price', showPrice ? 'true' : 'false'],
        ['booking_show_duration', showDur ? 'true' : 'false'],
        ['booking_require_phone', reqPhone ? 'true' : 'false'],
        ['booking_require_notes', reqNotes ? 'true' : 'false'],
        ['booking_confirmation_message', confirmMsg],
      ]);
      setSavedSched(); onSaved(sid); onRefresh();
    } catch (err) { setErrorSched(err instanceof Error ? err.message : 'Failed to save'); }
  }

  return (
    <div className="space-y-6">
      {/* Online booking + limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><CalendarDays className="size-5 text-primary" /><CardTitle>Booking Settings</CardTitle></div>
          <CardDescription>Online booking availability and lead/advance time limits.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Online booking enabled</p>
                <p className="text-xs text-muted-foreground mt-0.5">If off, the booking page shows a &quot;contact us&quot; message instead.</p>
              </div>
              <Switch checked={online} onCheckedChange={(v) => { setOnline(v); touch(); }} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Minimum lead time</Label>
                <p className="text-xs text-muted-foreground">How far ahead customers must book.</p>
                <Select value={lead} onValueChange={(v) => { setLead(v); touch(); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAD_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Maximum advance booking</Label>
                <p className="text-xs text-muted-foreground">How far into the future slots are shown.</p>
                <Select value={advance} onValueChange={(v) => { setAdvance(v); touch(); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ADV_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {stateProf.error && <p className="text-sm text-destructive">{stateProf.error}</p>}
            <div className="flex justify-end"><SaveBtn state={stateProf} /></div>
          </form>
        </CardContent>
      </Card>

      {/* Scheduling details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scheduling &amp; Slot Rules</CardTitle>
          <CardDescription>Slot grid, buffer times, blackout dates, and booking page display.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSched} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Time slot duration</Label>
                <Select value={slotDur} onValueChange={(v) => { setSlotDur(v); touch(); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SLOT_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Buffer time between jobs</Label>
                <Select value={buffer} onValueChange={(v) => { setBuffer(v); touch(); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BUFFER_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-day">Max bookings per day</Label>
                <Input id="max-day" type="number" min={1} max={20} value={maxDay} onChange={(e) => { setMaxDay(e.target.value); touch(); }} />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Fallback working hours <span className="font-normal text-muted-foreground text-xs">(overridden by Business Hours section)</span></Label>
              <div className="space-y-2">
                {DAY_ORDER.map((day) => {
                  const d = workingHours[day];
                  return (
                    <div key={day} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex items-center justify-between gap-3 sm:w-32 shrink-0">
                        <span className="text-sm">{DAY_LABELS[day]}</span>
                        <Switch checked={d.enabled} onCheckedChange={(on) => patchDay(day, { enabled: on })} />
                      </div>
                      <div className="flex gap-2 flex-1">
                        <Select value={d.start} onValueChange={(v) => patchDay(day, { start: v })} disabled={!d.enabled}>
                          <SelectTrigger className="flex-1 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-52">{SLOT_TIME_OPTIONS.map((o) => <SelectItem key={`s-${day}-${o.value}`} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <span className="self-center text-muted-foreground text-xs">–</span>
                        <Select value={d.end} onValueChange={(v) => patchDay(day, { end: v })} disabled={!d.enabled}>
                          <SelectTrigger className="flex-1 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-52">{SLOT_TIME_OPTIONS.map((o) => <SelectItem key={`e-${day}-${o.value}`} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Blackout dates</Label>
              <p className="text-xs text-muted-foreground">Specific dates when no bookings are accepted (holidays, closures).</p>
              <Popover open={blackoutOpen} onOpenChange={setBlackoutOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5">
                    <Plus className="size-4" />Add date
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" onSelect={(d) => {
                    if (!d) return;
                    const ymd = format(d, 'yyyy-MM-dd');
                    setBlackout((prev) => prev.includes(ymd) ? prev : [...prev, ymd].sort());
                    setBlackoutOpen(false);
                    touch();
                  }} />
                </PopoverContent>
              </Popover>
              {blackout.length > 0 ? (
                <ul className="space-y-1.5">
                  {blackout.map((d) => (
                    <li key={d} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                      <span>{format(new Date(`${d}T12:00:00`), 'PPP')}</span>
                      <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7" onClick={() => { setBlackout((p) => p.filter((x) => x !== d)); touch(); }}>Remove</Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No blackout dates.</p>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-sm font-semibold">Booking page display</Label>
              <div className="space-y-1.5">
                <Label htmlFor="pg-title">Page title</Label>
                <Input id="pg-title" value={pageTitle} onChange={(e) => { setPageTitle(e.target.value); touch(); }} placeholder="Book Your Detail" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pg-desc">Page description</Label>
                <Textarea id="pg-desc" value={pageDesc} rows={2} onChange={(e) => { setPageDesc(e.target.value); touch(); }} placeholder="Short intro shown under the title." />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { id: 'show-price', label: 'Show price', val: showPrice, set: setShowPrice },
                  { id: 'show-dur',   label: 'Show duration', val: showDur, set: setShowDur },
                  { id: 'req-phone',  label: 'Require phone number', val: reqPhone, set: setReqPhone },
                  { id: 'req-notes',  label: 'Require special notes', val: reqNotes, set: setReqNotes },
                ].map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <Label htmlFor={f.id} className="cursor-pointer text-sm">{f.label}</Label>
                    <Switch id={f.id} checked={f.val} onCheckedChange={(v) => { (f.set as (v: boolean) => void)(v); touch(); }} />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-msg">Booking confirmation message</Label>
                <Textarea id="confirm-msg" value={confirmMsg} rows={3} onChange={(e) => { setConfirmMsg(e.target.value); touch(); }} placeholder="Thank you! We'll see you soon." />
                <p className="text-xs text-muted-foreground">Shown on the booking success page.</p>
              </div>
            </div>

            {stateSched.error && <p className="text-sm text-destructive">{stateSched.error}</p>}
            <div className="flex justify-end"><SaveBtn state={stateSched} /></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── H. Payments ──────────────────────────────────────────────────────────────

function PaymentsSection({ onDirty, onSaved, onRefresh }: Omit<SettingsSectionProps, 'get'>) {
  const { state, setSaving, setSaved, setError } = useSaveState();
  const sid: SectionId = 'payments';

  const [depositType, setDepositType] = useState<'fixed' | 'percentage'>('fixed');
  const [depositVal, setDepositVal] = useState('30');
  const [loadingDeposit, setLoadingDeposit] = useState(true);

  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  const stripeMode = stripeKey.startsWith('pk_live_') ? 'Live' : 'Test';

  const touch = () => onDirty(sid);

  useEffect(() => {
    fetch('/api/admin/deposit-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.depositSettings) {
          setDepositType(data.depositSettings.deposit_type ?? 'fixed');
          setDepositVal(String(data.depositSettings.default_deposit_amount ?? 30));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDeposit(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(depositVal);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid deposit amount.');
      return;
    }
    setSaving();
    try {
      const res = await fetch('/api/admin/deposit-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_deposit_amount: amount,
          deposit_type: depositType,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to save');
      setSaved(); onSaved(sid); onRefresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save'); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2"><CreditCard className="size-5 text-primary" /><CardTitle>Payment Settings</CardTitle></div>
        <CardDescription>Configure the default deposit amount shown to clients at booking. This value is used dynamically on the public booking page.</CardDescription>
      </CardHeader>
      <CardContent>
        {loadingDeposit ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Stripe Mode</p>
                <p className="text-xs text-muted-foreground">Determined by your Stripe publishable key prefix.</p>
              </div>
              <Badge variant={stripeMode === 'Live' ? 'default' : 'secondary'}>{stripeMode}</Badge>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label>Deposit Type</Label>
              <p className="text-xs text-muted-foreground -mt-2">Choose whether the deposit is a fixed dollar amount or a percentage of the service price.</p>
              <div className="flex gap-3">
                {(['fixed', 'percentage'] as const).map((type) => (
                  <label key={type} className={cn('flex flex-1 items-center justify-center gap-2 cursor-pointer rounded-md border px-4 py-2.5 text-sm font-medium transition-colors', depositType === type ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50')}>
                    <input type="radio" name="dep-type" value={type} checked={depositType === type} onChange={() => { setDepositType(type); touch(); }} className="sr-only" />
                    {type === 'fixed' ? '$ Fixed Amount' : '% Percentage'}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dep-val">
                Default Deposit Amount{' '}
                <span className="text-muted-foreground font-normal">
                  ({depositType === 'fixed' ? 'AUD dollars' : '% of service price'})
                </span>
              </Label>
              <div className="relative max-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {depositType === 'fixed' ? '$' : '%'}
                </span>
                <Input
                  id="dep-val"
                  type="number"
                  min={0}
                  step={depositType === 'fixed' ? '1' : '0.1'}
                  value={depositVal}
                  onChange={(e) => { setDepositVal(e.target.value); touch(); }}
                  className="pl-7"
                  placeholder={depositType === 'fixed' ? '30' : '20'}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {depositType === 'fixed'
                  ? `Clients will be charged A$${parseFloat(depositVal) || 0} as a deposit when booking.`
                  : `Clients will be charged ${parseFloat(depositVal) || 0}% of the service price as a deposit.`}
              </p>
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="flex justify-end"><SaveBtn state={state} /></div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ─── I. Cancellation ──────────────────────────────────────────────────────────

function CancellationSection({ get, onDirty, onSaved, onRefresh }: SettingsSectionProps) {
  const { state, setSaving, setSaved, setError } = useSaveState();
  const sid: SectionId = 'cancellation';

  const [cancelHours, setCancelHours]   = useState(get('cancellation_hours_notice', '24'));
  const [reschedHours, setReschedHours] = useState(get('reschedule_hours_notice', '24'));
  const [refundPolicy, setRefundPolicy] = useState<'full' | 'deposit_only' | 'none'>(() => {
    const p = get('cancellation_refund_policy', 'full');
    return p === 'deposit_only' || p === 'none' ? p : 'full';
  });
  const [custResched, setCustResched] = useState(get('customer_reschedule_enabled', 'true') !== 'false');
  const [custCancel, setCustCancel]   = useState(get('customer_cancel_enabled', 'true') !== 'false');

  const touch = () => onDirty(sid);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { cancellation_hours_notice: cancelHours, reschedule_hours_notice: reschedHours, cancellation_refund_policy: refundPolicy, customer_reschedule_enabled: custResched ? 'true' : 'false', customer_cancel_enabled: custCancel ? 'true' : 'false' } }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to save');
      setSaved(); onSaved(sid); onRefresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save'); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2"><XCircle className="size-5 text-primary" /><CardTitle>Cancellation Policy</CardTitle></div>
        <CardDescription>Notice periods, refund rules, and customer self-serve options.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cancel-h">Notice for cancellations (hours)</Label>
              <Input id="cancel-h" type="number" min={0} value={cancelHours} onChange={(e) => { setCancelHours(e.target.value); touch(); }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resched-h">Notice for reschedules (hours)</Label>
              <Input id="resched-h" type="number" min={0} value={reschedHours} onChange={(e) => { setReschedHours(e.target.value); touch(); }} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Refund policy</Label>
            <div className="space-y-2 rounded-lg border p-3">
              {([['full', 'Full refund if cancelled in time'], ['deposit_only', 'Keep deposit, refund remainder'], ['none', 'No refunds']] as const).map(([val, lbl]) => (
                <label key={val} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="refund" value={val} checked={refundPolicy === val} onChange={() => { setRefundPolicy(val); touch(); }} />
                  {lbl}
                </label>
              ))}
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Customer Self-Serve</Label>
            <p className="text-xs text-muted-foreground">Control whether customers can manage their own bookings online.</p>
            <div className="space-y-2">
              {[
                { id: 'cust-resched', label: 'Allow customers to reschedule online', desc: 'Shows the Reschedule button on the customer manage page.', val: custResched, set: setCustResched },
                { id: 'cust-cancel',  label: 'Allow customers to cancel online',     desc: 'Shows the Cancel button on the customer manage page.',     val: custCancel,  set: setCustCancel },
              ].map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <Label htmlFor={f.id} className="text-sm font-medium cursor-pointer">{f.label}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                  <Switch id={f.id} checked={f.val} onCheckedChange={(v) => { (f.set as (v: boolean) => void)(v); touch(); }} />
                </div>
              ))}
            </div>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end"><SaveBtn state={state} /></div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── J. Danger Zone ───────────────────────────────────────────────────────────

function DangerSection() {
  const [cancelOpen, setCancelOpen]   = useState(false);
  const [cancelling, setCancelling]   = useState(false);
  const [cancelResult, setCancelResult] = useState<string | null>(null);
  const [exporting, setExporting]     = useState(false);

  async function handleCancelPending() {
    setCancelling(true);
    try {
      const res = await fetch('/api/admin/settings/cancel-pending', { method: 'POST' });
      const data = await res.json();
      setCancelResult(data.ok ? `${data.cancelled} booking${data.cancelled !== 1 ? 's' : ''} cancelled.` : `Error: ${data.error}`);
    } catch { setCancelResult('An unexpected error occurred.'); }
    finally { setCancelling(false); }
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/settings/export-csv');
      if (!res.ok) { alert('Export failed. Please try again.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `detailing-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <div className="flex items-center gap-2"><AlertTriangle className="size-5 text-destructive" /><CardTitle className="text-destructive">Danger Zone</CardTitle></div>
        <CardDescription>Irreversible actions. Proceed with caution.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div>
            <p className="text-sm font-medium">Cancel All Pending Bookings</p>
            <p className="text-xs text-muted-foreground">Marks every pending booking as cancelled. Cannot be undone.</p>
          </div>
          <Dialog open={cancelOpen} onOpenChange={(open) => { setCancelOpen(open); if (!open) setCancelResult(null); }}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="shrink-0"><Trash2 className="size-4 mr-1.5" />Cancel Pending</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel All Pending Bookings?</DialogTitle>
                <DialogDescription>This will permanently mark all pending bookings as cancelled. Customers will not be automatically notified.</DialogDescription>
              </DialogHeader>
              {cancelResult && <p className="text-sm rounded-md bg-muted px-3 py-2">{cancelResult}</p>}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep Bookings</Button>
                <Button variant="destructive" onClick={handleCancelPending} disabled={cancelling || !!cancelResult}>
                  {cancelling ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Trash2 className="size-4 mr-1.5" />}Yes, Cancel All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Export All Data as CSV</p>
            <p className="text-xs text-muted-foreground">Downloads a CSV of all bookings and customers.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={exporting} className="shrink-0">
            {exporting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Download className="size-4 mr-1.5" />}Export CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
