"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { GalleryGridItem, SectionMeta } from "@/types";
import { Container } from "../layout/Container";
import { Heading, LabelText, Rule } from "../ui/Typography";
import { GalleryGrid } from "../ui/Media";
import { EASE, VIEWPORT, staggerContainer, fadeUpVariants } from "@/lib/animations";

interface GallerySectionProps {
  meta: SectionMeta;
  items: GalleryGridItem[];
  columns?: 2 | 3 | 4;
  layout?: "grid" | "masonry";
  /** Anchor id — used for deep-link navigation (e.g. /nails#gallery) */
  id?: string;
  /** Optional CTA rendered top-right of the header */
  cta?: { label: string; href: string };
  className?: string;
}

export function GallerySection({
  meta,
  items,
  columns = 4,
  layout = "masonry",
  id,
  cta,
  className,
}: GallerySectionProps) {
  const isDark = meta.colorScheme === "dark";

  return (
    <section
      id={id}
      className={cn(
        isDark ? "bg-vynl-black" : "bg-vynl-white",
        className
      )}
    >
      {/* ── Header — staggered reveal ── */}
      <Container>
        <motion.div
          className="pt-24 md:pt-32 pb-10 md:pb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-16"
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          {/* Left: label + title */}
          <motion.div className="flex flex-col gap-4 min-w-0" variants={fadeUpVariants}>
            {meta.label && (
              <div className="flex items-center gap-3">
                <Rule />
                <LabelText light={isDark}>{meta.label}</LabelText>
              </div>
            )}
            <Heading
              as="h2"
              size="3xl"
              className={cn("max-w-xl", isDark && "text-vynl-white")}
            >
              {meta.title}
            </Heading>
          </motion.div>

          {/* Right: subtitle + CTA */}
          <motion.div
            className="flex flex-col items-start md:items-end gap-4 shrink-0"
            variants={fadeUpVariants}
            transition={{ duration: 0.8, ease: EASE, delay: 0.08 }}
          >
            {meta.subtitle && (
              <p
                className={cn(
                  "text-sm font-sans font-light leading-relaxed md:text-right max-w-xs",
                  isDark ? "text-vynl-gray-500" : "text-vynl-gray-500"
                )}
              >
                {meta.subtitle}
              </p>
            )}
            {cta && (
              <a
                href={cta.href}
                className={cn(
                  "group inline-flex items-center gap-3 text-2xs font-sans font-medium tracking-ultra-wide uppercase transition-opacity duration-300 hover:opacity-70",
                  isDark ? "text-vynl-champagne" : "text-vynl-black"
                )}
              >
                {cta.label}
                <span className="block w-8 h-px bg-current transition-all duration-500 group-hover:w-16" />
              </a>
            )}
            {/* Image count */}
            <span
              className={cn(
                "text-2xs font-sans tracking-widest tabular-nums",
                isDark ? "text-vynl-gray-700" : "text-vynl-gray-300"
              )}
            >
              {String(items.length).padStart(2, "0")} images
            </span>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <div className={cn("h-px w-full mb-1", isDark ? "bg-vynl-gray-800" : "bg-vynl-gray-100")} />
      </Container>

      {/* ── Full-bleed grid ── */}
      <GalleryGrid items={items} columns={columns} layout={layout} />

      {/* Bottom CTA bar (when cta is present) */}
      {cta && (
        <Container>
          <div
            className={cn(
              "mt-1 py-8 border-t flex items-center justify-between",
              isDark ? "border-vynl-gray-800" : "border-vynl-gray-100"
            )}
          >
            <span
              className={cn(
                "text-2xs font-sans tracking-ultra-wide uppercase",
                isDark ? "text-vynl-gray-600" : "text-vynl-gray-400"
              )}
            >
              Vynl Studio · Gel-X Specialist
            </span>
            <a
              href={cta.href}
              className={cn(
                "group inline-flex items-center gap-3 text-2xs font-sans font-medium tracking-ultra-wide uppercase transition-opacity duration-300 hover:opacity-70",
                isDark ? "text-vynl-white" : "text-vynl-black"
              )}
            >
              <span className="block w-6 h-px bg-current transition-all duration-500 group-hover:w-10" />
              {cta.label}
            </a>
          </div>
        </Container>
      )}

      {/* Bottom spacing when no CTA */}
      {!cta && <div className="pb-24 md:pb-32" />}
    </section>
  );
}
