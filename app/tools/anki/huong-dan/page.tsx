import type { Metadata } from "next";
import Link from "next/link";

import { CodeBlock, CopyButton } from "@/components/anki-guide/CopyButton";
import { TemplateCard } from "@/components/anki-guide/TemplateCard";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CARD_CSS, CARD_TEMPLATES, NOTE_TYPE_FIELDS } from "@/lib/anki/templates";
import { getDictionary } from "@/lib/i18n";

const t = getDictionary("vi").ankiGuide;

export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDescription,
};

function Steps({ items }: { items: readonly string[] }) {
  return (
    <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

export default function AnkiGuidePage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <Link href="/tools/anki" className="text-sm text-ink-700 hover:text-brand-ink">
              {t.backToTool}
            </Link>
            <h1 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">{t.title}</h1>
            <p className="mt-4 text-lg text-ink-700">{t.subtitle}</p>

            <div className="card mt-8">
              <h2 className="text-xl font-semibold text-ink-900">{t.whatTitle}</h2>
              <p className="mt-2 text-ink-700">{t.what}</p>
              <p className="mt-3 font-medium text-ink-900">{t.install}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-700">
                {t.installLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-brand-ink underline">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-ink-700">{t.sync}</p>
            </div>

            <div className="card mt-6">
              <h2 className="text-xl font-semibold text-ink-900">{t.step1Title}</h2>
              <Steps items={t.step1} />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink-900">{t.fieldsLabel}</p>
                <CopyButton text={NOTE_TYPE_FIELDS.join("\n")} label={t.copyFields} />
              </div>
              <ol className="mt-2 grid list-decimal gap-x-8 gap-y-1 rounded-lg bg-ink-50 py-3 pl-10 pr-4 font-mono text-sm text-ink-900 sm:grid-cols-2">
                {NOTE_TYPE_FIELDS.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ol>
              <p className="mt-3 text-sm text-ink-700">{t.fieldsNote}</p>
            </div>

            <div className="card mt-6">
              <h2 className="text-xl font-semibold text-ink-900">{t.step2Title}</h2>
              <Steps items={t.step2} />
              <p className="mt-3 text-sm text-ink-700">{t.step2Note}</p>
            </div>

            <div className="card mt-6">
              <h2 className="text-xl font-semibold text-ink-900">{t.step3Title}</h2>
              <Steps items={t.step3} />
              <p className="mt-3 text-sm text-ink-700">{t.step3Phone}</p>
              <Link href="/tools/anki" className="btn-primary mt-4">
                {t.toTool}
              </Link>
            </div>

            <h2 id="mau-the" className="mt-12 scroll-mt-24 text-2xl font-bold text-ink-900">
              {t.templatesTitle}
            </h2>
            <p className="mt-2 text-ink-700">{t.templatesIntro}</p>
            <div className="mt-6 flex flex-col gap-6">
              {CARD_TEMPLATES.map((tpl) => (
                <TemplateCard key={tpl.id} template={tpl} />
              ))}
              <div className="card">
                <h3 className="text-xl font-semibold text-ink-900">{t.cssTitle}</h3>
                <p className="mb-3 mt-1 text-sm text-ink-700">{t.cssIntro}</p>
                <CodeBlock title="Styling" code={CARD_CSS} />
              </div>
            </div>

            <div className="card mt-10">
              <h2 className="text-xl font-semibold text-ink-900">{t.tipsTitle}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-700">
                {t.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="card mt-6">
              <h2 className="text-xl font-semibold text-ink-900">{t.errorsTitle}</h2>
              <dl className="mt-3 space-y-3">
                {t.errors.map(([problem, fix]) => (
                  <div key={problem}>
                    <dt className="font-medium text-ink-900">{problem}</dt>
                    <dd className="text-sm text-ink-700">{fix}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
