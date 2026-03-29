import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/HeroSection";
import { AcademySection } from "@/components/sections/AcademySection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { Container } from "@/components/layout/Container";
import { Heading, Subheading, LabelText, BodyText, Rule } from "@/components/ui/Typography";
import { MediaPlaceholder } from "@/components/ui/Media";
import {
  academyModules,
  academyWaitlistConfig,
  testimonials,
  academyFAQs,
} from "@/data";

export const metadata: Metadata = {
  title: "Vynl Academy — Professional Nail Education",
  description:
    "Vynl Academy teaches Gel-X mastery, advanced nail art, content creation, pricing, and brand building. Join the waitlist for the first cohort.",
};

export default function AcademyPage() {
  return (
    <>
      {/* ── Hero ── */}
      <HeroSection
        data={{
          eyebrow: "Vynl Academy",
          title: "Built for nail artists",
          titleItalic: "ready to elevate.",
          subtitle:
            "Professional nail education from foundation technique to full brand-building. Not just a course — a transformation.",
          primaryCTA: { label: "Join the Waitlist", href: "#waitlist" },
          secondaryCTA: { label: "View Curriculum", href: "#curriculum" },
          colorScheme: "dark",
        }}
        variant="compact"
      />

      {/* ── Transformation ── */}
      <section className="py-24 md:py-32 bg-vynl-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <Rule />
                <LabelText>The Outcome</LabelText>
              </div>
              <Heading as="h2" size="2xl">
                From learning to{" "}
                <span className="italic text-vynl-champagne">fully booked.</span>
              </Heading>
              <div className="flex flex-col gap-5">
                <BodyText className="text-vynl-gray-600">
                  Vynl Academy is designed to take you from wherever you are right now — zero
                  experience or already practising — and bring you to a level where you can
                  charge your worth, attract the right clients, and build a real nail brand.
                </BodyText>
                <BodyText className="text-vynl-gray-600">
                  We cover everything generalist courses leave out: the techniques, yes —
                  but also the business, the content, the brand, and the confidence.
                </BodyText>
              </div>
            </div>

            {/* Before / After */}
            <div className="flex flex-col gap-0 border border-vynl-gray-100">
              <div className="p-8 border-b border-vynl-gray-100">
                <LabelText className="text-vynl-gray-400 mb-4">Before Vynl Academy</LabelText>
                {[
                  "Learning from YouTube tutorials",
                  "Undercharging and undervaluing",
                  "Inconsistent technique",
                  "No clear brand identity",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 py-2.5 border-b border-vynl-gray-50 last:border-0">
                    <span className="text-vynl-gray-300 text-xs mt-0.5">×</span>
                    <span className="text-sm font-sans font-light text-vynl-gray-400">{item}</span>
                  </div>
                ))}
              </div>
              <div className="p-8 bg-vynl-black">
                <LabelText className="mb-4">After Vynl Academy</LabelText>
                {[
                  "Confident, consistent Gel-X technique",
                  "Charging what your work deserves",
                  "Advanced nail art skills that stand out",
                  "A brand — not just a service",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 py-2.5 border-b border-white/8 last:border-0">
                    <span className="text-vynl-champagne text-xs mt-0.5">✓</span>
                    <span className="text-sm font-sans font-light text-vynl-gray-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Who it's for ── */}
      <section className="py-20 md:py-24 bg-vynl-smoke">
        <Container>
          <div className="flex flex-col items-center text-center gap-6 mb-14">
            <div className="flex items-center gap-4 justify-center">
              <Rule />
              <LabelText>Who it&apos;s for</LabelText>
              <Rule />
            </div>
            <Heading as="h2" size="xl" className="max-w-xl">
              The academy is for you if…
            </Heading>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-vynl-gray-200">
            {[
              {
                title: "You're brand new",
                body: "No experience required. We start from the very beginning of Gel-X application and build from there.",
              },
              {
                title: "You're already practising",
                body: "You've been doing nails but want to elevate your technique, your art, and your prices.",
              },
              {
                title: "You want to build a brand",
                body: "You're not just here for the technique — you want to build something real, with your name on it.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-vynl-smoke p-10 flex flex-col gap-4">
                <Heading as="h3" size="sm">{title}</Heading>
                <BodyText size="sm" muted>{body}</BodyText>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Curriculum + Waitlist ── */}
      <AcademySection
        meta={{
          label: "Curriculum",
          title: "Six modules. One transformation.",
          subtitle:
            "Each module builds on the last — from application foundations to running a fully booked nail brand.",
          colorScheme: "dark",
        }}
        modules={academyModules}
        waitlistConfig={academyWaitlistConfig}
      />

      {/* ── Testimonials ── */}
      <TestimonialsSection
        meta={{
          label: "From Graduates",
          title: "Real results.",
          colorScheme: "smoke",
        }}
        testimonials={testimonials.filter((_, i) => i % 2 !== 0)}
      />

      {/* ── Final CTA ── */}
      <CTASection
        label="Enrollment opening soon"
        title="Your nail brand"
        titleItalic="starts here."
        subtitle="Join the waitlist to secure early access, founding member pricing, and exclusive pre-launch content."
        primaryCTA={{ label: "Join the Waitlist", href: "#waitlist" }}
        variant="black"
      />

      {/* ── FAQ ── */}
      <FAQSection
        meta={{
          label: "FAQ",
          title: "Questions about the Academy.",
          colorScheme: "light",
        }}
        items={academyFAQs}
      />
    </>
  );
}
