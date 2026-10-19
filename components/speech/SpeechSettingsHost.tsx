"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

import { SERVER_SPEECH_STATE, speechState, subscribeSpeech } from "@/lib/speech/store";

// Loaded only when the dialog opens, so pages carry no voice-settings code.
const SpeechSettings = dynamic(() => import("./SpeechSettings").then((m) => m.SpeechSettings), { ssr: false });

/** Mounted in the root layout: renders the voice settings dialog when it is open. */
export function SpeechSettingsHost() {
  const state = useSyncExternalStore(subscribeSpeech, speechState, () => SERVER_SPEECH_STATE);
  return state.settings === "closed" ? null : <SpeechSettings />;
}
