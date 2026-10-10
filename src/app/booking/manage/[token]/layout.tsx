import type { Metadata } from "next";

// Tokenised per-customer page: keep it out of search indexes entirely.
export const metadata: Metadata = {
  title: "Manage Your Booking",
  robots: { index: false, follow: false },
};

export default function ManageBookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
