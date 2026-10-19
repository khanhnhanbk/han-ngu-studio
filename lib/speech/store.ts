/**
 * Shared state of the 🔊 buttons and the voice settings dialog. Kept apart
 * from the player so the root layout can watch the dialog without loading
 * any playback code.
 */
export type SpeechState = {
  /** Id of the button whose word is loading or playing. */
  id: string | null;
  status: "idle" | "loading" | "playing";
  /** Voice settings dialog: closed, or open (because a word had no sound). */
  settings: "closed" | "open" | "unavailable";
};

let state: SpeechState = { id: null, status: "idle", settings: "closed" };
const listeners = new Set<() => void>();

export function setSpeechState(next: Partial<SpeechState>): void {
  state = { ...state, ...next };
  for (const l of listeners) l();
}

export const subscribeSpeech = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));
export const speechState = () => state;
export const SERVER_SPEECH_STATE: SpeechState = state;

export function openSpeechSettings(reason: "open" | "unavailable" = "open"): void {
  setSpeechState({ settings: reason });
}

export function closeSpeechSettings(): void {
  setSpeechState({ settings: "closed" });
}
