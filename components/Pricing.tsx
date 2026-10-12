import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("vi");

export function Pricing() {
  return (
    <section id="pricing" className="section">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Bảng giá</p>
          <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">
            {dict.pricing.title}
          </h2>
          <p className="mt-4 text-lg text-ink-700">{dict.pricing.subtitle}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
          {/* Free plan */}
          <div className="card flex flex-col">
            <h3 className="text-lg font-semibold text-ink-900">
              {dict.pricing.free.name}
            </h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-ink-900">
                {dict.pricing.free.price}
              </span>
              <span className="text-sm text-ink-700/70">
                {dict.pricing.free.period}
              </span>
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {dict.pricing.free.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                  <span className="text-green-600">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a href="#cta" className="btn-primary mt-6">
              {dict.pricing.free.cta}
            </a>
          </div>

          {/* Pro plan placeholder */}
          <div className="card relative flex flex-col border-brand-300 bg-brand-50/50">
            <span className="absolute right-4 top-4 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">
              {dict.pricing.pro.badge}
            </span>
            <h3 className="text-lg font-semibold text-ink-900">
              {dict.pricing.pro.name}
            </h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-ink-900">
                {dict.pricing.pro.price}
              </span>
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {dict.pricing.pro.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                  <span className="text-brand-600">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a href="#cta" className="btn-secondary mt-6">
              {dict.pricing.pro.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
