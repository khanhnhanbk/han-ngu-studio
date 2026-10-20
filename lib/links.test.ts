import { describe, expect, it } from "vitest";
import { TOOL_GROUPS, TOOLS, type ToolId } from "./links";

describe("TOOLS", () => {
  it("has /tools/ hrefs", () => {
    for (const t of TOOLS) {
      expect(t.href.startsWith("/tools/")).toBe(true);
    }
  });
  it("lists the decompose tool", () => {
    expect(TOOLS.some((t) => t.href === "/tools/decompose")).toBe(true);
  });
  it("puts every tool in exactly one group", () => {
    const ids = TOOL_GROUPS.flatMap((g) => g.tools.map((t) => t.id));
    const all: ToolId[] = ["reader", "practiceSheet", "strokeOrder", "segment", "pinyin", "hanviet", "anki", "quiz", "radicals", "decompose", "comprehensibleInput", "stories"];
    expect([...ids].sort()).toEqual([...all].sort());
    expect(new Set(TOOLS.map((t) => t.href)).size).toBe(all.length);
  });
  it("lists the N+1 tool", () => {
    expect(TOOLS.some((t) => t.href === "/tools/comprehensible-input")).toBe(true);
  });
});
