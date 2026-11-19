import { ToolJsonLd } from "@/components/seo/JsonLd";
import { toolMetadata } from "@/lib/i18n/metadata";

// English route: the same page component; it reads the language from the URL.
import Page from "@/app/tools/pinyin/page";
export const metadata = toolMetadata("en", "pinyin", "/tools/pinyin");

export default function EnPage() {
  return (
    <>
      <ToolJsonLd locale="en" tool="pinyin" path="/tools/pinyin" />
      <Page />
    </>
  );
}
