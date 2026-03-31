"use client";

import { motion } from "framer-motion";
import { cn, schemeClasses } from "@/lib/utils";
import type { FeatureCardData, SectionMeta } from "@/types";
import { Container } from "../layout/Container";
import { Grid } from "../layout/Grid";
import { Heading, Subheading, LabelText, Rule } from "../ui/Typography";
import { FeatureCard } from "../cards/Cards";
import { EASE, VIEWPORT, staggerContainer, fadeUpVariants } from "@/lib/animations";

interface FeatureSectionProps {
  meta: SectionMeta;
  features: FeatureCardData[];
  cardVariant?: "default" | "minimal" | "bordered" | "dark";
  cols?: 2 | 3 | 4;
  className?: string;
}

export function FeatureSection({
  meta, features, cardVariant = "default", cols = 3, className,
}: FeatureSectionProps) {
  const isDark = meta.colorScheme === "dark";

  return (
    <section
      className={cn(schemeClasses(meta.colorScheme ?? "light"), "py-24 md:py-32", className)}
    >
      <Container>
        {/* Section header — staggered reveal */}
        <motion.div
          className={cn(
            "mb-16 flex flex-col gap-5",
            meta.align === "center" && "items-center text-center",
            meta.align === "right" && "items-end text-right"
          )}
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          {meta.label && (
            <motion.div className="flex items-center gap-4" variants={fadeUpVariants}>
              <Rule />
              <LabelText light={isDark}>{meta.label}</LabelText>
            </motion.div>
          )}
          <motion.div variants={fadeUpVariants}>
            <Heading
              as="h2"
              size="2xl"
              className={cn("max-w-2xl", isDark && "text-vynl-white")}
            >
              {meta.title}
            </Heading>
          </motion.div>
          {meta.subtitle && (
            <motion.div variants={fadeUpVariants}>
              <Subheading
                className={cn("max-w-xl", isDark && "text-vynl-gray-400")}
              >
                {meta.subtitle}
              </Subheading>
            </motion.div>
          )}
        </motion.div>

        {/* Cards — staggered grid reveal */}
        <motion.div
          variants={staggerContainer(0.1, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          <Grid cols={cols} gap="md">
            {features.map((card) => (
              <motion.div key={card.id} variants={fadeUpVariants}>
                <FeatureCard
                  card={card}
                  variant={cardVariant}
                />
              </motion.div>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </section>
  );
}
