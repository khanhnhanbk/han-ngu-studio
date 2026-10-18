import { describe, expect, it } from "vitest";
import { TOOLS } from "./links";

describe("TOOLS", () => {
  it("has /tools/ hrefs", () => {
    for (const t of TOOLS) {
      expect(t.href.startsWith("/tools/")).toBe(true);
    }
  });
  it("lists the decompose tool", () => {
    expect(TOOLS.some((t) => t.href === "/tools/decompose")).toBe(true);
  });
  it("lists the N+1 tool", () => {
    expect(TOOLS.some((t) => t.href === "/tools/comprehensible-input")).toBe(true);
  });
});
