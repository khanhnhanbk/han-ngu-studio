"use client";

import { useState } from "react";

import { CheckIcon } from "@/components/icons/check";
import { CopyIcon } from "@/components/icons/copy";
import { IconButton } from "@/components/icons/trigger";
import { getDictionary } from "@/lib/i18n";

const t = getDictionary("vi").ankiGuide;

/** Copy `text` to the clipboard; the label confirms for a moment. */
export function CopyButton({ text, label = t.copy }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      icon={copied ? CheckIcon : CopyIcon}
      className="btn-secondary px-3 py-1.5 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? t.copied : label}
    </IconButton>
  );
}

/** A labelled block of template code with its copy button. */
export function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-900">{title}</p>
        <CopyButton text={code} />
      </div>
      <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-ink-900/10 bg-ink-50 p-3 text-xs leading-relaxed text-ink-900">
        <code>{code}</code>
      </pre>
    </div>
  );
}
