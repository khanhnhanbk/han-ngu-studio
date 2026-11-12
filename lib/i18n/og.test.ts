import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { toolOgImage } from "./metadata";

const root = join(__dirname, "..", "..");
const toolRoutes = [
  "/lesson",
  ...readdirSync(join(root, "app", "tools"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(root, "app", "tools", d.name, "layout.tsx")))
    .map((d) => `/tools/${d.name}`),
];

describe("tool link-preview images", () => {
  it("finds the tool routes", () => {
    expect(toolRoutes.length).toBeGreaterThanOrEqual(15);
  });

  it.each(toolRoutes)("%s has a Vietnamese and an English image in public/og", (route) => {
    for (const locale of ["vi", "en"] as const) {
      const url = toolOgImage(locale, route);
      expect(url).toMatch(/^\/og\/(en\/)?[a-z-]+\.png\?v=\d+$/);
      expect(existsSync(join(root, "public", url.split("?")[0]))).toBe(true);
    }
  });

  it("has the English home image used by app/en/layout.tsx", () => {
    expect(existsSync(join(root, "public", "og", "en", "home.png"))).toBe(true);
  });
});
