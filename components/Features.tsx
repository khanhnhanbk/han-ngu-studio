import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("vi");

const icons = ["筆", "札", "空", "序"];

export function Features() {
  return (
    <section id="features" className="section">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Tính năng</p>
          <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">
            {dict.features.title}
          </h2>
          <p className="mt-4 text-lg text-ink-700">{dict.features.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {dict.features.items.map((item, i) => (
            <div key={item.title} className="card flex flex-col">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-lg hanzi text-brand-700">
                {icons[i]}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink-900">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-ink-700">
                {item.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                {item.cta}
                <span aria-hidden>→</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
