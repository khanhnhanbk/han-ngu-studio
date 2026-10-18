"use client";

import { usePathname } from "next/navigation";

import { LOCALES } from "@/lib/i18n";
import { switchLocalePath } from "@/lib/i18n/locale";
import { useDictionary, useLocale } from "@/lib/i18n/useLocale";

/**
 * VI / EN links to the same page in the other language. The hash is kept
 * (stroke order #c=学, practice sheet #chars=…), read when clicked because it
 * is not part of the server-rendered URL.
 */
export function LanguageSwitch({ inline = false }: { inline?: boolean }) {
  const dict = useDictionary();
  const locale = useLocale();
  const pathname = usePathname() ?? "/";

  return (
    <div role="group" aria-label={dict.language.label} className="inline-flex gap-1 rounded-lg bg-ink-50 p-1 text-sm">
      {LOCALES.map((l) => {
        const href = switchLocalePath(pathname, l);
        const active = l === locale;
        return (
          <a
            key={l}
            href={href}
            hrefLang={l}
            lang={l}
            aria-current={active ? "page" : undefined}
            title={dict.language[l]}
            onClick={(e) => {
              if (active) return e.preventDefault();
              e.preventDefault();
              window.location.assign(href + window.location.hash);
            }}
            className={`whitespace-nowrap rounded-md px-2 py-1 font-medium uppercase transition ${
              active ? "bg-surface text-ink-900 shadow-sm" : "text-ink-700 hover:text-ink-900"
            }`}
          >
            {l}
            {inline && <span className="ml-1 normal-case">{dict.language[l]}</span>}
          </a>
        );
      })}
    </div>
  );
}
