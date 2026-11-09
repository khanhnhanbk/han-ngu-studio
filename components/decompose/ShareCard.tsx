"use client";

import { useState } from "react";

import {
  CARD_HEIGHT,
  CARD_SITE,
  CARD_WIDTH,
  cardFileName,
  clampLines,
  formulaOf,
  pickStory,
  shortMeaning,
  wrapText,
  type CardModel,
} from "@/lib/decompose/card";
import { loadMnemonics, suggestionFor } from "@/lib/decompose/mnemonics";
import { readNotes } from "@/lib/decompose/notes";
import { confirmDownload } from "@/lib/data/budget";
import { downloadBlob } from "@/lib/download";
import { useDictionary } from "@/lib/i18n/useLocale";
import { VOCAB_FILE, loadVocab } from "@/lib/vocab/load";
import { vocabFor, type VocabData } from "@/lib/vocab/lookup";

/** One top-level part of the character; `char` is null for an unknown part. */
export type ShareCardPart = { char: string | null; simp: string; hanviet: string; radical: string };

type Props = {
  /** The character as shown (Traditional in Phồn thể mode). */
  char: string;
  /** Simplified form, used to look up meanings and the suggested story. */
  simp: string;
  pinyin: string;
  hanviet: string;
  /** "Name · meaning" when the character is itself a radical. */
  radical: string;
  parts: ShareCardPart[];
};

type Labels = { kinds: Record<"goc" | "meo", string>; draft: string; own: string };

// The image is always light, whatever the page theme, so it reads the same
// wherever it is shared. Ink channels match the light-mode --ink-* tokens in
// app/globals.css; the accent comes from the raw --b-* palette.
const INK_900 = "rgb(15 23 42)";
const INK_700 = "rgb(51 65 85)";
const INK_500 = "rgb(100 116 139)";
const PAPER = "rgb(255 255 255)";

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function brand(step: number): string {
  const channels = cssVar(`--b-${step}`);
  return channels ? `rgb(${channels})` : INK_700;
}

function meaningOf(vocab: VocabData | null, simp: string, radical: string): string {
  const fromVocab = vocab ? vocabFor(vocab, simp)?.meaning ?? "" : "";
  if (fromVocab) return shortMeaning(fromVocab);
  // "Thủy · Nước" → "Nước"
  return radical ? shortMeaning(radical.split(" · ").slice(1).join(" · ") || radical) : "";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draw the card. Fonts must already be loaded. */
function draw(ctx: CanvasRenderingContext2D, card: CardModel, hanzi: string, latin: string, labels: Labels) {
  const W = CARD_WIDTH;
  const PAD = 80;
  const inner = W - PAD * 2;
  const font = (size: number, family: string, weight = 400) => `${weight} ${size}px ${family}`;
  const measureWith = (f: string) => (s: string) => {
    ctx.font = f;
    return ctx.measureText(s).width;
  };

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, CARD_HEIGHT);
  ctx.fillStyle = brand(600);
  ctx.fillRect(0, 0, W, 16);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Big glyph on a 米字格 guide.
  const box = 460;
  const bx = (W - box) / 2;
  const by = 90;
  ctx.fillStyle = brand(50);
  roundRect(ctx, bx, by, box, box, 28);
  ctx.fill();
  ctx.strokeStyle = brand(200);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.save();
  ctx.setLineDash([14, 12]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx, by + box / 2);
  ctx.lineTo(bx + box, by + box / 2);
  ctx.moveTo(bx + box / 2, by);
  ctx.lineTo(bx + box / 2, by + box);
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + box, by + box);
  ctx.moveTo(bx + box, by);
  ctx.lineTo(bx, by + box);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = INK_900;
  ctx.font = font(360, hanzi);
  ctx.textBaseline = "middle";
  ctx.fillText(card.char, W / 2, by + box / 2 + 10);
  ctx.textBaseline = "alphabetic";

  // Reading and meaning.
  let y = by + box + 80;
  const reading = [card.pinyin, card.hanviet.toUpperCase()].filter(Boolean).join("  ·  ");
  ctx.fillStyle = brand(700);
  ctx.font = font(52, latin, 700);
  ctx.fillText(reading, W / 2, y, inner);
  if (card.meaning) {
    y += 56;
    ctx.fillStyle = INK_700;
    ctx.font = font(38, latin);
    ctx.fillText(card.meaning, W / 2, y, inner);
  }

  // Formula row.
  if (card.formula) {
    y += 90;
    ctx.fillStyle = INK_900;
    ctx.font = font(76, hanzi);
    ctx.fillText(card.formula, W / 2, y, inner);
  }

  // Parts: glyph on the left, "hán việt: meaning" beside it.
  ctx.textAlign = "left";
  const parts = card.parts.slice(0, 4);
  if (parts.length) y += 40;
  for (const part of parts) {
    y += 70;
    ctx.fillStyle = INK_900;
    ctx.font = font(56, hanzi);
    ctx.fillText(part.char, PAD + 40, y);
    const text = [part.hanviet, part.meaning].filter(Boolean).join(": ");
    ctx.fillStyle = INK_700;
    ctx.font = font(36, latin);
    ctx.fillText(text, PAD + 130, y - 6, inner - 150);
  }

  // Story box, sized to what is left above the footer.
  const footerY = CARD_HEIGHT - 60;
  if (card.story) {
    const top = y + 50;
    const textFont = font(36, latin);
    const lineH = 50;
    const badgeH = 52;
    const room = footerY - 50 - top - 40 - badgeH - 24;
    const maxLines = Math.max(1, Math.floor(room / lineH));
    const width = inner - 64;
    const measure = measureWith(textFont);
    const lines = clampLines(wrapText(card.story.text, width, measure), maxLines, width, measure);
    const h = 40 + badgeH + 24 + lines.length * lineH;
    ctx.fillStyle = brand(50);
    roundRect(ctx, PAD, top, inner, h, 24);
    ctx.fill();
    ctx.strokeStyle = brand(200);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Badges: kind (or "Câu chuyện của tôi"), then "chưa kiểm duyệt".
    const badges: { text: string; solid: boolean }[] =
      card.story.from === "own"
        ? [{ text: labels.own, solid: false }]
        : [
            { text: labels.kinds[card.story.kind], solid: card.story.kind === "goc" },
            ...(card.story.reviewed ? [] : [{ text: labels.draft, solid: false }]),
          ];
    let bxPos = PAD + 32;
    const badgeFont = font(28, latin, 600);
    for (const badge of badges) {
      ctx.font = badgeFont;
      const bw = ctx.measureText(badge.text).width + 40;
      roundRect(ctx, bxPos, top + 32, bw, badgeH - 8, (badgeH - 8) / 2);
      if (badge.solid) {
        ctx.fillStyle = brand(700);
        ctx.fill();
        ctx.fillStyle = PAPER;
      } else {
        ctx.fillStyle = PAPER;
        ctx.fill();
        ctx.strokeStyle = brand(400);
        ctx.stroke();
        ctx.fillStyle = brand(800);
      }
      ctx.textBaseline = "middle";
      ctx.fillText(badge.text, bxPos + 20, top + 32 + (badgeH - 8) / 2 + 1);
      ctx.textBaseline = "alphabetic";
      bxPos += bw + 14;
    }

    ctx.fillStyle = INK_900;
    ctx.font = textFont;
    let ly = top + 40 + badgeH + 30;
    for (const line of lines) {
      ctx.fillText(line, PAD + 32, ly);
      ly += lineH;
    }
  }

  // Footer.
  ctx.textAlign = "center";
  ctx.fillStyle = INK_500;
  ctx.font = font(30, latin, 500);
  ctx.fillText(`Hán Ngữ Studio · ${CARD_SITE}`, W / 2, footerY);
}

