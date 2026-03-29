import { HeroSection } from "@/components/sections/HeroSection";
import { FeatureSection } from "@/components/sections/FeatureSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { CTASection } from "@/components/sections/CTASection";
import { Container } from "@/components/layout/Container";
import { Heading, Subheading, LabelText, Rule } from "@/components/ui/Typography";
import { WaitlistForm } from "@/components/forms/Forms";
import {
  heroData,
  brandPillars,
  galleryItems,
  testimonials,
  academyWaitlistConfig,
} from "@/data";
import { fetchBeholdGalleryItems } from "@/lib/behold-feed";
import type { GalleryGridItem } from "@/types";

export const revalidate = 86400;

function homeGalleryPlaceholders(): GalleryGridItem[] {
  return galleryItems.slice(0, 8).map(({ id, alt, aspect }) => ({
    id,
    alt,
    aspect,
  }));
}

export default async function HomePage() {
  const beholdGallery = await fetchBeholdGalleryItems(8);
  const galleryGridItems = beholdGallery ?? homeGalleryPlaceholders();
  return (
    <>
      {/* ── Hero ── */}
      <HeroSection data={heroData} variant="full" />

      {/* ── Brand statement ── */}
      <section className="py-20 md:py-28 bg-vynl-white">
        <Container size="md">
          <div className="flex flex-col items-center text-center gap-6">
            <Rule />
            <blockquote className="font-display italic text-2xl md:text-3xl lg:text-4xl text-vynl-black leading-snug max-w-2xl">
              &ldquo;Not a generalist salon. Not a beauty counter. A nail
              specialist — where detail is the only standard.&rdquo;
            </blockquote>
            <p className="text-2xs font-sans tracking-ultra-wide uppercase text-vynl-champagne">
              Vynl Studio
            </p>
          </div>
        </Container>
      </section>

      {/* ── Brand Pillars ── */}
      <FeatureSection
        meta={{
          label: "The Vynl Ecosystem",
          title: "Three ways to experience Vynl",
          subtitle:
            "A studio. An academy. A supply shop. One obsession with quality.",
          align: "left",
          colorScheme: "smoke",
        }}
        features={brandPillars}
        cardVariant="bordered"
        cols={3}
      />

      {/* ── Gallery teaser ── */}
      <GallerySection
        meta={{
          label: "The Work",
          title: "Gel-X sets that speak for themselves.",
          subtitle:
            "Every set is a collaboration — inspired by you, executed with precision.",
          colorScheme: "dark",
        }}
        items={galleryGridItems}
        columns={4}
      />

      {/* ── Specialist positioning ── */}
      <section className="py-24 md:py-32 bg-vynl-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Text */}
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <Rule />
                <LabelText>Why Vynl</LabelText>
              </div>
              <Heading as="h2" size="2xl" className="max-w-lg">
                We do one thing. <span className="italic text-vynl-champagne">Exceptionally well.</span>
              </Heading>
              <div className="flex flex-col gap-5">
                <Subheading>
                  Vynl is a Gel-X specialist — full stop. No acrylic. No gel polish only.
                  No compromises.
                </Subheading>
                <Subheading>
                  Our singular focus on Gel-X extensions and advanced nail art means every
                  technique, every product, and every process is optimised for one outcome:
                  the most flawless nails possible.
                </Subheading>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-4">
                {[
                  { stat: "Gel-X", label: "Extensions Only" },
                  { stat: "Level 1–3", label: "Nail Art Tiers" },
                  { stat: "100%", label: "By Appointment" },
                  { stat: "0", label: "Drills. Ever." },
                ].map(({ stat, label }) => (
                  <div key={label} className="flex flex-col gap-1 border-t border-vynl-gray-100 pt-5">
                    <span className="font-display text-2xl md:text-3xl text-vynl-black">{stat}</span>
                    <span className="text-2xs font-sans text-vynl-gray-400 tracking-widest uppercase">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Media placeholder */}
            <div className="relative">
              <div className="aspect-[3/4] w-full max-w-sm ml-auto">
                <div className="absolute inset-0 bg-vynl-nude -rotate-2 translate-x-3 translate-y-3 opacity-30" />
                <div className="relative h-full bg-gradient-to-br from-vynl-gray-800 to-vynl-black flex items-center justify-center">
                  {/* Corner marks */}
                  <span className="absolute top-5 left-5 w-7 h-7 border-t border-l border-vynl-champagne/40" />
                  <span className="absolute top-5 right-5 w-7 h-7 border-t border-r border-vynl-champagne/40" />
                  <span className="absolute bottom-5 left-5 w-7 h-7 border-b border-l border-vynl-champagne/40" />
                  <span className="absolute bottom-5 right-5 w-7 h-7 border-b border-r border-vynl-champagne/40" />
                  <div className="text-center">
                    <p className="text-2xs font-sans text-vynl-gray-500 tracking-ultra-wide uppercase mb-2">Campaign Image</p>
                    <p className="text-2xs font-sans text-vynl-gray-700 tracking-widest">Portrait · Close-up nail shot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Testimonials ── */}
      <TestimonialsSection
        meta={{
          label: "From the Chair",
          title: "What clients say.",
          colorScheme: "dark",
        }}
        testimonials={testimonials.filter((_, i) => i % 2 === 0)}
      />

      {/* ── Academy teaser ── */}
      <section className="py-24 md:py-32 bg-vynl-smoke">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="flex flex-col gap-7">
              <div className="flex items-center gap-4">
                <Rule />
                <LabelText>Vynl Academy</LabelText>
              </div>
              <Heading as="h2" size="2xl" className="max-w-lg">
                Built for nail artists ready to{" "}
                <span className="italic">elevate.</span>
              </Heading>
              <Subheading className="max-w-md">
                Gel-X mastery, nail art technique, content creation, pricing,
                and brand building — everything a working nail artist needs in one
                professional programme.
              </Subheading>
              <ul className="flex flex-col gap-3 pt-2">
                {[
                  "Gel-X application from foundation",
                  "Advanced nail art & 3D techniques",
                  "Content creation & brand building",
                  "Pricing, clients & business strategy",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-vynl-champagne text-xs mt-0.5">—</span>
                    <span className="text-sm font-sans font-light text-vynl-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <WaitlistForm {...academyWaitlistConfig} colorScheme="smoke" />
          </div>
        </Container>
      </section>

      {/* ── Final CTA ── */}
      <CTASection
        label="Ready?"
        title="Your best nails"
        titleItalic="start here."
        subtitle="Book a Gel-X appointment and experience what specialist means."
        primaryCTA={{ label: "Book an Appointment", href: "/contact" }}
        secondaryCTA={{ label: "View Services", href: "/nails" }}
        variant="black"
      />
    </>
  );
}
