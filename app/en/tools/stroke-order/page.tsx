import { ToolJsonLd } from "@/components/seo/JsonLd";
import { toolMetadata } from "@/lib/i18n/metadata";

// English route: the same page component; it reads the language from the URL.
import Page from "@/app/tools/stroke-order/page";
export const metadata = toolMetadata("en", "strokeOrder", "/tools/stroke-order");

export default function EnPage() {
  return (
    <>
      <ToolJsonLd locale="en" tool="strokeOrder" path="/tools/stroke-order" />
      <Page />
    </>
  );
}
