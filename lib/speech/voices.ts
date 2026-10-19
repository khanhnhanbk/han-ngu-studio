/**
 * Choosing a device voice (Web Speech) for Mandarin, used only when there is
 * no human recording. Online voices (localService false) send the text to
 * their provider, so they are offered only when the user allows them.
 */
export type VoiceLike = Pick<SpeechSynthesisVoice, "voiceURI" | "name" | "lang" | "localService">;

/** 0 = Mainland Mandarin, 1 = generic Chinese, 2 = Taiwan Mandarin; null = not Mandarin. */
export function mandarinRank(lang: string): number | null {
  const l = lang.toLowerCase().replace("_", "-");
  // zh-HK / yue are Cantonese: wrong language for Pinyin.
  if (/^(yue|zh-hk|zh-yue)/.test(l)) return null;
  if (/^(zh-cn|cmn-cn|zh-hans|cmn-hans|zh-sg)/.test(l)) return 0;
  if (l === "zh" || l === "cmn") return 1;
  if (/^(zh-tw|cmn-tw|zh-hant)/.test(l)) return 2;
  return null;
}

/** Names known to sound natural; scored above the rest. */
const GOOD_NAME = /natural|neural|premium|enhanced|xiaoxiao|yunxi|tingting|lilian|google 普通话|google mandarin/i;

/** Mandarin voices that may be used, best first. */
export function rankVoices<V extends VoiceLike>(voices: readonly V[], allowOnline: boolean): V[] {
  const usable = voices.filter((v) => mandarinRank(v.lang) !== null && (allowOnline || v.localService));
  const score = (v: V) => (mandarinRank(v.lang) ?? 9) * 10 + (GOOD_NAME.test(v.name) ? 0 : 2) + (v.localService ? 0 : 1);
  return [...usable].sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
}

/** The user's chosen voice if it is still usable, else the best one. */
export function pickVoice<V extends VoiceLike>(voices: readonly V[], allowOnline: boolean, chosen: string | null): V | null {
  const ranked = rankVoices(voices, allowOnline);
  return ranked.find((v) => v.voiceURI === chosen) ?? ranked[0] ?? null;
}
