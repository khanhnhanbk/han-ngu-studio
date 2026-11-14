"use client";

import { Noto_Sans_TC } from "next/font/google";

// Taiwan glyph shapes for Phồn thể mode. This module is loaded only after the
// switch (TradFontHost), so its @font-face CSS (about 320 slice rules) is no
// longer render-blocking on every page in Giản thể mode.
const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

/**
 * Points --font-hanzi-tc at Noto Sans TC. Same selector as the stand-in in
 * globals.css; this <style> comes later in the document, so it wins.
 */
export function TradFont() {
  return <style>{`:root:root[data-script="trad"]{--font-hanzi-tc:${notoSansTC.style.fontFamily}}`}</style>;
}
