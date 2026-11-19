import type { MetadataRoute } from "next";

import { localizeHref } from "@/lib/i18n/locale";
import { TOOLS } from "@/lib/links";

/** The live site's origin (also `metadataBase` in app/layout.tsx). */
export const SITE_URL = "https://han-ngu-studio.vercel.app";

/**
 * Every page that should be in search results, as its Vietnamese path; each also has an
 * /en twin. Hidden tools (HIDDEN_TOOLS in lib/links.ts: segment, hanviet,
 * comprehensible-input) are left out: no menu, footer or page links to them any more.
 * lib/seo/sitemap.test.ts fails when a new page folder under app/ is missing here.
 */
export const SITEMAP_PATHS: readonly string[] = [
  "/",
  "/lesson",
  ...TOOLS.map((t) => t.href),
  "/tools/anki/guide",
  "/guide",
  "/licenses",
];

/** Absolute URL of a Vietnamese path in `locale` ("/" → the bare origin, no trailing slash). */
export function absoluteUrl(locale: "vi" | "en", path: string): string {
  const p = localizeHref(locale, path);
  return p === "/" ? SITE_URL : `${SITE_URL}${p}`;
}

/** Sitemap rows: one per page and language, each listing both languages as hreflang alternates. */
export function sitemapEntries(): MetadataRoute.Sitemap {
  return SITEMAP_PATHS.flatMap((path) => {
    const languages = { vi: absoluteUrl("vi", path), en: absoluteUrl("en", path) };
    return (["vi", "en"] as const).map((locale) => ({
      url: absoluteUrl(locale, path),
      alternates: { languages },
    }));
  });
}
