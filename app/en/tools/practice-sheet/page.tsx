import { toolMetadata } from "@/lib/i18n/metadata";

// English route: the same page component; it reads the language from the URL.
export { default } from "@/app/tools/practice-sheet/page";
export const metadata = toolMetadata("en", "practiceSheet", "/tools/practice-sheet");
