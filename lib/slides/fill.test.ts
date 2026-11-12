import { readFileSync } from "node:fs";
import { join } from "node:path";

import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { fieldsIn, fillSlideXml, fillTemplate, type SlideWord } from "./fill";

const word = (chu: string, extra: Partial<SlideWord> = {}): SlideWord => ({
  chu,
  pinyin: "",
  hanviet: "",
  nghia: "",
  vidu: "",
  vidu_pinyin: "",
  vidu_nghia: "",
  vidu2: "",
  vidu2_pinyin: "",
  vidu2_nghia: "",
  hsk: "",
  ...extra,
});

const template = (name: string) => new Uint8Array(readFileSync(join(__dirname, "../../public/templates", `${name}.pptx`)));

/** Slide texts of a .pptx in presentation order. */
function slideTexts(bytes: Uint8Array): string[] {
  const files = unzipSync(bytes);
  const rels = strFromU8(files["ppt/_rels/presentation.xml.rels"]);
  const target = (id: string) => new RegExp(`Id="${id}"[^>]*Target="([^"]+)"`).exec(rels)?.[1];
  return [...strFromU8(files["ppt/presentation.xml"]).matchAll(/r:id="([^"]+)"/g)]
    .map((m) => target(m[1]))
    .filter((t): t is string => !!t && t.startsWith("slides/"))
    .map((t) => [...strFromU8(files[`ppt/${t}`]).matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join(" "));
}

describe("fillSlideXml", () => {
  it("joins runs PowerPoint split and keeps the first run's formatting", () => {
    const xml = '<a:p><a:r><a:rPr b="1"/><a:t>{{ch</a:t></a:r><a:r><a:t>u}} – {{nghia}}</a:t></a:r></a:p>';
    const out = fillSlideXml(xml, { chu: "学习", nghia: "học <tập> & hành" });
    expect(out).toBe('<a:p><a:r><a:rPr b="1"/><a:t>学习 – học &lt;tập&gt; &amp; hành</a:t></a:r><a:r><a:t></a:t></a:r></a:p>');
  });

  it("keeps unknown fields visible and reads English aliases", () => {
    expect(fillSlideXml("<a:p><a:r><a:t>{{word}} {{typo}}</a:t></a:r></a:p>", { chu: "早" })).toContain("早 {{typo}}");
    expect(fieldsIn("<a:p><a:r><a:t>{{ Meaning }}</a:t></a:r></a:p>")).toEqual(["nghia"]);
  });
});

describe("fillTemplate", () => {
  it("repeats the word slide once per word and keeps the title slide once", () => {
    const res = fillTemplate(template("the-tu"), [word("早", { pinyin: "zǎo" }), word("学习", { nghia: "học tập" })], "Bài 1");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.slides).toBe(3);
    const texts = slideTexts(res.bytes);
    expect(texts).toHaveLength(3);
    expect(texts[0]).toContain("Bài 1");
    expect(texts[1]).toContain("早");
    expect(texts[1]).toContain("zǎo");
    expect(texts[2]).toContain("学习");
    expect(texts[2]).toContain("học tập");
    expect(texts.join(" ")).not.toMatch(/\{\{/);
  });

  it("repeats a group of word slides (question then answer) in order", () => {
    const res = fillTemplate(template("hoi-dap"), [word("早"), word("晚")], "Bài 2");
    expect(res.ok && res.slides).toBe(5);
    if (!res.ok) return;
    const texts = slideTexts(res.bytes);
    expect(texts.map((t) => (t.includes("早") ? "早" : t.includes("晚") ? "晚" : "-"))).toEqual(["-", "早", "早", "晚", "晚"]);
    // Every slide part is listed once in [Content_Types].xml.
    const types = strFromU8(unzipSync(res.bytes)["[Content_Types].xml"]);
    for (let n = 1; n <= 5; n++) expect(types.match(new RegExp(`/ppt/slides/slide${n}\\.xml"`, "g"))?.length).toBe(1);
  });

  it("puts a different example on each example slide of the three-slide template", () => {
    const w = word("打扫", { vidu: "我们要打扫房间。", vidu2: "你把房间打扫干净了吗？", vidu2_nghia: "Bạn đã dọn sạch phòng chưa?" });
    const res = fillTemplate(template("ba-trang"), [w, word("干净")], "Bài 3");
    expect(res.ok && res.slides).toBe(7);
    if (!res.ok) return;
    const texts = slideTexts(res.bytes);
    expect(texts[2]).toContain("我们要打扫房间。");
    expect(texts[2]).not.toContain("你把");
    expect(texts[3]).toContain("你把房间打扫干净了吗？");
    expect(texts[3]).toContain("Bạn đã dọn sạch phòng chưa?");
    expect(texts[4]).toContain("干净");
    expect(texts.join(" ")).not.toMatch(/\{\{/);
  });

  it("reads the English names of the second example", () => {
    expect(fieldsIn("<a:p><a:r><a:t>{{example2}} {{example2_meaning}}</a:t></a:r></a:p>")).toEqual(["vidu2", "vidu2_nghia"]);
  });

  it("reports what it cannot use", () => {
    expect(fillTemplate(strToU8("not a zip"), [word("早")], "")).toEqual({ ok: false, error: "notPptx" });
    expect(fillTemplate(template("the-tu"), [], "")).toEqual({ ok: false, error: "noWords" });
    const files = unzipSync(template("the-tu"));
    for (const p of Object.keys(files)) if (/^ppt\/slides\/slide\d+\.xml$/.test(p)) files[p] = strToU8(strFromU8(files[p]).replace(/\{\{(?!bai)[a-z_]+\}\}/g, ""));
    expect(fillTemplate(zipSync(files), [word("早")], "")).toEqual({ ok: false, error: "noWordSlide" });
  });

  it("lists fields it does not know", () => {
    const files = unzipSync(template("the-tu"));
    files["ppt/slides/slide2.xml"] = strToU8(strFromU8(files["ppt/slides/slide2.xml"]).replace("{{hanviet}}", "{{hanvet}}"));
    const res = fillTemplate(zipSync(files), [word("早")], "");
    expect(res.ok && res.unknown).toEqual(["hanvet"]);
  });
});
