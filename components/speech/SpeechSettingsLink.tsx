"use client";

import { Volume2Icon } from "@/components/icons/volume-2";
import { useDictionary } from "@/lib/i18n/useLocale";
import { openSpeechSettings } from "@/lib/speech/player";

/** "Giọng đọc": opens the voice settings (shown next to a tool's 🔊 buttons). */
export function SpeechSettingsLink({ className = "" }: { className?: string }) {
  const t = useDictionary().speech;
  return (
    <button
      type="button"
      onClick={() => openSpeechSettings()}
      className={`inline-flex items-center gap-1 text-xs text-ink-500 underline decoration-dotted underline-offset-2 hover:text-brand-ink ${className}`}
    >
      <Volume2Icon size={12} aria-hidden />
      {t.settingsLink}
    </button>
  );
}
