"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { Heading, Subheading, LabelText, Rule } from "@/components/ui/Typography";

// Shared easing — same spring Apple uses in marketing pages
const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: EASE, delay: custom * 0.1 },
  }),
};

const STATS = [
  { stat: "Gel-X", label: "Extensions Only" },
  { stat: "Level 1–3", label: "Nail Art Tiers" },
  { stat: "100%", label: "By Appointment" },
  { stat: "0", label: "Drills. Ever." },
];

export function WhyVynlSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Subtle parallax: image drifts slightly upward as you scroll past
  const imageY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-vynl-white overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* ── Text column ── */}
          <motion.div
            className="flex flex-col gap-8"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.09 } },
            }}
          >
            <motion.div className="flex items-center gap-4" variants={fadeUp} custom={0}>
              <Rule />
              <LabelText>Why Vynl</LabelText>
            </motion.div>

            <motion.div variants={fadeUp} custom={1}>
              <Heading as="h2" size="2xl" className="max-w-lg">
                We do one thing.{" "}
                <span className="italic text-vynl-champagne">Exceptionally well.</span>
              </Heading>
            </motion.div>

            <motion.div className="flex flex-col gap-5" variants={fadeUp} custom={2}>
              <Subheading>
                Vynl is a Gel-X specialist. Full stop. No acrylic. No gel polish only.
                No compromises.
              </Subheading>
              <Subheading>
                Our singular focus on Gel-X extensions and advanced nail art means every
                technique, every product, and every process is optimised for one outcome:
                the most flawless nails possible.
              </Subheading>
            </motion.div>

            {/* Stats grid */}
            <motion.div
              className="grid grid-cols-2 gap-6 pt-4"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
              }}
            >
              {STATS.map(({ stat, label }) => (
                <motion.div
                  key={label}
                  className="flex flex-col gap-1 border-t border-vynl-gray-100 pt-5"
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
                  }}
                >
                  <span className="font-display text-2xl md:text-3xl text-vynl-black">{stat}</span>
                  <span className="text-2xs font-sans text-vynl-gray-400 tracking-widest uppercase">{label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Image column ── */}
          <motion.div
            className="relative w-full max-w-sm ml-auto"
            initial={{ opacity: 0, x: 56, scale: 0.97 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.1, ease: EASE }}
          >
            {/* Backing: absolute inset-0 = exactly the same size as the image frame.
                Framer animates x/y from 0→18 so it slides into the offset position
                rather than using layout-based padding (which caused height mismatches). */}
            <motion.div
              className="absolute inset-0 bg-vynl-champagne/15 border border-vynl-champagne/40"
              initial={{ opacity: 0, x: 0, y: 0 }}
              whileInView={{ opacity: 1, x: 18, y: 18 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.0, ease: EASE, delay: 0.3 }}
            />

            {/* Cropped portrait frame — shows the nail portion of the image */}
            <div className="relative aspect-[3/4] overflow-hidden shadow-[0_24px_64px_-16px_rgba(0,0,0,0.28)]">
              <motion.div style={{ y: imageY }} className="absolute inset-0 scale-[1.08]">
                <Image
                  src="/images/IMG_8459.PNG"
                  alt="Gel-X nail art close-up"
                  fill
                  className="object-cover object-bottom"
                  sizes="(max-width: 1024px) 100vw, 384px"
                />
              </motion.div>
            </div>
          </motion.div>

        </div>
      </Container>
    </section>
  );
}
