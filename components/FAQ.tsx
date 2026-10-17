import { getDictionary } from "@/lib/i18n";
import { FaqItem } from "./FaqItem";

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
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
