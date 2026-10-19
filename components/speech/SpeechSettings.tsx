"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { Volume2Icon } from "@/components/icons/volume-2";
import { useDictionary } from "@/lib/i18n/useLocale";
import {
  closeSpeechSettings,
  playWord,
  SERVER_SPEECH_STATE,
  speechState,
  subscribeSpeech,
} from "@/lib/speech/player";
import { DEFAULT_SPEECH_PREFS, readSpeechPrefs, saveSpeechPrefs, type SpeechPrefs } from "@/lib/speech/prefs";
import { mandarinRank, rankVoices } from "@/lib/speech/voices";

type System = "windows" | "mac" | "ios" | "android" | "linux";
const SYSTEMS: System[] = ["windows", "mac", "ios", "android", "linux"];

function detectSystem(): System {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/.test(ua)) return "mac";
  return "linux";
}

/** Mandarin device voices; Chrome fills the list late (voiceschanged). */
function useMandarinVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const read = () => setVoices(speechSynthesis.getVoices().filter((v) => mandarinRank(v.lang) !== null));
    read();
    speechSynthesis.addEventListener("voiceschanged", read);
    return () => speechSynthesis.removeEventListener("voiceschanged", read);
  }, []);
  return voices;
}

/** "Giọng đọc" dialog, mounted once in the root layout. */
export function SpeechSettings() {
  const t = useDictionary().speech;
  const state = useSyncExternalStore(subscribeSpeech, speechState, () => SERVER_SPEECH_STATE);
  const open = state.settings !== "closed";
  const voices = useMandarinVoices();
  const [prefs, setPrefs] = useState<SpeechPrefs>(DEFAULT_SPEECH_PREFS);
  const [system, setSystem] = useState<System>("windows");

  useEffect(() => {
    if (!open) return;
    setPrefs(readSpeechPrefs());
    setSystem(detectSystem());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSpeechSettings();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const usable = useMemo(() => rankVoices(voices, prefs.allowOnline), [voices, prefs.allowOnline]);

  function update(next: Partial<SpeechPrefs>) {
    const value = { ...prefs, ...next };
    setPrefs(value);
    saveSpeechPrefs(value);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/40 p-0 sm:items-center sm:p-4" onClick={closeSpeechSettings}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="speech-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-ink-900/10 bg-surface p-5 shadow-lg sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="speech-title" className="flex items-center gap-2 text-lg font-semibold text-ink-900">
            <Volume2Icon size={20} aria-hidden /> {t.title}
          </h2>
          <button type="button" onClick={closeSpeechSettings} className="text-sm text-ink-500 hover:text-ink-900">
            {t.close}
          </button>
        </div>

        {state.settings === "unavailable" && (
          <p className="mt-3 rounded-lg bg-brand-500/15 p-3 text-sm text-ink-900">{t.unavailable}</p>
        )}

        <p className="mt-3 text-sm font-medium text-ink-900">{t.howTitle}</p>
        <p className="mt-1 text-sm text-ink-700">{t.how}</p>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink-900">{t.deviceVoice}</span>
          {usable.length === 0 ? (
            <span className="text-ink-700">{t.noVoice}</span>
          ) : (
            <select
              value={usable.some((v) => v.voiceURI === prefs.voiceURI) ? (prefs.voiceURI ?? "") : ""}
              onChange={(e) => update({ voiceURI: e.target.value || null })}
              className="rounded-lg border border-ink-900/10 px-3 py-2"
            >
              <option value="">
                {t.autoVoice} ({usable[0].name})
              </option>
              {usable.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} · {v.lang}
                  {v.localService ? "" : ` · ${t.online}`}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="mt-3 flex items-start gap-2 text-sm text-ink-700">
          <input type="checkbox" className="mt-1" checked={prefs.allowOnline} onChange={(e) => update({ allowOnline: e.target.checked })} />
          <span>
            <span className="font-medium text-ink-900">{t.allowOnline}</span>
            <span className="mt-0.5 block text-xs text-ink-500">{t.allowOnlineNote}</span>
          </span>
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-ink-700">
            {t.rate}
            <input
              type="range"
              min={0.6}
              max={1}
              step={0.1}
              value={prefs.rate}
              onChange={(e) => update({ rate: Number(e.target.value) })}
            />
            <span className="tabular-nums">{prefs.rate.toFixed(1)}×</span>
          </label>
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 text-sm"
            disabled={usable.length === 0}
            onClick={() => void playWord("speech-test", { word: t.testWord })}
          >
            {t.test} <span className="hanzi">{t.testWord}</span>
          </button>
        </div>

        <div className="mt-5 border-t border-ink-900/10 pt-4">
          <p className="text-sm font-medium text-ink-900">{t.installTitle}</p>
          <div role="tablist" className="mt-2 flex flex-wrap gap-1">
            {SYSTEMS.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={system === s}
                onClick={() => setSystem(s)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  system === s ? "bg-brand-600 text-on-brand" : "bg-ink-50 text-ink-700 hover:text-ink-900"
                }`}
              >
                {t.systems[s]}
              </button>
            ))}
          </div>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink-700">
            {t.install[system].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-ink-500">{t.installNote}</p>
        </div>

        <p className="mt-4 text-xs text-ink-500">{t.credit}</p>
      </div>
    </div>
  );
}
