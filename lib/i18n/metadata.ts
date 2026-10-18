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
  return {
    title: `${item.title} – Hán Ngữ Studio`,
    description: item.description,
    alternates: alternates(locale, path),
  };
}
