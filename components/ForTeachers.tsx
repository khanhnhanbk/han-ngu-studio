import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("vi");

export function ForTeachers() {
  return (
    <section id="for-teachers" className="section">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Giáo viên</p>
          <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">
            {dict.forTeachers.title}
          </h2>
          <p className="mt-4 text-lg text-ink-700">
            {dict.forTeachers.subtitle}
          </p>
          <a href="#cta" className="btn-primary mt-8">
            {dict.forTeachers.cta}
          </a>
        </div>

        <ul className="grid gap-4">
          {dict.forTeachers.points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 rounded-xl border border-ink-900/10 bg-surface p-4 shadow-sm"
            >
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-100 text-sm text-green-700">
                ✓
              </span>
              <span className="text-sm text-ink-700">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
