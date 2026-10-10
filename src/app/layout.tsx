import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { PageTransition } from "@/components/ui/PageTransition";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, nailSalonSchema, websiteSchema } from "@/lib/seo";
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

const DEFAULT_TITLE = "Vynl | Gel-X Nail Studio in Cranebrook & Penrith, Sydney";
const DEFAULT_DESCRIPTION =
  "Gel-X nail studio in Cranebrook, NSW, minutes from Penrith. Gel-X extensions and advanced nail art only — no acrylics — by appointment. Plus Vynl Academy nail training.";

export const metadata: Metadata = {
  // Required for og:image, canonicals and og:url to resolve to absolute URLs.
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | Vynl",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: "Vynl",
  keywords: [
    "Gel-X nails Cranebrook",
    "Gel-X nails Penrith",
    "nail salon Cranebrook",
    "nail extensions Penrith",
    "nail art Western Sydney",
    "nail course Australia",
    "Vynl Academy",
  ],
  // No site-wide canonical: a canonical set here is inherited by every page that
  // forgets its own, silently pointing it at the homepage. Each page declares
  // its own `alternates.canonical` instead.
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Vynl",
    url: SITE_URL,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  // Title and description are left to fall back to each page's Open Graph
  // tags. Setting them here would stamp the homepage title on every share card.
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className="scroll-smooth">
      <head>
        <JsonLd data={nailSalonSchema()} />
        <JsonLd data={websiteSchema()} />
      </head>
      <body
        className={`${playfair.variable} ${dmSans.variable} antialiased bg-vynl-white font-sans text-vynl-black`}
      >
        <MotionProvider>
          <Navbar logoText="VYNL" items={navItems} cta={navCTA} />
          <main>
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer data={footerData} />
        </MotionProvider>
        {/* Vercel Web Analytics + Speed Insights (cookieless). Vercel serves their
            scripts once both are enabled in the project dashboard; locally the
            script requests 404 harmlessly and nothing is counted. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
