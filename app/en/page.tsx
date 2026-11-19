import type { Metadata } from "next";

import { HomePage } from "@/components/HomePage";
import { SiteJsonLd } from "@/components/seo/JsonLd";
import { alternates } from "@/lib/i18n/metadata";

// English home page: the same sections; they read the language from the URL.
export const metadata: Metadata = { alternates: alternates("en", "/") };

export default function Page() {
  return (
    <>
      <SiteJsonLd locale="en" />
      <HomePage />
    </>
  );
}
