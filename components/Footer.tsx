import { getDictionary } from "@/lib/i18n";
import { REPO_URL, TOOLS, USER_GUIDE_URL } from "@/lib/links";

const dict = getDictionary("vi");

export function Footer() {
  const year = new Date().getFullYear();

  const columns = [
    {
      title: dict.footer.columns.tools,
      links: TOOLS.map((tool) => ({ label: dict.nav[tool.id], href: tool.href, external: false })),
    },
    {
      title: dict.footer.columns.resources,
      links: [
        { label: dict.footer.links.guide, href: USER_GUIDE_URL, external: true },
        { label: dict.footer.links.source, href: REPO_URL, external: true },
        { label: dict.footer.links.faq, href: "/#faq", external: false },
        { label: dict.footer.links.roadmap, href: "/#roadmap", external: false },
      ],
    },
  ];

  return (
    <footer className="border-t border-ink-900/5 bg-surface">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 font-bold text-ink-900">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white hanzi text-lg">
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
                      className="text-sm text-ink-700/70 transition hover:text-brand-600"
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
            © {year} Hán Ngữ Studio. {dict.footer.rights}
          </p>
          <div className="flex items-center gap-2 text-xs text-ink-700/60">
            <span>{dict.footer.languageLabel}:</span>
            <span className="rounded-md bg-ink-50 px-2 py-1 font-semibold text-ink-900">
              VI
            </span>
            <span className="cursor-not-allowed rounded-md px-2 py-1 opacity-50">
              EN
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
