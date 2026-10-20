"use client";

import { VolumeXIcon } from "@/components/icons/volume-x";
import { Volume2Icon } from "@/components/icons/volume-2";
import { useDictionary } from "@/lib/i18n/useLocale";
import { readSpeechPrefs, saveSpeechPrefs } from "@/lib/speech/prefs";
import { openSpeechSettings } from "@/lib/speech/store";
import { useSpeechEnabled } from "@/lib/speech/useSpeechEnabled";

/**
 * Pronunciation switch in the Navbar, so it is visible on every page. Off:
 * a click turns it on (the 🔊 buttons appear). On: a click opens Giọng đọc,
 * which has "Tắt phát âm". `compact` = icon only (phone bar, next to the menu button).
 */
export function SpeechNavButton({ compact = false }: { compact?: boolean }) {
  const t = useDictionary().speech;
  const enabled = useSpeechEnabled();
  const label = enabled ? t.navOn : t.navOff;
  const Icon = enabled ? Volume2Icon : VolumeXIcon;

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={compact ? label : undefined}
      title={enabled ? t.settingsLink : `${t.enable} ${t.enableHint}`}
      onClick={() => (enabled ? openSpeechSettings() : saveSpeechPrefs({ ...readSpeechPrefs(), enabled: true }))}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition ${
        compact ? "h-10 w-10 border border-ink-900/10" : "px-3 py-1.5"
      } ${enabled ? "bg-brand-50 text-brand-ink hover:bg-brand-100" : "bg-ink-50 text-ink-700 hover:text-ink-900"}`}
    >
      <Icon size={compact ? 20 : 16} aria-hidden />
      {!compact && <span>{label}</span>}
    </button>
  );
}
