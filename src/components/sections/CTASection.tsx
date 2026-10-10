"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CTALink, MediaItem } from "@/types";
import { Container } from "../layout/Container";
import { Heading, Subheading, LabelText, Rule } from "../ui/Typography";
import { PrimaryButton, SecondaryButton, GhostButton } from "../ui/Buttons";
import { EASE, VIEWPORT, staggerContainer, fadeUpVariants } from "@/lib/animations";

interface CTASectionProps {
  label?: string;
  title: string;
  titleItalic?: string;
  subtitle?: string;
  primaryCTA?: CTALink;
  secondaryCTA?: CTALink;
  variant?: "black" | "champagne" | "smoke" | "white" | "petal";
  /** Two photos tilted either side of the copy (xl screens up). */
  sidePhotos?: MediaItem[];
  className?: string;
}

export function CTASection({
  label, title, titleItalic, subtitle,
  primaryCTA, secondaryCTA,
  variant = "black", sidePhotos, className,
}: CTASectionProps) {
  const isDark = variant === "black";
  const isChampagne = variant === "champagne";
  const isPetal = variant === "petal";

  return (
    <section
      className={cn(
        "py-24 md:py-32 relative overflow-hidden",
        isDark && "bg-vynl-black",
        isChampagne && "bg-vynl-champagne-light",
        variant === "smoke" && "bg-vynl-smoke",
        variant === "white" && "bg-vynl-white",
        isPetal && "bg-gradient-to-b from-vynl-smoke via-vynl-petal/70 to-vynl-smoke",
        className
      )}
    >
      {sidePhotos?.slice(0, 2).map((photo, i) => (
        <figure
          key={photo.src}
          aria-hidden
          className={cn(
            "float-soft hidden xl:block absolute top-1/2 -mt-36 w-48 2xl:w-56 bg-white p-2 pb-8 rounded-2xl",
            "shadow-[0_18px_40px_-12px_rgba(185,103,127,0.35)]",
            i === 0 ? "left-[5%] 2xl:left-[9%]" : "right-[5%] 2xl:right-[9%]"
          )}
          style={{
            ["--tilt" as string]: i === 0 ? "-6deg" : "6deg",
            transform: `rotate(${i === 0 ? "-6deg" : "6deg"})`,
            animationDelay: i === 0 ? "0s" : "-3.5s",
          }}
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-vynl-petal">
            <Image src={photo.src} alt="" fill sizes="224px" className="object-cover" />
          </div>
        </figure>
      ))}
      {/* Subtle texture overlay */}
      {isDark && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,169,110,0.08),transparent)] pointer-events-none" />
      )}

      <Container className="relative z-10">
        <motion.div
          className="flex flex-col items-center text-center gap-8"
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          {label && (
            <motion.div
              className="flex items-center gap-4 justify-center"
              variants={fadeUpVariants}
            >
              <Rule className={isDark ? "bg-vynl-champagne/40" : undefined} />
              <LabelText light={isDark}>{label}</LabelText>
              <Rule className={isDark ? "bg-vynl-champagne/40" : undefined} />
            </motion.div>
          )}

          <motion.h2
            variants={fadeUpVariants}
            className={cn(
              "font-display font-medium text-balance tracking-tight max-w-3xl",
              "text-4xl md:text-5xl lg:text-6xl",
              isDark ? "text-vynl-white" : "text-vynl-black"
            )}
          >
            {title}{" "}
            {titleItalic && (
              <span className={cn("italic", isDark ? "text-vynl-petal" : isPetal ? "text-vynl-rose-deep" : "text-vynl-champagne-muted")}>
                {titleItalic}
              </span>
            )}
          </motion.h2>

          {subtitle && (
            <motion.div variants={fadeUpVariants}>
              <Subheading
                className={cn(
                  "max-w-xl",
                  isDark ? "text-vynl-gray-400" : isChampagne ? "text-vynl-gray-700" : "text-vynl-gray-500"
                )}
              >
                {subtitle}
              </Subheading>
            </motion.div>
          )}

          {(primaryCTA || secondaryCTA) && (
            <motion.div
              className="flex flex-col sm:flex-row items-center gap-4 mt-2"
              variants={fadeUpVariants}
            >
              {primaryCTA && (
                <PrimaryButton
                  href={primaryCTA.href}
                  external={primaryCTA.external}
                  size="lg"
                  className={cn(
                    isDark && "bg-vynl-petal text-vynl-black hover:bg-vynl-rose border-none",
                    (isChampagne || isPetal) && "bg-vynl-black text-vynl-white"
                  )}
                >
                  {primaryCTA.label}
                </PrimaryButton>
              )}
              {secondaryCTA && (
                <GhostButton
                  href={secondaryCTA.href}
                  external={secondaryCTA.external}
                  size="lg"
                  className={cn(
                    isDark && "text-vynl-white border-white/20 hover:border-white/50",
                    !isDark && "text-vynl-black border-vynl-black/20 hover:border-vynl-black/60"
                  )}
                >
                  {secondaryCTA.label}
                </GhostButton>
              )}
            </motion.div>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
