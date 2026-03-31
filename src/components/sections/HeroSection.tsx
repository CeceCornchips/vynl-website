"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HeroSectionData } from "@/types";
import { Container } from "../layout/Container";
import { LabelText, Rule } from "../ui/Typography";
import { PrimaryButton, GhostButton } from "../ui/Buttons";
import { HeroMedia } from "../ui/Media";
import { EASE } from "@/lib/animations";

interface HeroSectionProps {
  data: HeroSectionData;
  className?: string;
  /** Full-page hero vs compact sub-page hero */
  variant?: "full" | "compact";
}

/** Each text child fades up in sequence */
const textChild = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: EASE, delay },
  }),
};

/** Stagger container for the hero text block */
const textContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.25 },
  },
};

export function HeroSection({ data, className, variant = "full" }: HeroSectionProps) {
  const { eyebrow, title, titleItalic, subtitle, primaryCTA, secondaryCTA, media } = data;
  const isFull = variant === "full";
  const sectionRef = useRef<HTMLElement>(null);

  // Parallax: track hero scroll progress from top-of-viewport to bottom-of-viewport
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Background drifts upward at ~60% the scroll speed — the parallax illusion
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative flex items-end overflow-hidden bg-vynl-black",
        isFull ? "min-h-screen" : "min-h-[55vh]",
        className
      )}
    >
      {/* ── Background: zoom-in on load + parallax on scroll ── */}
      <motion.div
        className="absolute inset-0 origin-center"
        style={{ y: backgroundY }}
        initial={{ scale: 1.12 }}
        animate={{ scale: 1.06 }}
        transition={{ duration: 2.4, ease: EASE }}
      >
        <HeroMedia media={media} />
      </motion.div>

      {/* Two-layer overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-vynl-black via-vynl-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-vynl-black/70 to-transparent" />

      <Container className="relative z-10 pb-20 md:pb-28 pt-40">
        {/* Staggered text reveal */}
        <motion.div
          className="max-w-3xl flex flex-col gap-7"
          variants={textContainer}
          initial="hidden"
          animate="show"
        >
          {eyebrow && (
            <motion.div className="flex items-center gap-4" variants={textChild} custom={0}>
              <Rule className="w-8" />
              <LabelText light>{eyebrow}</LabelText>
            </motion.div>
          )}

          <motion.h1
            variants={textChild}
            custom={0}
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
          </motion.h1>

          {subtitle && (
            <motion.p
              variants={textChild}
              custom={0}
              className="text-base md:text-lg font-sans font-light text-vynl-gray-300 max-w-xl leading-relaxed"
            >
              {subtitle}
            </motion.p>
          )}

          {(primaryCTA || secondaryCTA) && (
            <motion.div
              variants={textChild}
              custom={0}
              className="flex flex-col sm:flex-row gap-4 pt-2"
            >
              {primaryCTA && (
                <PrimaryButton
                  href={primaryCTA.href}
                  size="lg"
                  className="bg-vynl-champagne-light text-vynl-black hover:bg-vynl-nude border-none btn-shimmer"
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
            </motion.div>
          )}
        </motion.div>
      </Container>

      {/* Scroll hint — pulses gently */}
      {isFull && (
        <motion.div
          className="absolute bottom-8 right-8 md:right-16 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8, ease: EASE }}
        >
          <span className="text-2xs font-sans text-vynl-gray-600 tracking-ultra-wide uppercase rotate-90 origin-center">
            Scroll
          </span>
          <div
            className="w-px h-14 bg-gradient-to-b from-vynl-gray-600 to-transparent scroll-pulse-line"
            style={{ animation: "scroll-pulse 2.2s ease-in-out infinite" }}
          />
        </motion.div>
      )}
    </section>
  );
}
