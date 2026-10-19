/**
 * Data and libraries the site ships, with their licences (shown on /giay-phep;
 * keep in step with THIRD-PARTY-NOTICES.md). What each is used for is UI text:
 * `legal.uses[id]` in lib/i18n.
 */
export type SourceId =
  | "hsk30"
  | "cvdict"
  | "cedict"
  | "tatoeba"
  | "mmah"
  | "strokes"
  | "audio"
  | "unihan"
  | "wubi"
  | "libraries"
  | "fonts";

export type Source = {
  id: SourceId;
  name: string;
  url: string;
  license: string;
  licenseUrl?: string;
};

const CC_BY_SA_4 = "https://creativecommons.org/licenses/by-sa/4.0/";

export const SOURCES: readonly Source[] = [
  { id: "hsk30", name: "HSK 3.0 (GF 0025-2021) · ivankra/hsk30", url: "https://github.com/ivankra/hsk30", license: "MIT", licenseUrl: "https://github.com/ivankra/hsk30/blob/master/LICENSE" },
  { id: "cvdict", name: "CVDICT · Phong Phan", url: "https://github.com/ph0ngp/CVDICT", license: "CC BY-SA 4.0", licenseUrl: CC_BY_SA_4 },
  { id: "cedict", name: "CC-CEDICT · MDBG", url: "https://cc-cedict.org/", license: "CC BY-SA 4.0", licenseUrl: CC_BY_SA_4 },
  { id: "tatoeba", name: "Tatoeba", url: "https://tatoeba.org/", license: "CC BY 2.0 FR", licenseUrl: "https://creativecommons.org/licenses/by/2.0/fr/" },
  { id: "mmah", name: "Make Me a Hanzi", url: "https://github.com/skishore/makemeahanzi", license: "LGPL-3.0+", licenseUrl: "https://www.gnu.org/licenses/lgpl-3.0.html" },
  { id: "strokes", name: "hanzi-writer-data 2.0.1", url: "https://github.com/chanind/hanzi-writer-data", license: "Arphic Public License", licenseUrl: "https://github.com/chanind/hanzi-writer-data/blob/master/ARPHICPL.TXT" },
  { id: "audio", name: "audio-cmn · Yue Tan, Chen Wang, Hugo Lopez", url: "https://github.com/hugolpz/audio-cmn", license: "CC BY-SA" },
  { id: "unihan", name: "Unicode Unihan", url: "https://www.unicode.org/charts/unihan.html", license: "Unicode License v3", licenseUrl: "https://www.unicode.org/license.txt" },
  { id: "wubi", name: "pywubi 0.3.0", url: "https://github.com/mozillazg/pywubi", license: "MIT" },
  { id: "libraries", name: "Hanzi Writer, pinyin-pro, opencc-js + OpenCC, Next.js, React, animateicons + Lucide", url: "https://github.com/khanhnhanbk/han-ngu-studio/blob/main/THIRD-PARTY-NOTICES.md", license: "MIT · Apache-2.0 · ISC" },
  { id: "fonts", name: "Be Vietnam Pro, Noto Sans/Serif SC/TC, LXGW WenKai TC, Ma Shan Zheng", url: "https://fonts.google.com/", license: "SIL OFL 1.1", licenseUrl: "https://openfontlicense.org/" },
];
