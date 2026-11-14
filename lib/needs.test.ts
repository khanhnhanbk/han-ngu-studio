import { describe, expect, it } from "vitest";

import { vi } from "@/lib/i18n/vi";
import { TOOL_GROUPS, TOOLS } from "@/lib/links";

import { NEED_MAP } from "./needs";

describe("NEED_MAP", () => {
  it("has one branch per tool group, in the same order", () => {
    expect(NEED_MAP.map((b) => b.group)).toEqual(TOOL_GROUPS.map((g) => g.id));
  });
  it("reaches every shown tool and Soạn bài", () => {
    const hrefs = NEED_MAP.flatMap((b) => b.needs.map((n) => n.href.split("#")[0]));
    for (const t of TOOLS) {
      // Anki and Quiz are reached inside Soạn bài.
      if (t.id === "anki" || t.id === "quiz") continue;
      expect(hrefs, t.id).toContain(t.href);
    }
    expect(hrefs).toContain("/lesson");
  });
  it("has text for every leaf", () => {
    for (const n of NEED_MAP.flatMap((b) => b.needs)) {
      expect(vi.needMap.needs[n.id].title, n.id).toBeTruthy();
    }
  });
});
