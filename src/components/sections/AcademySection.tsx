import { cn } from "@/lib/utils";
import type { FeatureCardData, SectionMeta, WaitlistFormConfig } from "@/types";
import { Container } from "../layout/Container";
import { Heading, Subheading, LabelText, BodyText, Rule } from "../ui/Typography";
import { WaitlistForm } from "../forms/Forms";

interface AcademySectionProps {
  meta: SectionMeta;
  modules: FeatureCardData[];
  waitlistConfig: WaitlistFormConfig;
  className?: string;
}

export function AcademySection({
  meta, modules, waitlistConfig, className,
}: AcademySectionProps) {
  return (
    <section className={cn("py-24 md:py-32 bg-vynl-black", className)}>
      <Container>
        {/* Header */}
        <div className="mb-20 flex flex-col gap-5 items-center text-center">
          {meta.label && (
            <div className="flex items-center gap-4 justify-center">
              <Rule />
              <LabelText light>{meta.label}</LabelText>
              <Rule />
            </div>
          )}
          <Heading as="h2" size="2xl" className="text-vynl-white max-w-3xl">
            {meta.title}
          </Heading>
          {meta.subtitle && (
            <Subheading className="text-vynl-gray-400 max-w-xl">{meta.subtitle}</Subheading>
          )}
        </div>

        {/* Modules grid + waitlist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Curriculum modules */}
          <div id="curriculum" className="flex flex-col divide-y divide-white/8">
            {modules.map((mod) => (
              <div key={mod.id} className="flex items-start gap-6 py-7 group">
                <span className="shrink-0 font-display text-xs text-vynl-champagne/50 tracking-widest mt-1 w-6">
                  {mod.icon}
                </span>
                <div className="flex flex-col gap-1.5">
                  <Heading as="h3" size="xs" className="text-vynl-white">
                    {mod.title}
                  </Heading>
                  {mod.description && (
                    <BodyText size="sm" className="text-vynl-gray-500">{mod.description}</BodyText>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Waitlist */}
          <div id="waitlist" className="lg:sticky lg:top-32">
            <WaitlistForm {...waitlistConfig} colorScheme="dark" />
          </div>
        </div>
      </Container>
    </section>
  );
}
