"use client";

import { useState } from "react";
import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("vi");

export function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/#features", label: dict.nav.features },
    { href: "/#how-it-works", label: dict.nav.howItWorks },
    { href: "/#for-teachers", label: dict.nav.forTeachers },
    { href: "/#pricing", label: dict.nav.tools },
    { href: "/tools/practice-sheet", label: dict.nav.practiceSheet },
    { href: "/tools/segment", label: dict.nav.segment },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/5 bg-white/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-bold text-ink-900">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white hanzi text-lg">
            汉
          </span>
          <span>Hán Ngữ Studio</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-700 transition hover:text-brand-600"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a href="/#cta" className="btn-primary">
            {dict.nav.cta}
          </a>
        </div>

        <button
          type="button"
          aria-label="Menu"
          className="grid h-10 w-10 place-items-center rounded-lg border border-ink-900/10 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-xl">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-900/5 bg-white md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/#cta"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2"
            >
              {dict.nav.cta}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
