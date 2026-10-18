"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { currentDownload, formatBytes, subscribeDownload } from "@/lib/data/budget";
import { getDictionary } from "@/lib/i18n";

const t = getDictionary("vi").download;

/** Asks before a tool downloads more than lib/data/budget.ts THRESHOLD. */
export function DownloadPrompt() {
  const request = useSyncExternalStore(subscribeDownload, currentDownload, () => null);
  const [dontAsk, setDontAsk] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!request) return;
    setDontAsk(false);
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && request.answer(false, false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [request]);

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="download-title"
        aria-describedby="download-body"
        className="w-full max-w-md rounded-xl border border-ink-900/10 bg-surface p-6 shadow-lg"
      >
        <h2 id="download-title" className="text-lg font-semibold text-ink-900">
          {t.title}
        </h2>
        <p id="download-body" className="mt-2 text-sm text-ink-700">
          {t.body.replace("{size}", formatBytes(request.bytes))}
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={dontAsk} onChange={(e) => setDontAsk(e.target.checked)} />
          {t.dontAsk}
        </label>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => request.answer(false, false)}>
            {t.cancel}
          </button>
          <button ref={confirmRef} type="button" className="btn-primary" onClick={() => request.answer(true, dontAsk)}>
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
