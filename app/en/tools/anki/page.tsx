import { AnkiTool } from "@/components/anki/AnkiTool";
import { ToolJsonLd } from "@/components/seo/JsonLd";
import { toolMetadata } from "@/lib/i18n/metadata";

// English route: the same tool component; it reads the language from the URL.
export const metadata = toolMetadata("en", "anki", "/tools/anki");

export default function EnPage() {
  return (
    <>
      <ToolJsonLd locale="en" tool="anki" path="/tools/anki" />
      <AnkiTool />
    </>
  );
}
