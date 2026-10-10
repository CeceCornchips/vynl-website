import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types";
import { BUSINESS } from "@/lib/seo";

interface PhotoMarqueeProps {
  photos: MediaItem[];
  /** Small heading above the strip. */
  label?: string;
  /** Seconds for one full loop; larger is slower. */
  duration?: number;
  /** Scroll right-to-left (default) or left-to-right. */
  reverse?: boolean;
  className?: string;
}

/**
 * An endlessly scrolling strip of nail photos on a blush background.
 *
 * The list is rendered twice and the track slides by half its width (see
 * .marquee-track in globals.css), so the loop has no visible seam. The second
 * copy is aria-hidden so screen readers only hear each photo once. Hovering
 * pauses it; prefers-reduced-motion stops it and lets it scroll by hand.
 */
export function PhotoMarquee({
  photos,
  label = "Fresh from the studio",
  duration = 70,
  reverse = false,
  className,
}: PhotoMarqueeProps) {
  return (
    <section className={cn("relative py-14 md:py-20 bg-vynl-smoke overflow-hidden", className)}>
      <div className="flex flex-col items-center gap-2 mb-8 md:mb-10 px-4 text-center">
        <p className="font-display italic text-2xl md:text-3xl text-vynl-rose-deep">
          <span aria-hidden className="text-vynl-rose not-italic mr-2">✿</span>
          {label}
          <span aria-hidden className="text-vynl-rose not-italic ml-2">✿</span>
        </p>
        <a
          href={BUSINESS.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-2xs font-sans font-medium tracking-ultra-wide uppercase text-vynl-gray-500 hover:text-vynl-rose-deep transition-colors"
        >
          More on Instagram · @au.vynl
        </a>
      </div>

      <div className="relative motion-reduce:overflow-x-auto">
        <div
          className="marquee-track flex w-max gap-4 md:gap-6 px-2 py-4"
          style={{
            ["--marquee-duration" as string]: `${duration}s`,
            animationDirection: reverse ? "reverse" : undefined,
          }}
        >
          {[0, 1].map((copy) =>
            photos.map((photo, i) => (
              <div
                key={`${copy}-${photo.src}`}
                aria-hidden={copy === 1 || undefined}
                className={cn(
                  "relative shrink-0 w-36 md:w-52 aspect-[3/4] overflow-hidden rounded-[1.75rem]",
                  "ring-4 ring-white shadow-[0_12px_30px_-14px_rgba(185,103,127,0.45)]",
                  i % 2 === 0 ? "rotate-[-2deg]" : "rotate-[2deg] translate-y-3"
                )}
              >
                <Image
                  src={photo.src}
                  alt={copy === 0 ? photo.alt : ""}
                  fill
                  sizes="(max-width: 768px) 144px, 208px"
                  className="object-cover"
                />
              </div>
            ))
          )}
        </div>

        {/* Soft fade at both edges */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-vynl-smoke to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-vynl-smoke to-transparent" />
      </div>
    </section>
  );
}
