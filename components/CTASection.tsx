"use client";

import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { PRACTICE_SHEET_HREF, USER_GUIDE_URL } from "@/lib/links";

export function CTASection() {
  const dict = useDictionary();
  const href = useHref();
  return (
    <section id="cta" className="section">
      <div className="container-page">
        {/* Stays dark in both themes; the glow follows the accent colour. */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgb(var(--b-400)) 0, transparent 40%), radial-gradient(circle at 80% 60%, rgb(var(--b-600)) 0, transparent 40%)",
            }}
          />
          <div className="relative mx-auto max-w-xl">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{dict.cta.title}</h2>
            <p className="mt-4 text-white/80">{dict.cta.subtitle}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href={href(PRACTICE_SHEET_HREF)} className="btn bg-white text-slate-900 hover:bg-white/90">
                {dict.cta.primary}
              </a>
              <a
                href={USER_GUIDE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border border-white/30 text-white hover:bg-white/10"
              >
                {dict.cta.secondary}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
