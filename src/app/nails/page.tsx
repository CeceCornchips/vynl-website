import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/HeroSection";
import { NailCatalogSection } from "@/components/sections/NailCatalogSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { NailsApproachSection } from "@/components/sections/NailsApproachSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/seo";
import { galleryItems, testimonials, nailsFAQs, nailServices, nailAddOns } from "@/data";

const PATH = "/nails";
const TITLE = "Gel-X Nails Cranebrook & Penrith | Extensions & Nail Art";
const DESCRIPTION =
  "Gel-X nail extensions and advanced nail art in Cranebrook, NSW — minutes from Penrith, Jordan Springs and Glenmore Park. Gel-X only, no acrylics. Book online.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Vynl",
    url: PATH,
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function NailsPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            name: "Gel-X nail extensions and nail art",
            description: DESCRIPTION,
            path: PATH,
            serviceType: "Gel-X nail extensions",
            // Catalogue entries use `title`, and prices are display strings.
            offers: nailServices.map(({ title, description, price }) => ({
              name: title,
              description,
              price,
            })),
          }),
          faqSchema(nailsFAQs),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Gel-X Nails", path: PATH },
          ]),
        ]}
      />

      {/* ── Hero ── */}
      <HeroSection
        data={{
          eyebrow: "Gel-X Specialist",
          title: "Advanced nail art,",
          titleItalic: "precisely applied.",
          subtitle:
            "We specialise exclusively in Gel-X extensions and high-detail nail art. No acrylics. No compromise.",
          primaryCTA: { label: "Book Now", href: "https://vynl.square.site/s/appointments", external: true },
          secondaryCTA: { label: "View Services", href: "#services" },
          colorScheme: "dark",
        }}
        variant="compact"
      />

      {/* ── About / Gel-X explainer ── */}
      <NailsApproachSection />

      {/* ── Services ── */}
      <NailCatalogSection nailServices={nailServices} addOns={nailAddOns} />

      {/* ── Gallery ── */}
      <GallerySection
        id="gallery"
        meta={{
          label: "Gallery",
          title: "The work.",
          subtitle: "Every set you see here is Gel-X. No exceptions.",
          colorScheme: "dark",
        }}
        items={galleryItems}
        columns={3}
        layout="masonry"
      />

      {/* ── Testimonials ── */}
      <TestimonialsSection
        meta={{
          label: "Client Reviews",
          title: "What they said.",
          colorScheme: "smoke",
        }}
        testimonials={testimonials.filter((_, i) => i % 2 === 0)}
      />

      {/* ── Booking CTA ── */}
      <CTASection
        label="Book your set"
        title="Ready to wear"
        titleItalic="your best nails?"
        subtitle="All services are by online booking only. Select your service, choose a time, and pay your deposit instantly via Square."
        primaryCTA={{ label: "Request an Appointment", href: "https://vynl.square.site/s/appointments", external: true }}
        variant="black"
      />

      {/* ── FAQ ── */}
      <FAQSection
        meta={{
          label: "FAQ",
          title: "Common questions.",
          colorScheme: "light",
        }}
        items={nailsFAQs}
      />
    </>
  );
}
