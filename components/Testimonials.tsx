import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("vi");

export function Testimonials() {
  return (
    <section className="border-y border-ink-900/5 bg-ink-50">
      <div className="container-page section">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Phản hồi</p>
          <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">
            {dict.testimonials.title}
          </h2>
          <p className="mt-4 text-lg text-ink-700">
            {dict.testimonials.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {dict.testimonials.items.map((t) => (
            <figure key={t.name} className="rounded-2xl bg-surface p-6 shadow-sm">
              <blockquote className="text-sm text-ink-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">
                  {t.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink-900">
                    {t.name}
                  </span>
                  <span className="block text-xs text-ink-700/70">
                    {t.role}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
