"use client";

import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { CheckPoint } from "./CheckPoint";
import { ArrowRightIcon } from "./icons/arrow-right";
import { IconLink } from "./icons/trigger";

export function ForTeachers() {
  const dict = useDictionary();
  const href = useHref();
  return (
    <section id="for-teachers" className="section">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">{dict.forTeachers.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">
            {dict.forTeachers.title}
          </h2>
          <p className="mt-4 text-lg text-ink-700">
            {dict.forTeachers.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <IconLink href={href("/lesson")} icon={ArrowRightIcon} iconAfter className="btn-primary">
              {dict.forTeachers.cta}
            </IconLink>
            <a href={href("/guide")} className="btn-secondary">
              {dict.forTeachers.guide}
            </a>
          </div>
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
