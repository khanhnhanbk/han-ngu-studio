import { ToolJsonLd } from "@/components/seo/JsonLd";
import { toolMetadata } from "@/lib/i18n/metadata";

// English route: the same page component; it reads the language from the URL.
import Page from "@/app/tools/stories/page";
export const metadata = toolMetadata("en", "stories", "/tools/stories");

export default function EnPage() {
  return (
    <>
      <ToolJsonLd locale="en" tool="stories" path="/tools/stories" />
      <Page />
    </>
  );
}
