import type { Locale } from "./index";

/**
 * The locale lives in the URL: Vietnamese at the site's own paths, English
 * under /en (/en, /en/tools/pinyin…). Static, no middleware.
 */
export const EN_PREFIX = "/en";

export function localeFromPath(path: string | null | undefined): Locale {
  return path === EN_PREFIX || path?.startsWith(`${EN_PREFIX}/`) || path?.startsWith(`${EN_PREFIX}#`) ? "en" : "vi";
}

/** A site path without its /en prefix ("/en/tools/x" → "/tools/x", "/en" → "/"). */
export function stripLocale(path: string): string {
  if (localeFromPath(path) !== "en") return path;
  const rest = path.slice(EN_PREFIX.length);
  return rest === "" || rest.startsWith("#") ? `/${rest}` : rest;
}

/**
 * An internal link in `locale`. Only page links get the prefix: external
 * URLs, in-page "#…" links and static files (/data, /vendor) are unchanged.
 */
export function localizeHref(locale: Locale, href: string): string {
  if (locale === "vi" || !href.startsWith("/") || href.startsWith("//")) return href;
  if (/^\/(data|vendor|_next)\//.test(href) || localeFromPath(href) === "en") return href;
  return href === "/" ? EN_PREFIX : href.startsWith("/#") ? `${EN_PREFIX}${href.slice(1)}` : `${EN_PREFIX}${href}`;
}

/** The same page in the other language. */
export function switchLocalePath(path: string, target: Locale): string {
  return localizeHref(target, stripLocale(path));
}

/**
 * Inline <head> script: the root layout is shared, so it says lang="vi";
 * English pages switch it before first paint (screen readers, hyphenation,
 * translation prompts). Same rule as localeFromPath.
 */
export const LANG_INIT_SCRIPT = `(function(){var p=location.pathname;if(p==="${EN_PREFIX}"||p.indexOf("${EN_PREFIX}/")===0)document.documentElement.lang="en";})();`;
