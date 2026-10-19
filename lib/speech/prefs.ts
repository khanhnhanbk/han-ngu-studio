/** Pronunciation preferences (not user text), kept in this browser. */
export type SpeechPrefs = {
  /**
   * Pronunciation is off until the user turns it on (per device): with it
   * off, no 🔊 buttons show and no audio file is ever fetched.
   */
  enabled: boolean;
  /** Device voice the user picked; null = choose the best automatically. */
  voiceURI: string | null;
  /** Allow online voices (they send the clicked word to Google/Microsoft). */
  allowOnline: boolean;
  /** Device-voice speed, 0.6–1. */
  rate: number;
};

export const DEFAULT_SPEECH_PREFS: SpeechPrefs = { enabled: false, voiceURI: null, allowOnline: false, rate: 0.8 };
const KEY = "hns-speech";
export const SPEECH_PREFS_EVENT = "speech-prefs-change";

export function parseSpeechPrefs(raw: string | null): SpeechPrefs {
  try {
    const v = JSON.parse(raw ?? "{}") as Partial<SpeechPrefs>;
    const rate = typeof v.rate === "number" && v.rate >= 0.6 && v.rate <= 1 ? v.rate : DEFAULT_SPEECH_PREFS.rate;
    return {
      enabled: v.enabled === true,
      voiceURI: typeof v.voiceURI === "string" && v.voiceURI ? v.voiceURI : null,
      allowOnline: v.allowOnline === true,
      rate,
    };
  } catch {
    return DEFAULT_SPEECH_PREFS;
  }
}

export function readSpeechPrefs(): SpeechPrefs {
  try {
    return parseSpeechPrefs(window.localStorage.getItem(KEY));
  } catch {
    return DEFAULT_SPEECH_PREFS;
  }
}

export function saveSpeechPrefs(prefs: SpeechPrefs): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Not saved; applies for this visit.
  }
  window.dispatchEvent(new Event(SPEECH_PREFS_EVENT));
}
