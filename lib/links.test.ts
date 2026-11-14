import { describe, expect, it } from "vitest";
import { HIDDEN_TOOLS, TOOL_GROUPS, TOOLS, type ToolId } from "./links";

describe("TOOLS", () => {
  it("has /tools/ hrefs", () => {
    for (const t of TOOLS) {
      expect(t.href.startsWith("/tools/")).toBe(true);
    }
  });
  it("lists the decompose tool", () => {
    expect(TOOLS.some((t) => t.href === "/tools/decompose")).toBe(true);
  });
  it("puts every tool in exactly one group or the hidden list", () => {
    const ids = [...TOOL_GROUPS.flatMap((g) => g.tools.map((t) => t.id)), ...HIDDEN_TOOLS.map((t) => t.id)];
    const all: ToolId[] = ["reader", "practiceSheet", "strokeOrder", "segment", "pinyin", "hanviet", "anki", "quiz", "radicals", "decompose", "comprehensibleInput", "stories", "lookup", "path"];
    expect([...ids].sort()).toEqual([...all].sort());
    expect(new Set([...TOOLS, ...HIDDEN_TOOLS].map((t) => t.href)).size).toBe(all.length);
  });
  it("keeps the hidden tools out of the menu", () => {
    for (const t of HIDDEN_TOOLS) expect(TOOLS.some((s) => s.id === t.id)).toBe(false);
  });
});
