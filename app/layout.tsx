import type { Metadata } from "next";
import { Be_Vietnam_Pro, LXGW_WenKai_TC, Noto_Sans_SC, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { DownloadPrompt } from "@/components/DownloadPrompt";
import { getDictionary } from "@/lib/i18n";
import { LANG_INIT_SCRIPT } from "@/lib/i18n/locale";
import { SCRIPT_INIT_SCRIPT } from "@/lib/script/preference";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-hanzi",
  display: "swap",
});

// Taiwan glyph shapes for Phồn thể mode (globals.css swaps --font-hanzi).
// Only used after the switch, so it is not preloaded.
const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-hanzi-tc",
  display: "swap",
  preload: false,
});

// Kai-style font for practice sheets. Google serves CJK glyphs in unicode-range
// slices, so there is nothing useful to preload.
const kai = LXGW_WenKai_TC({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-kai",
  display: "swap",
  preload: false,
});

const dict = getDictionary("vi");

export const metadata: Metadata = {
  title: dict.meta.title,
  description: dict.meta.description,
  metadataBase: new URL("https://han-ngu-studio.vercel.app"),
  openGraph: {
    title: dict.meta.title,
    description: dict.meta.description,
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The init script sets the theme class before React hydrates.
    <html
      lang="vi"
      className={`${beVietnam.variable} ${notoSansSC.variable} ${notoSansTC.variable} ${kai.variable}`}
      // Noto Sans TC lacks Simplified-only glyphs (欢, 习); Phồn thể mode
      // falls back to Noto Sans SC through this variable (globals.css).
      style={{ "--font-hanzi-sc": notoSansSC.style.fontFamily } as React.CSSProperties}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <DownloadPrompt />
      </body>
    </html>
  );
}
