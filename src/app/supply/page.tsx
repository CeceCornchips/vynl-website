import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Grid } from "@/components/layout/Grid";
import { Heading, Subheading, LabelText, BodyText, Rule } from "@/components/ui/Typography";
import { PrimaryButton } from "@/components/ui/Buttons";
import { MediaPlaceholder } from "@/components/ui/Media";
import { WaitlistForm } from "@/components/forms/Forms";
import { ProductCard } from "@/components/cards/Cards";
import { supplyProducts, shopWaitlistConfig } from "@/data";

export const metadata: Metadata = {
  title: "Vynl Supply — Coming Soon",
  description:
    "Vynl Supply is a premium nail tools and products shop launching soon. Gel-X kits, brushes, nail art tools — curated by a working nail artist. Join the waitlist.",
};

export default function SupplyPage() {
  return (
    <>
      {/* ── Hero: Full-screen coming soon ── */}
      <section className="relative min-h-screen flex items-center justify-center bg-vynl-black overflow-hidden">
        {/* Subtle radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(201,169,110,0.07),transparent)] pointer-events-none" />
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <Container className="relative z-10 flex flex-col items-center text-center gap-8 py-40">
          {/* Drop badge */}
          <span className="inline-flex items-center gap-2 border border-vynl-champagne/30 bg-vynl-champagne/5 px-5 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-vynl-champagne animate-pulse" />
            <span className="text-2xs font-sans text-vynl-champagne tracking-ultra-wide uppercase">
              Launching Soon
            </span>
          </span>

          <h1 className="font-display font-medium text-vynl-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tighter text-balance">
            Vynl Supply
          </h1>

          <p className="font-display italic text-vynl-champagne-light text-xl md:text-2xl">
            Premium tools for artists who take their craft seriously.
          </p>

          <Subheading className="text-vynl-gray-400 max-w-lg">
            Professional-grade Gel-X kits, brushes, and nail art tools — curated by a
            working nail artist, not a bulk supplier.
          </Subheading>

          <PrimaryButton
            href="#waitlist"
            size="lg"
            className="bg-vynl-champagne-light text-vynl-black hover:bg-vynl-nude border-none mt-4"
          >
            Join the Waitlist
          </PrimaryButton>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            <div className="w-px h-12 bg-gradient-to-b from-vynl-gray-600 to-transparent" />
          </div>
        </Container>
      </section>

      {/* ── Product teasers ── */}
      <section className="py-24 md:py-32 bg-vynl-smoke">
        <Container>
          <div className="mb-16 flex flex-col items-center text-center gap-5">
            <div className="flex items-center gap-4 justify-center">
              <Rule />
              <LabelText>Product Preview</LabelText>
              <Rule />
            </div>
            <Heading as="h2" size="2xl" className="max-w-2xl">
              A glimpse of what&apos;s coming.
            </Heading>
            <Subheading className="max-w-lg">
              Every product in Vynl Supply is hand-selected against one standard:
              is this what a serious nail artist actually needs?
            </Subheading>
          </div>
          <Grid cols={3} gap="lg">
            {supplyProducts.map((p) => (
              <ProductCard key={p.id} card={p} />
            ))}
          </Grid>
        </Container>
      </section>

      {/* ── Brand positioning ── */}
      <section className="py-24 md:py-32 bg-vynl-black">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <Rule />
                <LabelText>Why Vynl Supply</LabelText>
              </div>
              <Heading as="h2" size="2xl" className="text-vynl-white max-w-lg">
                Built by an artist. <span className="italic text-vynl-champagne-light">Not a supplier.</span>
              </Heading>
              <div className="flex flex-col gap-6 pt-2">
                {[
                  {
                    title: "Tested in real sets",
                    body: "Every product is used in our studio first. If it doesn't perform there, it doesn't make the shop.",
                  },
                  {
                    title: "No filler. No bulk.",
                    body: "We curate tightly. A small selection of exceptional tools is better than 500 mediocre options.",
                  },
                  {
                    title: "Made for serious nail techs",
                    body: "Whether you're in your first set or your thousandth — Vynl Supply is designed for artists who give a damn.",
                  },
                ].map(({ title, body }) => (
                  <div key={title} className="flex items-start gap-5">
                    <span className="shrink-0 w-px h-14 bg-vynl-champagne/30 mt-1" />
                    <div className="flex flex-col gap-1.5">
                      <Heading as="h3" size="xs" className="text-vynl-white">{title}</Heading>
                      <BodyText size="sm" className="text-vynl-gray-500">{body}</BodyText>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Placeholder brand visual */}
            <div className="grid grid-cols-2 gap-3">
              {["Product shot", "Packaging", "Lifestyle", "Brand visual"].map((label) => (
                <MediaPlaceholder
                  key={label}
                  aspect="square"
                  label={label}
                  mood="dark"
                  cropMarks={false}
                />
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── Waitlist ── */}
      <section id="waitlist" className="py-24 md:py-32 bg-vynl-white">
        <Container size="sm">
          <div className="flex flex-col items-center text-center gap-5 mb-12">
            <div className="flex items-center gap-4 justify-center">
              <Rule />
              <LabelText>Early Access</LabelText>
              <Rule />
            </div>
            <Heading as="h2" size="xl" className="max-w-lg">
              Be first to shop the drop.
            </Heading>
            <Subheading className="max-w-md">
              Waitlist members get exclusive early access, launch-day pricing, and
              first pick before we open to the public.
            </Subheading>
          </div>
          <WaitlistForm {...shopWaitlistConfig} colorScheme="smoke" />
        </Container>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 md:py-24 bg-vynl-black border-t border-white/5">
        <Container className="flex flex-col items-center text-center gap-6">
          <p className="font-display italic text-vynl-champagne-light text-lg md:text-2xl max-w-xl">
            &ldquo;Tools that perform. Products you can trust. A shop built by someone who uses them.&rdquo;
          </p>
          <p className="text-2xs font-sans text-vynl-gray-600 tracking-ultra-wide uppercase">
            Vynl Supply — Launching Soon
          </p>
        </Container>
      </section>
    </>
  );
}
