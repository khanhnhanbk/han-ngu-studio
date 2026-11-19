import { AnkiTool } from "@/components/anki/AnkiTool";
import { ToolJsonLd } from "@/components/seo/JsonLd";

// Structured data sits here, not in layout.tsx, because that layout also wraps /tools/anki/guide.
export default function Page() {
  return (
    <>
      <ToolJsonLd locale="vi" tool="anki" path="/tools/anki" />
      <AnkiTool />
    </>
  );
}
