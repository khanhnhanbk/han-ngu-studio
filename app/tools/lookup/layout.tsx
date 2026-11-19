import { ToolJsonLd } from "@/components/seo/JsonLd";
import { toolMetadata } from "@/lib/i18n/metadata";

// Title, description and hreflang for this tool (the page itself is a client component).
export const metadata = toolMetadata("vi", "lookup", "/tools/lookup");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolJsonLd locale="vi" tool="lookup" path="/tools/lookup" />
      {children}
    </>
  );
}
