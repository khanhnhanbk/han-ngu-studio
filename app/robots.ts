import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo/sitemap";

/** /robots.txt: everything may be crawled; points search engines to the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
