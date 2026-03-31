"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { cn } from "@/lib/utils";
import { InspoStep } from "@/components/booking/InspoStep";

// ── Stripe singleton ───────────────────────────────────────────────────────────

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ── Types ────────────────────────────────────────────────────────────────────

interface NailService {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  deposit_cents: number;
  deposit_type: "fixed" | "percentage";
  duration_minutes: number;
  category: string | null;
}

interface DepositSettings {
  default_deposit_amount: number;
  deposit_type: "fixed" | "percentage";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return `A$${(cents / 100).toFixed(2)}`;
}

function formatDollars(amount: number): string {
  return `A$${amount.toFixed(2)}`;
}

function minutesToDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} mins`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} mins`;
}

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtTime(hhmmss: string): string {
  if (!hhmmss) return "";
  const parts = hhmmss.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Compute deposit in cents from deposit settings + service price. */
function computeDepositCents(
  depositSettings: DepositSettings | null,
  service: NailService,
): number {
  if (depositSettings) {
    if (depositSettings.deposit_type === "percentage") {
      return Math.round((service.price_cents * depositSettings.default_deposit_amount) / 100);
    }
    return Math.round(depositSettings.default_deposit_amount * 100);
  }
  // Fallback to per-service deposit
  if (service.deposit_type === "percentage") {
    return Math.round((service.price_cents * service.deposit_cents) / 10000);
  }
  return service.deposit_cents;
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEP_LABELS = ["Service", "Details", "Inspo", "Payment", "Confirmation"] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-2xs font-sans font-medium transition-all",
                  done && "bg-vynl-black text-vynl-white",
                  active && "bg-vynl-champagne-light text-vynl-black ring-2 ring-vynl-champagne ring-offset-2",
                  !done && !active && "bg-vynl-gray-100 text-vynl-gray-400"
                )}
              >
                {done ? (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={cn(
                  "text-2xs font-sans tracking-widest uppercase hidden sm:block",
                  active ? "text-vynl-black font-medium" : "text-vynl-gray-400"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "h-px w-12 sm:w-16 mx-2 mb-5 transition-colors",
                  done ? "bg-vynl-black" : "bg-vynl-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Input / Label primitives ──────────────────────────────────────────────────

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-2xs font-sans font-medium tracking-widest uppercase text-vynl-gray-500 mb-2"
    >
      {children}
    </label>
  );
}

function TextInput({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={cn(
        "w-full px-4 py-3 text-sm font-sans font-light text-vynl-black bg-vynl-white",
        "border border-vynl-gray-200 rounded-none outline-none",
        "placeholder:text-vynl-gray-400",
        "focus:border-vynl-black transition-colors"
      )}
    />
  );
}

// ── Calendar picker ───────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

function CalendarPicker({
  value,
  onChange,
  viewYear,
  viewMonth,
  onMonthChange,
  dayStatuses,
  loadingAvailability,
  hasService,
}: {
  value: string;
  onChange: (v: string) => void;
  viewYear: number;
  viewMonth: number;
  onMonthChange: (year: number, month: number) => void;
  dayStatuses: Record<string, "available" | "full" | "closed"> | null;
  loadingAvailability: boolean;
  hasService: boolean;
}) {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayIso = isoDate(todayDate);

  function prevMonth() {
    if (viewMonth === 0) onMonthChange(viewYear - 1, 11);
    else onMonthChange(viewYear, viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) onMonthChange(viewYear + 1, 0);
    else onMonthChange(viewYear, viewMonth + 1);
  }

  const isPrevDisabled =
    viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth();

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startPad = (firstOfMonth.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array<null>(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="border border-vynl-gray-200 bg-vynl-white select-none relative overflow-hidden">
      {loadingAvailability && (
        <div className="absolute inset-0 bg-vynl-white/80 flex items-center justify-center z-10 pointer-events-none">
          <svg className="animate-spin w-5 h-5 text-vynl-gray-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-b border-vynl-gray-100">
        <button
          type="button"
          onClick={prevMonth}
          disabled={isPrevDisabled}
          className={cn(
            "w-8 h-8 flex items-center justify-center transition-colors",
            isPrevDisabled
              ? "text-vynl-gray-200 cursor-not-allowed"
              : "text-vynl-gray-500 hover:text-vynl-black hover:bg-vynl-smoke"
          )}
          aria-label="Previous month"
        >
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 1L1 6l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className="font-display text-sm text-vynl-black">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center text-vynl-gray-500 hover:text-vynl-black hover:bg-vynl-smoke transition-colors"
          aria-label="Next month"
        >
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 px-2 pt-3 pb-1">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-2xs font-sans font-medium tracking-widest uppercase text-vynl-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 px-2 pb-3">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`pad-${idx}`} />;

          const cellIso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isPast = cellIso < todayIso;
          const isSelected = cellIso === value;
          const isToday = cellIso === todayIso;
          const status = dayStatuses?.[cellIso];
          const isUnavailable = !isPast && hasService && dayStatuses !== null && status !== "available";
          const isDisabled = isPast || isUnavailable;

          return (
            <button
              key={cellIso}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(cellIso)}
              className={cn(
                "w-full aspect-square flex items-center justify-center text-xs font-sans transition-all",
                isPast && "text-vynl-gray-200 cursor-not-allowed",
                isUnavailable && "text-vynl-gray-300 cursor-not-allowed line-through",
                isSelected && "bg-vynl-black text-vynl-white font-medium",
                !isDisabled && !isSelected && "text-vynl-black hover:bg-vynl-smoke",
                isToday && !isSelected && !isDisabled && "text-vynl-champagne font-medium underline underline-offset-2"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {value && (
        <div className="border-t border-vynl-gray-100 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-sans text-vynl-gray-500">{fmtDate(value)}</span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-2xs font-sans text-vynl-gray-400 hover:text-vynl-black transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 1 — Service Selection ─────────────────────────────────────────────────

function ServiceStep({
  services,
  loadingServices,
  servicesError,
  selectedService,
  selectedAddons,
  onSelectService,
  onToggleAddon,
  onNext,
}: {
  services: NailService[];
  loadingServices: boolean;
  servicesError: string | null;
  selectedService: NailService | null;
  selectedAddons: NailService[];
  onSelectService: (s: NailService) => void;
  onToggleAddon: (s: NailService) => void;
  onNext: () => void;
}) {
  const nailServices = services.filter((s) => s.category === "nail_service");
  const addons = services.filter((s) => s.category === "addon");

  function ServiceCard({ service, isSelected, isAddon }: { service: NailService; isSelected: boolean; isAddon?: boolean }) {
    const handleClick = () => {
      if (isAddon) {
        onToggleAddon(service);
      } else {
        onSelectService(service);
      }
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "w-full text-left border p-4 transition-all duration-200",
          isSelected
            ? "border-vynl-black bg-vynl-black"
            : "border-vynl-gray-200 bg-vynl-white hover:border-vynl-gray-400"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div
              className={cn(
                "mt-0.5 shrink-0 transition-all",
                isAddon
                  ? cn("w-4 h-4 border-2 flex items-center justify-center",
                      isSelected ? "border-vynl-champagne bg-vynl-champagne" : "border-vynl-gray-300"
                    )
                  : cn("w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      isSelected ? "border-vynl-champagne" : "border-vynl-gray-300"
                    )
              )}
            >
              {isAddon && isSelected && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M1 3l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {!isAddon && isSelected && (
                <div className="w-2 h-2 rounded-full bg-vynl-champagne" />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={cn("font-display text-sm font-medium", isSelected ? "text-vynl-white" : "text-vynl-black")}>
                {service.name}
              </span>
              {service.description && (
                <span className={cn("text-xs font-sans font-light leading-relaxed", isSelected ? "text-vynl-gray-300" : "text-vynl-gray-500")}>
                  {service.description}
                </span>
              )}
              <div className="flex items-center gap-3 mt-0.5">
                {service.price_cents > 0 && (
                  <span className={cn("text-xs font-sans font-medium", isSelected ? "text-vynl-champagne-light" : "text-vynl-black")}>
                    {formatCents(service.price_cents)}
                  </span>
                )}
                {service.price_cents === 0 && (
                  <span className={cn("text-xs font-sans font-light italic", isSelected ? "text-vynl-gray-300" : "text-vynl-gray-400")}>
                    Price on consultation
                  </span>
                )}
                <span className="text-2xs font-sans tracking-widest uppercase text-vynl-gray-400">
                  {minutesToDuration(service.duration_minutes)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-display text-2xl text-vynl-black mb-2">Select your service</h2>
        <p className="text-sm font-sans text-vynl-gray-500 font-light leading-relaxed">
          Choose a nail service, then add any optional extras below.
        </p>
      </div>

      {loadingServices && (
        <div className="flex flex-col gap-2.5">
          {[1, 2].map((n) => (
            <div key={n} className="w-full border border-vynl-gray-100 p-5 bg-vynl-smoke animate-pulse h-20" />
          ))}
        </div>
      )}

      {servicesError && (
        <p className="text-sm font-sans text-red-500 bg-red-50 px-4 py-3 border border-red-100">
          {servicesError}
        </p>
      )}

      {!loadingServices && !servicesError && (
        <div className="flex flex-col gap-6">
          {/* Nail Services */}
          <div>
            <p className="text-2xs font-sans font-medium tracking-widest uppercase text-vynl-gray-400 mb-3">
              Nail Services
            </p>
            <div className="flex flex-col gap-2.5">
              {nailServices.length === 0 && (
                <p className="text-sm text-vynl-gray-400">No services available.</p>
              )}
              {nailServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={selectedService?.id === service.id}
                />
              ))}
            </div>
          </div>

          {/* Add Ons */}
          {addons.length > 0 && (
            <div>
              <p className="text-2xs font-sans font-medium tracking-widest uppercase text-vynl-gray-400 mb-1">
                Add Ons
              </p>
              <p className="text-xs font-sans text-vynl-gray-400 mb-3">
                Optional extras — select as many as you like.
              </p>
              <div className="flex flex-col gap-2">
                {addons.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedAddons.some((a) => a.id === service.id)}
                    isAddon
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedAddons.length > 0 && (
        <div className="bg-vynl-smoke border border-vynl-gray-100 p-4 flex flex-wrap gap-2">
          <span className="text-2xs font-sans tracking-widest uppercase text-vynl-gray-400 w-full mb-1">
            Selected add-ons
          </span>
          {selectedAddons.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1.5 text-xs font-sans bg-vynl-black text-vynl-white px-2.5 py-1">
              {a.name}
              <button
                type="button"
                onClick={() => onToggleAddon(a)}
                className="hover:text-vynl-champagne-light transition-colors"
                aria-label={`Remove ${a.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={!selectedService}
        onClick={onNext}
        className={cn(
          "w-full py-4 text-sm font-sans font-medium tracking-widest uppercase transition-all",
          selectedService
            ? "bg-vynl-black text-vynl-white hover:bg-vynl-gray-900"
            : "bg-vynl-gray-100 text-vynl-gray-400 cursor-not-allowed"
        )}
      >
        Continue
      </button>
    </div>
  );
}

// ── Step 2 — Customer Details + Calendar ──────────────────────────────────────

interface DetailsValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
}

function DetailsStep({
  values,
  onChange,
  onNext,
  onBack,
  selectedService,
}: {
  values: DetailsValues;
  onChange: (k: keyof DetailsValues, v: string) => void;
  onNext: () => void;
  onBack: () => void;
  selectedService: NailService | null;
}) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const monthCacheRef = useRef<Map<string, Record<string, "available" | "full" | "closed">>>(new Map());
  const [dayStatuses, setDayStatuses] = useState<Record<string, "available" | "full" | "closed"> | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const [nextAvailLoading, setNextAvailLoading] = useState(false);
  const [nextAvailError, setNextAvailError] = useState<string | null>(null);

  useEffect(() => {
    if (!values.preferredDate || !selectedService) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSlotsError(null);
    setAvailableSlots([]);

    let cancelled = false;
    fetch(`/api/booking/availability?date=${values.preferredDate}&serviceId=${selectedService.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load availability.");
        return res.json() as Promise<{ ok: boolean; available: boolean; slots: string[] }>;
      })
      .then((data) => {
        if (!cancelled) setAvailableSlots(data.slots ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setSlotsError(err instanceof Error ? err.message : "Could not load availability.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.preferredDate, selectedService?.id]);

  useEffect(() => {
    if (!selectedService) {
      setDayStatuses(null);
      return;
    }

    const month = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    const cacheKey = `${month}|${selectedService.id}`;

    if (monthCacheRef.current.has(cacheKey)) {
      setDayStatuses(monthCacheRef.current.get(cacheKey)!);
      return;
    }

    setLoadingMonth(true);
    setDayStatuses(null);

    let cancelled = false;
    fetch(`/api/bookings/calendar-availability?serviceId=${selectedService.id}&month=${month}`)
      .then((res) => {
        if (!res.ok) throw new Error("Calendar fetch failed");
        return res.json() as Promise<{ ok: boolean; days: Record<string, "available" | "full" | "closed"> }>;
      })
      .then((data) => {
        if (cancelled) return;
        monthCacheRef.current.set(cacheKey, data.days ?? {});
        setDayStatuses(data.days ?? {});
      })
      .catch(() => {
        if (!cancelled) setDayStatuses(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingMonth(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth, selectedService?.id]);

  function handleDateChange(date: string) {
    onChange("preferredDate", date);
    onChange("preferredTime", "");
  }

  async function handleNextAvailable() {
    if (!selectedService || nextAvailLoading) return;
    setNextAvailLoading(true);
    setNextAvailError(null);

    try {
      const res = await fetch(`/api/bookings/next-available?serviceId=${selectedService.id}`);
      const data = (await res.json()) as { ok: boolean; date: string | null };
      if (!data.ok || !data.date) {
        setNextAvailError("No availability in the next 60 days — please contact us.");
        return;
      }
      const [year, month] = data.date.split("-").map(Number);
      setViewYear(year);
      setViewMonth(month - 1);
      handleDateChange(data.date);
    } catch {
      setNextAvailError("Could not check availability. Please try again.");
    } finally {
      setNextAvailLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.preferredDate || !values.preferredTime) return;
    onNext();
  }

  const showSlots = values.preferredDate && selectedService;
  const noSlots = showSlots && !loadingSlots && !slotsError && availableSlots.length === 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl text-vynl-black mb-2">Your details</h2>
        <p className="text-sm font-sans text-vynl-gray-500 font-light leading-relaxed">
          Enter your contact info and choose an available appointment slot.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <FieldLabel htmlFor="firstName">First name</FieldLabel>
            <TextInput id="firstName" value={values.firstName} onChange={(v) => onChange("firstName", v)} placeholder="First name" required />
          </div>
          <div>
            <FieldLabel htmlFor="lastName">Last name</FieldLabel>
            <TextInput id="lastName" value={values.lastName} onChange={(v) => onChange("lastName", v)} placeholder="Last name" required />
          </div>
          <div>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <TextInput id="email" type="email" value={values.email} onChange={(v) => onChange("email", v)} placeholder="you@email.com" required />
          </div>
          <div>
            <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
            <TextInput id="phone" type="tel" value={values.phone} onChange={(v) => onChange("phone", v)} placeholder="04xx xxx xxx" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-sans font-medium tracking-widest uppercase text-vynl-gray-500">
              Date
            </span>
            {selectedService && (
              <button
                type="button"
                onClick={handleNextAvailable}
                disabled={nextAvailLoading}
                className={cn(
                  "flex items-center gap-1.5 text-2xs font-sans font-medium tracking-widest uppercase transition-colors",
                  nextAvailLoading ? "text-vynl-gray-300 cursor-not-allowed" : "text-vynl-champagne hover:text-vynl-black"
                )}
              >
                {nextAvailLoading ? (
                  <>
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Searching…
                  </>
                ) : <>Next available →</>}
              </button>
            )}
          </div>
          <CalendarPicker
            value={values.preferredDate}
            onChange={handleDateChange}
            viewYear={viewYear}
            viewMonth={viewMonth}
            onMonthChange={(y, m) => { setViewYear(y); setViewMonth(m); }}
            dayStatuses={dayStatuses}
            loadingAvailability={loadingMonth}
            hasService={!!selectedService}
          />
          {nextAvailError && (
            <p className="mt-2 text-xs font-sans text-vynl-gray-500 bg-vynl-smoke px-3 py-2 border border-vynl-gray-100">
              {nextAvailError}
            </p>
          )}
        </div>

        <div>
          <FieldLabel>Available times</FieldLabel>
          {!values.preferredDate && (
            <p className="text-xs font-sans text-vynl-gray-400">Select a date to see availability</p>
          )}
          {loadingSlots && (
            <div className="flex flex-wrap gap-2">
              {[1,2,3,4,5,6].map((n) => (
                <div key={n} className="w-24 h-10 bg-vynl-smoke animate-pulse border border-vynl-gray-100" />
              ))}
            </div>
          )}
          {slotsError && (
            <p className="text-sm font-sans text-red-500 bg-red-50 px-4 py-3 border border-red-100">{slotsError}</p>
          )}
          {noSlots && (
            <div className="flex items-center gap-3 px-4 py-4 bg-vynl-smoke border border-vynl-gray-100">
              <p className="text-sm font-sans text-vynl-gray-500">No availability — pick another day.</p>
            </div>
          )}
          {!loadingSlots && !slotsError && availableSlots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onChange("preferredTime", slot)}
                  className={cn(
                    "px-4 py-2.5 text-sm font-sans border transition-all",
                    values.preferredTime === slot
                      ? "bg-vynl-black text-vynl-white border-vynl-black"
                      : "bg-vynl-white text-vynl-black border-vynl-gray-200 hover:border-vynl-gray-400"
                  )}
                >
                  {fmtTime(slot)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
          <textarea
            id="notes"
            value={values.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            placeholder="Any allergies, length preferences, or special requests..."
            rows={3}
            className={cn(
              "w-full px-4 py-3 text-sm font-sans font-light text-vynl-black bg-vynl-white",
              "border border-vynl-gray-200 rounded-none outline-none resize-none",
              "placeholder:text-vynl-gray-400",
              "focus:border-vynl-black transition-colors"
            )}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-4 text-sm font-sans font-medium tracking-widest uppercase border border-vynl-gray-200 text-vynl-gray-600 hover:border-vynl-gray-400 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!values.preferredDate || !values.preferredTime}
          className={cn(
            "flex-1 py-4 text-sm font-sans font-medium tracking-widest uppercase transition-all",
            values.preferredDate && values.preferredTime
              ? "bg-vynl-black text-vynl-white hover:bg-vynl-gray-900"
              : "bg-vynl-gray-100 text-vynl-gray-400 cursor-not-allowed"
          )}
        >
          Continue
        </button>
      </div>
    </form>
  );
}

// ── Step 4 — Stripe Payment (inner component) ─────────────────────────────────

function StripePaymentForm({
  bookingId,
  depositCents,
  depositSettings,
  selectedService,
  selectedAddons,
  details,
  inspoFiles,
  inspoUrls,
  onBack,
}: {
  bookingId: string;
  depositCents: number;
  depositSettings: DepositSettings | null;
  selectedService: NailService;
  selectedAddons: NailService[];
  details: DetailsValues;
  inspoFiles: File[];
  inspoUrls: string[];
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const depositLabel = depositSettings?.deposit_type === "percentage"
    ? `${depositSettings.default_deposit_amount}% deposit`
    : `${formatDollars(depositSettings?.default_deposit_amount ?? depositCents / 100)} deposit`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || isProcessing) return;

    setIsProcessing(true);
    setPaymentError(null);

    // Fire-and-forget inspo email (images already uploaded to Blob if available)
    if (inspoFiles.length > 0) {
      try {
        const imageInfos = await Promise.all(
          inspoFiles.map(async (file) => {
            // If we have a blob URL for this file, use it
            // Otherwise fall back to base64
            const blobUrl = inspoUrls[inspoFiles.indexOf(file)];
            if (blobUrl) {
              return { filename: file.name || "image.jpg", url: blobUrl };
            }
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                const data = reader.result as string;
                const comma = data.indexOf(",");
                resolve(comma >= 0 ? data.slice(comma + 1) : data);
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(file);
            });
            return { filename: file.name || "image.jpg", contentType: file.type || "image/jpeg", base64 };
          })
        );

        fetch("/api/booking/inspo-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            clientName: `${details.firstName} ${details.lastName}`.trim(),
            clientEmail: details.email,
            clientPhone: details.phone,
            serviceName: selectedService.name,
            appointmentDate: fmtDate(details.preferredDate),
            appointmentTime: fmtTime(details.preferredTime),
            notes: details.notes,
            skipped: false,
            images: imageInfos,
          }),
        }).catch((err) => console.error("[inspo-email] failed:", err));
      } catch (err) {
        console.error("[inspo-email] encode failed:", err);
      }
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/book/success?bookingId=${bookingId}`,
        payment_method_data: {
          billing_details: {
            name: `${details.firstName} ${details.lastName}`.trim(),
            email: details.email,
          },
        },
      },
    });

    if (error) {
      setPaymentError(error.message ?? "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl text-vynl-black mb-2">Pay deposit</h2>
        <p className="text-sm font-sans text-vynl-gray-500 font-light leading-relaxed">
          A deposit of <strong>{formatCents(depositCents)}</strong> is required to secure your booking.
        </p>
      </div>

      <div className="bg-vynl-smoke p-5 flex flex-col gap-3 border border-vynl-gray-100">
        <p className="text-2xs font-sans tracking-widest uppercase text-vynl-gray-400">Booking Summary</p>
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex justify-between items-start gap-4">
            <span className="text-sm font-sans text-vynl-gray-700">{selectedService.name}</span>
            {selectedService.price_cents > 0 && (
              <span className="text-sm font-sans text-vynl-gray-500 shrink-0">{formatCents(selectedService.price_cents)}</span>
            )}
          </div>
          {selectedAddons.map((addon) => (
            <div key={addon.id} className="flex justify-between items-start gap-4">
              <span className="text-sm font-sans text-vynl-gray-600">+ {addon.name}</span>
              {addon.price_cents > 0 && (
                <span className="text-sm font-sans text-vynl-gray-400 shrink-0">{formatCents(addon.price_cents)}</span>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-sans text-vynl-gray-400">
              {fmtDate(details.preferredDate)} · {fmtTime(details.preferredTime)}
            </span>
          </div>
        </div>
        <div className="border-t border-vynl-gray-200 pt-3 flex justify-between items-center">
          <span className="text-sm font-sans font-medium text-vynl-black">Deposit due today</span>
          <span className="font-display text-xl text-vynl-black">{formatCents(depositCents)}</span>
        </div>
        <p className="text-xs font-sans text-vynl-gray-400">{depositLabel} · remaining balance due on the day</p>
      </div>

      <div className="flex flex-col gap-3">
        <FieldLabel>Card details</FieldLabel>
        <div className="border border-vynl-gray-200 p-4 bg-vynl-white">
          <PaymentElement options={{ layout: "tabs" }} />
        </div>

        {paymentError && (
          <p className="text-sm font-sans text-red-500 bg-red-50 px-4 py-3 border border-red-100">
            {paymentError}
          </p>
        )}

        <p className="text-xs font-sans text-vynl-gray-400 leading-relaxed flex items-center gap-2">
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.2" className="shrink-0 text-vynl-gray-300">
            <rect x="1" y="5" width="10" height="8" rx="1" />
            <path d="M3.5 5V3.5a2.5 2.5 0 015 0V5" strokeLinecap="round" />
          </svg>
          Payments processed securely by Stripe. Your card details never touch our servers.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="px-6 py-4 text-sm font-sans font-medium tracking-widest uppercase border border-vynl-gray-200 text-vynl-gray-600 hover:border-vynl-gray-400 transition-colors disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className={cn(
            "flex-1 py-4 text-sm font-sans font-medium tracking-widest uppercase transition-all",
            stripe && !isProcessing
              ? "bg-vynl-black text-vynl-white hover:bg-vynl-gray-900"
              : "bg-vynl-gray-100 text-vynl-gray-400 cursor-not-allowed"
          )}
        >
          {isProcessing ? "Processing…" : `Pay ${formatCents(depositCents)} Deposit`}
        </button>
      </div>
    </form>
  );
}

// ── Step 4 — Payment (outer: creates booking + payment intent) ────────────────

function PaymentStep({
  selectedService,
  selectedAddons,
  details,
  inspoFiles,
  inspoUrls,
  depositSettings,
  onBack,
  onSuccess,
}: {
  selectedService: NailService;
  selectedAddons: NailService[];
  details: DetailsValues;
  inspoFiles: File[];
  inspoUrls: string[];
  depositSettings: DepositSettings | null;
  onBack: () => void;
  onSuccess: (bookingId: string) => void;
}) {
  const [state, setState] = useState<
    | { phase: "creating" }
    | { phase: "ready"; clientSecret: string; bookingId: string; depositCents: number }
    | { phase: "error"; message: string }
  >({ phase: "creating" });

  const initiated = useRef(false);

  const init = useCallback(async () => {
    if (initiated.current) return;
    initiated.current = true;

    try {
      const depositCents = computeDepositCents(depositSettings, selectedService);

      const createRes = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: details.firstName,
          lastName: details.lastName,
          email: details.email,
          phone: details.phone,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          bookingDate: details.preferredDate,
          bookingTime: details.preferredTime,
          depositAmountCents: depositCents,
          notes: details.notes || null,
          inspoImages: inspoUrls.length > 0 ? inspoUrls : null,
          addons: selectedAddons.map((a) => a.id),
        }),
      });

      const createData = (await createRes.json()) as { ok: boolean; bookingId?: string; error?: string };
      if (!createData.ok || !createData.bookingId) {
        setState({ phase: "error", message: createData.error ?? "Failed to create booking." });
        return;
      }

      const bookingId = createData.bookingId;

      const piRes = await fetch("/api/bookings/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          serviceId: selectedService.id,
          depositType: depositSettings?.deposit_type ?? selectedService.deposit_type,
          depositValue: depositSettings?.default_deposit_amount ?? selectedService.deposit_cents / 100,
          totalPriceCents: selectedService.price_cents,
        }),
      });

      const piData = (await piRes.json()) as {
        ok: boolean;
        clientSecret?: string | null;
        depositAmountCents?: number;
        isFree?: boolean;
        error?: string;
      };

      if (!piData.ok) {
        setState({ phase: "error", message: piData.error ?? "Failed to set up payment." });
        return;
      }

      if (piData.isFree || !piData.clientSecret) {
        onSuccess(bookingId);
        return;
      }

      setState({
        phase: "ready",
        clientSecret: piData.clientSecret,
        bookingId,
        depositCents: piData.depositAmountCents ?? depositCents,
      });
    } catch (err) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Network error. Please try again." });
    }
  }, [details, selectedService, selectedAddons, depositSettings, inspoUrls, onSuccess]);

  useEffect(() => { init(); }, [init]);

  if (state.phase === "creating") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <svg className="animate-spin w-8 h-8 text-vynl-gray-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm font-sans text-vynl-gray-500">Setting up your booking…</p>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-2xl text-vynl-black mb-2">Something went wrong</h2>
          <p className="text-sm font-sans text-red-500 bg-red-50 px-4 py-3 border border-red-100">
            {state.message}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-4 text-sm font-sans font-medium tracking-widest uppercase border border-vynl-gray-200 text-vynl-gray-600 hover:border-vynl-gray-400 transition-colors w-fit"
        >
          Back
        </button>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[480px] border border-dashed border-vynl-gray-200 bg-vynl-smoke p-10 text-center">
        <p className="font-sans font-medium text-vynl-black text-sm">Stripe payments not connected yet</p>
        <p className="text-xs font-sans text-vynl-gray-400 max-w-sm leading-relaxed">
          Fill in <code className="bg-vynl-gray-100 px-1.5 py-0.5 rounded text-vynl-black">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> in{" "}
          <code className="bg-vynl-gray-100 px-1.5 py-0.5 rounded text-vynl-black">.env.local</code>
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: state.clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#0A0A0B",
            colorBackground: "#FFFFFF",
            colorText: "#0A0A0B",
            colorDanger: "#ef4444",
            fontFamily: "system-ui, sans-serif",
            borderRadius: "0px",
          },
        },
      }}
    >
      <StripePaymentForm
        bookingId={state.bookingId}
        depositCents={state.depositCents}
        depositSettings={depositSettings}
        selectedService={selectedService}
        selectedAddons={selectedAddons}
        details={details}
        inspoFiles={inspoFiles}
        inspoUrls={inspoUrls}
        onBack={onBack}
      />
    </Elements>
  );
}

// ── Step 5 — Confirmation ─────────────────────────────────────────────────────

function ConfirmationStep({
  selectedService,
  selectedAddons,
  details,
  bookingId,
}: {
  selectedService: NailService | null;
  selectedAddons: NailService[];
  details: DetailsValues;
  bookingId: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div className="w-16 h-16 rounded-full bg-vynl-black flex items-center justify-center">
          <svg width="22" height="18" viewBox="0 0 22 18" fill="none" stroke="white" strokeWidth="1.5">
            <path d="M1.5 9l6.5 7L20.5 1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-2xl text-vynl-black mb-2">You&apos;re booked in.</h2>
          <p className="text-sm font-sans text-vynl-gray-500 font-light leading-relaxed max-w-sm mx-auto">
            Your deposit has been received. A confirmation email is on its way.
          </p>
        </div>
      </div>

      <div className="bg-vynl-smoke border border-vynl-gray-100 p-6 flex flex-col gap-4">
        <p className="text-2xs font-sans tracking-widest uppercase text-vynl-gray-400">Appointment Confirmation</p>
        <div className="flex flex-col gap-2.5">
          {selectedService && (
            <div className="flex items-start gap-3">
              <span className="text-2xs font-sans tracking-widest uppercase text-vynl-gray-400 w-20 shrink-0 pt-0.5">Service</span>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-sans text-vynl-black font-light">{selectedService.name}</span>
                {selectedAddons.map((a) => (
                  <span key={a.id} className="text-xs font-sans text-vynl-gray-500">+ {a.name}</span>
                ))}
              </div>
            </div>
          )}
          {[
            { label: "Date", value: fmtDate(details.preferredDate) },
            { label: "Time", value: fmtTime(details.preferredTime) },
            { label: "Name", value: `${details.firstName} ${details.lastName}`.trim() },
            { label: "Email", value: details.email },
            ...(details.phone.trim() ? [{ label: "Phone", value: details.phone.trim() }] : []),
            { label: "Ref", value: bookingId.slice(0, 8).toUpperCase() },
          ].map(({ label, value }) =>
            value ? (
              <div key={label} className="flex items-start gap-3">
                <span className="text-2xs font-sans tracking-widest uppercase text-vynl-gray-400 w-20 shrink-0 pt-0.5">{label}</span>
                <span className={cn("text-sm font-sans text-vynl-black font-light break-all", label === "Ref" && "text-xs text-vynl-gray-500 font-mono")}>
                  {value}
                </span>
              </div>
            ) : null
          )}
        </div>
      </div>

      <div className="border border-vynl-champagne/40 bg-vynl-champagne/5 p-6 flex flex-col gap-4">
        <p className="text-2xs font-sans tracking-widest uppercase text-vynl-champagne">What&apos;s Next</p>
        <p className="font-display text-lg text-vynl-black leading-snug">
          We&apos;ll review your inspo and be in touch before your appointment.
        </p>
        <p className="text-sm font-sans text-vynl-gray-600 font-light leading-relaxed">
          If you have more inspo photos to share, feel free to send them via Instagram DM.
          The remaining balance is due on the day.
        </p>
        <a
          href="https://instagram.com/au.vynl"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 text-sm font-sans font-medium text-vynl-black hover:text-vynl-champagne transition-colors"
        >
          <span className="text-vynl-champagne">→</span>
          DM @au.vynl on Instagram
        </a>
      </div>
    </div>
  );
}

// ── BookingFlow (main export) ─────────────────────────────────────────────────

export function BookingFlow() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<NailService | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<NailService[]>([]);
  const [details, setDetails] = useState<DetailsValues>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });
  const [inspoFiles, setInspoFiles] = useState<File[]>([]);
  const [inspoUrls, setInspoUrls] = useState<string[]>([]);
  const [uploadingInspo, setUploadingInspo] = useState(false);
  const [bookingId, setBookingId] = useState("");

  const [services, setServices] = useState<NailService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [depositSettings, setDepositSettings] = useState<DepositSettings | null>(null);

  // Load services
  useEffect(() => {
    let cancelled = false;
    setLoadingServices(true);
    setServicesError(null);

    fetch("/api/services")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load services.");
        return res.json() as Promise<{ ok: boolean; services: NailService[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setServices(Array.isArray(data.services) ? data.services.filter((s) => s.id) : []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setServicesError(err instanceof Error ? err.message : "Could not load services. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoadingServices(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Load deposit settings
  useEffect(() => {
    fetch("/api/booking/deposit-settings")
      .then((res) => res.json())
      .then((data: { ok: boolean; depositSettings?: DepositSettings }) => {
        if (data.ok && data.depositSettings) {
          setDepositSettings(data.depositSettings);
        }
      })
      .catch(() => {});
  }, []);

  function handleDetailChange(key: keyof DetailsValues, value: string) {
    setDetails((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAddon(addon: NailService) {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  }

  async function handleInspoComplete() {
    // Upload inspo files to Vercel Blob
    if (inspoFiles.length === 0) {
      setStep(4);
      return;
    }

    setUploadingInspo(true);
    const uploaded: string[] = [];

    try {
      for (const file of inspoFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload/inspo", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
        if (data.ok && data.url) {
          uploaded.push(data.url);
        } else {
          // Blob upload failed (e.g. token not configured) — continue without URL
          console.warn("[inspo-upload] failed:", data.error);
        }
      }
    } catch (err) {
      console.error("[inspo-upload] error:", err);
    } finally {
      setUploadingInspo(false);
    }

    setInspoUrls(uploaded);
    setStep(4);
  }

  function handlePaymentSuccess(id: string) {
    setBookingId(id);
    setStep(5);
  }

  return (
    <div className="w-full">
      {step < 5 && <StepIndicator current={step} />}

      {step === 1 && (
        <ServiceStep
          services={services}
          loadingServices={loadingServices}
          servicesError={servicesError}
          selectedService={selectedService}
          selectedAddons={selectedAddons}
          onSelectService={(s) => {
            setSelectedService(s);
            setDetails((prev) => ({ ...prev, preferredTime: "" }));
          }}
          onToggleAddon={toggleAddon}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <DetailsStep
          values={details}
          onChange={handleDetailChange}
          selectedService={selectedService}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <div className="flex flex-col gap-0">
          <InspoStep
            files={inspoFiles}
            setFiles={setInspoFiles}
            onBack={() => setStep(2)}
            onContinue={handleInspoComplete}
          />
          {uploadingInspo && (
            <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin w-8 h-8 text-vynl-gray-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm font-sans text-vynl-gray-500">Uploading your photos…</p>
              </div>
            </div>
          )}
        </div>
      )}
      {step === 4 && selectedService && (
        <PaymentStep
          selectedService={selectedService}
          selectedAddons={selectedAddons}
          details={details}
          inspoFiles={inspoFiles}
          inspoUrls={inspoUrls}
          depositSettings={depositSettings}
          onBack={() => setStep(3)}
          onSuccess={handlePaymentSuccess}
        />
      )}
      {step === 5 && (
        <ConfirmationStep
          selectedService={selectedService}
          selectedAddons={selectedAddons}
          details={details}
          bookingId={bookingId}
        />
      )}
    </div>
  );
}
