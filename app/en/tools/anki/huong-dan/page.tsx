import type { Metadata } from "next";

import { AnkiGuide } from "@/components/anki-guide/AnkiGuide";
import { getDictionary } from "@/lib/i18n";
import { alternates } from "@/lib/i18n/metadata";

const t = getDictionary("en").ankiGuide;

export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDescription,
  alternates: alternates("en", "/tools/anki/huong-dan"),
};

export default function AnkiGuidePage() {
  return <AnkiGuide />;
}
