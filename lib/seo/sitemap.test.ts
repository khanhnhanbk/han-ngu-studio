import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { HIDDEN_TOOLS } from "@/lib/links";
import { SITE_URL, SITEMAP_PATHS, sitemapEntries } from "./sitemap";

const APP = join(__dirname, "..", "..", "app");

/** Route of every folder under app/ that has a page.tsx ("/", "/en/tools/anki", …). */
function pageRoutes(dir = APP): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...pageRoutes(full));
    else if (name === "page.tsx") out.push("/" + relative(APP, dir).split("\\").join("/"));
  }
  return out.map((r) => (r === "/" ? r : r.replace(/\/$/, "")));
}

describe("sitemap", () => {
  const urls = sitemapEntries().map((e) => e.url);
  const hidden = new Set(HIDDEN_TOOLS.map((t) => t.href));

  it("lists every page folder under app/ in both languages, except hidden tools", () => {
    const routes = pageRoutes();
    expect(routes).toContain("/");
    expect(routes).toContain("/en");
    for (const route of routes) {
      const viPath = route === "/en" ? "/" : route.replace(/^\/en\//, "/");
      if (hidden.has(viPath)) {
        expect(urls).not.toContain(SITE_URL + route);
        continue;
      }
      expect(urls, route).toContain(route === "/" ? SITE_URL : SITE_URL + route);
    }
  });

  it("only lists pages that exist", () => {
    const routes = new Set(pageRoutes());
    for (const path of SITEMAP_PATHS) {
      expect(routes.has(path), path).toBe(true);
      expect(routes.has(path === "/" ? "/en" : `/en${path}`), path).toBe(true);
    }
  });

  it("has no duplicates and gives each row both hreflang links", () => {
    expect(new Set(urls).size).toBe(urls.length);
    for (const e of sitemapEntries()) {
      expect(Object.keys(e.alternates?.languages ?? {})).toEqual(["vi", "en"]);
    }
    expect(urls).toContain(SITE_URL);
    expect(urls).toContain(`${SITE_URL}/en/tools/practice-sheet`);
  });
});
