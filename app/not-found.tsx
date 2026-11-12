import type { Metadata } from "next";

import { NotFoundPage } from "@/components/not-found/NotFoundPage";
import { getDictionary } from "@/lib/i18n";

// Prerendered once for every unknown URL; NotFoundPage switches the title to English on /en/….
export const metadata: Metadata = {
  title: getDictionary("vi").notFound.metaTitle,
  robots: { index: false },
};

/** Every unknown URL, /en/… included: the page text follows the URL's language. */
export default function NotFound() {
  return <NotFoundPage />;
}
