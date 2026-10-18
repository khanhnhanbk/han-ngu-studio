import { en } from "./en";
import { vi, type Dictionary } from "./vi";

export type Locale = "vi" | "en";
export const LOCALES: readonly Locale[] = ["vi", "en"];

const dictionaries: Record<Locale, Dictionary> = { vi, en };

export function getDictionary(locale: Locale = "vi"): Dictionary {
  return dictionaries[locale] ?? vi;
}

export type { Dictionary };
