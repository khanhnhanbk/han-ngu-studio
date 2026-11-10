import type { Metadata } from "next";

import { getDictionary, type Locale } from "./index";
import { localizeHref } from "./locale";

/** hreflang links between a page's Vietnamese and English versions. */
export function alternates(locale: Locale, path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localizeHref(locale, path),
    languages: { vi: path, en: localizeHref("en", path), "x-default": path },
  };
}

type ToolKey = keyof ReturnType<typeof getDictionary>["features"]["items"];

/** Title, description and hreflang for a tool page in one language. */
export function toolMetadata(locale: Locale, tool: ToolKey, path: string): Metadata {
  const dict = getDictionary(locale);
  const item = dict.features.items[tool];
  const title = `${item.title} – Hán Ngữ Studio`;
  return {
    title,
    description: item.description,
    alternates: alternates(locale, path),
    // Link previews (Zalo, Facebook) show the tool's own title. Setting openGraph
    // here drops the inherited app/opengraph-image.png, so name it again.
    openGraph: {
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Hán Ngữ Studio" }],
      title,
      description: item.description,
      url: localizeHref(locale, path),
      siteName: "Hán Ngữ Studio",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      type: "website",
    },
  };
}
