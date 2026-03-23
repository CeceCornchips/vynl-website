import { cn } from "@/lib/utils";
import type { ServiceCardData, SectionMeta, CTALink } from "@/types";
import { Container } from "../layout/Container";
import { Grid } from "../layout/Grid";
import { Heading, Subheading, LabelText, Rule } from "../ui/Typography";
import { PrimaryButton } from "../ui/Buttons";
import { ServiceCard } from "../cards/Cards";

interface ServicesSectionProps {
  meta: SectionMeta;
  services: ServiceCardData[];
  cta?: CTALink;
  className?: string;
}

export function ServicesSection({ meta, services, cta, className }: ServicesSectionProps) {
  return (
    <section className={cn("py-24 md:py-32 bg-vynl-white", className)}>
      <Container>
        <div className="mb-16 flex flex-col gap-5">
          {meta.label && (
            <div className="flex items-center gap-4">
              <Rule />
              <LabelText>{meta.label}</LabelText>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="flex flex-col gap-4">
              <Heading as="h2" size="2xl" className="max-w-xl">
                {meta.title}
              </Heading>
              {meta.subtitle && (
                <Subheading className="max-w-lg">{meta.subtitle}</Subheading>
              )}
            </div>
            {cta && (
              <PrimaryButton href={cta.href} size="md" className="shrink-0">
                {cta.label}
              </PrimaryButton>
            )}
          </div>
        </div>
        <Grid cols={3} gap="md">
          {services.map((s) => (
            <ServiceCard key={s.id} card={s} />
          ))}
        </Grid>
      </Container>
    </section>
  );
}
