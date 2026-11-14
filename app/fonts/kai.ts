import { LXGW_WenKai_TC } from "next/font/google";

// Kai-style font (--font-kai) for practice sheets and the Anki card previews.
// Declared in its own module so only the pages that import it carry its
// @font-face CSS (about 110 slice rules); it used to sit in the root layout.
// Google serves CJK glyphs in unicode-range slices, so nothing is preloaded.
export const kai = LXGW_WenKai_TC({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-kai",
  display: "swap",
  preload: false,
});
