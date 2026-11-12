import type { Metadata } from "next";

import { TeacherGuide } from "@/components/guide/TeacherGuide";
import { getDictionary } from "@/lib/i18n";
import { alternates } from "@/lib/i18n/metadata";

const t = getDictionary("en").guide;

export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDescription,
  alternates: alternates("en", "/guide"),
};

export default function Page() {
  return <TeacherGuide />;
}
