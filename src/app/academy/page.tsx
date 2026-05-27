import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/HeroSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { Container } from "@/components/layout/Container";
import { Heading, LabelText, BodyText, Rule } from "@/components/ui/Typography";
import { ChampagneButton } from "@/components/ui/Buttons";
import { WaitlistForm } from "@/components/forms/Forms";
import { academyWaitlistConfig, academyFAQs } from "@/data";

export const metadata: Metadata = {
  title: "Vynl Academy: Professional Nail Education",
  description:
    "Professional nail education from Vynl. Enrollment opening soon — join the waitlist and get a free course when we launch.",
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
            "Professional nail education from Vynl. Enrollment opening soon — join the waitlist now and get a free course when we launch.",
          primaryCTA: { label: "Join the Waitlist", href: "#waitlist" },
          secondaryCTA: { label: "Learn More", href: "#curriculum" },
          colorScheme: "dark",
        }}
        variant="compact"
      />

      {/* ── The Outcome ── */}
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
                  Vynl Academy is designed to take you from wherever you are right now to a level
                  where you can charge your worth, attract the right clients, and build a real
                  nail brand.
                </BodyText>
              </div>
            </div>

            {/* Before / After */}
            <div className="flex flex-col gap-0 border border-vynl-gray-100">
              <div className="p-8 border-b border-vynl-gray-100">
                <LabelText className="text-vynl-gray-400 mb-4">Before Vynl Academy</LabelText>
                {[
                  "Learning from scattered YouTube tutorials",
                  "Undercharging and undervaluing your work",
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
                  "A brand, not just a service",
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
                body: "No experience required. We start from the very beginning and build from there.",
              },
              {
                title: "You're already practising",
                body: "You've been doing nails but want to elevate your technique, your art, and your prices.",
              },
              {
                title: "You want to build a brand",
                body: "You're not just here for the technique. You want to build something real, with your name on it.",
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

      {/* ── Curriculum ── */}
      <section id="curriculum" className="py-24 md:py-32 bg-vynl-black">
        <Container>
          <div className="flex flex-col items-center text-center gap-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 justify-center">
              <Rule />
              <LabelText light>THE CURRICULUM</LabelText>
              <Rule />
            </div>
            <Heading as="h2" size="2xl" className="text-vynl-white">
              Details coming soon.
            </Heading>
            <BodyText className="text-vynl-gray-400">
              We&apos;re keeping this close to our chest for now. Join the waitlist and be the
              first to see what&apos;s inside.
            </BodyText>
            <ChampagneButton href="#waitlist">Join the Waitlist</ChampagneButton>
          </div>
        </Container>
      </section>

      {/* ── Waitlist ── */}
      <section id="waitlist" className="py-24 md:py-32 bg-vynl-black border-t border-white/10">
        <Container>
          <div className="max-w-lg mx-auto">
            <WaitlistForm {...academyWaitlistConfig} colorScheme="dark" />
          </div>
        </Container>
      </section>

      {/* ── Enrollment CTA ── */}
      <CTASection
        label="Enrollment opening soon"
        title="Your nail brand"
        titleItalic="starts here."
        subtitle="Join the waitlist to secure your free course, early access, and founding member pricing."
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
