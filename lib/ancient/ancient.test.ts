import { describe, expect, it } from "vitest";

// Shared with pnpm fetch:ancient / build:data (plain Node).
// @ts-expect-error -- untyped .mjs helper
import * as script from "../../scripts/lib/ancient.mjs";

import { ANCIENT_FORMS, ANCIENT_SHARDS, ancientShard, commonsPage, formsFor, svgDataUrl, type AncientEntry } from "./load";

const cleanSvg = script.cleanSvg as (text: string) => string | null;

describe("shards", () => {
  it("match the build script", () => {
    expect(ANCIENT_SHARDS).toBe(script.ANCIENT_SHARDS);
    expect([...ANCIENT_FORMS]).toEqual(script.ANCIENT_FORMS);
    for (const c of ["人", "车", "車", "发", "𠀀", "龍"]) expect(ancientShard(c)).toBe(script.ancientShard(c));
  });
});

describe("cleanSvg", () => {
  const inkscape = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Created with Inkscape -->
<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
  xmlns="http://www.w3.org/2000/svg" width="300" height="300" id="svg2" version="1.1" inkscape:version="0.48">
  <metadata id="m"><rdf:RDF><cc:Work rdf:about=""><dc:title></dc:title></cc:Work></rdf:RDF></metadata>
  <defs id="defs4" />
  <sodipodi:namedview id="base" pagecolor="#ffffff" />
  <g inkscape:label="Layer 1" id="layer1" transform="translate(0,-752.36218)">
    <path id="p1" style="fill:#000000" d="m 115.60225,1028.2537 c -11.45064,-2.366 z" />
  </g>
</svg>`;

  it("keeps only the drawing, with a viewBox", () => {
    expect(cleanSvg(inkscape)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><g transform="translate(0,-752.3)"><path style="fill:#000000" d="m 115.6,1028.2 c -11.4,-2.3 z" /></g></svg>',
    );
  });

  it("drops a plain DOCTYPE line (potrace) but refuses one with entities", () => {
    const potrace = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN"
 "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">
<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="123pt" height="123pt" viewBox="0 0 123.000000 123.000000">
<metadata>Created by potrace 1.13</metadata>
<g fill="#000000" stroke="none"><path d="M300 1033 c1 -18 16 -31 40 -34"/></g>
</svg>`;
    expect(cleanSvg(potrace)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 123.000000 123.000000"><g fill="#000000" stroke="none"><path d="M300 1033 c1 -18 16 -31 40 -34"/></g></svg>',
    );
    expect(cleanSvg(`<!DOCTYPE svg [<!ENTITY x "y">]><svg viewBox="0 0 1 1"><path d="M0 0"/></svg>`)).toBeNull();
  });

  it("keeps an existing viewBox", () => {
    expect(cleanSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20" width="5"><path d="M0 0h1"/></svg>')).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><path d="M0 0h1"/></svg>',
    );
  });

  it("rejects anything that could load or run something", () => {
    const wrap = (inner: string) => `<svg viewBox="0 0 1 1">${inner}<path d="M0 0"/></svg>`;
    for (const bad of [
      '<image href="x.png"/>',
      "<script>alert(1)</script>",
      '<a xlink:href="https://example.com"/>',
      '<path onclick="x()" d="M0 0"/>',
      '<path style="fill:url(#g)" d="M0 0"/>',
      "<style>path{}</style>",
      "<foreignObject/>",
    ]) {
      expect(cleanSvg(wrap(bad))).toBeNull();
    }
  });

  it("rejects files with no size, or nothing drawn", () => {
    expect(cleanSvg("<svg><path d='M0 0'/></svg>")).toBeNull();
    expect(cleanSvg('<svg viewBox="0 0 1 1"><g/></svg>')).toBeNull();
    expect(cleanSvg("not svg")).toBeNull();
  });
});

describe("formsFor", () => {
  const entry = (name: string): AncientEntry => ({ oracle: ["<svg o/>", name], seal: ["<svg s/>", name] });

  it("shows forms filed under the character itself", () => {
    expect(formsFor(entry("人"), "人", "人", []).map((f) => f.form)).toEqual(["oracle", "seal"]);
  });

  it("shows a Traditional-named file for a Simplified character with one Traditional form", () => {
    expect(formsFor(entry("車"), "车", "车", ["車"])).toHaveLength(2);
    expect(formsFor(entry("車"), "車", "车", ["車"])).toHaveLength(2);
  });

  it("does not guess when a Simplified character merges several Traditional ones", () => {
    expect(formsFor(entry("發"), "发", "发", ["發", "髮"])).toEqual([]);
    expect(formsFor(entry("發"), "髮", "发", ["發", "髮"])).toEqual([]);
    expect(formsFor(entry("發"), "發", "发", ["發", "髮"])).toHaveLength(2);
  });

  it("does not give a Traditional character the file of its Simplified form", () => {
    expect(formsFor(entry("后"), "後", "后", ["後"])).toEqual([]);
    expect(formsFor(entry("后"), "后", "后", ["後"])).toHaveLength(2);
  });

  it("is empty without data", () => {
    expect(formsFor(null, "人", "人", [])).toEqual([]);
  });
});

describe("links", () => {
  it("points at the Commons file page", () => {
    expect(commonsPage("車", "oracle")).toBe("https://commons.wikimedia.org/wiki/File:%E8%BB%8A-oracle.svg");
  });

  it("encodes the SVG as a data URL", () => {
    expect(svgDataUrl('<svg a="#"/>')).toBe("data:image/svg+xml;charset=utf-8,%3Csvg%20a%3D%22%23%22%2F%3E");
  });
});
