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

/**
 * Link-preview image for one tool page: `public/og/<last route part>.png`, English in
 * `public/og/en/`. Drawn by `scripts/og/make-og.mjs` (every word inside the centre 630×630
 * square, which Facebook comments, Messenger and Zalo crop to). Raise OG_VERSION whenever the
 * images are redrawn so Zalo and Facebook fetch the new picture instead of their cached one.
 */
export const OG_VERSION = 1;

export function toolOgImage(locale: Locale, path: string): string {
  const file = path.split("/").filter(Boolean).pop();
  return `/og/${locale === "en" ? "en/" : ""}${file}.png?v=${OG_VERSION}`;
}

/** Title, description and hreflang for a tool page in one language. */
export function toolMetadata(locale: Locale, tool: ToolKey, path: string): Metadata {
  const dict = getDictionary(locale);
  const item = dict.features.items[tool];
  const title = `${item.title} – Hán Ngữ Studio`;
  const image = { url: toolOgImage(locale, path), width: 1200, height: 630, alt: item.title };
  return {
    title,
    description: item.description,
    alternates: alternates(locale, path),
    // Link previews (Zalo, Facebook) show the tool's own title and picture. Setting
    // openGraph here drops the inherited app/opengraph-image.png, so images must be listed.
    openGraph: {
      images: [image],
      title,
      description: item.description,
      url: localizeHref(locale, path),
      siteName: "Hán Ngữ Studio",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      type: "website",
    },
    twitter: { card: "summary_large_image", images: [image] },
  };
}
