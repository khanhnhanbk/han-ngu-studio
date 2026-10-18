import type { Metadata } from "next";

import { AnkiGuide } from "@/components/anki-guide/AnkiGuide";
import { getDictionary } from "@/lib/i18n";
import { alternates } from "@/lib/i18n/metadata";

const t = getDictionary("vi").ankiGuide;

export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDescription,
  alternates: alternates("vi", "/tools/anki/huong-dan"),
};

export default function AnkiGuidePage() {
  return <AnkiGuide />;
}
