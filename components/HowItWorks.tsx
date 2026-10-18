"use client";

import { useDictionary } from "@/lib/i18n/useLocale";

export function HowItWorks() {
  const dict = useDictionary();
  return (
    <section id="how-it-works" className="border-y border-ink-900/5 bg-ink-50">
      <div className="container-page section">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{dict.howItWorks.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">
            {dict.howItWorks.title}
          </h2>
          <p className="mt-4 text-lg text-ink-700">
            {dict.howItWorks.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {dict.howItWorks.steps.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl bg-surface p-6 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-lg font-bold text-on-brand">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-ink-700">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
