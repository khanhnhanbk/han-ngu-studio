import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("vi");

type Status = keyof typeof dict.roadmap.statuses;

const STATUS_STYLE: Record<Status, string> = {
  next: "bg-brand-600 text-white",
  planned: "bg-brand-100 text-brand-700",
  idea: "bg-ink-900/5 text-ink-700",
};

/** What's coming, in the order of docs/plans/2026-10-15-roadmap.md. */
export function Roadmap() {
  return (
    <section id="roadmap" className="border-y border-ink-900/5 bg-ink-50">
      <div className="container-page section">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{dict.roadmap.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">{dict.roadmap.title}</h2>
          <p className="mt-4 text-lg text-ink-700">{dict.roadmap.subtitle}</p>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {dict.roadmap.items.map((item) => {
            const status = item.status as Status;
            return (
              <li key={item.title} className="rounded-2xl border border-ink-900/10 bg-surface p-5 shadow-sm">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}
                >
                  {dict.roadmap.statuses[status]}
                </span>
                <h3 className="mt-3 font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-1 text-sm text-ink-700">{item.description}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 text-center text-sm text-ink-700/70">{dict.roadmap.note}</p>
      </div>
    </section>
  );
}
