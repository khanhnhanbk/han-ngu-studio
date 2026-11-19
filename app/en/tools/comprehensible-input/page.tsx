import { ToolJsonLd } from "@/components/seo/JsonLd";
import { toolMetadata } from "@/lib/i18n/metadata";

// English route: the same page component; it reads the language from the URL.
import Page from "@/app/tools/comprehensible-input/page";
export const metadata = toolMetadata("en", "comprehensibleInput", "/tools/comprehensible-input");

export default function EnPage() {
  return (
    <>
      <ToolJsonLd locale="en" tool="comprehensibleInput" path="/tools/comprehensible-input" />
      <Page />
    </>
  );
}
