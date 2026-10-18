import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("en");

/** English pages (/en/…): English title and description; the pages are shared with Vietnamese. */
export const metadata: Metadata = {
  title: dict.meta.title,
  description: dict.meta.description,
  openGraph: {
    title: dict.meta.title,
    description: dict.meta.description,
    locale: "en_US",
    type: "website",
  },
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return children;
}
