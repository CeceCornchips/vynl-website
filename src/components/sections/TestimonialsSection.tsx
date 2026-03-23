import { cn } from "@/lib/utils";
import type { TestimonialCardData, SectionMeta } from "@/types";
import { Container } from "../layout/Container";
import { Grid } from "../layout/Grid";
import { Heading, Subheading, LabelText, Rule } from "../ui/Typography";
import { TestimonialCard } from "../cards/Cards";

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
        <div className="mb-16 flex flex-col gap-5 items-center text-center">
          {meta.label && (
            <div className="flex items-center gap-4 justify-center">
              <Rule />
              <LabelText light={isDark}>{meta.label}</LabelText>
              <Rule />
            </div>
          )}
          <Heading
            as="h2"
            size="xl"
            className={cn("max-w-xl", isDark && "text-vynl-white")}
          >
            {meta.title}
          </Heading>
          {meta.subtitle && (
            <Subheading
              className={cn("max-w-lg", isDark && "text-vynl-gray-400")}
            >
              {meta.subtitle}
            </Subheading>
          )}
        </div>
        <Grid cols={2} gap="md">
          {testimonials.map((t) => (
            <TestimonialCard
              key={t.id}
              card={t}
              colorScheme={isDark ? "dark" : "light"}
            />
          ))}
        </Grid>
      </Container>
    </section>
  );
}
