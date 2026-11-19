import { getDictionary, type Locale } from "@/lib/i18n";
import { localizeHref } from "@/lib/i18n/locale";
import type { ToolKey } from "@/lib/i18n/metadata";

/**
 * The live origin, for absolute URLs in structured data (same as `metadataBase` in
 * app/layout.tsx).
 */
export const JSONLD_ORIGIN = "https://han-ngu-studio.vercel.app";

const SITE_NAME = "Hán Ngữ Studio";

type JsonLd = Record<string, unknown>;

function abs(locale: Locale, path: string): string {
  const p = localizeHref(locale, path);
  return p === "/" ? JSONLD_ORIGIN : `${JSONLD_ORIGIN}${p}`;
}

/**
 * Home page: the site and who publishes it. Only facts that are true today:
 * no ratings, reviews, user counts or contact details.
 */
export function siteJsonLd(locale: Locale): JsonLd {
  const dict = getDictionary(locale);
  const home = abs(locale, "/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        name: SITE_NAME,
        url: home,
        description: dict.meta.description,
        inLanguage: locale,
        publisher: { "@id": `${JSONLD_ORIGIN}#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${JSONLD_ORIGIN}#organization`,
        name: SITE_NAME,
        url: JSONLD_ORIGIN,
        logo: `${JSONLD_ORIGIN}/icon.png`,
      },
    ],
  };
}

/**
 * A tool page: a free web app that runs in the browser, plus Home › Tool breadcrumbs.
 * Name = the tool's card title, description = its search-result text (`seo` in lib/i18n).
 */
export function toolJsonLd(locale: Locale, tool: ToolKey, path: string): JsonLd {
  const dict = getDictionary(locale);
  const name = dict.features.items[tool].title;
  const url = abs(locale, path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name,
        url,
        description: dict.seo[tool].description,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        inLanguage: locale,
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
        publisher: { "@id": `${JSONLD_ORIGIN}#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: abs(locale, "/") },
          { "@type": "ListItem", position: 2, name, item: url },
        ],
      },
    ],
  };
}

/** Script-tag body: `<` escaped so no text can close the tag (same as components/FAQ.tsx). */
export function jsonLdString(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
