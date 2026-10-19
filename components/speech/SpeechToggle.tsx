"use client";

import { Volume2Icon } from "@/components/icons/volume-2";
import { useDictionary } from "@/lib/i18n/useLocale";
import { readSpeechPrefs, saveSpeechPrefs } from "@/lib/speech/prefs";
import { openSpeechSettings } from "@/lib/speech/store";
import { useSpeechEnabled } from "@/lib/speech/useSpeechEnabled";

/**
 * Pronunciation is off by default. Off: "Bật phát âm" turns it on (the 🔊
 * buttons appear). On: "Giọng đọc" opens the voice settings.
 */
export function SpeechToggle({ className = "" }: { className?: string }) {
  const t = useDictionary().speech;
  const enabled = useSpeechEnabled();
  return (
    <button
      type="button"
      onClick={() => (enabled ? openSpeechSettings() : saveSpeechPrefs({ ...readSpeechPrefs(), enabled: true }))}
      className={`inline-flex items-center gap-1 text-xs text-ink-500 underline decoration-dotted underline-offset-2 hover:text-brand-ink ${className}`}
    >
      <Volume2Icon size={12} aria-hidden />
      {enabled ? t.settingsLink : `${t.enable} ${t.enableHint}`}
    </button>
  );
}
