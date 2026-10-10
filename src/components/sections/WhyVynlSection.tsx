"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { Heading, Subheading, LabelText, Rule } from "@/components/ui/Typography";
import { BUSINESS } from "@/lib/seo";
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
  { value: "Gel-X", label: "Extensions only. No acrylic, ever." },
  { value: "Level 1–3", label: "Nail art tiers, from minimal to maximal." },
];

const tile = {
  hidden: { opacity: 0, y: 26, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.75, ease: EASE },
  },
};

const TILE_SHADOW = "shadow-[0_18px_40px_-24px_rgba(185,103,127,0.55)]";

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

          </motion.div>

          {/* ── Bento: photo + stat tiles ── */}
          <motion.div
            className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          >
            {photos?.[0] && (
              <motion.figure
                variants={tile}
                className={`relative row-span-2 aspect-[3/4] overflow-hidden rounded-[2rem] bg-vynl-petal ${TILE_SHADOW}`}
              >
                <Image
                  src={photos[0].src}
                  alt={photos[0].alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 300px"
                  className="object-cover"
                />
                <figcaption className="absolute left-3 bottom-3 whitespace-nowrap rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-sans font-medium text-vynl-black">
                  Hand-painted
                </figcaption>
              </motion.figure>
            )}

            {FEATURE_STATS.map(({ value, label }) => (
              <motion.div
                key={value}
                variants={tile}
                className="flex flex-col justify-end rounded-[2rem] bg-vynl-smoke p-5 sm:p-6 md:p-7"
              >
                <div className="flex flex-col gap-2">
                  <span className="font-display italic text-3xl sm:text-4xl md:text-5xl text-vynl-rose-deep leading-none">
                    {value}
                  </span>
                  <span className="text-sm font-sans text-vynl-gray-600 leading-snug">{label}</span>
                </div>
              </motion.div>
            ))}

            <motion.div
              variants={tile}
              className="col-span-2 flex flex-col gap-6 rounded-[2rem] bg-gradient-to-br from-vynl-petal to-vynl-smoke p-6 md:p-8"
            >
              <div className="flex items-center gap-5">
                <span className="shrink-0 font-display italic text-5xl md:text-6xl text-vynl-rose-deep leading-none">100%</span>
                <div className="flex flex-col gap-1">
                  <span className="font-display text-xl text-vynl-black leading-tight">By appointment</span>
                  <span className="text-sm font-sans text-vynl-gray-600 leading-snug">
                    Private, one-on-one sessions in a calm studio.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-5 border-t border-white/70">
                {photos && photos.length > 1 && (
                  <div aria-hidden className="flex -space-x-3">
                    {photos.slice(1, 3).map((photo) => (
                      <span key={photo.src} className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-white">
                        <Image src={photo.src} alt="" fill sizes="44px" className="object-cover" />
                      </span>
                    ))}
                  </div>
                )}
                <a
                  href={BUSINESS.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full bg-vynl-black px-5 py-2.5 text-xs font-sans font-medium tracking-widest uppercase text-vynl-white hover:bg-vynl-rose-deep transition-colors"
                >
                  Book your set
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </a>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </Container>
    </section>
  );
}
