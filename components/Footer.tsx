import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("vi");

export function Footer() {
  const year = new Date().getFullYear();

  const columns = [
    {
      title: dict.footer.columns.product,
      links: [
        { label: dict.footer.links.practiceSheet, href: "/tools/practice-sheet" },
        { label: dict.footer.links.anki, href: "#features" },
        { label: dict.footer.links.cloze, href: "#features" },
        { label: dict.footer.links.nPlusOne, href: "#features" },
      ],
    },
    {
      title: dict.footer.columns.resources,
      links: [
        { label: dict.footer.links.guide, href: "#how-it-works" },
        { label: dict.footer.links.blog, href: "#" },
        { label: dict.footer.links.faq, href: "#" },
      ],
    },
    {
      title: dict.footer.columns.company,
      links: [
        { label: dict.footer.links.about, href: "#" },
        { label: dict.footer.links.contact, href: "#cta" },
        { label: dict.footer.links.privacy, href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-ink-900/5 bg-surface">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-4">
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
