"use client";

import { useEffect, useState } from "react";

import { IDENTITY, loadTradConverter, type ScriptConverter } from "./convert";
import { DEFAULT_SCRIPT, readScript, SCRIPT_EVENT, type Script } from "./preference";

/** The chosen script; follows the switch live (this tab and other tabs). */
export function useScript(): Script {
  const [script, setScript] = useState<Script>(DEFAULT_SCRIPT);
  useEffect(() => {
    const sync = () => setScript(readScript());
    sync();
    window.addEventListener(SCRIPT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SCRIPT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return script;
}

export type ConverterState = {
  script: Script;
  /** The converter for `script`; the identity until Phồn thể is loaded. */
  conv: ScriptConverter;
  /** False while the Traditional dictionaries download. */
  ready: boolean;
  /** True if they failed to download. */
  failed: boolean;
};

/** The converter for the chosen script, loading OpenCC on demand. */
export function useConverter(): ConverterState {
  const script = useScript();
  const [trad, setTrad] = useState<ScriptConverter | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (script !== "trad" || trad) return;
    let alive = true;
    setFailed(false);
    loadTradConverter().then(
      (c) => alive && setTrad(c),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [script, trad]);

  if (script === "simp") return { script, conv: IDENTITY, ready: true, failed: false };
  return { script, conv: trad ?? IDENTITY, ready: trad !== null, failed };
}
