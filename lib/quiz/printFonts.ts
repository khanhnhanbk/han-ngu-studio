/**
 * Fetch the font slices the printed worksheet needs before window.print().
 *
 * Google splits each font into unicode-range slices that the browser
 * downloads only when visible text uses them. The worksheet is display:none
 * on screen, and Chrome does not wait for fonts while printing, so Pinyin
 * tone marks and Vietnamese letters fell back to a system serif font.
 * Loading them by text first makes the PDF use the site's own fonts.
 */
const SPECS = [
  { variable: "--font-hanzi", styles: ["400 20px", "700 20px"] },
  { variable: "--font-be-vietnam", styles: ["400 14px", "700 24px"] },
];

export async function ensurePrintFonts(text: string): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    const root = getComputedStyle(document.documentElement);
    const loads: Promise<unknown>[] = [];
    for (const { variable, styles } of SPECS) {
      const stack = root.getPropertyValue(variable).trim();
      if (!stack) continue;
      // Load each family on its own so every one gets its slices, not just
      // the first family that matches.
      for (const family of stack.split(",").map((f) => f.trim()).filter(Boolean)) {
        if (/^(serif|sans-serif|system-ui|monospace)$/.test(family)) continue;
        for (const style of styles) loads.push(document.fonts.load(`${style} ${family}`, text).catch(() => []));
      }
    }
    await Promise.all(loads);
    await document.fonts.ready;
  } catch {
    // Printing still works with fallback fonts.
  }
}
