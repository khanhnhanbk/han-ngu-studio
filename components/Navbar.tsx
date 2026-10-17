"use client";

import Link from "next/link";
import { useState } from "react";
import { getDictionary } from "@/lib/i18n";
import { TOOLS } from "@/lib/links";

import { ChevronDownIcon } from "./icons/chevron-down";
import { MenuIcon } from "./icons/menu";
import { useIconTrigger } from "./icons/trigger";
import { XIcon } from "./icons/x";
import { ThemePicker } from "./ThemePicker";

const dict = getDictionary("vi");

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const chevron = useIconTrigger();
  const menu = useIconTrigger();

  const links = [
    { href: "/#features", label: dict.nav.features },
    { href: "/#how-it-works", label: dict.nav.howItWorks },
    { href: "/#for-teachers", label: dict.nav.forTeachers },
    { href: "/#roadmap", label: dict.nav.roadmap },
  ];

  const tools = TOOLS.map((tool) => ({ href: tool.href, label: dict.nav[tool.id] }));

  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/5 bg-surface/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-bold text-ink-900">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-on-brand hanzi text-lg">
            汉
          </span>
          <span>Hán Ngữ Studio</span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex xl:gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-sm font-medium text-ink-700 transition hover:text-brand-ink"
            >
              {link.label}
            </a>
          ))}

          <div
            className="group relative"
            onMouseLeave={() => setToolsOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setToolsOpen(false)}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={toolsOpen}
              onClick={() => setToolsOpen((v) => !v)}
              {...chevron.triggerProps}
              className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-ink-700 transition hover:text-brand-ink"
            >
              {dict.nav.tools}
              <ChevronDownIcon
                ref={chevron.ref}
                size={14}
                aria-hidden
                className={`transition-transform ${toolsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {/* pt-2 bridges the gap so hover isn't lost moving into the panel */}
            <div
              role="menu"
              className={`absolute left-0 top-full pt-2 group-hover:block ${
                toolsOpen ? "block" : "hidden"
              }`}
            >
              <div className="min-w-48 rounded-xl border border-ink-900/10 bg-surface p-2 shadow-lg">
                {tools.map((tool) => (
                  <a
                    key={tool.href}
                    href={tool.href}
                    role="menuitem"
                    className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 hover:text-brand-ink"
                  >
                    {tool.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemePicker />
          <Link href="/#cta" className="btn-primary whitespace-nowrap">
            {dict.nav.cta}
          </Link>
        </div>

        <button
          type="button"
          aria-label="Menu"
          className="grid h-10 w-10 place-items-center rounded-lg border border-ink-900/10 lg:hidden"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          {...menu.triggerProps}
        >
          {open ? (
            <XIcon ref={menu.ref} size={20} aria-hidden />
          ) : (
            <MenuIcon ref={menu.ref} size={20} aria-hidden />
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-900/5 bg-surface lg:hidden">
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
            <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {dict.nav.tools}
            </p>
            {tools.map((tool) => (
              <a
                key={tool.href}
                href={tool.href}
                onClick={() => setOpen(false)}
                className="rounded-lg py-2 pl-6 pr-3 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                {tool.label}
              </a>
            ))}
            <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {dict.theme.button}
            </p>
            <div className="px-3 py-2">
              <ThemePicker inline />
            </div>
            <Link
              href="/#cta"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2"
            >
              {dict.nav.cta}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
