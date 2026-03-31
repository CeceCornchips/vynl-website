"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TestimonialCardData, SectionMeta } from "@/types";
import { Container } from "../layout/Container";
import { Heading, Subheading, LabelText, Rule } from "../ui/Typography";
import { TestimonialCard } from "../cards/Cards";
import { VIEWPORT, staggerContainer, fadeUpVariants } from "@/lib/animations";

interface TestimonialsSectionProps {
  meta: SectionMeta;
  testimonials: TestimonialCardData[];
  className?: string;
}

export function TestimonialsSection({ meta, testimonials, className }: TestimonialsSectionProps) {
  const isDark = meta.colorScheme !== "light" && meta.colorScheme !== "smoke";

  return (
    <section
      className={cn(
        "py-24 md:py-32",
        isDark ? "bg-vynl-black" : "bg-vynl-smoke",
        className
      )}
    >
      <Container>
        {/* Header */}
        <motion.div
          className="mb-16 flex flex-col gap-5 items-center text-center"
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          {meta.label && (
            <motion.div className="flex items-center gap-4 justify-center" variants={fadeUpVariants}>
              <Rule />
              <LabelText light={isDark}>{meta.label}</LabelText>
              <Rule />
            </motion.div>
          )}
          <motion.div variants={fadeUpVariants}>
            <Heading
              as="h2"
              size="xl"
              className={cn("max-w-xl", isDark && "text-vynl-white")}
            >
              {meta.title}
            </Heading>
          </motion.div>
          {meta.subtitle && (
            <motion.div variants={fadeUpVariants}>
              <Subheading
                className={cn("max-w-lg", isDark && "text-vynl-gray-400")}
              >
                {meta.subtitle}
              </Subheading>
            </motion.div>
          )}
        </motion.div>

        {/* Cards — staggered */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
          variants={staggerContainer(0.12, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          {testimonials.map((t) => (
            <motion.div key={t.id} variants={fadeUpVariants}>
              <TestimonialCard
                card={t}
                colorScheme={isDark ? "dark" : "light"}
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
