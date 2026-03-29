"use client";

import { cn } from "@/lib/utils";

interface SquareBookingEmbedProps {
  /** Your Square booking URL from src/config/booking.ts */
  src: string;
  className?: string;
}

/**
 * Embeds the Square Appointments booking flow directly on the page.
 * Square renders its own UI inside the iframe — no extra scripts needed.
 *
 * To get your URL:
 *   Square Dashboard → Appointments → Online Booking → Share booking link
 */
export function SquareBookingEmbed({ src, className }: SquareBookingEmbedProps) {
  const isPlaceholder = src.includes("YOUR_LOCATION_ID");

  if (isPlaceholder) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 min-h-[480px] border border-dashed border-vynl-gray-200 bg-vynl-smoke rounded-lg p-10 text-center",
          className
        )}
      >
        <span className="text-2xl">📅</span>
        <p className="font-sans font-medium text-vynl-black text-sm">
          Square booking not connected yet
        </p>
        <p className="text-xs font-sans text-vynl-gray-400 max-w-sm leading-relaxed">
          Open{" "}
          <code className="bg-vynl-gray-100 px-1.5 py-0.5 rounded text-vynl-black">
            src/config/booking.ts
          </code>{" "}
          and replace{" "}
          <code className="bg-vynl-gray-100 px-1.5 py-0.5 rounded text-vynl-black">
            YOUR_LOCATION_ID
          </code>{" "}
          with your Square booking URL.
        </p>
        <p className="text-2xs font-sans text-vynl-gray-300 tracking-widest uppercase mt-2">
          Square Dashboard → Appointments → Online Booking → Share
        </p>
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title="Book an Appointment — Vynl Nails"
      loading="lazy"
      allow="payment"
      className={cn(
        "w-full border-0 min-h-[700px]",
        className
      )}
    />
  );
}
