import { Ma_Shan_Zheng, Noto_Serif_SC, Noto_Serif_TC } from "next/font/google";

// Extra sheet fonts, declared here so only the practice-sheet page carries
// them. LXGW WenKai (--font-kai) and Noto Sans SC (--font-hanzi) come from
// app/layout.tsx. Google serves CJK glyphs in unicode-range slices that are
// self-hosted at build time and fetched only when used, so nothing is
// preloaded.
const maShanZheng = Ma_Shan_Zheng({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mashanzheng",
  display: "swap",
  preload: false,
});

const notoSerifSC = Noto_Serif_SC({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-noto-serif-sc",
  display: "swap",
  preload: false,
});

// Taiwan glyph shapes for the "Noto Serif" preset in Phồn thể mode.
const notoSerifTC = Noto_Serif_TC({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-noto-serif-tc",
  display: "swap",
  preload: false,
});

/** Class names that define the extra font variables. */
export const sheetFontVariables = `${maShanZheng.variable} ${notoSerifSC.variable} ${notoSerifTC.variable}`;
