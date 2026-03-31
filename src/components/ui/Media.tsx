"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { GalleryGridItem, MediaItem, PlaceholderMood } from "@/types";
import { galleryItemVariants, VIEWPORT } from "@/lib/animations";

// ── Premium MediaPlaceholder ─────────────────────────────────────────────
// Looks intentional and editorial even without real content.

interface MediaPlaceholderProps {
  aspect?: "square" | "portrait" | "landscape" | "video" | "wide" | "tall";
  className?: string;
  label?: string;
  sublabel?: string;
  mood?: PlaceholderMood;
  /** Show corner crop marks */
  cropMarks?: boolean;
}

const aspectMap = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  tall: "aspect-[2/3]",
  landscape: "aspect-[4/3]",
  video: "aspect-video",
  wide: "aspect-[16/7]",
};

const moodGradient: Record<PlaceholderMood, string> = {
  dark: "from-vynl-gray-900 via-vynl-gray-800 to-vynl-black",
  nude: "from-vynl-nude via-vynl-champagne-light to-vynl-gray-200",
  smoke: "from-vynl-smoke via-vynl-gray-100 to-vynl-gray-200",
  champagne: "from-vynl-champagne-light via-vynl-nude to-vynl-gray-200",
};

const moodText: Record<PlaceholderMood, string> = {
  dark: "text-vynl-gray-600",
  nude: "text-vynl-gray-500",
  smoke: "text-vynl-gray-400",
  champagne: "text-vynl-gray-500",
};

const moodLabel: Record<PlaceholderMood, string> = {
  dark: "text-vynl-gray-500",
  nude: "text-vynl-gray-600",
  smoke: "text-vynl-gray-500",
  champagne: "text-vynl-gray-600",
};

export function MediaPlaceholder({
  aspect = "landscape",
  className,
  label,
  sublabel,
  mood = "dark",
  cropMarks = true,
}: MediaPlaceholderProps) {
  return (
    <div
      className={cn(
        aspectMap[aspect],
        "relative overflow-hidden",
        `bg-gradient-to-br ${moodGradient[mood]}`,
        className
      )}
    >
      {/* Corner crop marks */}
      {cropMarks && (
        <>
          <span className="absolute top-4 left-4 w-5 h-5 border-t border-l border-vynl-champagne/30 pointer-events-none" />
          <span className="absolute top-4 right-4 w-5 h-5 border-t border-r border-vynl-champagne/30 pointer-events-none" />
          <span className="absolute bottom-4 left-4 w-5 h-5 border-b border-l border-vynl-champagne/30 pointer-events-none" />
          <span className="absolute bottom-4 right-4 w-5 h-5 border-b border-r border-vynl-champagne/30 pointer-events-none" />
        </>
      )}

      {/* Centre content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        {/* Abstract mark */}
        <div className={cn("opacity-20", moodText[mood])}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="1" y="1" width="30" height="30" stroke="currentColor" strokeWidth="0.75" />
            <line x1="1" y1="16" x2="31" y2="16" stroke="currentColor" strokeWidth="0.5" />
            <line x1="16" y1="1" x2="16" y2="31" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>

        {label && (
          <p className={cn("text-2xs font-sans font-medium tracking-ultra-wide uppercase", moodLabel[mood])}>
            {label}
          </p>
        )}
        {sublabel && (
          <p className={cn("text-2xs font-sans tracking-widest opacity-50", moodLabel[mood])}>
            {sublabel}
          </p>
        )}
      </div>

      {/* Vynl watermark */}
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-2xs font-display tracking-ultra-wide opacity-10 uppercase text-vynl-gray-400 select-none">
        VYNL
      </span>
    </div>
  );
}

// ── HeroMedia ─────────────────────────────────────────────────────────────

interface HeroMediaProps {
  media?: MediaItem;
  className?: string;
  priority?: boolean;
}

export function HeroMedia({ media, className, priority = true }: HeroMediaProps) {
  if (!media) {
    return (
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-vynl-gray-900 via-vynl-black to-vynl-gray-800",
          className
        )}
      />
    );
  }

  if (media.type === "video") {
    return (
      <div className={cn("absolute inset-0 overflow-hidden", className)}>
        <video
          src={media.src}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Dark luxury overlay */}
        <div className="absolute inset-0 bg-vynl-black/50" />
      </div>
    );
  }

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <Image
        src={media.src}
        alt={media.alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-vynl-black/60" />
    </div>
  );
}

