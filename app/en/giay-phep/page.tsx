import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";
import { getDictionary } from "@/lib/i18n";
import { alternates } from "@/lib/i18n/metadata";

const t = getDictionary("en").legal;

export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDescription,
  alternates: alternates("en", "/giay-phep"),
};

export default function Page() {
  return <LegalPage />;
}
