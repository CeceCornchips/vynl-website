"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { squareConfig } from "@/config/square";
import { InspoStep } from "@/components/booking/InspoStep";
import type { SquareCard } from "@/types/square.d";
import type { CatalogService, ServicesResponse } from "@/app/api/services/route";

// ── Booking item — Square catalog service mapped for the UI ───────────────────

interface BookingItem {
  id: string;          // Square catalog variation ID
  title: string;
  description?: string;
  price?: string;
  duration?: string;
  depositCents: number;
  depositLabel: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toBookingItem(s: CatalogService): BookingItem {
  return {
    id: s.variationId,
    title: s.name,
    description: s.description,
    price: s.priceLabel,
    duration: s.duration,
    depositCents: s.depositCents,
    depositLabel: s.depositLabel,
  };
}

const getLvl = (name: string) => {
  const match = name.match(/LVL\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : Infinity;
};

function sortAddOnsByLvlThenName(items: BookingItem[]): BookingItem[] {
  return [...items].sort((a, b) => {
    const lvlDiff = getLvl(a.title) - getLvl(b.title);
    if (lvlDiff !== 0) return lvlDiff;
    return a.title.localeCompare(b.title);
  });
}

function depositFor(item: BookingItem | null) {
  if (!item) return { cents: 6000, label: "A$60.00" };
  return { cents: item.depositCents, label: item.depositLabel };
}

function addOnDepositFor(item: BookingItem) {
  return { cents: item.depositCents, label: item.depositLabel };
}

function formatCents(cents: number): string {
  return `A$${(cents / 100).toFixed(2)}`;
}

function totalDeposit(service: BookingItem | null, addOns: BookingItem[]) {
  const base = depositFor(service);
  const addOnTotal = addOns.reduce((sum, a) => sum + addOnDepositFor(a).cents, 0);
  const total = base.cents + addOnTotal;
  return { cents: total, label: formatCents(total) };
}

function isConfigured() {
  return (
    squareConfig.appId &&
    !squareConfig.appId.includes("REPLACE") &&
    squareConfig.locationId &&
    !squareConfig.locationId.includes("REPLACE")
  );
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

/** Format an ISO slot timestamp (from Square) into a human-readable time string in Sydney timezone. */
function fmtTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      const comma = data.indexOf(",");
      resolve(comma >= 0 ? data.slice(comma + 1) : data);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Returns YYYY-MM-DD in Australia/Sydney timezone for a given ISO timestamp. */
function toSydneyDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Australia/Sydney",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
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

function SelectInput({
  id,
  value,
  onChange,
  children,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={cn(
        "w-full px-4 py-3 text-sm font-sans font-light text-vynl-black bg-vynl-white",
        "border border-vynl-gray-200 rounded-none outline-none appearance-none",
        "focus:border-vynl-black transition-colors cursor-pointer",
        !value && "text-vynl-gray-400"
      )}
    >
      {children}
    </select>
  );
}

// ── Calendar picker ───────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addCalendarDays(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

function CalendarPicker({
  value,
  onChange,
  viewYear,
  viewMonth,
  onMonthChange,
  availableDates,
  loadingAvailability,
  hasService,
}: {
  value: string;
  onChange: (v: string) => void;
  viewYear: number;
  viewMonth: number;
  onMonthChange: (year: number, month: number) => void;
  /** Set of YYYY-MM-DD strings that have at least one slot. null = data not yet loaded (don't grey anything). */
  availableDates: Set<string> | null;
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
      {/* Loading overlay while fetching month availability */}
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
          // Grey out days with no availability once we have data for this month
          const isUnavailable =
            !isPast && hasService && availableDates !== null && !availableDates.has(cellIso);
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

// ── Step 1 — Service + Add-On Selection ───────────────────────────────────────

function ServiceStep({
  services,
  addOns,
  loadingServices,
  servicesError,
  selectedService,
  selectedAddOns,
  onSelectService,
  onToggleAddOn,
  onNext,
}: {
  services: BookingItem[];
  addOns: BookingItem[];
  loadingServices: boolean;
  servicesError: string | null;
  selectedService: BookingItem | null;
  selectedAddOns: BookingItem[];
  onSelectService: (s: BookingItem) => void;
  onToggleAddOn: (s: BookingItem) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-display text-2xl text-vynl-black mb-2">Select your services</h2>
        <p className="text-sm font-sans text-vynl-gray-500 font-light leading-relaxed">
          Choose one main service, then add any extras below. A deposit secures your booking.
        </p>
      </div>

      {/* ── Main services (radio) ── */}
      <div className="flex flex-col gap-4">
        <p className="text-2xs font-sans font-medium tracking-widest uppercase text-vynl-gray-400">
          Service — choose one
        </p>

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
          <div className="flex flex-col gap-2.5">
            {services.map((service) => {
              const deposit = depositFor(service);
              const isSelected = selectedService?.id === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => onSelectService(service)}
                  className={cn(
                    "w-full text-left border p-5 transition-all duration-200",
                    isSelected
                      ? "border-vynl-black bg-vynl-black"
                      : "border-vynl-gray-200 bg-vynl-white hover:border-vynl-gray-400"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1">
                      <div
                        className={cn(
                          "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                          isSelected ? "border-vynl-champagne" : "border-vynl-gray-300"
                        )}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-vynl-champagne" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "font-display text-base font-medium",
                            isSelected ? "text-vynl-white" : "text-vynl-black"
                          )}
                        >
                          {service.title}
                        </span>
                        {service.description && (
                          <span
                            className={cn(
                              "text-xs font-sans font-light leading-relaxed",
                              isSelected ? "text-vynl-gray-300" : "text-vynl-gray-500"
                            )}
                          >
                            {service.description}
                          </span>
                        )}
                        <div className="flex items-center gap-4 mt-1">
                          {service.price && (
                            <span
                              className={cn(
                                "text-xs font-sans font-medium",
                                isSelected ? "text-vynl-champagne-light" : "text-vynl-black"
                              )}
                            >
                              {service.price}
                            </span>
                          )}
                          {service.duration && (
                            <span className="text-2xs font-sans tracking-widest uppercase text-vynl-gray-400">
                              {service.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-sans font-medium shrink-0",
                        isSelected ? "text-vynl-champagne-light" : "text-vynl-champagne"
                      )}
                    >
                      {deposit.label} deposit
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add-ons (checkboxes) ── */}
      {!loadingServices && !servicesError && addOns.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-2xs font-sans font-medium tracking-widest uppercase text-vynl-gray-400">
            Add-Ons — select all that apply
          </p>
          <div className="flex flex-col gap-2">
            {addOns.map((addon) => {
              const isChecked = selectedAddOns.some((a) => a.id === addon.id);
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => onToggleAddOn(addon)}
                  className={cn(
                    "w-full text-left border px-5 py-4 transition-all duration-200",
                    isChecked
                      ? "border-vynl-gray-400 bg-vynl-smoke"
                      : "border-vynl-gray-100 bg-vynl-white hover:border-vynl-gray-300"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={cn(
                        "w-4 h-4 border-2 flex items-center justify-center shrink-0 transition-all",
                        isChecked ? "border-vynl-black bg-vynl-black" : "border-vynl-gray-300"
                      )}
                    >
                      {isChecked && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" stroke="white" strokeWidth="1.5">
                          <path d="M1 3l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-4 min-w-0">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-sans font-medium text-vynl-black truncate">
                          {addon.title}
                        </span>
                        {addon.description && (
                          <span className="text-xs font-sans font-light text-vynl-gray-500 leading-snug line-clamp-1">
                            {addon.description}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        {addon.price && (
                          <span className="text-xs font-sans font-medium text-vynl-black">
                            {addon.price}
                          </span>
                        )}
                        {addon.duration && (
                          <span className="text-2xs font-sans tracking-widest uppercase text-vynl-gray-400 hidden sm:block">
                            {addon.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
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

// ── Step 2 — Customer Details ─────────────────────────────────────────────────

interface DetailsValues {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  preferredDate: string;
  preferredTime: string; // ISO timestamp from Square availability, e.g. "2025-04-07T10:00:00+10:00"
  notes: string;
}

function DetailsStep({
  values,
  onChange,
  onNext,
  onBack,
  selectedService,
  selectedAddOns,
}: {
  values: DetailsValues;
  onChange: (k: keyof DetailsValues, v: string) => void;
  onNext: () => void;
  onBack: () => void;
  selectedService: BookingItem | null;
  selectedAddOns: BookingItem[];
}) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Calendar month view — lifted here so "Next available" can navigate to the right month
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  // Month-level availability for greying out days (keyed by "<YYYY-MM>|<serviceId>|<addonIds>")
  const monthCacheRef = useRef<Map<string, Set<string>>>(new Map());
  const [availableDatesForView, setAvailableDatesForView] = useState<Set<string> | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);

  // "Next available" button state
  const [nextAvailLoading, setNextAvailLoading] = useState(false);
  const [nextAvailError, setNextAvailError] = useState<string | null>(null);

  // Fetch availability whenever date or selected services change
  useEffect(() => {
    if (!values.preferredDate || !selectedService) {
      setAvailableSlots([]);
      setLoadingSlots(false);
      return;
    }

    setLoadingSlots(true);
    setSlotsError(null);
    setAvailableSlots([]);

    let cancelled = false;
    fetch("/api/square/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceVariationId: selectedService.id,
        addOnVariationIds: selectedAddOns.map((a) => a.id),
        startDate: values.preferredDate,
        endDate: values.preferredDate,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load availability.");
        return res.json() as Promise<{ slots: string[] }>;
      })
      .then((data) => {
        if (!cancelled) setAvailableSlots(data.slots ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setSlotsError(
            err instanceof Error ? err.message : "Could not load availability. Please try again."
          );
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.preferredDate, selectedService?.id, selectedAddOns]);

  // Fetch available dates for the whole viewed month — used to grey out days with no slots.
  // Results are cached per (month × service × add-ons) so navigating back never re-fetches.
  useEffect(() => {
    if (!selectedService) {
      setAvailableDatesForView(null);
      return;
    }

    const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    const cacheKey = `${monthKey}|${selectedService.id}|${selectedAddOns.map((a) => a.id).join(",")}`;

    if (monthCacheRef.current.has(cacheKey)) {
      setAvailableDatesForView(monthCacheRef.current.get(cacheKey)!);
      return;
    }

    setLoadingMonth(true);
    setAvailableDatesForView(null);

    const startDate = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
    const endDate = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    let cancelled = false;
    fetch("/api/square/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceVariationId: selectedService.id,
        addOnVariationIds: selectedAddOns.map((a) => a.id),
        startDate,
        endDate,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Availability fetch failed");
        return res.json() as Promise<{ slots: string[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        const available = new Set<string>(
          (data.slots ?? []).map(toSydneyDate).filter(Boolean)
        );
        monthCacheRef.current.set(cacheKey, available);
        setAvailableDatesForView(available);
      })
      .catch(() => {
        // On error, don't grey anything — let the user try picking dates manually
        if (!cancelled) setAvailableDatesForView(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingMonth(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth, selectedService?.id, selectedAddOns]);

  function handleDateChange(date: string) {
    onChange("preferredDate", date);
    onChange("preferredTime", ""); // reset time slot on date change
  }

  async function handleNextAvailable() {
    if (!selectedService || nextAvailLoading) return;

    setNextAvailLoading(true);
    setNextAvailError(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    async function fetchSlotsRange(start: string, end: string): Promise<string[]> {
      const res = await fetch("/api/square/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceVariationId: selectedService!.id,
          addOnVariationIds: selectedAddOns.map((a) => a.id),
          startDate: start,
          endDate: end,
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch availability");
      const data = (await res.json()) as { slots: string[] };
      return data.slots ?? [];
    }

    try {
      // Square allows max 32 days per query — split into two sequential windows.
      const endWindow1 = isoDate(addCalendarDays(today, 31));
      let slots = await fetchSlotsRange(isoDate(today), endWindow1);

      if (slots.length === 0) {
        const startWindow2 = isoDate(addCalendarDays(today, 32));
        const endWindow2 = isoDate(addCalendarDays(today, 62));
        slots = await fetchSlotsRange(startWindow2, endWindow2);
      }

      if (slots.length === 0) {
        setNextAvailError("No availability in the next 60 days, please contact us");
        return;
      }

      const firstDate = [...slots].map(toSydneyDate).filter(Boolean).sort()[0];
      if (!firstDate) {
        setNextAvailError("No availability in the next 60 days, please contact us");
        return;
      }

      const [year, month] = firstDate.split("-").map(Number);
      setViewYear(year);
      setViewMonth(month - 1);
      handleDateChange(firstDate);
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
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <TextInput
              id="name"
              value={values.customerName}
              onChange={(v) => onChange("customerName", v)}
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <TextInput
              id="email"
              type="email"
              value={values.customerEmail}
              onChange={(v) => onChange("customerEmail", v)}
              placeholder="you@email.com"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
            <TextInput
              id="phone"
              type="tel"
              value={values.customerPhone}
              onChange={(v) => onChange("customerPhone", v)}
              placeholder="04xx xxx xxx"
            />
          </div>
        </div>

        {/* Date */}
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
                  nextAvailLoading
                    ? "text-vynl-gray-300 cursor-not-allowed"
                    : "text-vynl-champagne hover:text-vynl-black"
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
                ) : (
                  <>Next available →</>
                )}
              </button>
            )}
          </div>
          <CalendarPicker
            value={values.preferredDate}
            onChange={handleDateChange}
            viewYear={viewYear}
            viewMonth={viewMonth}
            onMonthChange={(y, m) => { setViewYear(y); setViewMonth(m); }}
            availableDates={availableDatesForView}
            loadingAvailability={loadingMonth}
            hasService={!!selectedService}
          />
          {nextAvailError && (
            <p className="mt-2 text-xs font-sans text-vynl-gray-500 bg-vynl-smoke px-3 py-2 border border-vynl-gray-100">
              {nextAvailError}
            </p>
          )}
          {!values.preferredDate && !nextAvailError && (
            <p className="mt-1.5 text-xs font-sans text-vynl-gray-400">Select a date above</p>
          )}
        </div>

        {/* Available time slots */}
        <div>
          <FieldLabel>Available times</FieldLabel>

          {/* No date or no service yet */}
          {!values.preferredDate && (
            <p className="text-xs font-sans text-vynl-gray-400">Select a date to see availability</p>
          )}
          {values.preferredDate && !selectedService && (
            <p className="text-xs font-sans text-vynl-gray-400">Select a service to see availability</p>
          )}

          {/* Loading */}
          {loadingSlots && (
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="w-24 h-10 bg-vynl-smoke animate-pulse border border-vynl-gray-100" />
              ))}
            </div>
          )}

          {/* Error */}
          {slotsError && (
            <p className="text-sm font-sans text-red-500 bg-red-50 px-4 py-3 border border-red-100">
              {slotsError}
            </p>
          )}

          {/* No availability */}
          {noSlots && (
            <div className="flex items-center gap-3 px-4 py-4 bg-vynl-smoke border border-vynl-gray-100">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-vynl-gray-400 shrink-0">
                <circle cx="8" cy="8" r="7" />
                <path d="M8 5v4M8 11v.5" strokeLinecap="round" />
              </svg>
              <p className="text-sm font-sans text-vynl-gray-500">
                No availability — pick another day.
              </p>
            </div>
          )}

          {/* Slot grid */}
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

        {/* Notes */}
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

// ── Step 4 — Payment ──────────────────────────────────────────────────────────

interface PaymentStepProps {
  sdkReady: boolean;
  selectedService: BookingItem | null;
  selectedAddOns: BookingItem[];
  details: DetailsValues;
  inspoFiles: File[];
  onBack: () => void;
  onSuccess: (paymentId: string) => void;
}

function PaymentStep({
  sdkReady,
  selectedService,
  selectedAddOns,
  details,
  inspoFiles,
  onBack,
  onSuccess,
}: PaymentStepProps) {
  const [cardReady, setCardReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // cardRef holds the live Square Card instance across renders.
  const cardRef = useRef<SquareCard | null>(null);

  const deposit = totalDeposit(selectedService, selectedAddOns);

  useEffect(() => {
    if (!sdkReady || !window.Square) return;

    // Each effect invocation gets its own `cancelled` flag in its closure.
    // Both Strict Mode runs call payments.card() concurrently, but only the
    // second (cancelled=false) run proceeds to attach(). The first run sees
    // cancelled=true after payments.card() resolves and destroys its card
    // without ever touching the container, so the second attach() always
    // finds a clean container and succeeds.
    let cancelled = false;

    const run = async () => {
      let card: SquareCard | undefined;
      try {
        setInitError(null);
        const Sq = window.Square;
        if (!Sq) return;
        const payments = Sq.payments(squareConfig.appId, squareConfig.locationId);
        card = await payments.card({
          style: {
            ".input-container": { borderColor: "#e5e5e5", borderRadius: "0px" },
            ".input-container.is-focus": { borderColor: "#1a1a1a" },
            ".input-container.is-error": { borderColor: "#ef4444" },
            input: {
              backgroundColor: "transparent",
              color: "#1a1a1a",
              fontFamily: "sans-serif",
              fontSize: "14px",
              fontWeight: "300",
            },
            "input::placeholder": { color: "#9ca3af" },
          },
        });

        // Check before attach — if cleanup already fired, discard this card.
        // Letting both runs attach() causes the second to silently no-op
        // (container occupied) and leaves the container empty once the first
        // card is destroyed.
        if (cancelled) {
          card.destroy().catch(() => {});
          return;
        }

        // Clear any stale content left by a previous failed init.
        const container = document.getElementById("square-card-container");
        if (container) container.innerHTML = "";

        await card.attach("#square-card-container");

        if (cancelled) {
          card.destroy().catch(() => {});
          return;
        }

        cardRef.current = card;
        setCardReady(true);
      } catch (err) {
        if (!cancelled) {
          console.error("[Square card init]", err);
          setInitError("Unable to load the payment form. Please refresh and try again.");
        }
        card?.destroy().catch(() => {});
      }
    };

    run();

    return () => {
      cancelled = true;
      const card = cardRef.current;
      if (card) {
        cardRef.current = null;
        card.destroy().catch(() => {});
      }
    };
  }, [sdkReady]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cardRef.current || isProcessing) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const result = await cardRef.current.tokenize();

      if (result.status !== "OK" || !result.token) {
        setPaymentError(
          result.errors?.[0]?.message ?? "Card validation failed. Please check your details."
        );
        setIsProcessing(false);
        return;
      }

      if (inspoFiles.length === 0) {
        setPaymentError("Please go back and upload at least one inspiration photo.");
        setIsProcessing(false);
        return;
      }

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: result.token,
          amountCents: deposit.cents,
          customerName: details.customerName,
          customerEmail: details.customerEmail,
          serviceVariationId: selectedService?.id ?? "",
          serviceName: selectedService?.title ?? "Vynl Nails Service",
          addOnVariationIds: selectedAddOns.map((a) => a.id),
          addOnNames: selectedAddOns.map((a) => a.title),
          addOnDurations: selectedAddOns.map((a) => a.duration ? parseDuration(a.duration) : 30),
          durationMinutes: selectedService?.duration ? parseDuration(selectedService.duration) : 60,
          preferredDate: details.preferredDate,
          preferredTime: details.preferredTime,
          notes: details.notes,
        }),
      });

      const data = (await response.json()) as {
        paymentId?: string;
        bookingId?: string | null;
        syncPending?: boolean;
        error?: string;
      };

      if (!response.ok || !data.paymentId) {
        setPaymentError(data.error ?? "Payment failed. Please try again.");
        setIsProcessing(false);
        return;
      }

      const bookingId = data.bookingId ?? null;
      try {
        const images = await Promise.all(
          inspoFiles.map(async (file) => ({
            filename: file.name || "image.jpg",
            contentType: file.type || "image/jpeg",
            base64: await fileToBase64(file),
          }))
        );

        const emailRes = await fetch("/api/booking/inspo-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: details.customerName,
            clientEmail: details.customerEmail,
            clientPhone: details.customerPhone,
            serviceName: selectedService?.title ?? "",
            addOnNames: selectedAddOns.map((a) => a.title),
            appointmentDate: fmtDate(details.preferredDate),
            appointmentTime: fmtTime(details.preferredTime),
            notes: details.notes,
            skipped: false,
            images,
            ...(bookingId ? { squareBookingId: bookingId } : {}),
            squarePaymentId: data.paymentId,
          }),
        });
        if (!emailRes.ok) {
          const errBody = (await emailRes.json().catch(() => ({}))) as { error?: string };
          console.error(
            "[booking] inspo email failed after payment:",
            errBody.error ?? emailRes.status
          );
        }
      } catch (err) {
        console.error("[booking] inspo email request failed:", err);
      }

      onSuccess(data.paymentId);
    } catch {
      setPaymentError("A network error occurred. Please try again.");
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl text-vynl-black mb-2">Pay deposit</h2>
        <p className="text-sm font-sans text-vynl-gray-500 font-light leading-relaxed">
          A deposit is required to secure your booking.
        </p>
      </div>

      <div className="bg-vynl-smoke p-5 flex flex-col gap-3 border border-vynl-gray-100">
        <p className="text-2xs font-sans tracking-widest uppercase text-vynl-gray-400">
          Booking Summary
        </p>
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex justify-between items-start gap-4">
            <span className="text-sm font-sans text-vynl-gray-700">{selectedService?.title}</span>
            <span className="text-sm font-sans text-vynl-gray-500 shrink-0">
              {depositFor(selectedService).label} deposit
            </span>
          </div>
          {selectedAddOns.map((a) => {
            const adDeposit = addOnDepositFor(a);
            return (
              <div key={a.id} className="flex justify-between items-start gap-4 pl-3 border-l-2 border-vynl-gray-200">
                <span className="text-xs font-sans text-vynl-gray-500">{a.title}</span>
                <span className="text-xs font-sans text-vynl-gray-400 shrink-0">
                  {adDeposit.cents > 0 ? `+${adDeposit.label}` : adDeposit.label}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-sans text-vynl-gray-400">
              {fmtDate(details.preferredDate)} · {fmtTime(details.preferredTime)}
            </span>
          </div>
        </div>
        <div className="border-t border-vynl-gray-200 pt-3 flex justify-between items-center">
          <span className="text-sm font-sans font-medium text-vynl-black">Deposit due today</span>
          <span className="font-display text-xl text-vynl-black">{deposit.label}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <FieldLabel>Card details</FieldLabel>

        <div
          id="square-card-container"
          className={cn(
            "min-h-[89px] transition-colors",
            !cardReady && !initError && "border border-vynl-gray-200 bg-vynl-smoke animate-pulse"
          )}
        />

        {!cardReady && !initError && !sdkReady && (
          <p className="text-xs font-sans text-vynl-gray-400">Loading payment form…</p>
        )}
        {initError && <p className="text-xs font-sans text-red-500">{initError}</p>}
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
          Payments processed securely by Square. Your card details never touch our servers.
          {squareConfig.isSandbox && (
            <span className="ml-1 text-vynl-champagne">[Sandbox — no real charges]</span>
          )}
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
          disabled={!cardReady || isProcessing || !!initError}
          className={cn(
            "flex-1 py-4 text-sm font-sans font-medium tracking-widest uppercase transition-all",
            cardReady && !isProcessing && !initError
              ? "bg-vynl-black text-vynl-white hover:bg-vynl-gray-900"
              : "bg-vynl-gray-100 text-vynl-gray-400 cursor-not-allowed"
          )}
        >
          {isProcessing ? "Processing…" : `Pay ${deposit.label} Deposit`}
        </button>
      </div>
    </form>
  );
}

// ── Step 5 — Confirmation ─────────────────────────────────────────────────────

function ConfirmationStep({
  selectedService,
  selectedAddOns,
  details,
  paymentId,
}: {
  selectedService: BookingItem | null;
  selectedAddOns: BookingItem[];
  details: DetailsValues;
  paymentId: string;
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
            Your deposit has been received. We&apos;ll confirm your exact time by email within 24 hours.
          </p>
        </div>
      </div>

      <div className="bg-vynl-smoke border border-vynl-gray-100 p-6 flex flex-col gap-4">
        <p className="text-2xs font-sans tracking-widest uppercase text-vynl-gray-400">
          Appointment Request
        </p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-3">
            <span className="text-2xs font-sans tracking-widest uppercase text-vynl-gray-400 w-20 shrink-0 pt-0.5">
              Service
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-sans text-vynl-black font-light">
                {selectedService?.title}
              </span>
              {selectedAddOns.map((a) => (
                <span key={a.id} className="text-xs font-sans text-vynl-gray-500">
                  + {a.title}
                </span>
              ))}
            </div>
          </div>
          {[
            { label: "Date", value: fmtDate(details.preferredDate) },
            { label: "Time", value: fmtTime(details.preferredTime) },
            { label: "Name", value: details.customerName },
            { label: "Email", value: details.customerEmail },
            ...(details.customerPhone.trim()
              ? [{ label: "Phone" as const, value: details.customerPhone.trim() }]
              : []),
            { label: "Reference", value: paymentId },
          ].map(({ label, value }) =>
            value ? (
              <div key={label} className="flex items-start gap-3">
                <span className="text-2xs font-sans tracking-widest uppercase text-vynl-gray-400 w-20 shrink-0 pt-0.5">
                  {label}
                </span>
                <span
                  className={cn(
                    "text-sm font-sans text-vynl-black font-light break-all",
                    label === "Reference" && "text-xs text-vynl-gray-500"
                  )}
                >
                  {value}
                </span>
              </div>
            ) : null
          )}
        </div>
      </div>

      <div className="border border-vynl-champagne/40 bg-vynl-champagne/5 p-6 flex flex-col gap-4">
        <p className="text-2xs font-sans tracking-widest uppercase text-vynl-champagne">Next Step</p>
        <p className="font-display text-lg text-vynl-black leading-snug">
          Send your inspo photos via Instagram DM.
        </p>
        <p className="text-sm font-sans text-vynl-gray-600 font-light leading-relaxed">
          The more reference the better — screenshots, saved posts, colour swatches, anything goes.
          We&apos;ll let you know what&apos;s achievable before your appointment.
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

// ── Not-configured placeholder ────────────────────────────────────────────────

function NotConfigured() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[480px] border border-dashed border-vynl-gray-200 bg-vynl-smoke p-10 text-center">
      <span className="text-2xl">💳</span>
      <p className="font-sans font-medium text-vynl-black text-sm">Square payments not connected yet</p>
      <p className="text-xs font-sans text-vynl-gray-400 max-w-sm leading-relaxed">
        Open{" "}
        <code className="bg-vynl-gray-100 px-1.5 py-0.5 rounded text-vynl-black">.env.local</code>{" "}
        and fill in your{" "}
        <code className="bg-vynl-gray-100 px-1.5 py-0.5 rounded text-vynl-black">
          NEXT_PUBLIC_SQUARE_APP_ID
        </code>{" "}
        and{" "}
        <code className="bg-vynl-gray-100 px-1.5 py-0.5 rounded text-vynl-black">
          NEXT_PUBLIC_SQUARE_LOCATION_ID
        </code>
        .
      </p>
      <p className="text-2xs font-sans text-vynl-gray-300 tracking-widest uppercase mt-2">
        developer.squareup.com → Your App → Sandbox Credentials
      </p>
    </div>
  );
}

// ── Duration parser ───────────────────────────────────────────────────────────

function parseDuration(d: string): number {
  const hrs = d.match(/(\d+)\s*hr/);
  const mins = d.match(/(\d+)\s*min/);
  return (hrs ? parseInt(hrs[1]) * 60 : 0) + (mins ? parseInt(mins[1]) : 0) || 60;
}

// ── BookingFlow (main export) ─────────────────────────────────────────────────

export function BookingFlow() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<BookingItem | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<BookingItem[]>([]);
  const [details, setDetails] = useState<DetailsValues>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });
  const [inspoFiles, setInspoFiles] = useState<File[]>([]);
  const [sdkReady, setSdkReady] = useState(false);
  const [paymentId, setPaymentId] = useState("");

  // ── Catalog state ──
  const [services, setServices] = useState<BookingItem[]>([]);
  const [addOns, setAddOns] = useState<BookingItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingServices(true);
    setServicesError(null);

    fetch("/api/services")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load services.");
        return res.json() as Promise<ServicesResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setServices(data.services.map(toBookingItem));
        setAddOns(sortAddOnsByLvlThenName(data.addOns.map(toBookingItem)));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setServicesError(
          err instanceof Error ? err.message : "Could not load services. Please refresh."
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingServices(false);
      });

    return () => { cancelled = true; };
  }, []);

  function handleSelectService(service: BookingItem) {
    setSelectedService(service);
    // Reset time slot — a different service may have different availability
    setDetails((prev) => ({ ...prev, preferredTime: "" }));
  }

  function handleToggleAddOn(addon: BookingItem) {
    setSelectedAddOns((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
    // Reset time slot — total appointment length changes with add-ons
    setDetails((prev) => ({ ...prev, preferredTime: "" }));
  }

  function handleDetailChange(key: keyof DetailsValues, value: string) {
    setDetails((prev) => ({ ...prev, [key]: value }));
  }

  function handleInspoContinue() {
    if (inspoFiles.length === 0) return;
    setStep(4);
  }

  function handlePaymentSuccess(id: string) {
    setPaymentId(id);
    setStep(5);
  }

  if (!isConfigured()) {
    return <NotConfigured />;
  }

  return (
    <>
      <Script
        src={squareConfig.sdkUrl}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />

      <div className="w-full">
        {step < 5 && <StepIndicator current={step} />}

        {step === 1 && (
          <ServiceStep
            services={services}
            addOns={addOns}
            loadingServices={loadingServices}
            servicesError={servicesError}
            selectedService={selectedService}
            selectedAddOns={selectedAddOns}
            onSelectService={handleSelectService}
            onToggleAddOn={handleToggleAddOn}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <DetailsStep
            values={details}
            onChange={handleDetailChange}
            selectedService={selectedService}
            selectedAddOns={selectedAddOns}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <InspoStep
            files={inspoFiles}
            setFiles={setInspoFiles}
            onBack={() => setStep(2)}
            onContinue={handleInspoContinue}
          />
        )}
        {step === 4 && (
          <PaymentStep
            sdkReady={sdkReady}
            selectedService={selectedService}
            selectedAddOns={selectedAddOns}
            details={details}
            inspoFiles={inspoFiles}
            onBack={() => setStep(3)}
            onSuccess={handlePaymentSuccess}
          />
        )}
        {step === 5 && (
          <ConfirmationStep
            selectedService={selectedService}
            selectedAddOns={selectedAddOns}
            details={details}
            paymentId={paymentId}
          />
        )}
      </div>
    </>
  );
}
