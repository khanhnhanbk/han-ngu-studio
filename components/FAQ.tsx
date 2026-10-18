"use client";

import { useDictionary } from "@/lib/i18n/useLocale";
import { FaqItem } from "./FaqItem";

export function FAQ() {
  const dict = useDictionary();
  return (
    <section id="faq" className="border-y border-ink-900/5 bg-ink-50">
      <div className="container-page section">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{dict.faq.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">
            {dict.faq.title}
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {dict.faq.items.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
