"use client";

import { useRef, useState } from "react";

import type { CardImage } from "@/lib/anki/exportApkg";
import { getDictionary } from "@/lib/i18n";

const t = getDictionary("vi").anki;

/** First image file in a paste or drop, if any. */
function imageFrom(data: DataTransfer | null): File | undefined {
  return Array.from(data?.files ?? []).find((f) => f.type.startsWith("image/"));
}

/**
 * The image of one card: pick a file, paste (Ctrl+V) or drop an image onto
 * the cell. Everything stays in the browser.
 */
export function ImageCell({
  word,
  image,
  onImage,
  onRemove,
}: {
  word: string;
  image: CardImage | undefined;
  onImage: (file: File) => void;
  onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      tabIndex={0}
      aria-label={t.imageCellLabel.replace("{word}", word)}
      onPaste={(e) => {
        const file = imageFrom(e.clipboardData);
        if (file) {
          e.preventDefault();
          onImage(file);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = imageFrom(e.dataTransfer);
        if (file) onImage(file);
      }}
      className={`flex w-28 items-center gap-1 rounded border px-1 py-1 focus:border-brand-500 focus:outline-none ${
        over ? "border-brand-500 bg-brand-50" : "border-dashed border-ink-900/20"
      }`}
    >
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImage(file);
          e.target.value = "";
        }}
      />
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- a local blob: URL, not an optimisable asset */}
          <img src={image.url} alt="" className="h-10 w-10 rounded object-cover" />
          <button
            type="button"
            onClick={onRemove}
            aria-label={`${t.imageRemove} – ${word}`}
            title={t.imageRemove}
            className="rounded px-1 text-lg leading-none text-ink-500 hover:text-red-600"
          >
            ×
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="w-full rounded px-1 py-1 text-xs text-ink-500 hover:text-brand-ink"
        >
          {t.imagePick}
        </button>
      )}
    </div>
  );
}
