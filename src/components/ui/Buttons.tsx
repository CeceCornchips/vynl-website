import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  children: React.ReactNode;
  className?: string;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  href?: string;
  external?: boolean;
  fullWidth?: boolean;
}

const sizeMap: Record<ButtonSize, string> = {
  sm: "px-6 py-2.5 text-xs tracking-widest",
  md: "px-8 py-3.5 text-xs tracking-widest",
  lg: "px-10 py-4 text-sm tracking-widest",
};

const base =
  "inline-flex items-center justify-center uppercase font-sans font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 rounded-none active:scale-[0.97] active:duration-75";

function Wrap({
  href, external, className, children, disabled, onClick, type = "button",
}: {
  href?: string;
  external?: boolean;
  className: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}) {
  if (href) {
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    ) : (
      <Link href={href} className={className}>{children}</Link>
    );
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function PrimaryButton({
  children, className, size = "md", fullWidth, ...props
}: ButtonBaseProps) {
  return (
    <Wrap
      className={cn(
        base, sizeMap[size],
        "bg-vynl-black text-vynl-white hover:bg-vynl-gray-800 focus-visible:ring-vynl-black",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </Wrap>
  );
}

export function SecondaryButton({
  children, className, size = "md", fullWidth, ...props
}: ButtonBaseProps) {
  return (
    <Wrap
      className={cn(
        base, sizeMap[size],
        "border border-vynl-black text-vynl-black bg-transparent hover:bg-vynl-black hover:text-vynl-white focus-visible:ring-vynl-black",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </Wrap>
  );
}

export function GhostButton({
  children, className, size = "md", fullWidth, ...props
}: ButtonBaseProps) {
  return (
    <Wrap
      className={cn(
        base, sizeMap[size],
        "text-current border border-current/30 hover:border-current/70 focus-visible:ring-current/30",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </Wrap>
  );
}

export function ChampagneButton({
  children, className, size = "md", fullWidth, ...props
}: ButtonBaseProps) {
  return (
    <Wrap
      className={cn(
        base, sizeMap[size],
        "bg-vynl-champagne-light text-vynl-black hover:bg-vynl-nude focus-visible:ring-vynl-champagne",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </Wrap>
  );
}
