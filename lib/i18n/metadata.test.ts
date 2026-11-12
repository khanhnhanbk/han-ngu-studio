import { describe, expect, it } from "vitest";

import { en } from "./en";
import { toolMetadata, toolTitle } from "./metadata";
import { vi } from "./vi";

const tools = Object.keys(vi.features.items) as Array<keyof typeof vi.features.items>;

describe("SEO text for each tool", () => {
  it("covers every tool on the landing page, and nothing else", () => {
    expect(Object.keys(vi.seo).sort()).toEqual([...tools].sort());
    expect(Object.keys(en.seo).sort()).toEqual([...tools].sort());
  });

  for (const dict of [vi, en]) {
    const locale = dict === vi ? "vi" : "en";
    for (const tool of tools) {
      it(`${locale} ${tool}: title fits a Google result, description is 120–160 characters`, () => {
        // Google cuts titles at about 60–65 characters and descriptions at about 160.
        expect(toolTitle(locale, tool).length).toBeLessThanOrEqual(67);
        const n = dict.seo[tool].description.length;
        expect(n).toBeGreaterThanOrEqual(120);
        expect(n).toBeLessThanOrEqual(160);
      });
    }
  }

  it("is used for the page title, description and link preview", () => {
    const meta = toolMetadata("vi", "practiceSheet", "/tools/practice-sheet");
    expect(meta.title).toBe("Tạo phiếu tập viết chữ Hán in A4 miễn phí – Hán Ngữ Studio");
    expect(meta.description).toBe(vi.seo.practiceSheet.description);
    expect(meta.openGraph?.title).toBe(meta.title);
    expect(meta.openGraph?.description).toBe(meta.description);
    // The landing-page card keeps its own short text.
    expect(vi.features.items.practiceSheet.title).toBe("Phiếu tập viết chữ Hán");
  });
});
