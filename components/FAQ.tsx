"use client";

import { useDictionary } from "@/lib/i18n/useLocale";
import { FaqItem } from "./FaqItem";

/**
 * FAQPage structured data for Google, in the page's own language. `<` is
 * escaped so no answer text can close the script tag.
 */
function faqJsonLd(items: ReadonlyArray<{ question: string; answer: string }>): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }).replace(/</g, "\\u003c");
}

export function FAQ() {
  const dict = useDictionary();
  return (
    <section id="faq" className="border-y border-ink-900/5 bg-ink-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqJsonLd(dict.faq.items) }}
      />
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
