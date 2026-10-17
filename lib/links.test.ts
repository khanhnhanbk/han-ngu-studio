import { describe, expect, it } from "vitest";
import { TOOLS } from "./links";

describe("TOOLS", () => {
  it("has one-character icons and /tools/ hrefs", () => {
    for (const t of TOOLS) {
      expect([...t.icon]).toHaveLength(1);
      expect(t.href.startsWith("/tools/")).toBe(true);
    }
  });
  it("lists the N+1 tool", () => {
    expect(TOOLS.some((t) => t.href === "/tools/comprehensible-input")).toBe(true);
  });
});
