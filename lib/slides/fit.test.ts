import { describe, expect, it } from "vitest";

import { fillSlideXml, type FitNote } from "./fill";
import { groupFitted, linesNeeded, textWidth } from "./fit";

/** A text box like PowerPoint's: position, size in EMU, no insets, one paragraph at `sz` (hundredths of a point). */
const box = (text: string, cx: number, cy: number, sz: number, x = 0) =>
  `<p:sp><p:spPr><a:xfrm><a:off x="${Math.round(x)}" y="0"/><a:ext cx="${Math.round(cx)}" cy="${Math.round(cy)}"/></a:xfrm></p:spPr>` +
  `<p:txBody><a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0"><a:spAutoFit/></a:bodyPr><a:lstStyle/>` +
  `<a:p><a:r><a:rPr lang="zh-CN" sz="${sz}"/><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;
const pic = (x: number, cx: number, cy: number) =>
  `<p:pic><p:spPr><a:xfrm><a:off x="${Math.round(x)}" y="0"/><a:ext cx="${Math.round(cx)}" cy="${Math.round(cy)}"/></a:xfrm></p:spPr></p:pic>`;
const sizes = (xml: string) => [...xml.matchAll(/sz="(\d+)"/g)].map((m) => Number(m[1]));

// The teacher's template: {{chu}} at 212 pt in a box two characters wide, one line tall.
const PT = 12700;
const chuBox = box("{{chu}}", 2.2 * 212 * PT, 1.2 * 212 * PT, 21200);

describe("text widths", () => {
  it("counts a Chinese character as 1 em and Latin letters narrower", () => {
    expect(textWidth("大学生")).toBe(3);
    expect(textWidth("sinh viên")).toBeLessThan(5);
    expect(linesNeeded("大学生", 2.2)).toBe(2);
    expect(linesNeeded("sinh viên đại học", 5)).toBe(2);
    expect(linesNeeded("", 5)).toBe(1);
  });
});

describe("fitting filled text into its box", () => {
  it("leaves a word that fits alone", () => {
    const notes: FitNote[] = [];
    expect(sizes(fillSlideXml(chuBox, { chu: "汉语" }, notes))).toEqual([21200]);
    expect(notes).toEqual([]);
  });

  it("shrinks a three-character word to one line instead of breaking it", () => {
    const notes: FitNote[] = [];
    const out = fillSlideXml(chuBox, { chu: "大学生" }, notes);
    const [sz] = sizes(out);
    expect(sz).toBeLessThan(21200);
    expect(3 * sz * 127).toBeLessThanOrEqual(2.2 * 212 * PT);
    expect(notes).toEqual([{ fields: ["chu"], text: "大学生", scale: expect.any(Number), overflow: false }]);
    expect(notes[0].scale).toBeGreaterThan(0.6);
  });

  it("keeps clear of a picture drawn over the right part of the box", () => {
    const wide = box("{{chu}}", 20 * 212 * PT, 1.2 * 212 * PT, 21200);
    const free = fillSlideXml(wide + pic(10 * 212 * PT, 5 * 212 * PT, 212 * PT), { chu: "大学生" });
    expect(sizes(free)).toEqual([21200]);
    const blocked = fillSlideXml(wide + pic(2.5 * 212 * PT, 5 * 212 * PT, 212 * PT), { chu: "大学生" });
    expect(sizes(blocked)[0]).toBeLessThan(21200);
  });

  it("lets a long meaning wrap in a box drawn two lines tall", () => {
    const meaning = box("{{nghia}}", 30 * 57 * PT * 0.56, 2.4 * 57 * PT, 5700);
    const notes: FitNote[] = [];
    const long = "sinh viên đại học; sinh viên cao đẳng, học viên";
    expect(sizes(fillSlideXml(meaning, { nghia: long }, notes))).toEqual([5700]);
    expect(notes).toEqual([]);
  });

  it("flags text that cannot fit even at the smallest size", () => {
    const notes: FitNote[] = [];
    fillSlideXml(chuBox, { chu: "中华人民共和国国务院" }, notes);
    expect(notes[0]).toMatchObject({ scale: 0.4, overflow: true });
  });

  it("gives a size to runs that had none", () => {
    const bare = chuBox.replace('<a:rPr lang="zh-CN" sz="21200"/>', "").replace("<a:lstStyle/>", '<a:lstStyle><a:lvl1pPr><a:defRPr sz="21200"/></a:lvl1pPr></a:lstStyle>');
    const out = fillSlideXml(bare, { chu: "大学生" });
    expect(out).toMatch(/<a:r><a:rPr sz="\d+"\/><a:t>大学生/);
  });

  it("lists each word once per box, with its smallest size", () => {
    const n = (text: string, scale: number): FitNote => ({ fields: ["chu"], text, scale, overflow: false });
    expect(groupFitted([n("大学生", 0.9), n("大学生", 0.7), n("图书馆", 0.8)])).toEqual([n("大学生", 0.7), n("图书馆", 0.8)]);
  });
});
