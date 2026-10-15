import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("vi");

export function FAQ() {
  return (
    <section id="faq" className="border-y border-ink-900/5 bg-ink-50">
      <div className="container-page section">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Giải đáp</p>
          <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">
            {dict.faq.title}
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {dict.faq.items.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-ink-900/10 bg-surface p-5 shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink-900">
                {item.question}
                <span className="text-brand-600 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-ink-700">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
