import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeMap = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-screen-2xl",
  full: "max-w-none",
};

export function Container({ children, className, size = "lg" }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-6 md:px-10 lg:px-16", sizeMap[size], className)}>
      {children}
    </div>
  );
}
