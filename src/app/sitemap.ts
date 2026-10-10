import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/seo";
import { galleryItems } from "@/data";

/**
 * Public, indexable routes only.
 *
 * Deliberately excluded: /api (private), /booking/manage (tokenised,
 * per-customer), /book/success (post-transaction), and /book — the in-app
 * booking flow is unlinked from the site and duplicates /contact's intent, so
 * listing it would split the "book an appointment" signal. Admin is currently
 * disabled (see src/app/_admin/README.md) and must stay out of here if it
 * comes back.
 *
 * `updated` is the date the page's content last meaningfully changed. Bump it
 * by hand when you edit a page. Stamping every URL with the build time makes
 * Google stop trusting lastmod across the whole sitemap.
 */
const routes: Array<{
  path: string;
  updated: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  images?: string[];
}> = [
  {
    path: "/",
    updated: "2026-10-10",
    changeFrequency: "weekly",
    priority: 1,
    images: [absoluteUrl("/hero-poster.jpg"), ...galleryItems.slice(0, 12).map((i) => i.media!.src)],
  },
  {
    path: "/nails",
    updated: "2026-10-10",
    changeFrequency: "weekly",
    priority: 0.9,
    // Every gallery photo, including the ones behind "Load more" that aren't
    // in the initial HTML.
    images: [
      "/images/gallery/gel-x-nail-art-vynl-studio.jpg",
      ...galleryItems.map((i) => i.media!.src),
    ],
  },
  { path: "/academy", updated: "2026-10-10", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contact", updated: "2026-10-10", changeFrequency: "monthly", priority: 0.8 },
  { path: "/supply", updated: "2026-10-10", changeFrequency: "monthly", priority: 0.5 },
  { path: "/gel-x-guide", updated: "2026-10-10", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", updated: "2026-10-10", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", updated: "2026-10-10", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, updated, changeFrequency, priority, images }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(`${updated}T00:00:00+11:00`),
    changeFrequency,
    priority,
    ...(images ? { images: images.map(absoluteUrl) } : {}),
  }));
}
