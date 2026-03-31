import { HeroSection } from "@/components/sections/HeroSection";
import { FeatureSection } from "@/components/sections/FeatureSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { CTASection } from "@/components/sections/CTASection";
import { WhyVynlSection } from "@/components/sections/WhyVynlSection";
import { Container } from "@/components/layout/Container";
import { Heading, Subheading, LabelText, Rule } from "@/components/ui/Typography";
import { WaitlistForm } from "@/components/forms/Forms";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import {
  heroData,
  brandPillars,
  galleryItems,
  testimonials,
  academyWaitlistConfig,
} from "@/data";

export default function HomePage() {
  const homeGallery = galleryItems.slice(0, 12);
  return (
    <>
      {/* ── Hero ── */}
      <HeroSection data={heroData} variant="full" />

      {/* ── Brand statement ── */}
      <section className="py-20 md:py-28 bg-vynl-white">
        <Container size="md">
          <AnimatedSection variant="scale">
            <div className="flex flex-col items-center text-center gap-6">
              <Rule />
              <blockquote className="font-display italic text-2xl md:text-3xl lg:text-4xl text-vynl-black leading-snug max-w-2xl">
                &ldquo;Not a generalist salon. Not a beauty counter. A nail
                specialist, where detail is the only standard.&rdquo;
              </blockquote>
              <p className="text-2xs font-sans tracking-ultra-wide uppercase text-vynl-champagne">
                Vynl Studio
              </p>
            </div>
          </AnimatedSection>
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
            "Every set is a collaboration: inspired by you, executed with precision.",
          colorScheme: "dark",
        }}
        items={homeGallery}
        columns={4}
        layout="masonry"
        cta={{ label: "View all work", href: "/nails#gallery" }}
      />

      {/* ── Specialist positioning ── */}
      <WhyVynlSection />

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
          <AnimatedSection>
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
                  and brand building, everything a working nail artist needs in one
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
          </AnimatedSection>
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
