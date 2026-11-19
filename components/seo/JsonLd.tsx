import type { Locale } from "@/lib/i18n";
import type { ToolKey } from "@/lib/i18n/metadata";
import { jsonLdString, siteJsonLd, toolJsonLd } from "@/lib/seo/jsonld";

/** Structured data for the home page (server-rendered into the HTML). */
export function SiteJsonLd({ locale }: { locale: Locale }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(siteJsonLd(locale)) }} />;
}

/** Structured data for one tool page (server-rendered into the HTML). */
export function ToolJsonLd({ locale, tool, path }: { locale: Locale; tool: ToolKey; path: string }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(toolJsonLd(locale, tool, path)) }} />
  );
}
