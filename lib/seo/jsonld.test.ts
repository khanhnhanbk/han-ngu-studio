import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getDictionary } from "@/lib/i18n";
import type { ToolKey } from "@/lib/i18n/metadata";
import { JSONLD_ORIGIN, jsonLdString, siteJsonLd, toolJsonLd } from "./jsonld";

const APP = join(__dirname, "..", "..", "app");
const TOOL_KEYS = Object.keys(getDictionary("vi").seo) as ToolKey[];

type Node = Record<string, unknown>;
const graph = (s: string) => (JSON.parse(s) as { "@graph": Node[] })["@graph"];

describe("toolJsonLd", () => {
  it("is valid JSON with a free WebApplication and Home › Tool breadcrumbs, in both languages", () => {
    for (const locale of ["vi", "en"] as const) {
      for (const tool of TOOL_KEYS) {
        const [app, crumbs] = graph(jsonLdString(toolJsonLd(locale, tool, "/tools/x")));
        expect(app["@type"]).toBe("WebApplication");
        expect(app.applicationCategory).toBe("EducationalApplication");
        expect(app.isAccessibleForFree).toBe(true);
        expect(app.inLanguage).toBe(locale);
        expect(app.offers).toEqual({ "@type": "Offer", price: "0", priceCurrency: "VND" });
        expect(app.name).toBe(getDictionary(locale).features.items[tool].title);
        expect(app.description).toBe(getDictionary(locale).seo[tool].description);
        expect(app.url).toBe(locale === "en" ? `${JSONLD_ORIGIN}/en/tools/x` : `${JSONLD_ORIGIN}/tools/x`);
        expect(crumbs["@type"]).toBe("BreadcrumbList");
        const items = crumbs.itemListElement as Node[];
        expect(items.map((i) => i.position)).toEqual([1, 2]);
        expect(items[0].item).toBe(locale === "en" ? `${JSONLD_ORIGIN}/en` : JSONLD_ORIGIN);
      }
    }
  });

  it("never claims ratings, reviews or counts", () => {
    const all = [siteJsonLd("vi"), siteJsonLd("en"), ...TOOL_KEYS.map((t) => toolJsonLd("vi", t, "/tools/x"))];
    for (const d of all) expect(JSON.stringify(d)).not.toMatch(/aggregateRating|review|ratingValue|userInteractionCount/i);
  });
});

describe("siteJsonLd", () => {
  it("describes the site and its publisher", () => {
    const [site, org] = graph(jsonLdString(siteJsonLd("en")));
    expect(site["@type"]).toBe("WebSite");
    expect(site.url).toBe(`${JSONLD_ORIGIN}/en`);
    expect(site.description).toBe(getDictionary("en").meta.description);
    expect(org["@type"]).toBe("Organization");
    expect(org.logo).toBe(`${JSONLD_ORIGIN}/icon.png`);
  });
});

describe("jsonLdString", () => {
  it("escapes < so text cannot close the script tag", () => {
    const s = jsonLdString({ name: "</script><b>" });
    expect(s).not.toContain("<");
    expect(JSON.parse(s).name).toBe("</script><b>");
  });
});

describe("tool routes", () => {
  it("every tool page renders its structured data in both languages", () => {
    const dirs = [
      ...readdirSync(join(APP, "tools")).map((d) => join(APP, "tools", d)),
      ...readdirSync(join(APP, "en", "tools")).map((d) => join(APP, "en", "tools", d)),
      join(APP, "lesson"),
      join(APP, "en", "lesson"),
    ];
    for (const dir of dirs) {
      const src = ["layout.tsx", "page.tsx"]
        .map((f) => join(dir, f))
        .filter(existsSync)
        .map((f) => readFileSync(f, "utf8"))
        .join("\n");
      expect(src, dir).toMatch(/<ToolJsonLd locale="(vi|en)"/);
    }
  });
});
