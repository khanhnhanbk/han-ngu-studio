import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("vi");

// Sample mizige cells for the hero mockup
const cells = ["永", "和", "九", "年", "岁", "在"];

function MizigeCell({ char }: { char: string }) {
  return (
    <div className="relative aspect-square rounded-md border border-brand-300 bg-white">
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-brand-500/40">
        <span className="absolute h-px w-full rotate-0 bg-brand-300/40" />
        <span className="absolute h-full w-px bg-brand-300/40" />
        <span className="absolute h-px w-[141%] rotate-45 bg-brand-300/30" />
        <span className="absolute h-px w-[141%] -rotate-45 bg-brand-300/30" />
      </span>
      <span className="hanzi absolute inset-0 flex items-center justify-center text-3xl text-ink-900">
        {char}
      </span>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-96 bg-gradient-to-b from-brand-50 to-transparent"
      />
      <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {dict.hero.badge}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            {dict.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-700">
            {dict.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#cta" className="btn-primary">
              {dict.hero.ctaPrimary}
            </a>
            <a href="#features" className="btn-secondary">
              {dict.hero.ctaSecondary}
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-700/70">{dict.hero.trustNote}</p>
        </div>

        {/* Mockup: practice sheet preview */}
        <div className="animate-fade-up rounded-2xl border border-ink-900/10 bg-white p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-900">
              Phiếu tập viết
            </span>
            <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
              ㅁ 米字格
            </span>
          </div>
          <div className="mb-2 text-xs text-ink-700/60">
            Yǒng hé jiǔ nián suì zài
          </div>
          <div className="grid grid-cols-6 gap-2">
            {cells.map((c) => (
              <MizigeCell key={c} char={c} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-ink-700/70">
            <span>Pinyin</span>
            <span>Ngũ bút</span>
            <span>Nét đứt</span>
          </div>
        </div>
      </div>
    </section>
  );
}
