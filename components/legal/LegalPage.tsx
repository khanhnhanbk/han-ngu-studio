"use client";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SOURCES } from "@/lib/legal/sources";
import { useDictionary } from "@/lib/i18n/useLocale";
import { REPO_URL } from "@/lib/links";

const linkClass = "text-brand-ink underline";

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

/** Licences & privacy (/giay-phep and /en/giay-phep). */
export function LegalPage() {
  const t = useDictionary().legal;
  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page max-w-4xl">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{t.title}</h1>
            <p className="mt-4 text-lg text-ink-700">{t.subtitle}</p>

            <div className="card mt-8">
              <h2 className="text-xl font-semibold text-ink-900">{t.privacyTitle}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-700">
                {t.privacy.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm">
                <External href="https://vercel.com/legal/privacy-policy">{t.vercelPrivacy}</External>
              </p>
            </div>

            <div className="card mt-6">
              <h2 className="text-xl font-semibold text-ink-900">{t.licenseTitle}</h2>
              <p className="mt-3 text-ink-700">{t.code}</p>
              <p className="mt-2 text-sm">
                <External href={`${REPO_URL}/blob/main/LICENSE`}>{t.codeLink}</External>
              </p>
              <p className="mt-4 text-ink-700">{t.data}</p>
            </div>

            <div className="card mt-6">
              <h2 className="text-xl font-semibold text-ink-900">{t.sourcesTitle}</h2>
              <ul className="mt-4 divide-y divide-ink-900/5">
                {SOURCES.map((s) => (
                  <li key={s.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="font-medium text-ink-900">
                      <External href={s.url}>{s.name}</External>
                    </p>
                    <p className="mt-1 text-sm text-ink-700">
                      <span className="text-ink-700/70">{t.usedFor}:</span> {t.uses[s.id]}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-700">
                      <span className="text-ink-700/70">{t.licenseLabel}:</span>{" "}
                      {s.licenseUrl ? <External href={s.licenseUrl}>{s.license}</External> : s.license}
                    </p>
                  </li>
                ))}
              </ul>
              <h3 className="mt-6 font-semibold text-ink-900">{t.ownTitle}</h3>
              <p className="mt-1 text-sm text-ink-700">{t.own}</p>
              <p className="mt-4 text-sm">
                <External href={`${REPO_URL}/blob/main/THIRD-PARTY-NOTICES.md`}>{t.noticesLink}</External>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
