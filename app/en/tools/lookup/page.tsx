import { ToolJsonLd } from "@/components/seo/JsonLd";
import { toolMetadata } from "@/lib/i18n/metadata";

// English route: the same page component; it reads the language from the URL.
import Page from "@/app/tools/lookup/page";
export const metadata = toolMetadata("en", "lookup", "/tools/lookup");

export default function EnPage() {
  return (
    <>
      <ToolJsonLd locale="en" tool="lookup" path="/tools/lookup" />
      <Page />
    </>
  );
}
