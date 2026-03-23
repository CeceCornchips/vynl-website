import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { navItems, navCTA, footerData } from "@/data";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Vynl — Gel-X Artistry, Refined.",
  description:
    "Vynl is a premium nail art studio specialising exclusively in Gel-X extensions and advanced nail art. Plus Vynl Academy for professional nail education and Vynl Supply — coming soon.",
  keywords: ["Gel-X nails", "nail art", "nail extensions", "Vynl Academy", "nail education", "luxury nails"],
  openGraph: {
    title: "Vynl — Gel-X Artistry, Refined.",
    description: "Premium Gel-X specialist. Advanced nail art. Vynl Academy. Supply Shop coming soon.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${playfair.variable} ${dmSans.variable} antialiased bg-vynl-white font-sans text-vynl-black`}
      >
        <Navbar logoText="VYNL" items={navItems} cta={navCTA} />
        <main>{children}</main>
        <Footer data={footerData} />
      </body>
    </html>
  );
}
