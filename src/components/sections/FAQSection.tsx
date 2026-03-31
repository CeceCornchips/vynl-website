"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { FAQItem, SectionMeta } from "@/types";
import { Container } from "../layout/Container";
import { Heading, Subheading, LabelText, BodyText, Rule } from "../ui/Typography";
import { EASE, VIEWPORT, staggerContainer, fadeUpVariants } from "@/lib/animations";

interface FAQRowProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  dark?: boolean;
}

function FAQRow({ item, isOpen, onToggle, dark }: FAQRowProps) {
  return (
    <div className={cn("border-b", dark ? "border-white/8" : "border-vynl-gray-100")}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-8 py-6 text-left focus-visible:outline-none"
      >
        <span
          className={cn(
            "text-sm font-sans font-light",
            dark ? "text-vynl-gray-200" : "text-vynl-black"
          )}
        >
          {item.question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.28, ease: EASE }}
          className={cn(
            "shrink-0 w-7 h-7 flex items-center justify-center border transition-colors duration-300",
            dark
              ? "border-white/15 text-vynl-gray-400"
              : "border-vynl-gray-200 text-vynl-gray-500",
            isOpen && "border-vynl-champagne text-vynl-champagne"
          )}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 1v8M1 5h8" strokeLinecap="square" />
          </svg>
        </motion.span>
      </button>

      {/* Animated accordion panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="faq-answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <div className="pb-6">
              <BodyText
                size="sm"
                className={dark ? "text-vynl-gray-400" : "text-vynl-gray-600"}
              >
                {item.answer}
              </BodyText>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FAQSectionProps {
  meta: SectionMeta;
  items: FAQItem[];
  className?: string;
}

export function FAQSection({ meta, items, className }: FAQSectionProps) {
  const [openId, setOpenId] = useState<string | number | null>(null);
  const isDark = meta.colorScheme === "dark";

  return (
    <section
      className={cn(
        "py-24 md:py-32",
        isDark ? "bg-vynl-black" : "bg-vynl-white",
        className
      )}
    >
      <Container size="md">
        {/* Header */}
        <motion.div
          className="mb-14 flex flex-col gap-5 items-center text-center"
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          {meta.label && (
            <motion.div className="flex items-center gap-4 justify-center" variants={fadeUpVariants}>
              <Rule />
              <LabelText light={isDark}>{meta.label}</LabelText>
              <Rule />
            </motion.div>
          )}
          <motion.div variants={fadeUpVariants}>
            <Heading
              as="h2"
              size="xl"
              className={cn(isDark && "text-vynl-white")}
            >
              {meta.title}
            </Heading>
          </motion.div>
          {meta.subtitle && (
            <motion.div variants={fadeUpVariants}>
              <Subheading className={cn(isDark && "text-vynl-gray-400")}>
                {meta.subtitle}
              </Subheading>
            </motion.div>
          )}
        </motion.div>

        {/* FAQ rows — staggered reveal */}
        <motion.div
          className={cn("border-t", isDark ? "border-white/8" : "border-vynl-gray-100")}
          variants={staggerContainer(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          {items.map((item) => (
            <motion.div key={item.id} variants={fadeUpVariants}>
              <FAQRow
                item={item}
                isOpen={openId === item.id}
                onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                dark={isDark}
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
