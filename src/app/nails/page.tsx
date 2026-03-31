import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/HeroSection";
import { NailCatalogSection } from "@/components/sections/NailCatalogSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { NailsApproachSection } from "@/components/sections/NailsApproachSection";
import { galleryItems, testimonials, nailsFAQs, nailServices, nailAddOns } from "@/data";

export const metadata: Metadata = {
  title: "Vynl Nails: Gel-X Extensions & Advanced Nail Art",
  description:
    "Gel-X extensions and advanced nail art at Vynl. We specialise exclusively in Gel-X. No acrylics, no compromises. Book your appointment.",
};

export default function NailsPage() {
  return (
    <>
      {/* ── Hero ── */}
      <HeroSection
        data={{
          eyebrow: "Gel-X Specialist",
          title: "Advanced nail art,",
          titleItalic: "precisely applied.",
          subtitle:
            "We specialise exclusively in Gel-X extensions and high-detail nail art. No acrylics. No compromise.",
          primaryCTA: { label: "Book Now", href: "/contact" },
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
        primaryCTA={{ label: "Request an Appointment", href: "/contact" }}
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
