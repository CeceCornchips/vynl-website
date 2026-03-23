"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { FAQItem, SectionMeta } from "@/types";
import { Container } from "../layout/Container";
import { Heading, Subheading, LabelText, BodyText, Rule } from "../ui/Typography";

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
        <span
          className={cn(
            "shrink-0 w-7 h-7 flex items-center justify-center border transition-all duration-300",
            dark
              ? "border-white/15 text-vynl-gray-400"
              : "border-vynl-gray-200 text-vynl-gray-500",
            isOpen && "rotate-45 border-vynl-champagne text-vynl-champagne"
          )}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 1v8M1 5h8" strokeLinecap="square" />
          </svg>
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-80 pb-6" : "max-h-0"
        )}
      >
        <BodyText
          size="sm"
          className={dark ? "text-vynl-gray-400" : "text-vynl-gray-600"}
        >
          {item.answer}
        </BodyText>
      </div>
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
        <div className="mb-14 flex flex-col gap-5 items-center text-center">
          {meta.label && (
            <div className="flex items-center gap-4 justify-center">
              <Rule />
              <LabelText light={isDark}>{meta.label}</LabelText>
              <Rule />
            </div>
          )}
          <Heading
            as="h2"
            size="xl"
            className={cn(isDark && "text-vynl-white")}
          >
            {meta.title}
          </Heading>
          {meta.subtitle && (
            <Subheading className={cn(isDark && "text-vynl-gray-400")}>
              {meta.subtitle}
            </Subheading>
          )}
        </div>
        <div className={cn("border-t", isDark ? "border-white/8" : "border-vynl-gray-100")}>
          {items.map((item) => (
            <FAQRow
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              dark={isDark}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
