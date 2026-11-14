import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { DownloadPrompt } from "@/components/DownloadPrompt";
import { TradFontHost } from "@/components/fonts/TradFontHost";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { SpeechSettingsHost } from "@/components/speech/SpeechSettingsHost";
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

// Chinese glyphs come in unicode-range slices fetched only when a character
// needs them; preloading the "latin" slice only competed with the page's own
// fonts and scripts.
const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-hanzi",
  display: "swap",
  preload: false,
});

// Noto Sans TC (Phồn thể) is loaded by <TradFontHost /> only in that mode, and
// LXGW WenKai (--font-kai) by the pages that use it (app/fonts/kai.ts).

const dict = getDictionary("vi");

export const metadata: Metadata = {
  title: dict.meta.title,
  description: dict.meta.description,
  metadataBase: new URL("https://han-ngu-studio.vercel.app"),
  openGraph: {
    title: dict.meta.title,
    description: dict.meta.description,
    url: "/",
    siteName: "Hán Ngữ Studio",
    locale: "vi_VN",
    type: "website",
  },
  // Image, favicon and icons are the file-convention files next to this layout:
  // opengraph-image.png, twitter-image.png, favicon.ico, icon.png, apple-icon.png.
  twitter: { card: "summary_large_image" },
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
      className={`${beVietnam.variable} ${notoSansSC.variable}`}
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
        <SpeechSettingsHost />
        <TradFontHost />
        <SiteAnalytics />
      </body>
    </html>
  );
}
