"use client";

import { useDictionary } from "@/lib/i18n/useLocale";

export function Problem() {
  const dict = useDictionary();
  return (
    <section className="border-y border-ink-900/5 bg-ink-50">
      <div className="container-page section">
        <h2 className="text-center text-3xl font-bold text-ink-900">
          {dict.problem.title}
        </h2>
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {dict.problem.items.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-xl bg-surface p-4 shadow-sm"
            >
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                !
              </span>
              <p className="text-sm text-ink-700">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
