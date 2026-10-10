import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /admin and /sign-in are disabled for now; kept here so they stay
        // uncrawled the moment they're switched back on.
        disallow: [
          "/admin",
          "/api/",
          "/booking/manage/",
          "/sign-in",
          "/book/success",
          "/monitoring",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
