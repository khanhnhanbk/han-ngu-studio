/** Which Chinese script the tools show: Simplified (default) or Taiwan Traditional. */
export type Script = "simp" | "trad";

export const SCRIPTS: readonly Script[] = ["simp", "trad"];
export const DEFAULT_SCRIPT: Script = "simp";

const STORAGE_KEY = "script";
/** Fired on window when the switch changes, so every mounted tool updates. */
export const SCRIPT_EVENT = "script-change";

export function parseScript(raw: string | null): Script {
  return raw === "trad" ? "trad" : DEFAULT_SCRIPT;
}

export function readScript(): Script {
  try {
    return parseScript(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage can be blocked (private mode, site data disabled).
    return DEFAULT_SCRIPT;
  }
}

export function applyScript(script: Script): void {
  const root = document.documentElement;
  if (script === "trad") root.setAttribute("data-script", "trad");
  else root.removeAttribute("data-script");
}

export function saveScript(script: Script): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, script);
  } catch {
    // Not persisted; the script still applies for this visit.
  }
  applyScript(script);
  window.dispatchEvent(new Event(SCRIPT_EVENT));
}

/**
 * Inline <head> script: sets data-script before first paint so Traditional
 * text never flashes in the Simplified font. Same rule as parseScript.
 */
export const SCRIPT_INIT_SCRIPT = `(function(){try{
if(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})==="trad")document.documentElement.setAttribute("data-script","trad");
}catch(e){}})();`;
