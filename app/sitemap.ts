import type { MetadataRoute } from "next";

import { sitemapEntries } from "@/lib/seo/sitemap";

/** /sitemap.xml, built once at build time (no runtime work). Page list: lib/seo/sitemap.ts. */
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries();
}
