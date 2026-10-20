"use client";

import { useEffect, useState } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { LEVEL_STYLE } from "@/components/reader/levels";
import { feedbackUrl } from "@/lib/feedback";
import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { HSK_LEVELS, type HskLevel } from "@/lib/reader/analyze";
import { useConverter } from "@/lib/script/useScript";
import { loadStoryIndex, type StoryEntry } from "@/lib/stories/load";

const fill = (s: string, values: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");

/** The story library: short stories by HSK level, each opened in Đọc hiểu (#story=<id>). */
export default function StoriesPage() {
  const t = useDictionary().stories;
  const href = useHref();
  const { conv } = useConverter();
  const [stories, setStories] = useState<StoryEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStoryIndex()
      .then(setStories)
      .catch(() => setError(t.loadFailed));
  }, [t]);

  const levels = HSK_LEVELS.filter((l) => stories?.some((s) => s.level === l));

  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{t.title}</h1>
            <p className="mt-4 max-w-3xl text-lg text-ink-700">{t.subtitle}</p>

            {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
            {!stories && !error && <p className="mt-6 text-sm text-ink-700">{t.loading}</p>}

            {levels.map((level) => (
              <div key={level} className="mt-10">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-ink-900">
                  <span className={`inline-block h-3 w-3 rounded-full ${LEVEL_STYLE[level as HskLevel].bg}`} aria-hidden />
                  {fill(t.level, { level })}
                </h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {stories!
                    .filter((s) => s.level === level)
                    .map((s) => (
                      <article key={s.id} className="card flex flex-col">
                        <p className="text-xs font-medium uppercase tracking-wide text-brand-ink">{s.topic}</p>
                        <h3 className="hanzi mt-2 text-2xl text-ink-900">{conv.toShown(s.title)}</h3>
                        <p className="mt-1 text-ink-700">{s.titleVi}</p>
                        {s.status === "draft" && (
                          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full bg-ink-900/5 px-2 py-0.5 text-ink-700">{t.draft}</span>
                            <a
                              href={feedbackUrl(fill(t.issueTitle, { title: s.title, id: s.id }), fill(t.issueBody, { title: s.title, id: s.id }))}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={t.feedbackHint}
                              className="text-brand-ink underline decoration-dotted underline-offset-2"
                            >
                              {t.feedback}
                            </a>
                          </p>
                        )}
                        <p className="mt-4 text-sm text-ink-500">{t.newWords}</p>
                        <p className="hanzi mt-1 text-lg text-ink-900">{s.newWords.map((w) => conv.toShown(w)).join("、")}</p>
                        <a href={href(`/tools/reader#story=${s.id}`)} className="btn-primary mt-6 w-fit">
                          {t.read}
                        </a>
                      </article>
                    ))}
                </div>
              </div>
            ))}

            {stories && <p className="mt-10 text-xs text-ink-500">{t.note}</p>}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
