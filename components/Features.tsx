"use client";

import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { TOOL_GROUPS, TOOLS } from "@/lib/links";
import { TOOL_GLYPHS } from "@/lib/tool-glyphs/glyphs";
import { ToolCard } from "./ToolCard";

export function Features() {
  const dict = useDictionary();
  const href = useHref();
  return (
    <section id="features" className="section">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{dict.nav.features}</p>
          <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">
            {dict.features.title}
          </h2>
          <p className="mt-4 text-lg text-ink-700">{dict.features.subtitle.replace("{count}", String(TOOLS.length))}</p>
        </div>

        {TOOL_GROUPS.map((group) => (
          <div key={group.id} className="mt-12">
            <h3 className="text-xl font-semibold text-ink-900">
              {dict.nav.groups[group.id].title}
              <span className="ml-2 text-base font-normal text-ink-500">· {dict.nav.groups[group.id].hint}</span>
            </h3>
            {/* Four cards fill one row on wide screens instead of leaving one alone.
                Soạn bài leads its group: Anki, Quiz and Practice sheet also live inside it. */}
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {group.id === "prepare" && (
                <ToolCard
                  glyph={{ simp: "课", trad: "課" }}
                  href={href("/lesson")}
                  title={dict.features.items.lesson.title}
                  description={dict.features.items.lesson.description}
                  cta={dict.features.items.lesson.cta}
                />
              )}
              {group.tools.map((tool) => {
                const item = dict.features.items[tool.id];
                return (
                  <ToolCard
                    key={tool.id}
                    glyph={TOOL_GLYPHS[tool.id]}
                    href={href(tool.href)}
                    title={item.title}
                    description={item.description}
                    cta={item.cta}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
