import { getDictionary } from "@/lib/i18n";
import { PRACTICE_SHEET_HREF } from "@/lib/links";
import { CheckPoint } from "./CheckPoint";
import { ArrowRightIcon } from "./icons/arrow-right";
import { IconLink } from "./icons/trigger";

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
          <IconLink href={PRACTICE_SHEET_HREF} icon={ArrowRightIcon} iconAfter className="btn-primary mt-8">
            {dict.forTeachers.cta}
          </IconLink>
        </div>

        <ul className="grid gap-4">
          {dict.forTeachers.points.map((point) => (
            <CheckPoint key={point}>{point}</CheckPoint>
          ))}
        </ul>
      </div>
    </section>
  );
}
