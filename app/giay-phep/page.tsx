import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";
import { getDictionary } from "@/lib/i18n";
import { alternates } from "@/lib/i18n/metadata";

const t = getDictionary("vi").legal;

export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDescription,
  alternates: alternates("vi", "/giay-phep"),
};

export default function Page() {
  return <LegalPage />;
}
