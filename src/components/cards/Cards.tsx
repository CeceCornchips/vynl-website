import { cn } from "@/lib/utils";
import type {
  FeatureCardData,
  ServiceCardData,
  ProductCardData,
  TestimonialCardData,
} from "@/types";
import { PrimaryButton, GhostButton, SecondaryButton } from "../ui/Buttons";
import { LabelText, Heading, BodyText, Rule } from "../ui/Typography";
import { MediaPlaceholder } from "../ui/Media";

// ── FeatureCard ───────────────────────────────────────────────────────────

interface FeatureCardProps {
  card: FeatureCardData;
  variant?: "default" | "minimal" | "bordered" | "dark";
  className?: string;
}

export function FeatureCard({ card, variant = "default", className }: FeatureCardProps) {
  const isDark = variant === "dark";
  return (
    <div
      className={cn(
        "group flex flex-col gap-6 p-8",
        variant === "default" && "bg-vynl-smoke hover:bg-vynl-gray-100 transition-colors duration-300",
        variant === "minimal" && "bg-transparent",
        variant === "bordered" && "border border-vynl-gray-200 hover:border-vynl-champagne/60 transition-colors duration-300",
        variant === "dark" && "bg-vynl-gray-800 hover:bg-vynl-gray-700 transition-colors duration-300",
        className
      )}
    >
      {card.icon && (
        <span className={cn(
          "font-display text-sm tracking-widest",
          isDark ? "text-vynl-champagne" : "text-vynl-champagne"
        )}>
          {card.icon}
        </span>
      )}

      <div className="flex flex-col gap-3">
        {card.tag && (
          <LabelText className={isDark ? "text-vynl-champagne/60" : undefined}>
            {card.tag}
          </LabelText>
        )}
        <Heading
          as="h3"
          size="sm"
          className={isDark ? "text-vynl-white" : "text-vynl-black"}
        >
          {card.title}
        </Heading>
        {card.description && (
          <BodyText
            size="sm"
            className={isDark ? "text-vynl-gray-400" : "text-vynl-gray-500"}
          >
            {card.description}
          </BodyText>
        )}
      </div>

      {card.cta && (
        <div className="mt-auto pt-2">
          <GhostButton
            href={card.cta.href}
            size="sm"
            className={cn(
              "text-xs",
              isDark ? "text-vynl-champagne border-vynl-champagne/30 hover:border-vynl-champagne/60" : "text-vynl-black"
            )}
          >
            {card.cta.label} →
          </GhostButton>
        </div>
      )}
    </div>
  );
}

// ── ServiceCard ───────────────────────────────────────────────────────────

interface ServiceCardProps {
  card: ServiceCardData;
  className?: string;
}

export function ServiceCard({ card, className }: ServiceCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col border border-vynl-gray-100 hover:border-vynl-champagne/40 transition-colors duration-300",
        className
      )}
    >
      {/* Level tag strip */}
      {card.level && (
        <div className="px-7 py-3 border-b border-vynl-gray-100 group-hover:border-vynl-champagne/20 transition-colors">
          <LabelText className="text-vynl-champagne/70">{card.level}</LabelText>
        </div>
      )}

      <div className="flex flex-col gap-5 p-7 flex-1">
        <div className="flex items-start justify-between gap-4">
          <Heading as="h3" size="sm" className="flex-1">
            {card.title}
          </Heading>
          {card.price && (
            <span className="shrink-0 font-display italic text-sm text-vynl-champagne">
              {card.price}
            </span>
          )}
        </div>

        {card.description && (
          <BodyText size="sm" muted>{card.description}</BodyText>
        )}

        {card.includes && card.includes.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {card.includes.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-vynl-champagne/60 text-xs mt-0.5">—</span>
                <span className="text-xs font-sans font-light text-vynl-gray-500">{item}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-5 border-t border-vynl-gray-100 flex items-center justify-between">
          {card.duration && (
            <span className="text-2xs font-sans text-vynl-gray-400 tracking-widest uppercase">
              {card.duration}
            </span>
          )}
          <SecondaryButton href="/contact" size="sm">
            Book
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

// ── ProductCard ───────────────────────────────────────────────────────────

interface ProductCardProps {
  card: ProductCardData;
  className?: string;
}

export function ProductCard({ card, className }: ProductCardProps) {
  return (
    <div className={cn("group flex flex-col", className)}>
      {/* Image area */}
      <div className="relative overflow-hidden">
        {card.media ? (
          <div className="relative aspect-square overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic product URLs; avoid Image domain config */}
            <img
              src={card.media.src}
              alt={card.media.alt}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ) : (
          <MediaPlaceholder
            aspect="square"
            label={card.category}
            sublabel="Product Photography"
            mood="champagne"
          />
        )}
        {card.badge && (
          <span className="absolute top-4 left-4 bg-vynl-black text-vynl-white text-2xs font-sans font-medium tracking-ultra-wide uppercase px-3 py-1.5">
            {card.badge}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 pt-5 pb-3">
        {card.category && (
          <LabelText className="text-vynl-champagne/60 text-2xs">{card.category}</LabelText>
        )}
        <Heading as="h3" size="xs">{card.title}</Heading>
        {card.description && (
          <BodyText size="sm" muted className="text-vynl-gray-400 line-clamp-2">
            {card.description}
          </BodyText>
        )}
        <div className="flex items-center justify-between pt-2">
          {card.price ? (
            <span className="font-display italic text-sm text-vynl-black">{card.price}</span>
          ) : (
            <span className="text-2xs font-sans text-vynl-gray-400 tracking-widest uppercase">Price TBA</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TestimonialCard ───────────────────────────────────────────────────────

interface TestimonialCardProps {
  card: TestimonialCardData;
  className?: string;
  colorScheme?: "light" | "dark";
}

export function TestimonialCard({
  card, className, colorScheme = "dark",
}: TestimonialCardProps) {
  const isDark = colorScheme === "dark";
  return (
    <div
      className={cn(
        "flex flex-col gap-7 p-8 md:p-10",
        isDark ? "bg-vynl-gray-900" : "bg-vynl-smoke",
        className
      )}
    >
      {card.rating && (
        <div className="flex gap-1.5">
          {Array.from({ length: card.rating }).map((_, i) => (
            <span key={i} className="text-vynl-champagne text-xs">★</span>
          ))}
        </div>
      )}

      <blockquote
        className={cn(
          "font-display italic text-lg md:text-xl leading-relaxed",
          isDark ? "text-vynl-gray-200" : "text-vynl-gray-700"
        )}
      >
        &ldquo;{card.quote}&rdquo;
      </blockquote>

      <div className="mt-auto flex items-center gap-4 pt-6 border-t border-white/8">
        <div className="w-8 h-8 flex items-center justify-center bg-vynl-champagne/20">
          <span className="text-vynl-champagne text-xs font-display">{card.author[0]}</span>
        </div>
        <div>
          <p className={cn("text-xs font-sans font-medium tracking-widest uppercase", isDark ? "text-vynl-white" : "text-vynl-black")}>
            {card.author}
          </p>
          {card.role && (
            <p className="text-2xs font-sans text-vynl-gray-500 tracking-widest mt-0.5">
              {card.role}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
