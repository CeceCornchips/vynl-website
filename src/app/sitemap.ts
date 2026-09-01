import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Public, indexable routes only.
 *
 * Deliberately excluded: /admin and /api (private), /sign-in, /booking/manage
 * (tokenised, per-customer), /book/success (post-transaction), and /book — the
 * in-app booking flow is unlinked from the site and duplicates /contact's
 * intent, so listing it would split the "book an appointment" signal.
 */
const routes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/nails", changeFrequency: "weekly", priority: 0.9 },
  { path: "/academy", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/supply", changeFrequency: "monthly", priority: 0.5 },
  { path: "/gel-x-guide", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
