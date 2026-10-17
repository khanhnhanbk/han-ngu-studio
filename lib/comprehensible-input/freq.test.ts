import { expect, it } from "vitest";

import { buildFreqRank } from "./freq";

it("counts blank lines, trims, last duplicate wins", () => {
  const r = buildFreqRank(["我", "", "  你 ", "我", "\t"]);
  expect(r.get("我")).toBe(4);
  expect(r.get("你")).toBe(3);
  expect(r.size).toBe(2);
});
