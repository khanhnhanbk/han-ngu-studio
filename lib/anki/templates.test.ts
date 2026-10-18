import { describe, expect, it } from "vitest";

import { COLUMNS } from "./buildDeck";
import {
  CARD_TEMPLATES,
  NOTE_TYPE_FIELDS,
  renderCard,
  renderTemplate,
  SAMPLE_ROW,
  templateFields,
} from "./templates";

const get = (id: string) => CARD_TEMPLATES.find((t) => t.id === id)!;

describe("card templates", () => {
  it("name only the note type's fields (the TSV columns)", () => {
    expect(NOTE_TYPE_FIELDS).toEqual(COLUMNS);
    const allowed = new Set<string>([...NOTE_TYPE_FIELDS, "FrontSide"]);
    for (const t of CARD_TEMPLATES) {
      for (const name of [...templateFields(t.front), ...templateFields(t.back)]) expect(allowed).toContain(name);
    }
  });

  it("put the word on the front of Nhận diện and the meaning on the front of Nhớ chữ / Gõ chữ", () => {
    expect(renderCard(get("recognize"), SAMPLE_ROW).front).toContain("学习");
    for (const id of ["recall", "type"]) {
      const { front } = renderCard(get(id), SAMPLE_ROW);
      expect(front).toContain("học, học tập");
      expect(front).not.toContain("学习");
    }
  });

  it("show the answer on the back", () => {
    const { back } = renderCard(get("recognize"), SAMPLE_ROW);
    expect(back).toContain("xué xí");
    expect(back).toContain("học tập");
    expect(back).toContain("我在学校学习。");
    expect(renderCard(get("type"), SAMPLE_ROW).back).toContain('<code id="typeans">学习</code>');
  });

  it("make no Câu ví dụ card for a word without a sentence (empty front)", () => {
    expect(renderCard(get("sentence"), { ...SAMPLE_ROW, sentence: "" }).front.trim()).toBe('<div class="sentence"></div>');
    expect(renderTemplate("{{sentence}}", { sentence: "" }, "front")).toBe("");
  });
});

describe("renderTemplate", () => {
  it("escapes text but keeps <br> between examples", () => {
    expect(renderTemplate("{{a}}", { a: "<b>&<br>二" }, "front")).toBe("&lt;b&gt;&amp;<br>二");
  });

  it("drops {{#f}} sections for empty fields and shows {{^f}} fallbacks", () => {
    const tpl = "{{#vi}}VI:{{vi}}{{/vi}}{{^vi}}EN:{{en}}{{/vi}}";
    expect(renderTemplate(tpl, { vi: "học", en: "learn" }, "front")).toBe("VI:học");
    expect(renderTemplate(tpl, { vi: " ", en: "learn" }, "front")).toBe("EN:learn");
  });

  it("puts the front into {{FrontSide}} and renders {{type:f}} per side", () => {
    expect(renderTemplate("{{FrontSide}}|{{a}}", { a: "x" }, "back", "F")).toBe("F|x");
    expect(renderTemplate("{{type:word}}", SAMPLE_ROW, "front")).toContain("<input");
    expect(renderTemplate("{{type:word}}", SAMPLE_ROW, "back")).toBe('<code id="typeans">学习</code>');
  });
});
