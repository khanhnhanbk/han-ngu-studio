"use client";

import type { VariantRow } from "@/lib/decompose/variants";
import { useDictionary } from "@/lib/i18n/useLocale";

/**
 * "Giản · Phồn · Nhật" (phase 12b): the Simplified, Traditional (Taiwan) and
 * Japanese forms of the character, one row per Traditional form (发: 發 発,
 * 髮 髪). A form that has decomposition data opens in Chiết tự when clicked.
 */
export function VariantForms({
  rows,
  current,
  hasData,
  onOpen,
}: {
  rows: VariantRow[];
  current: string;
  hasData: (char: string) => boolean;
  onOpen: (char: string) => void;
}) {
  const t = useDictionary().decompose;
  if (rows.length === 0) return null;
  const heads = [t.formSimp, t.formTrad, t.formJp];

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-ink-900">{t.forms}</h3>
      <table className="mt-2 text-center">
        <thead>
          <tr className="text-xs text-ink-500">
            {heads.map((h) => (
              <th key={h} scope="col" className="w-14 pb-1 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("")}>
              {row.map((form, i) => {
                const base = "hanzi inline-flex h-11 w-11 items-center justify-center rounded-lg text-2xl";
                if (form === current)
                  return (
                    <td key={i} className="py-0.5">
                      <span className={`${base} border border-brand-500 bg-brand-50 text-brand-700`} aria-current="true">
                        {form}
                      </span>
                    </td>
                  );
                return (
                  <td key={i} className="py-0.5">
                    {hasData(form) ? (
                      <button
                        type="button"
                        onClick={() => onOpen(form)}
                        title={t.formOpen.replace("{char}", form)}
                        className={`${base} border border-ink-900/10 text-ink-900 transition hover:border-brand-400`}
                      >
                        {form}
                      </button>
                    ) : (
                      <span className={`${base} text-ink-700`}>{form}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-xs text-ink-500">{t.formsHint}</p>
    </div>
  );
}
