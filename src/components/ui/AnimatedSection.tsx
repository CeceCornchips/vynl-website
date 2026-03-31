"use client";

import { motion } from "framer-motion";
import { EASE, VIEWPORT } from "@/lib/animations";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  /** Use "up" (default), "scale", or "none" for different reveal styles */
  variant?: "up" | "scale" | "none";
}

/**
 * Drop-in wrapper that gives any server-rendered content a smooth
 * fade+slide-up reveal when it enters the viewport.
 */
export function AnimatedSection({
  children,
  className,
  delay = 0,
  distance = 32,
  variant = "up",
}: AnimatedSectionProps) {
  const initial =
    variant === "scale"
      ? { opacity: 0, scale: 0.96 }
      : variant === "none"
        ? { opacity: 0 }
        : { opacity: 0, y: distance };

  const animate =
    variant === "scale"
      ? { opacity: 1, scale: 1 }
      : variant === "none"
        ? { opacity: 1 }
        : { opacity: 1, y: 0 };

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={VIEWPORT}
      transition={{ duration: 0.8, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
