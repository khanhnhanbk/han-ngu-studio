import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { getDictionary } from "@/lib/i18n";

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
    <html
      lang="vi"
      className={`${beVietnam.variable} ${notoSansSC.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
