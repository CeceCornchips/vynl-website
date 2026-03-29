// ── Square Configuration ─────────────────────────────────────────────────────
//
// Environment variables control sandbox vs. production.
// Set in .env.local for local dev; set in your hosting provider's env config
// for production (Vercel, Netlify, etc.).

const env = process.env.NEXT_PUBLIC_SQUARE_ENV ?? "sandbox";

export const squareConfig = {
  appId: process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? "",
  locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "",
  isSandbox: env !== "production",
  sdkUrl:
    env === "production"
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js",
} as const;

// ── Deposit amounts per service (AUD cents) ──────────────────────────────────
// Flat $60 deposit for all services.

export const SERVICE_DEPOSITS: Record<string, { cents: number; label: string }> = {};

export const DEFAULT_DEPOSIT = { cents: 6000, label: "A$60.00" };

// ── Add-on deposit amounts (AUD cents) ───────────────────────────────────────
// Fixed-price add-ons: full price is added to the deposit.
// Variable-price add-ons (nail art): minimum quoted amount; 0 means price is
// discussed at appointment and not added to today's deposit.

export const ADD_ON_DEPOSITS: Record<string, { cents: number; label: string }> = {
  ao1: { cents: 3000, label: "A$30.00" },  // Foreign Soak Off
  ao2: { cents: 2000, label: "A$20.00" },  // French Tips
  ao3: { cents: 0,    label: "Quoted"   },  // Full Colour (price varies)
  ao4: { cents: 1000, label: "A$10.00"  },  // LVL 1 Nail Art (min)
  ao5: { cents: 5000, label: "A$50.00"  },  // LVL 2 Nail Art (min)
  ao6: { cents: 10000, label: "A$100.00" }, // LVL 3 Nail Art (min)
  ao7: { cents: 2000, label: "A$20.00" },  // Soak Off
};

// ── Available time slots ──────────────────────────────────────────────────────

export const TIME_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];
