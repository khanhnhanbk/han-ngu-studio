"use client";

import { useEffect, useRef, useState } from "react";

import { getDictionary } from "@/lib/i18n";
import {
  LOCAL_FONT_SUGGESTIONS,
  PRESET_FONTS,
  UPLOAD_FAMILY,
  fontStack,
  quoteFamily,
  type SheetFontId,
} from "@/lib/sheetFonts";
import { FileInput } from "../FileInput";

const dict = getDictionary("vi");
const t = dict.practiceSheet.font;

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const SAMPLE = "永字學习书";

type LocalFontData = { family: string };
type WindowWithLocalFonts = Window & {
  queryLocalFonts?: () => Promise<LocalFontData[]>;
};

/**
 * Whether a font family is installed: text drawn with it must differ in
 * width from at least one generic fallback. (document.fonts.check() is not
 * reliable for local fonts.)
 */
function isInstalled(name: string): boolean {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return true;
  const text = "永字學mmmwwwiii";
  return ["monospace", "serif", "sans-serif"].some((base) => {
    ctx.font = `72px ${base}`;
    const fallback = ctx.measureText(text).width;
    ctx.font = `72px ${quoteFamily(name)}, ${base}`;
    return ctx.measureText(text).width !== fallback;
  });
}

type Props = {
  fontId: SheetFontId;
  onFontId: (id: SheetFontId) => void;
  localName: string;
  onLocalName: (name: string) => void;
  uploadName: string | null;
  onUploadName: (name: string | null) => void;
};

export function FontPicker({
  fontId,
  onFontId,
  localName,
  onLocalName,
  uploadName,
  onUploadName,
}: Props) {
  const [installed, setInstalled] = useState<string[]>([]);
  const [listError, setListError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [missing, setMissing] = useState(false);
  const face = useRef<FontFace | null>(null);

  // Local Font Access API: Chrome/Edge desktop only. Checked after mount
  // so the server and first client render agree.
  const [canList, setCanList] = useState(false);
  useEffect(() => {
    setCanList(typeof (window as WindowWithLocalFonts).queryLocalFonts === "function");
  }, []);

  async function listInstalled() {
    setListError("");
    try {
      const fonts = await (window as WindowWithLocalFonts).queryLocalFonts!();
      const families = Array.from(new Set(fonts.map((f) => f.family))).sort((a, b) =>
        a.localeCompare(b),
      );
      setInstalled(families);
    } catch {
      setListError(t.listDenied);
    }
  }

  function checkLocal(name: string) {
    setMissing(name.trim() !== "" && !isInstalled(name.trim()));
  }

  // The file is read in the browser and registered with document.fonts;
  // it is never uploaded anywhere.
  async function handleUpload(file: File | undefined) {
    setUploadError("");
    if (!file) return;
    if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) {
      setUploadError(t.badFile);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(t.tooBig);
      return;
    }
    try {
      const loaded = await new FontFace(UPLOAD_FAMILY, await file.arrayBuffer()).load();
      if (face.current) document.fonts.delete(face.current);
      document.fonts.add(loaded);
      face.current = loaded;
      onUploadName(file.name);
      onFontId("upload");
    } catch {
      setUploadError(t.readFailed);
    }
  }

  const previewId = fontId === "upload" && !uploadName ? "wenkai" : fontId;

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="font-medium">{t.label}</span>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={fontId}
          onChange={(e) => onFontId(e.target.value as SheetFontId)}
          className="rounded-lg border border-ink-900/10 px-3 py-2"
        >
          {PRESET_FONTS.map((id) => (
            <option key={id} value={id}>
              {t.presets[id]}
            </option>
          ))}
          <option value="local">{t.local}</option>
          <option value="upload">{t.upload}</option>
        </select>
        <div
          className="flex items-center rounded-lg border border-ink-900/10 bg-surface px-3 text-3xl text-ink-900"
          style={{ fontFamily: fontStack(previewId, localName) }}
          aria-label={t.sample}
        >
          {SAMPLE}
        </div>
      </div>

      {fontId === "local" && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              list="sheet-local-fonts"
              value={localName}
              placeholder={t.localPlaceholder}
              onChange={(e) => {
                onLocalName(e.target.value);
                setMissing(false);
              }}
              onBlur={(e) => checkLocal(e.target.value)}
              className="w-full rounded-lg border border-ink-900/10 px-3 py-2 sm:max-w-xs"
            />
            <datalist id="sheet-local-fonts">
              {(installed.length ? installed : LOCAL_FONT_SUGGESTIONS).map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            {canList && (
              <button type="button" className="btn-secondary px-3 py-2" onClick={listInstalled}>
                {t.listInstalled}
              </button>
            )}
          </div>
          <p className="text-xs text-ink-500">
            {installed.length
              ? t.listed.replace("{count}", String(installed.length))
              : t.localHint}
          </p>
          {missing && <p className="text-xs text-red-600">{t.notFound}</p>}
          {listError && <p className="text-xs text-red-600">{listError}</p>}
        </div>
      )}

      {fontId === "upload" && (
        <div className="flex flex-col gap-1">
          <FileInput accept=".ttf,.otf,.woff,.woff2" onFile={handleUpload} showName={false} />
          <p className="text-xs text-ink-500">
            {uploadName ? t.uploaded.replace("{name}", uploadName) : t.uploadHint}
          </p>
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        </div>
      )}
    </div>
  );
}
