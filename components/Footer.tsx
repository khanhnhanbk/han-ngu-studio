"use client";

import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { REPO_URL, TOOL_GROUPS, USER_GUIDE_URL } from "@/lib/links";

import { LanguageSwitch } from "./LanguageSwitch";

export function Footer() {
  const dict = useDictionary();
  const href = useHref();
  const year = new Date().getFullYear();

  // One column per tool group, then resources.
  const columns = [
    ...TOOL_GROUPS.map((group) => ({
      title: dict.nav.groups[group.id].title,
      links: group.tools.map((tool) => ({ label: dict.nav[tool.id], href: href(tool.href), external: false })),
    })),
    {
      title: dict.footer.columns.resources,
      links: [
        { label: dict.footer.links.guide, href: USER_GUIDE_URL, external: true },
        { label: dict.footer.links.source, href: REPO_URL, external: true },
        { label: dict.footer.links.faq, href: href("/#faq"), external: false },
        { label: dict.footer.links.roadmap, href: href("/#roadmap"), external: false },
      ],
    },
  ];

  return (
    <footer className="border-t border-ink-900/5 bg-surface">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2 font-bold text-ink-900">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-on-brand hanzi text-lg">
                汉
              </span>
              <span>Hán Ngữ Studio</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-700/70">
              {dict.footer.tagline}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-ink-900">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="text-sm text-ink-700/70 transition hover:text-brand-ink"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink-900/5 pt-6 sm:flex-row">
          <p className="text-xs text-ink-700/60">
            © {year} Hán Ngữ Studio. {dict.footer.rights}{" "}
            <a
              href="https://github.com/Avijit07x/animateicons"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-ink"
            >
              {dict.footer.iconCredit}
            </a>{" "}
            <a
              href="https://github.com/nk2028/opencc-js"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-ink"
            >
              {dict.footer.scriptCredit}
            </a>
          </p>
          <div className="flex items-center gap-2 text-xs text-ink-700/60">
            <span>{dict.footer.languageLabel}:</span>
            <LanguageSwitch />
          </div>
        </div>
      </div>
    </footer>
  );
}
