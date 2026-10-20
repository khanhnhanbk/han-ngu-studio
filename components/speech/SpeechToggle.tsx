"use client";

import { VolumeXIcon } from "@/components/icons/volume-x";
import { Volume2Icon } from "@/components/icons/volume-2";
import { useDictionary } from "@/lib/i18n/useLocale";
import { readSpeechPrefs, saveSpeechPrefs } from "@/lib/speech/prefs";
import { openSpeechSettings } from "@/lib/speech/store";
import { useSpeechEnabled } from "@/lib/speech/useSpeechEnabled";

/**
 * Pronunciation is off by default. Off: "Bật phát âm" turns it on (the 🔊
 * buttons appear). On: "Giọng đọc" opens the voice settings.
 * `prominent` = a real button near the top of a tool; default = small link.
 */
export function SpeechToggle({ className = "", prominent = false }: { className?: string; prominent?: boolean }) {
  const t = useDictionary().speech;
  const enabled = useSpeechEnabled();
  const toggle = () => (enabled ? openSpeechSettings() : saveSpeechPrefs({ ...readSpeechPrefs(), enabled: true }));

  if (prominent) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-left text-sm font-medium transition ${
          enabled
            ? "border-brand-200 bg-brand-50 text-brand-ink hover:bg-brand-100"
            : "border-ink-900/10 bg-surface text-ink-900 shadow-sm hover:border-brand-300 hover:text-brand-ink"
        } ${className}`}
      >
        {enabled ? <Volume2Icon size={18} aria-hidden /> : <VolumeXIcon size={18} aria-hidden />}
        <span>
          {enabled ? `${t.navOn} · ${t.settingsLink}` : t.enable}
          {!enabled && <span className="block text-xs font-normal text-ink-500">{t.enableHint}</span>}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1 text-xs text-ink-500 underline decoration-dotted underline-offset-2 hover:text-brand-ink ${className}`}
    >
      <Volume2Icon size={12} aria-hidden />
      {enabled ? t.settingsLink : `${t.enable} ${t.enableHint}`}
    </button>
  );
}
