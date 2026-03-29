import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/HeroSection";
import { NailCatalogSection } from "@/components/sections/NailCatalogSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { Container } from "@/components/layout/Container";
import { Heading, Subheading, LabelText, BodyText, Rule } from "@/components/ui/Typography";
import { MediaPlaceholder } from "@/components/ui/Media";
import { galleryItems, testimonials, nailsFAQs, nailServices, nailAddOns } from "@/data";

export const metadata: Metadata = {
  title: "Vynl Nails — Gel-X Extensions & Advanced Nail Art",
  description:
    "Gel-X extensions and advanced nail art at Vynl. We specialise exclusively in Gel-X — no acrylics, no compromises. Book your appointment.",
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
      <section className="py-24 md:py-32 bg-vynl-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <Rule />
                <LabelText>Our Approach</LabelText>
              </div>
              <Heading as="h2" size="2xl">
                The Gel-X difference.
              </Heading>
              <div className="flex flex-col gap-5">
                <BodyText className="text-vynl-gray-600">
                  Gel-X is a soft gel extension system that applies directly over your natural
                  nail — no drilling, no primer, no damage. The result is a flexible,
                  lightweight extension that feels natural and wears beautifully.
                </BodyText>
                <BodyText className="text-vynl-gray-600">
                  Combined with our advanced nail art techniques — from minimal chrome to
                  hand-painted 3D florals — every set is designed for the client in front of us.
                </BodyText>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-vynl-gray-100">
                {[
                  { label: "No drill", sub: "Gentle on the nail" },
                  { label: "3–4 weeks", sub: "Typical wear time" },
                  { label: "6 services", sub: "From builder to art" },
                ].map(({ label, sub }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="font-display text-lg text-vynl-black">{label}</span>
                    <span className="text-2xs font-sans text-vynl-gray-400 tracking-widest uppercase">{sub}</span>
                  </div>
                ))}
              </div>
            </div>
            <MediaPlaceholder
              aspect="portrait"
              label="Nail Art Process"
              sublabel="Close-up · Application Shot"
              mood="nude"
            />
          </div>
        </Container>
      </section>

      {/* ── Services ── */}
      <NailCatalogSection nailServices={nailServices} addOns={nailAddOns} />

      {/* ── Gallery ── */}
      <GallerySection
        meta={{
          label: "Gallery",
          title: "The work.",
          subtitle: "A selection of recent sets — everything you see is Gel-X.",
          colorScheme: "dark",
        }}
        items={galleryItems}
        columns={4}
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