/**
 * "Tải ảnh thẻ chữ": draws a 1080×1350 PNG of the character in the browser
 * and saves it on the device. Nothing is uploaded. The learner's own note goes
 * on the card only when "Dùng ghi chú của tôi" is ticked.
 */
export function ShareCard({ char, simp, pinyin, hanviet, radical, parts }: Props) {
  const t = useDictionary().decompose;
  const [useOwn, setUseOwn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function handleClick() {
    setBusy(true);
    setStatus("");
    try {
      // vocab.json is small (about 300 KB); the card still works without it.
      const vocab = (await confirmDownload([VOCAB_FILE])) ? await loadVocab().catch(() => null) : null;
      const mnemonics = await loadMnemonics().catch(() => null);
      const own = readNotes()[char] ?? "";
      const story = pickStory(suggestionFor(mnemonics, simp), own, useOwn);
      const card: CardModel = {
        char,
        pinyin,
        hanviet,
        meaning: meaningOf(vocab, simp, radical),
        parts: parts
          .filter((p): p is ShareCardPart & { char: string } => p.char !== null)
          .map((p) => ({ char: p.char, hanviet: p.hanviet, meaning: meaningOf(vocab, p.simp, p.radical) })),
        formula: formulaOf(char, parts.map((p) => p.char)),
        story,
      };

      const hanzi = cssVar("--font-hanzi") || "sans-serif";
      const latin = cssVar("--font-be-vietnam") || "sans-serif";
      const glyphs = [card.char, card.formula, ...card.parts.map((p) => p.char), story?.text ?? ""].join("");
      await Promise.all([
        document.fonts.load(`400 100px ${hanzi}`, glyphs),
        document.fonts.load(`400 36px ${latin}`),
        document.fonts.load(`600 36px ${latin}`),
        document.fonts.load(`700 36px ${latin}`),
      ]);

      const canvas = document.createElement("canvas");
      canvas.width = CARD_WIDTH;
      canvas.height = CARD_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas");
      draw(ctx, card, hanzi, latin, { kinds: t.kinds, draft: t.suggestionDraft, own: t.cardOwn });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("no image");
      downloadBlob(blob, cardFileName(char));
      setStatus(useOwn && !own.trim() ? t.cardNoOwn : t.cardDone);
    } catch {
      setStatus(t.cardFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <button type="button" className="btn-secondary px-3 py-2" onClick={handleClick} disabled={busy}>
        {busy ? t.cardBusy : t.cardButton}
      </button>
      <label className="mt-2 flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" checked={useOwn} onChange={(e) => setUseOwn(e.target.checked)} />
        {t.cardUseOwn}
      </label>
      <p className="mt-1 min-h-4 text-xs text-ink-500" aria-live="polite">
        {status || t.cardHint}
      </p>
    </div>
  );
}
