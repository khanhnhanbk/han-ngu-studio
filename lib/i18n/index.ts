import { vi, type Dictionary } from "./vi";

export type Locale = "vi" | "en";

// English is not translated yet — it falls back to Vietnamese for now.
// When ready, add lib/i18n/en.ts and map it here.
const dictionaries: Record<Locale, Dictionary> = {
  vi,
  en: vi,
};

export function getDictionary(locale: Locale = "vi"): Dictionary {
  return dictionaries[locale] ?? vi;
}

export type { Dictionary };
