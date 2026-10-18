import { toolMetadata } from "@/lib/i18n/metadata";

// Title, description and hreflang for this tool (the page itself is a client component).
export const metadata = toolMetadata("vi", "pinyin", "/tools/pinyin");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
