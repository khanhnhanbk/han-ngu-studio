"use client";

import { CheckIcon } from "./icons/check";
import { useIconTrigger } from "./icons/trigger";

/** One "for teachers" benefit; hovering the row plays the check mark. */
export function CheckPoint({ children }: { children: React.ReactNode }) {
  const check = useIconTrigger();
  return (
    <li
      {...check.triggerProps}
      className="flex items-start gap-3 rounded-xl border border-ink-900/10 bg-surface p-4 shadow-sm"
    >
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
        <CheckIcon ref={check.ref} size={14} aria-hidden />
      </span>
      <span className="text-sm text-ink-700">{children}</span>
    </li>
  );
}
