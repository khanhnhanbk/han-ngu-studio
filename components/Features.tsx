import { getDictionary } from "@/lib/i18n";
import { TOOLS } from "@/lib/links";
import { ToolCard } from "./ToolCard";

const dict = getDictionary("vi");

export function Features() {
  return (
    <section id="features" className="section">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{dict.nav.features}</p>
          <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">
            {dict.features.title}
          </h2>
          <p className="mt-4 text-lg text-ink-700">{dict.features.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const item = dict.features.items[tool.id];
            return (
              <ToolCard
                key={tool.id}
                id={tool.id}
                href={tool.href}
                title={item.title}
                description={item.description}
                cta={item.cta}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
