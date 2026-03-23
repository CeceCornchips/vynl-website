import { cn, schemeClasses } from "@/lib/utils";
import type { FeatureCardData, SectionMeta } from "@/types";
import { Container } from "../layout/Container";
import { Grid } from "../layout/Grid";
import { Heading, Subheading, LabelText, Rule } from "../ui/Typography";
import { FeatureCard } from "../cards/Cards";

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
        <div
          className={cn(
            "mb-16 flex flex-col gap-5",
            meta.align === "center" && "items-center text-center",
            meta.align === "right" && "items-end text-right"
          )}
        >
          {meta.label && (
            <div className="flex items-center gap-4">
              <Rule />
              <LabelText light={isDark}>{meta.label}</LabelText>
            </div>
          )}
          <Heading
            as="h2"
            size="2xl"
            className={cn("max-w-2xl", isDark && "text-vynl-white")}
          >
            {meta.title}
          </Heading>
          {meta.subtitle && (
            <Subheading
              className={cn("max-w-xl", isDark && "text-vynl-gray-400")}
            >
              {meta.subtitle}
            </Subheading>
          )}
        </div>
        <Grid cols={cols} gap="md">
          {features.map((card) => (
            <FeatureCard
              key={card.id}
              card={card}
              variant={cardVariant}
            />
          ))}
        </Grid>
      </Container>
    </section>
  );
}
