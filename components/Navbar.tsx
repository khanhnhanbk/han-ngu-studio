"use client";

import Link from "next/link";
import { useState } from "react";
import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { TOOL_GROUPS } from "@/lib/links";

import { ChevronDownIcon } from "./icons/chevron-down";
import { MenuIcon } from "./icons/menu";
import { useIconTrigger } from "./icons/trigger";
import { XIcon } from "./icons/x";
import { LanguageSwitch } from "./LanguageSwitch";
import { ScriptSwitch } from "./ScriptSwitch";
import { ThemePicker } from "./ThemePicker";

export function Navbar() {
  const dict = useDictionary();
  const href = useHref();
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const chevron = useIconTrigger();
  const menu = useIconTrigger();

  const links = [
    { href: href("/#how-it-works"), label: dict.nav.howItWorks },
    { href: href("/#for-teachers"), label: dict.nav.forTeachers },
    { href: href("/#roadmap"), label: dict.nav.roadmap },
  ];

  const groups = TOOL_GROUPS.map((g) => ({
    id: g.id,
    ...dict.nav.groups[g.id],
    tools: g.tools.map((tool) => ({ href: href(tool.href), label: dict.nav[tool.id], hint: dict.nav.hints[tool.id] })),
  }));

  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/5 bg-surface/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href={href("/")} className="flex items-center gap-2 whitespace-nowrap font-bold text-ink-900">
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
              className={`absolute left-1/2 top-full -translate-x-1/2 pt-2 group-hover:block ${
                toolsOpen ? "block" : "hidden"
              }`}
            >
              {/* One column per group: what the learner wants to do. */}
              <div className="grid w-[44rem] grid-cols-3 gap-2 rounded-xl border border-ink-900/10 bg-surface p-3 shadow-lg">
                {groups.map((group) => (
                  <div key={group.id} role="group" aria-label={group.title}>
                    <p className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-brand-ink">
                      {group.title}
                    </p>
                    <p className="px-3 pb-1 text-xs text-ink-500">{group.hint}</p>
                    {group.tools.map((tool) => (
                      <a
                        key={tool.href}
                        href={tool.href}
                        role="menuitem"
                        className="block rounded-lg px-3 py-2 hover:bg-ink-50"
                      >
                        <span className="block text-sm font-medium text-ink-900">{tool.label}</span>
                        <span className="block text-xs text-ink-500">{tool.hint}</span>
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitch />
          <ScriptSwitch />
          <ThemePicker />
          <Link href={href("/#cta")} className="btn-primary whitespace-nowrap">
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
            {groups.map((group) => (
              <div key={group.id} className="mt-2">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {dict.nav.tools} · {group.title}
                </p>
                {group.tools.map((tool) => (
                  <a
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg py-2 pl-6 pr-3 hover:bg-ink-50"
                  >
                    <span className="block text-sm font-medium text-ink-700">{tool.label}</span>
                    <span className="block text-xs text-ink-500">{tool.hint}</span>
                  </a>
                ))}
              </div>
            ))}
            <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {dict.language.label}
            </p>
            <div className="px-3 py-2">
              <LanguageSwitch inline />
            </div>
            <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {dict.script.label}
            </p>
            <div className="px-3 py-2">
              <ScriptSwitch inline />
            </div>
            <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {dict.theme.button}
            </p>
            <div className="px-3 py-2">
              <ThemePicker inline />
            </div>
            <Link
              href={href("/#cta")}
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
