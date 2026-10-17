"use client";

import { PlusIcon } from "./icons/plus";
import { useIconTrigger } from "./icons/trigger";

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const plus = useIconTrigger();
  return (
    <details className="group rounded-xl border border-ink-900/10 bg-surface p-5 shadow-sm">
      <summary
        {...plus.triggerProps}
        className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink-900"
      >
        {question}
        <PlusIcon
          ref={plus.ref}
          size={18}
          aria-hidden
          className="shrink-0 text-brand-600 transition group-open:rotate-45"
        />
      </summary>
      <p className="mt-3 text-sm text-ink-700">{answer}</p>
    </details>
  );
}
