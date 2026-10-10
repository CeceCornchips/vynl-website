import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types";

interface PolaroidCollageProps {
  /** Two or three photos; extras are ignored. */
  photos: MediaItem[];
  /** "stack": overlapping pile (hero). "row": side-by-side fan (content areas). */
  layout?: "stack" | "row";
  /** `sizes` hint for each photo. Defaults suit a ~1/3-width column. */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

// Position, tilt and float offset for each photo in the overlapping stack.
const STACK = [
  { pos: "left-0 top-[10%] w-[54%] z-10", tilt: "-7deg", delay: "0s" },
  { pos: "right-0 top-0 w-[50%] z-20", tilt: "5deg", delay: "-2.4s" },
  { pos: "left-[22%] bottom-0 w-[52%] z-30", tilt: "-2deg", delay: "-4.8s" },
];

const ROW_TILTS = ["-4deg", "2deg", "-1.5deg"];

function Polaroid({
  photo,
  tilt,
  delay,
  sizes,
  priority,
  className,
}: {
  photo: MediaItem;
  tilt: string;
  delay: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "float-soft bg-white p-2 pb-7 md:p-2.5 md:pb-9 rounded-2xl",
        "shadow-[0_18px_40px_-12px_rgba(185,103,127,0.35)] ring-1 ring-vynl-petal",
        className
      )}
      style={{ ["--tilt" as string]: tilt, transform: `rotate(${tilt})`, animationDelay: delay }}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-vynl-petal">
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    </figure>
  );
}

/**
 * Tilted, white-framed nail photos that bob gently — the site's "cute" accent.
 * Pure CSS motion (see .float-soft in globals.css), so it renders on the server
 * and switches off under prefers-reduced-motion.
 */
export function PolaroidCollage({
  photos,
  layout = "stack",
  sizes = "(max-width: 1024px) 40vw, 260px",
  priority,
  className,
}: PolaroidCollageProps) {
  const shown = photos.slice(0, 3);

  if (layout === "row") {
    return (
      <div className={cn("grid gap-3 md:gap-5", shown.length === 2 ? "grid-cols-2" : "grid-cols-3", className)}>
        {shown.map((photo, i) => (
          <Polaroid
            key={photo.src}
            photo={photo}
            tilt={ROW_TILTS[i]}
            delay={`${i * -2.3}s`}
            sizes={sizes}
            priority={priority}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-[5/6]", className)}>
      {shown.map((photo, i) => (
        <Polaroid
          key={photo.src}
          photo={photo}
          tilt={STACK[i].tilt}
          delay={STACK[i].delay}
          sizes={sizes}
          priority={priority}
          className={cn("absolute", STACK[i].pos)}
        />
      ))}
      {/* Little sparkles */}
      <span aria-hidden className="absolute -top-4 left-[46%] z-40 text-2xl text-vynl-rose select-none">✦</span>
      <span aria-hidden className="absolute bottom-[18%] -right-3 z-40 text-lg text-vynl-champagne-light select-none">✦</span>
      <span aria-hidden className="absolute bottom-[34%] -left-4 z-40 text-sm text-vynl-rose select-none">✦</span>
    </div>
  );
}
