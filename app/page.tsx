import type { Metadata } from "next";

import { HomePage } from "@/components/HomePage";
import { SiteJsonLd } from "@/components/seo/JsonLd";
import { alternates } from "@/lib/i18n/metadata";

export const metadata: Metadata = { alternates: alternates("vi", "/") };

export default function Page() {
  return (
    <>
      <SiteJsonLd locale="vi" />
      <HomePage />
    </>
  );
}
