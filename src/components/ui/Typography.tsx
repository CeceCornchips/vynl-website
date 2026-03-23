import { cn } from "@/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type HeadingSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "display"
  | "hero";

interface HeadingProps {
  children: React.ReactNode;
  as?: HeadingLevel;
  size?: HeadingSize;
  italic?: boolean;
  className?: string;
}

const sizeMap: Record<HeadingSize, string> = {
  xs: "text-lg md:text-xl font-semibold leading-snug tracking-tight",
  sm: "text-xl md:text-2xl font-semibold leading-snug tracking-tight",
  md: "text-2xl md:text-3xl font-semibold leading-snug tracking-tight",
  lg: "text-3xl md:text-4xl font-semibold leading-tight tracking-tight",
  xl: "text-4xl md:text-5xl font-semibold leading-tight tracking-tight",
  "2xl": "text-5xl md:text-6xl font-medium leading-tight tracking-tight",
  "3xl": "text-6xl md:text-7xl font-medium leading-[1.05] tracking-tight",
  display: "text-6xl md:text-8xl font-medium leading-[1.0] tracking-tighter",
  hero: "text-7xl sm:text-8xl md:text-9xl font-medium leading-[0.95] tracking-tighter",
};

export function Heading({
  children,
  as: Tag = "h2",
  size = "lg",
  italic = false,
  className,
}: HeadingProps) {
  return (
    <Tag
      className={cn(
        "font-display text-balance",
        sizeMap[size],
        italic && "italic",
        className
      )}
    >
      {children}
    </Tag>
  );
}

interface SubheadingProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  muted?: boolean;
}

const subSizeMap = {
  sm: "text-sm",
  md: "text-base md:text-lg",
  lg: "text-lg md:text-xl",
};

export function Subheading({
  children,
  className,
  size = "md",
  muted = true,
}: SubheadingProps) {
  return (
    <p
      className={cn(
        subSizeMap[size],
        "font-sans font-light leading-relaxed text-balance",
        muted ? "text-vynl-gray-500" : "text-current",
        className
      )}
    >
      {children}
    </p>
  );
}

interface BodyTextProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "base" | "lg";
  as?: "p" | "span" | "div";
  muted?: boolean;
}

export function BodyText({
  children,
  className,
  size = "base",
  as: Tag = "p",
  muted = false,
}: BodyTextProps) {
  return (
    <Tag
      className={cn(
        size === "sm" && "text-sm",
        size === "base" && "text-base",
        size === "lg" && "text-lg",
        "font-sans font-light leading-relaxed",
        muted ? "text-vynl-gray-400" : "text-vynl-gray-600",
        className
      )}
    >
      {children}
    </Tag>
  );
}

interface LabelTextProps {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "p" | "div";
  light?: boolean;
}

export function LabelText({
  children,
  className,
  as: Tag = "span",
  light = false,
}: LabelTextProps) {
  return (
    <Tag
      className={cn(
        "text-2xs font-sans font-medium tracking-ultra-wide uppercase",
        light ? "text-vynl-gray-300" : "text-vynl-champagne",
        className
      )}
    >
      {children}
    </Tag>
  );
}

// A thin horizontal rule — used between label and heading
export function Rule({ className }: { className?: string }) {
  return <div className={cn("w-12 h-px bg-vynl-champagne", className)} />;
}
