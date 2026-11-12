"use client";

import Image from "next/image";

import { Footer } from "@/components/Footer";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { IconLink } from "@/components/icons/trigger";
import { Navbar } from "@/components/Navbar";
import { useDictionary, useHref, useLocale } from "@/lib/i18n/useLocale";

/** Screenshot sizes (px) of public/guide/<locale>/<step>.webp, made from 1.5× page shots at 1200 px wide. */
const GUIDE_IMAGES: Record<string, Record<string, readonly [number, number]>> = {
  en: {
    anki: [1200, 919],
    paste: [1200, 1134],
    practice: [1200, 956],
    quiz: [1200, 463],
    slides: [1088, 450],
    table: [1200, 511],
  },
  vi: {
    anki: [1200, 919],
    paste: [1200, 1134],
    practice: [1200, 956],
    quiz: [1200, 463],
    slides: [1088, 403],
    table: [1200, 511],
  },
};

/** "Hướng dẫn cho thầy cô" (/guide, /en/guide): one lesson from a pasted handout to every output, step by step. */
export function TeacherGuide() {
  const t = useDictionary().guide;
  const href = useHref();
  const locale = useLocale();
  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page max-w-4xl">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 className="mt-3 text-balance text-3xl font-bold text-ink-900 sm:text-4xl">{t.title}</h1>
            <p className="mt-4 max-w-3xl text-lg text-ink-700">{t.subtitle}</p>
            <IconLink href={href("/lesson")} icon={ArrowRightIcon} iconAfter className="btn-primary mt-6">
              {t.open}
            </IconLink>

            <nav aria-label={t.contents} className="card mt-8">
              <h2 className="font-semibold text-ink-900">{t.contents}</h2>
              <ol className="mt-3 grid list-decimal gap-1 pl-5 text-ink-700 sm:grid-cols-2">
                {t.steps.map((s, i) => (
                  <li key={s.title}>
                    <a href={`#buoc-${i + 1}`} className="hover:text-brand-ink">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <ol className="mt-12 flex flex-col gap-16">
              {t.steps.map((s, i) => {
                const [w, h] = GUIDE_IMAGES[locale]?.[s.image] ?? [1200, 800];
                return (
                  <li key={s.title} id={`buoc-${i + 1}`} className="scroll-mt-24">
                    <h2 className="flex items-baseline gap-3 text-2xl font-bold text-ink-900">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-base text-on-brand">
                        {i + 1}
                      </span>
                      <span className="text-balance">{s.title}</span>
                    </h2>
                    <p className="mt-3 max-w-3xl text-ink-700">{s.body}</p>
                    {s.tips.length > 0 && (
                      <ul className="mt-3 max-w-3xl list-disc space-y-1 pl-5 text-sm text-ink-700">
                        {s.tips.map((tip) => (
                          <li key={tip}>{tip}</li>
                        ))}
                      </ul>
                    )}
                    <Image
                      src={`/guide/${locale}/${s.image}.webp`}
                      alt={s.alt}
                      width={w}
                      height={h}
                      sizes="(min-width: 896px) 832px, 100vw"
                      unoptimized
                      className="mt-6 h-auto w-full rounded-2xl border border-ink-900/10 bg-surface shadow-sm"
                    />
                  </li>
                );
              })}
            </ol>

            <div className="card mt-16">
              <h2 className="text-xl font-semibold text-ink-900">{t.saveTitle}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-700">
                {t.save.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="mt-12 text-center">
              <p className="text-lg text-ink-700">{t.end}</p>
              <IconLink href={href("/lesson")} icon={ArrowRightIcon} iconAfter className="btn-primary mt-4">
                {t.open}
              </IconLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
