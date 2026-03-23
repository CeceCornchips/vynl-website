import { cn } from "@/lib/utils";
import type { CTALink } from "@/types";
import { Container } from "../layout/Container";
import { Heading, Subheading, LabelText, Rule } from "../ui/Typography";
import { PrimaryButton, SecondaryButton, GhostButton } from "../ui/Buttons";

interface CTASectionProps {
  label?: string;
  title: string;
  titleItalic?: string;
  subtitle?: string;
  primaryCTA?: CTALink;
  secondaryCTA?: CTALink;
  variant?: "black" | "champagne" | "smoke" | "white";
  className?: string;
}

export function CTASection({
  label, title, titleItalic, subtitle,
  primaryCTA, secondaryCTA,
  variant = "black", className,
}: CTASectionProps) {
  const isDark = variant === "black";
  const isChampagne = variant === "champagne";

  return (
    <section
      className={cn(
        "py-24 md:py-32 relative overflow-hidden",
        isDark && "bg-vynl-black",
        isChampagne && "bg-vynl-champagne-light",
        variant === "smoke" && "bg-vynl-smoke",
        variant === "white" && "bg-vynl-white",
        className
      )}
    >
      {/* Subtle texture overlay */}
      {isDark && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,169,110,0.08),transparent)] pointer-events-none" />
      )}

      <Container className="relative z-10 flex flex-col items-center text-center gap-8">
        {label && (
          <div className="flex items-center gap-4 justify-center">
            <Rule className={isDark ? "bg-vynl-champagne/40" : undefined} />
            <LabelText light={isDark}>{label}</LabelText>
            <Rule className={isDark ? "bg-vynl-champagne/40" : undefined} />
          </div>
        )}

        <h2
          className={cn(
            "font-display font-medium text-balance tracking-tight max-w-3xl",
            "text-4xl md:text-5xl lg:text-6xl",
            isDark ? "text-vynl-white" : "text-vynl-black"
          )}
        >
          {title}{" "}
          {titleItalic && (
            <span className={cn("italic", isDark ? "text-vynl-champagne-light" : "text-vynl-champagne-muted")}>
              {titleItalic}
            </span>
          )}
        </h2>

        {subtitle && (
          <Subheading
            className={cn(
              "max-w-xl",
              isDark ? "text-vynl-gray-400" : isChampagne ? "text-vynl-gray-700" : "text-vynl-gray-500"
            )}
          >
            {subtitle}
          </Subheading>
        )}

        {(primaryCTA || secondaryCTA) && (
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            {primaryCTA && (
              <PrimaryButton
                href={primaryCTA.href}
                size="lg"
                className={cn(
                  isDark && "bg-vynl-champagne-light text-vynl-black hover:bg-vynl-nude border-none",
                  isChampagne && "bg-vynl-black text-vynl-white"
                )}
              >
                {primaryCTA.label}
              </PrimaryButton>
            )}
            {secondaryCTA && (
              <GhostButton
                href={secondaryCTA.href}
                size="lg"
                className={cn(
                  isDark && "text-vynl-white border-white/20 hover:border-white/50",
                  !isDark && "text-vynl-black border-vynl-black/20 hover:border-vynl-black/60"
                )}
              >
                {secondaryCTA.label}
              </GhostButton>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
