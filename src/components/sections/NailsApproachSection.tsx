"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { Heading, LabelText, BodyText, Rule } from "@/components/ui/Typography";

const STATS = [
  { label: "No odour", sub: "Completely smell-free application" },
  { label: "3–5 weeks", sub: "Typical wear with professional prep" },
  { label: "Lightweight", sub: "Flexible, natural feel" },
];

// Shared easing curve — same spring Apple uses in marketing pages
const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: EASE, delay: custom * 0.1 },
  }),
};

export function NailsApproachSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // Parallax: track the section as it moves through the viewport
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Image drifts 60 px upward over the full scroll range — subtle depth effect
  const imageY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-vynl-white overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* ── Text column — staggered fade-up ── */}
          <motion.div
            className="flex flex-col gap-8"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
          >
            <motion.div className="flex items-center gap-4" variants={fadeUp} custom={0}>
              <Rule />
              <LabelText>Our Approach</LabelText>
            </motion.div>

            <motion.div variants={fadeUp} custom={1}>
              <Heading as="h2" size="2xl">
                The Gel-X difference.
              </Heading>
            </motion.div>

            <motion.div className="flex flex-col gap-5" variants={fadeUp} custom={2}>
              <BodyText className="text-vynl-gray-600">
                Gel-X is a soft gel extension system applied directly over your natural nail
                using extend gel, with no acrylic powder, no monomer, no harsh chemical odour.
                The result is a lightweight, flexible extension that moves with your natural
                nail and wears for 3–5 weeks without lifting.
              </BodyText>
            </motion.div>

            {/* Stats — second stagger layer */}
            <motion.div
              className="grid grid-cols-3 gap-6 pt-4 border-t border-vynl-gray-100"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } },
              }}
            >
              {STATS.map(({ label, sub }) => (
                <motion.div
                  key={label}
                  className="flex flex-col gap-1"
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
                  }}
                >
                  <span className="font-display text-lg text-vynl-black">{label}</span>
                  <span className="text-2xs font-sans text-vynl-gray-400 tracking-widest uppercase">
                    {sub}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Image column — slide-in + parallax, full natural size ── */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, x: 56, scale: 0.97 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.1, ease: EASE }}
          >
            <motion.div style={{ y: imageY }}>
              <Image
                src="/images/IMG_8527.png"
                alt="Gel-X nail art set at Vynl Studio"
                width={0}
                height={0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-auto"
                priority
              />
            </motion.div>
          </motion.div>

        </div>
      </Container>
    </section>
  );
}
