"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";

import { getDictionary, type Dictionary, type Locale } from "./index";
import { localeFromPath, localizeHref } from "./locale";

/** The page's locale, from its URL (also during static rendering). */
export function useLocale(): Locale {
  return localeFromPath(usePathname());
}

export function useDictionary(): Dictionary {
  return getDictionary(useLocale());
}

/** Turns a site link into the same link in the page's language. */
export function useHref(): (href: string) => string {
  const locale = useLocale();
  return useCallback((href: string) => localizeHref(locale, href), [locale]);
}
