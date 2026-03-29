import { cn } from "@/lib/utils";
import type { ServiceCardData } from "@/types";
import { Container } from "../layout/Container";
import { Heading, LabelText, Rule } from "../ui/Typography";

// ── Clock Icon ────────────────────────────────────────────────────────────

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-3.5 h-3.5 shrink-0", className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.5" />
      <polyline points="12 7 12 12 15.5 14.5" />
    </svg>
  );
}

// ── Service Card ──────────────────────────────────────────────────────────

function CatalogCard({ card }: { card: ServiceCardData }) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-0 rounded-xl border border-vynl-gray-100 bg-vynl-white",
        "transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
      )}
    >
      {/* Level badge strip */}
      {card.level && (
        <div className="px-6 py-2.5 border-b border-vynl-gray-100 rounded-t-xl bg-vynl-smoke/60">
          <LabelText className="text-vynl-champagne/80 text-2xs">{card.level}</LabelText>
        </div>
      )}

      <div className="flex flex-col gap-4 p-6 flex-1">
        {/* Title */}
        <h3 className="font-display text-base font-semibold text-vynl-black leading-snug">
          {card.title}
        </h3>

        {/* Description */}
        {card.description && (
          <p className="text-sm font-sans text-vynl-gray-500 leading-relaxed">
            {card.description}
          </p>
        )}

        {/* Price */}
        {card.price && (
          <p className="font-sans font-bold text-sm text-vynl-black tracking-wide">
            {card.price}
          </p>
        )}

        {/* Footer: duration only */}
        {card.duration && (
          <div className="mt-auto pt-4 border-t border-vynl-gray-100">
            <span className="flex items-center gap-1.5 text-vynl-gray-400">
              <ClockIcon />
              <span className="text-2xs font-sans tracking-widest uppercase">
                {card.duration}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Category Group ────────────────────────────────────────────────────────

function CategoryGroup({
  label,
  heading,
  services,
}: {
  label?: string;
  heading: string;
  services: ServiceCardData[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {label && (
          <div className="flex items-center gap-4">
            <Rule />
            <LabelText>{label}</LabelText>
          </div>
        )}
        <Heading as="h3" size="lg">
          {heading}
        </Heading>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
        {services.map((s) => (
          <CatalogCard key={s.id} card={s} />
        ))}
      </div>
    </div>
  );
}

// ── NailCatalogSection ────────────────────────────────────────────────────

interface NailCatalogSectionProps {
  nailServices: ServiceCardData[];
  addOns: ServiceCardData[];
  className?: string;
}

export function NailCatalogSection({
  nailServices,
  addOns,
  className,
}: NailCatalogSectionProps) {
  return (
    <section
      id="services"
      className={cn("py-24 md:py-32 bg-vynl-smoke", className)}
    >
      <Container>
        {/* Section header */}
        <div className="mb-14 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Rule />
            <LabelText>Services &amp; Pricing</LabelText>
          </div>
          <Heading as="h2" size="2xl" className="max-w-xl">
            What we offer.
          </Heading>
          <p className="text-sm font-sans text-vynl-gray-500 max-w-lg leading-relaxed">
            Choose your service below and add any extras to personalise your
            appointment.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-16">
          <CategoryGroup
            heading="Nail Services"
            services={nailServices}
          />
          <CategoryGroup
            heading="Add Ons"
            services={addOns}
          />
        </div>
      </Container>
    </section>
  );
}
