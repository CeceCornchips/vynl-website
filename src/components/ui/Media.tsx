import Image from "next/image";
import { cn } from "@/lib/utils";
import type { GalleryGridItem, MediaItem, PlaceholderMood } from "@/types";

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
}

export function GalleryGrid({ items, className, columns = 4 }: GalleryGridProps) {
  const colsMap = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const aspectClass =
    (item: GalleryGridItem) =>
      item.aspect === "portrait"
        ? "aspect-[3/4]"
        : item.aspect === "landscape"
          ? "aspect-video"
          : "aspect-square";

  return (
    <div className={cn("grid gap-2 md:gap-3", colsMap[columns], className)}>
      {items.map((item) => {
        const baseShell = cn(
          "relative block overflow-hidden group cursor-pointer",
          aspectClass(item)
        );
        const linkShell = cn(
          baseShell,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vynl-champagne"
        );

        const inner = (
          <>
            {item.media ? (
              <Image
                src={item.media.src}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes={`(max-width: 768px) 50vw, ${columns === 4 ? "25vw" : "33vw"}`}
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
            <div className="absolute inset-0 bg-vynl-black/0 group-hover:bg-vynl-black/25 transition-colors duration-500 flex items-end p-4 opacity-0 group-hover:opacity-100 pointer-events-none">
              <span className="text-2xs text-vynl-white font-sans tracking-widest uppercase line-clamp-3">
                {item.alt}
              </span>
            </div>
          </>
        );

        if (item.href) {
          return (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkShell}
            >
              {inner}
            </a>
          );
        }

        return (
          <div key={item.id} className={baseShell}>
            {inner}
          </div>
        );
      })}
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
