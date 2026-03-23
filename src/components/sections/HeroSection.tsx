import { cn } from "@/lib/utils";
import type { HeroSectionData } from "@/types";
import { Container } from "../layout/Container";
import { LabelText, Rule } from "../ui/Typography";
import { PrimaryButton, GhostButton } from "../ui/Buttons";
import { HeroMedia } from "../ui/Media";

interface HeroSectionProps {
  data: HeroSectionData;
  className?: string;
  /** Full-page hero vs compact sub-page hero */
  variant?: "full" | "compact";
}

export function HeroSection({ data, className, variant = "full" }: HeroSectionProps) {
  const { eyebrow, title, titleItalic, subtitle, primaryCTA, secondaryCTA, media } = data;
  const isFull = variant === "full";

  return (
    <section
      className={cn(
        "relative flex items-end overflow-hidden bg-vynl-black",
        isFull ? "min-h-screen" : "min-h-[55vh]",
        className
      )}
    >
      <HeroMedia media={media} />

      {/* Two-layer overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-vynl-black via-vynl-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-vynl-black/60 to-transparent" />

      <Container className="relative z-10 pb-20 md:pb-28 pt-40">
        <div className="max-w-3xl flex flex-col gap-7">
          {eyebrow && (
            <div className="flex items-center gap-4">
              <Rule className="w-8" />
              <LabelText light>{eyebrow}</LabelText>
            </div>
          )}

          <h1
            className={cn(
              "font-display font-medium text-vynl-white text-balance leading-[1.0] tracking-tighter",
              isFull
                ? "text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
                : "text-4xl md:text-5xl lg:text-6xl"
            )}
          >
            {title}{" "}
            {titleItalic && (
              <span className="italic text-vynl-champagne-light">{titleItalic}</span>
            )}
          </h1>

          {subtitle && (
            <p className="text-base md:text-lg font-sans font-light text-vynl-gray-300 max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}

          {(primaryCTA || secondaryCTA) && (
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              {primaryCTA && (
                <PrimaryButton
                  href={primaryCTA.href}
                  size="lg"
                  className="bg-vynl-champagne-light text-vynl-black hover:bg-vynl-nude border-none"
                >
                  {primaryCTA.label}
                </PrimaryButton>
              )}
              {secondaryCTA && (
                <GhostButton
                  href={secondaryCTA.href}
                  size="lg"
                  className="text-vynl-white border-white/30 hover:border-white/60"
                >
                  {secondaryCTA.label}
                </GhostButton>
              )}
            </div>
          )}
        </div>
      </Container>

      {/* Scroll hint */}
      {isFull && (
        <div className="absolute bottom-8 right-8 md:right-16 flex flex-col items-center gap-3">
          <span className="text-2xs font-sans text-vynl-gray-600 tracking-ultra-wide uppercase rotate-90 origin-center">
            Scroll
          </span>
          <div className="w-px h-14 bg-gradient-to-b from-vynl-gray-600 to-transparent" />
        </div>
      )}
    </section>
  );
}
