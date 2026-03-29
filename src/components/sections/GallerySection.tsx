import { cn } from "@/lib/utils";
import type { GalleryGridItem, SectionMeta } from "@/types";
import { Container } from "../layout/Container";
import { Heading, Subheading, LabelText, Rule } from "../ui/Typography";
import { GalleryGrid } from "../ui/Media";

interface GallerySectionProps {
  meta: SectionMeta;
  items: GalleryGridItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function GallerySection({ meta, items, columns = 4, className }: GallerySectionProps) {
  const isDark = meta.colorScheme === "dark";
  return (
    <section
      className={cn(
        "py-24 md:py-32",
        isDark ? "bg-vynl-black" : "bg-vynl-smoke",
        className
      )}
    >
      <Container>
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
            size="2xl"
            className={cn("max-w-xl", isDark && "text-vynl-white")}
          >
            {meta.title}
          </Heading>
          {meta.subtitle && (
            <Subheading
              className={cn("max-w-lg", isDark && "text-vynl-gray-400")}
            >
              {meta.subtitle}
            </Subheading>
          )}
        </div>
        <GalleryGrid items={items} columns={columns} />
      </Container>
    </section>
  );
}
