import { cn, schemeClasses } from "@/lib/utils";
import type { ColorScheme } from "@/types";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  colorScheme?: ColorScheme;
  /** Vertical padding size */
  spacing?: "sm" | "md" | "lg" | "xl";
  id?: string;
  as?: "section" | "div" | "article";
}

const spacingMap = {
  sm: "py-12 md:py-16",
  md: "py-16 md:py-24",
  lg: "py-24 md:py-32",
  xl: "py-32 md:py-40",
};

export function Section({
  children,
  className,
  colorScheme = "light",
  spacing = "md",
  id,
  as: Tag = "section",
}: SectionProps) {
  return (
    <Tag
      id={id}
      className={cn(schemeClasses(colorScheme), spacingMap[spacing], className)}
    >
      {children}
    </Tag>
  );
}
