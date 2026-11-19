import { ToolJsonLd } from "@/components/seo/JsonLd";
import { toolMetadata } from "@/lib/i18n/metadata";

// English route: the same page component; it reads the language from the URL.
import Page from "@/app/tools/path/page";
export const metadata = toolMetadata("en", "path", "/tools/path");

export default function EnPage() {
  return (
    <>
      <ToolJsonLd locale="en" tool="path" path="/tools/path" />
      <Page />
    </>
  );
}
