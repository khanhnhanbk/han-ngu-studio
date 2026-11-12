import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n";
import { OG_VERSION } from "@/lib/i18n/metadata";

const dict = getDictionary("en");

// Setting openGraph here drops the inherited app/opengraph-image.png (Vietnamese text),
// so /en pages name their own English picture, drawn by scripts/og/make-og.mjs.
const image = { url: `/og/en/home.png?v=${OG_VERSION}`, width: 1200, height: 630, alt: "Hán Ngữ Studio: learn Chinese for free" };

/** English pages (/en/…): English title and description; the pages are shared with Vietnamese. */
export const metadata: Metadata = {
  title: dict.meta.title,
  description: dict.meta.description,
  openGraph: {
    title: dict.meta.title,
    description: dict.meta.description,
    url: "/en",
    siteName: "Hán Ngữ Studio",
    locale: "en_US",
    type: "website",
    images: [image],
  },
  twitter: { card: "summary_large_image", images: [image] },
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return children;
}
