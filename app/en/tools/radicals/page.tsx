import { ToolJsonLd } from "@/components/seo/JsonLd";
import { toolMetadata } from "@/lib/i18n/metadata";

// English route: the same page component; it reads the language from the URL.
import Page from "@/app/tools/radicals/page";
export const metadata = toolMetadata("en", "radicals", "/tools/radicals");

export default function EnPage() {
  return (
    <>
      <ToolJsonLd locale="en" tool="radicals" path="/tools/radicals" />
      <Page />
    </>
  );
}
