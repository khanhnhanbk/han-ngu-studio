import { toolMetadata } from "@/lib/i18n/metadata";

// Title, description and hreflang for Soạn bài (the page itself is a client component).
export const metadata = toolMetadata("vi", "lesson", "/soan-bai");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
