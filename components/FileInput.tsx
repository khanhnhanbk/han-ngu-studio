"use client";

import { useState } from "react";
import { useDictionary } from "@/lib/i18n/useLocale";
import { useIconTrigger } from "./icons/trigger";
import { UploadIcon } from "./icons/upload";

/**
 * Styled file picker. The native input stays in the DOM (visually hidden,
 * still focusable) so keyboard and screen-reader use is unchanged; the file
 * is read on the device and never uploaded anywhere.
 */
export function FileInput({
  label,
  accept,
  onFile,
  showName = true,
}: {
  label?: string;
  accept: string;
  onFile: (file: File | undefined) => void;
  /** Hide the chosen file name when the caller already shows it. */
  showName?: boolean;
}) {
  const dict = useDictionary();
  const [name, setName] = useState("");
  const upload = useIconTrigger();

  return (
    <label className="flex flex-col gap-1" {...upload.triggerProps}>
      {label && <span className="font-medium">{label}</span>}
      <span className="flex min-w-0 items-center gap-3">
        <input
          type="file"
          accept={accept}
          className="peer sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setName(file?.name ?? "");
            onFile(file);
            // Allow picking the same file again after editing it on disk.
            e.target.value = "";
          }}
        />
        <span className="btn-secondary shrink-0 cursor-pointer px-3 py-2 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400">
          <UploadIcon ref={upload.ref} size={16} aria-hidden />
          {dict.fileInput.choose}
        </span>
        {showName && (
          <span className="truncate text-sm text-ink-700/70" title={name || undefined}>
            {name || dict.fileInput.none}
          </span>
        )}
      </span>
    </label>
  );
}
