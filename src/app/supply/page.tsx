import type { Metadata } from "next";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Container } from "@/components/layout/Container";
import { SupplyNotifyForm } from "@/components/forms/SupplyNotifyForm";

export const metadata: Metadata = {
  title: "Vynl Supply — Coming Soon",
  description:
    "Carefully curated nail supplies and tools, built for serious nail artists. Coming soon to Vynl — join the list for early access.",
};

export default function SupplyPage() {
  return (
    <div className="relative min-h-screen bg-vynl-black overflow-hidden flex flex-col">

      {/* ── Ambient background blobs ──────────────────────────────────────── */}
      <div className="pointer-events-none select-none" aria-hidden="true">
        {/* Top-left warm glow */}
        <div
          className="supply-blob-1 absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.12]"
          style={{
            background: "radial-gradient(circle, rgba(201,169,110,1) 0%, transparent 70%)",
            filter: "blur(72px)",
          }}
        />
        {/* Bottom-right warm glow */}
        <div
          className="supply-blob-2 absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, rgba(201,169,110,1) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Centre accent — very subtle */}
        <div
          className="supply-blob-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, rgba(255,240,200,1) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        {/* Fine grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <Container className="relative z-10 flex-1 flex flex-col items-center justify-center text-center gap-0 py-40">

        {/* Badge */}
        <AnimatedSection delay={0.05}>
          <div className="inline-flex items-center gap-2.5 border border-vynl-champagne/25 bg-vynl-champagne/5 px-5 py-2 mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-vynl-champagne animate-pulse" />
            <span className="text-2xs font-sans text-vynl-champagne tracking-ultra-wide uppercase">
              Coming Soon
            </span>
          </div>
        </AnimatedSection>

        {/* Main headline */}
        <AnimatedSection delay={0.1}>
          <h1 className="font-display font-medium text-vynl-white tracking-tighter leading-[0.92] text-balance mb-0">
            <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl">
              Supply
            </span>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl italic text-vynl-champagne-light mt-1">
              Drop.
            </span>
          </h1>
        </AnimatedSection>

        {/* Divider rule */}
        <AnimatedSection delay={0.18}>
          <div className="w-12 h-px bg-vynl-champagne/40 my-10" />
        </AnimatedSection>

        {/* Subtext */}
        <AnimatedSection delay={0.22}>
          <p className="text-base md:text-lg font-sans font-light text-vynl-gray-400 max-w-sm leading-relaxed mb-12">
            Carefully curated nail supplies and tools,
            built by a working nail artist.{" "}
            <span className="text-vynl-gray-300">Coming soon to Vynl.</span>
          </p>
        </AnimatedSection>

        {/* Email capture */}
        <AnimatedSection delay={0.3} className="w-full max-w-md">
          <div className="flex flex-col gap-3">
            <SupplyNotifyForm />
            <p className="text-2xs font-sans text-vynl-gray-700 tracking-widest">
              No spam. Just an alert when the drop happens.
            </p>
          </div>
        </AnimatedSection>

      </Container>

      {/* ── Bottom tag ───────────────────────────────────────────────────── */}
      <AnimatedSection delay={0.4}>
        <footer className="relative z-10 py-8 border-t border-white/5">
          <p className="text-center text-2xs font-sans text-vynl-gray-700 tracking-ultra-wide uppercase">
            Vynl Supply · Tools built for artists who give a damn
          </p>
        </footer>
      </AnimatedSection>

    </div>
  );
}
