"use client";

import { useEffect, useState } from "react";

import { readSpeechPrefs, SPEECH_PREFS_EVENT } from "./prefs";

/** Whether the user turned pronunciation on (false until hydrated, so nothing loads early). */
export function useSpeechEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const read = () => setEnabled(readSpeechPrefs().enabled);
    read();
    window.addEventListener(SPEECH_PREFS_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(SPEECH_PREFS_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return enabled;
}
