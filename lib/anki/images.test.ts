import { describe, expect, it, vi } from "vitest";

import {
  fitSize,
  imageCredit,
  imageFieldHtml,
  imageFileName,
  imageQuery,
  licenseName,
  parseOpenverse,
  RateLimitedError,
  searchImages,
} from "./images";

describe("imageQuery", () => {
  it("takes the first short sense without 'to' or articles", () => {
    expect(imageQuery("to learn; to study")).toBe("learn");
    expect(imageQuery("friend")).toBe("friend");
    expect(imageQuery("the Great Learning, one of the Four Books 四書|四书[Si4 shu1] in Confucianism; university; college")).toBe("university");
  });

  it("prefers common nouns over proper nouns", () => {
    expect(imageQuery("Apple (American tech company); apple")).toBe("apple");
    expect(imageQuery("Shui ethnic group; water/river")).toBe("water");
    expect(imageQuery("China")).toBe("China");
  });

  it("skips grammar notes and cross-references", () => {
    expect(imageQuery("used in 貓腰|猫腰[mao2 yao1]")).toBe("");
    expect(imageQuery("(completed action marker)/(modal particle indicating change of state)")).toBe("");
    expect(imageQuery("variant of 個|个[ge4]; CL:個|个")).toBe("");
  });
});

describe("Openverse", () => {
  const json = {
    results: [
      { id: "a1", url: "https://x/1.jpg", thumbnail: "https://api/a1/thumb/", title: "Apples", creator: "Ann", license: "by", license_version: "2.0", foreign_landing_url: "https://x/1" },
      { id: "b2", url: "https://x/2.jpg", thumbnail: "https://api/b2/thumb/", license: "cc0", license_version: "1.0" },
      { id: "c3", url: "https://x/3.jpg", license: "by" }, // no thumbnail: dropped
    ],
  };

  it("keeps complete results with readable licence names", () => {
    const out = parseOpenverse(json);
    expect(out.map((c) => [c.id, c.license])).toEqual([
      ["a1", "CC BY 2.0"],
      ["b2", "CC0 1.0"],
    ]);
    expect(licenseName("pdm")).toBe("Public Domain Mark 1.0");
    expect(licenseName("by-nc-sa", "4.0")).toBe("CC BY-NC-SA 4.0");
  });

  it("sends only the query, and reports rate limiting", async () => {
    const ok = vi.fn(async () => new Response(JSON.stringify(json), { status: 200 }));
    await searchImages("apple", ok as unknown as typeof fetch);
    const url = new URL(String((ok.mock.calls[0] as unknown[])[0]));
    expect(url.origin + url.pathname).toBe("https://api.openverse.org/v1/images/");
    expect(url.searchParams.get("q")).toBe("apple");
    const limited = vi.fn(async () => new Response("", { status: 429 }));
    await expect(searchImages("apple", limited as unknown as typeof fetch)).rejects.toBeInstanceOf(RateLimitedError);
  });
});

describe("card field", () => {
  it("credits the picture and escapes the text", () => {
    expect(imageCredit({ title: "Apples", creator: "Ann", license: "CC BY 2.0" })).toBe("“Apples” by Ann, CC BY 2.0");
    expect(imageCredit({ title: "", creator: "", license: "CC0 1.0" })).toBe("CC0 1.0");
    expect(imageFieldHtml("hns-img-a1.jpg", "<b> & co")).toBe('<img src="hns-img-a1.jpg"><div class="credit">&lt;b&gt; &amp; co</div>');
  });

  it("names files safely and scales pictures down only", () => {
    expect(imageFileName("ae9def31-39f4-4056-8df3-135b19a2ddc7")).toBe("hns-img-ae9def31-39f4-4056-8df3-135b19a2ddc7.jpg");
    expect(imageFileName("../x")).toBe("hns-img-.jpg");
    expect(fitSize(1024, 768)).toEqual({ w: 400, h: 300 });
    expect(fitSize(200, 100)).toEqual({ w: 200, h: 100 });
  });
});
