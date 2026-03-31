"use client";

import { MotionConfig } from "framer-motion";

/**
 * Provides Framer Motion configuration to the entire app.
 * reducedMotion="user" automatically respects the OS-level
 * "prefers-reduced-motion" setting — no manual checks required.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
