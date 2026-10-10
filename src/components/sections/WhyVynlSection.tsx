"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { Heading, Subheading, LabelText, Rule } from "@/components/ui/Typography";
import { PolaroidCollage } from "@/components/ui/PolaroidCollage";
import type { MediaItem } from "@/types";

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


const FEATURE_STATS = [
  { value: "Gel-X", label: "Extensions only — no acrylic, no compromise" },
  { value: "Level 1–3", label: "Nail art tiers for every style" },
  { value: "100%", label: "By appointment only" },
];

const statRow = {
  hidden: { opacity: 0, y: 24, x: 18 },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: { duration: 0.78, ease: EASE },
  },
};

export function WhyVynlSection({ photos }: { photos?: MediaItem[] }) {
  return (
    <section className="py-24 md:py-32 bg-vynl-white overflow-hidden">
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
                <span className="italic text-vynl-rose-deep">Exceptionally well.</span>
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
              <Subheading>
                We work from a private, by-appointment studio in Cranebrook, NSW, a few
                minutes from Penrith, and see clients from Jordan Springs, Glenmore Park,
                Emu Plains, St Marys and across Western Sydney.
              </Subheading>
            </motion.div>

            {photos?.length ? (
              <motion.div variants={fadeUp} custom={3} className="pt-4 max-w-md">
                <PolaroidCollage photos={photos} layout="row" sizes="(max-width: 1024px) 30vw, 150px" />
              </motion.div>
            ) : null}

          </motion.div>

          {/* ── Animated stats column ── */}
          <div className="relative flex flex-col justify-center overflow-hidden rounded-sm">

            {/* Slow-looping shimmer background */}
            <motion.div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 12, ease: "linear", repeat: Infinity }}
              style={{
                background:
                  "linear-gradient(135deg, transparent 0%, rgba(212,175,120,0.04) 25%, rgba(212,175,120,0.09) 50%, rgba(212,175,120,0.04) 75%, transparent 100%)",
                backgroundSize: "300% 300%",
              }}
            />

            <motion.div
              className="relative flex flex-col gap-0 py-2"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.16, delayChildren: 0.08 } },
              }}
            >
              {FEATURE_STATS.map(({ value, label }) => (
                <motion.div
                  key={value}
                  className="flex flex-col gap-3 pt-7 pb-7"
                  variants={statRow}
                >
                  {/* Thin rule above each stat */}
                  <div className="w-full h-px bg-vynl-petal" />

                  <div className="flex flex-col gap-2">
                    <span className="font-display italic text-5xl md:text-6xl lg:text-7xl text-vynl-rose-deep leading-none">
                      {value}
                    </span>
                    <span className="text-2xs font-sans tracking-ultra-wide uppercase text-vynl-gray-400 max-w-xs">
                      {label}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Closing rule */}
              <div className="w-full h-px bg-vynl-petal" />
            </motion.div>

          </div>

        </div>
      </Container>
    </section>
  );
}
