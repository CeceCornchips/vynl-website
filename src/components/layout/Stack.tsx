import { cn } from "@/lib/utils";

interface StackProps {
  children: React.ReactNode;
  className?: string;
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end";
  as?: "div" | "section" | "article" | "ul" | "ol";
}

const gapMap = {
  xs: "space-y-2",
  sm: "space-y-4",
  md: "space-y-6",
  lg: "space-y-10",
  xl: "space-y-16",
};

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
};

export function Stack({
  children,
  className,
  gap = "md",
  align = "start",
  as: Tag = "div",
}: StackProps) {
  return (
    <Tag className={cn("flex flex-col", gapMap[gap], alignMap[align], className)}>
      {children}
    </Tag>
  );
}
