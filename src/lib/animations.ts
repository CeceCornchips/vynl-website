import type { Variants } from "framer-motion";

/** Apple-inspired deceleration curve — smooth, never abrupt */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Shared spring for micro-interactions (button taps, hover pops) */
export const SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;

/** Common viewport config — fires once, 80px before element enters view */
export const VIEWPORT = { once: true, margin: "-80px" } as const;

/** Fade + slide up — workhorse for section reveals */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

/** Stagger container — wraps a list of fadeUp children */
export function staggerContainer(stagger = 0.1, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

/** Scale + fade in — images, cards */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.93 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: EASE },
  },
};

/** Slide in from right — image columns, sidebars */
export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 48 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 1.0, ease: EASE },
  },
};

/** Gallery item — subtle scale + fade with index-based delay */
export const galleryItemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 24 },
  show: (index: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: EASE,
      // Cap stagger at 12 items so late items don't wait forever
      delay: Math.min(index, 12) * 0.055,
    },
  }),
};
