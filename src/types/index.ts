// ── Shared Primitive Types ──────────────────────────────────────────────

export type ColorScheme = "light" | "dark" | "smoke" | "champagne";
export type SizeVariant = "xs" | "sm" | "md" | "lg" | "xl";
export type AlignVariant = "left" | "center" | "right";

// ── CTA / Link ──────────────────────────────────────────────────────────

export interface CTALink {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost" | "champagne";
  external?: boolean;
}

// ── Navigation ──────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

// ── Media ───────────────────────────────────────────────────────────────

export interface MediaItem {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  type?: "image" | "video";
}

export type PlaceholderMood = "dark" | "nude" | "smoke" | "champagne";

// ── Cards ───────────────────────────────────────────────────────────────

export interface BaseCard {
  id: string | number;
  title: string;
  description?: string;
  media?: MediaItem;
  cta?: CTALink;
  tag?: string;
}

export interface FeatureCardData extends BaseCard {
  icon?: string;
  stat?: string;
  statLabel?: string;
}

export interface ServiceCardData extends BaseCard {
  price?: string;
  duration?: string;
  level?: string;
  includes?: string[];
}

export interface ProductCardData extends BaseCard {
  price?: string;
  originalPrice?: string;
  badge?: string;
  inStock?: boolean;
  category?: string;
}

export interface TestimonialCardData {
  id: string | number;
  quote: string;
  author: string;
  role?: string;
  location?: string;
  avatar?: MediaItem;
  rating?: number;
}

// ── Sections ─────────────────────────────────────────────────────────────

export interface SectionMeta {
  label?: string;
  title: string;
  subtitle?: string;
  align?: AlignVariant;
  colorScheme?: ColorScheme;
}

export interface HeroSectionData {
  eyebrow?: string;
  title: string;
  titleItalic?: string;
  subtitle?: string;
  primaryCTA?: CTALink;
  secondaryCTA?: CTALink;
  media?: MediaItem;
  colorScheme?: ColorScheme;
}

export interface FAQItem {
  id: string | number;
  question: string;
  answer: string;
}

// ── Forms ────────────────────────────────────────────────────────────────

export interface WaitlistFormConfig {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  successMessage?: string;
  placeholder?: string;
  namePlaceholder?: string;
  context?: string;
  showName?: boolean;
}

export interface ContactFormConfig {
  title?: string;
  subtitle?: string;
}

// ── Footer ───────────────────────────────────────────────────────────────

export interface FooterLinkGroup {
  heading: string;
  links: { label: string; href: string }[];
}

export interface FooterData {
  logoText?: string;
  tagline?: string;
  linkGroups: FooterLinkGroup[];
  social?: { platform: string; href: string }[];
  legal?: { label: string; href: string }[];
  copyright?: string;
}
