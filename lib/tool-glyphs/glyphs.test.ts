import * as cn2t from "opencc-js/cn2t";
import { describe, expect, it } from "vitest";

import { TOOLS } from "@/lib/links";

import { TOOL_GLYPHS } from "./glyphs";

const toTw = cn2t.Converter({ from: "cn", to: "tw" });

describe("TOOL_GLYPHS", () => {
  it("gives every live tool one character", () => {
    for (const { id } of TOOLS) {
      expect(Array.from(TOOL_GLYPHS[id].simp)).toHaveLength(1);
    }
  });

  it("uses a different character for each tool", () => {
    const chars = Object.values(TOOL_GLYPHS).map((g) => g.simp);
    expect(new Set(chars).size).toBe(chars.length);
  });

  it("stores the Traditional form exactly when OpenCC changes the character", () => {
    for (const [id, g] of Object.entries(TOOL_GLYPHS)) {
      const tw = toTw(g.simp);
      expect(g.trad ?? g.simp, id).toBe(tw);
      if (g.trad) expect(g.trad, id).not.toBe(g.simp);
    }
  });
});
