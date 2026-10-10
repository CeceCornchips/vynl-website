import type { Metadata } from "next";

// Post-payment receipt page: never useful in search results.
export const metadata: Metadata = {
  title: "Booking Confirmed",
  robots: { index: false, follow: false },
};

export default function BookSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
