"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { Volume2Icon, type Volume2IconHandle } from "@/components/icons/volume-2";
import { useDictionary } from "@/lib/i18n/useLocale";
import { playWord, stopSpeech } from "@/lib/speech/player";
import { openSpeechSettings, SERVER_SPEECH_STATE, speechState, subscribeSpeech } from "@/lib/speech/store";
import { useSpeechEnabled } from "@/lib/speech/useSpeechEnabled";

/**
 * 🔊 for one word or character (never a sentence). Shown only after the user
 * turns pronunciation on (SpeechToggle); nothing loads before the first click. Plays the human recording
 * when there is one, else the device voice; with neither, opens the voice
 * settings with an install guide. A second click stops it.
 */
export function SpeakButton({
  word,
  label,
  tone3,
  contextual = false,
  size = 18,
  className = "",
}: {
  /** The word in Simplified characters (recordings are keyed that way). */
  word: string;
  /** The word as shown, for the accessible name (Traditional in Phồn thể mode). */
  label?: string;
  /** TONE3 reading per character, if known. */
  tone3?: readonly string[];
  /** The reading comes from the sentence (Đọc hiểu). */
  contextual?: boolean;
  size?: number;
  className?: string;
}) {
  const t = useDictionary().speech;
  const enabled = useSpeechEnabled();
  const state = useSyncExternalStore(subscribeSpeech, speechState, () => SERVER_SPEECH_STATE);
  const icon = useRef<Volume2IconHandle>(null);
  const id = `${word}|${tone3?.join(" ") ?? ""}`;
  const active = state.id === id;
  const playing = active && state.status === "playing";

  useEffect(() => {
    if (playing) icon.current?.startAnimation();
    else icon.current?.stopAnimation();
  }, [playing]);

  if (!enabled) return null;

  return (
    <button
      type="button"
      aria-label={t.listen.replace("{word}", label ?? word)}
      title={active ? t.stop : t.listen.replace("{word}", label ?? word)}
      aria-pressed={active}
      onClick={(e) => {
        // Inside cards and links: do not open or follow them.
        e.preventDefault();
        e.stopPropagation();
        if (active) return stopSpeech();
        // Called synchronously from the click, so audio unlocks on iOS.
        void playWord(id, { word, tone3, contextual }).then((r) => r === "unavailable" && openSpeechSettings("unavailable"));
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full p-1.5 transition hover:bg-brand-500/15 hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        active ? "bg-brand-500/15 text-brand-ink" : "text-ink-500"
      } ${active && state.status === "loading" ? "animate-pulse" : ""} ${className}`}
    >
      <Volume2Icon ref={icon} size={size} aria-hidden />
    </button>
  );
}
