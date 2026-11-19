import { ToolJsonLd } from "@/components/seo/JsonLd";
import { toolMetadata } from "@/lib/i18n/metadata";

// English route: the same page component; it reads the language from the URL.
import Page from "@/app/tools/practice-sheet/page";
export const metadata = toolMetadata("en", "practiceSheet", "/tools/practice-sheet");

export default function EnPage() {
  return (
    <>
      <ToolJsonLd locale="en" tool="practiceSheet" path="/tools/practice-sheet" />
      <Page />
    </>
  );
}
