import type { Metadata } from "next";

import { alternates } from "@/lib/i18n/metadata";

// English home page: the same page component; sections read the language from the URL.
export { default } from "@/app/page";
export const metadata: Metadata = { alternates: alternates("en", "/") };
