import type { Metadata } from "next";
import { Be_Vietnam_Pro, LXGW_WenKai_TC, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { getDictionary } from "@/lib/i18n";
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
      className={`${beVietnam.variable} ${notoSansSC.variable} ${kai.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