// ── GalleryGrid ───────────────────────────────────────────────────────────

interface GalleryGridProps {
  items: GalleryGridItem[];
  className?: string;
  columns?: 2 | 3 | 4;
  layout?: "grid" | "masonry";
}

const itemAspectClass = (item: GalleryGridItem) =>
  item.aspect === "portrait"
    ? "aspect-[3/4]"
    : item.aspect === "landscape"
      ? "aspect-video"
      : "aspect-square";

export function GalleryGrid({ items, className, columns = 4, layout = "grid" }: GalleryGridProps) {
  const colsMap = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const renderItem = (item: GalleryGridItem, key: string, index: number) => {
    const sizeHint =
      columns === 4
        ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        : columns === 3
          ? "(max-width: 640px) 50vw, 33vw"
          : "50vw";

    const inner = (
      <>
        {item.media ? (
          <Image
            src={item.media.src}
            alt={item.alt}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            sizes={sizeHint}
          />
        ) : (
          <MediaPlaceholder
            aspect={item.aspect === "portrait" ? "portrait" : item.aspect ?? "square"}
            label={item.alt}
            mood="nude"
            cropMarks={false}
            className="w-full h-full absolute inset-0"
          />
        )}
        {/* Hover overlay: dims + adds subtle ring */}
        <div className="absolute inset-0 bg-vynl-black/0 group-hover:bg-vynl-black/20 transition-colors duration-500 pointer-events-none ring-inset ring-0 group-hover:ring-1 group-hover:ring-white/10" />
      </>
    );

    const shellBase = cn(
      "relative overflow-hidden group",
      itemAspectClass(item),
      "transition-shadow duration-500 hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.35)]"
    );
    const shellLink = cn(
      shellBase,
      "block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vynl-champagne"
    );

    const shell = item.href ? (
      <a key={key} href={item.href} target="_blank" rel="noopener noreferrer" className={shellLink}>
        {inner}
      </a>
    ) : (
      <div key={key} className={shellBase}>{inner}</div>
    );

    return (
      <motion.div
        key={`motion-${key}`}
        variants={galleryItemVariants}
        custom={index}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
      >
        {shell}
      </motion.div>
    );
  };

  if (layout === "masonry") {
    const buildCols = (n: number) =>
      Array.from({ length: n }, (_, ci) => items.filter((_, j) => j % n === ci));

    return (
      <div className={cn("w-full", className)}>
        {/* Mobile — 2 columns, 2 px gap */}
        <div className="flex gap-0.5 md:hidden">
          {buildCols(2).map((col, ci) => (
            <div key={`m${ci}`} className="flex-1 flex flex-col gap-0.5 min-w-0">
              {col.map((item) => renderItem(item, `m${ci}-${item.id}`, items.indexOf(item)))}
            </div>
          ))}
        </div>
        {/* md+ — configured columns, 4 px gap */}
        <div className="hidden md:flex gap-1">
          {buildCols(columns).map((col, ci) => (
            <div key={`d${ci}`} className="flex-1 flex flex-col gap-1 min-w-0">
              {col.map((item) => renderItem(item, `d${ci}-${item.id}`, items.indexOf(item)))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-1 md:gap-1.5", colsMap[columns], className)}>
      {items.map((item, i) => renderItem(item, String(item.id), i))}
    </div>
  );
}

// ── VideoBlock ─────────────────────────────────────────────────────────────

interface VideoBlockProps {
  src?: string;
  poster?: string;
  className?: string;
  aspect?: "video" | "portrait" | "square";
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  label?: string;
}

export function VideoBlock({
  src, poster, className, aspect = "video",
  autoPlay = false, loop = true, muted = true, label,
}: VideoBlockProps) {
  if (!src) {
    return (
      <MediaPlaceholder
        aspect={aspect}
        label={label ?? "Video Content"}
        sublabel="MP4 · Loop"
        mood="dark"
        className={className}
      />
    );
  }
  return (
    <div className={cn("relative overflow-hidden", aspectMap[aspect], className)}>
      <video
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
