// Markdown report with targets and pass/fail.

/** Page-load targets (Core Web Vitals "good" thresholds). TBT has none in the plan: it is shown against 200 ms as the lab stand-in for INP. */
export const PAGE_TARGETS = { fcp: 1800, lcp: 2500, cls: 0.1, ttfb: 800, tbt: 200 };

const s = (ms) => (ms == null ? "–" : `${(ms / 1000).toFixed(2)} s`);
const msOrS = (ms) => (ms == null ? "–" : ms < 1000 ? `${Math.round(ms)} ms` : s(ms));
const kb = (b) => (b == null ? "–" : b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${Math.round(b / 1024)} KB`);
const mark = (v, target) => (v == null ? "–" : v <= target ? "✅" : "❌");
const shortUrl = (u, base) => {
  try {
    const url = new URL(u);
    return url.origin === new URL(base).origin ? url.pathname : `${url.host}${url.pathname}`;
  } catch {
    return u;
  }
};

function pageTable(rows) {
  const out = [
    "| Trang | Điểm | TTFB ≤0.8 s | FCP ≤1.8 s | LCP ≤2.5 s | TBT (≈INP) ≤200 ms | CLS ≤0.1 | Tổng tải |",
    "|---|---:|---|---|---|---|---|---:|",
  ];
  for (const r of rows) {
    const m = r.median;
    if (!m) {
      out.push(`| \`${r.path}\` | lỗi: ${r.runs.map((x) => x.error).join("; ")} | | | | | | |`);
      continue;
    }
    out.push(
      `| \`${r.path}\` | ${m.score} | ${s(m.ttfb)} ${mark(m.ttfb, PAGE_TARGETS.ttfb)} | ${s(m.fcp)} ${mark(m.fcp, PAGE_TARGETS.fcp)} | ${s(m.lcp)} ${mark(m.lcp, PAGE_TARGETS.lcp)} | ${msOrS(m.tbt)} ${mark(m.tbt, PAGE_TARGETS.tbt)} | ${m.cls.toFixed(3)} ${mark(m.cls, PAGE_TARGETS.cls)} | ${kb(m.bytes)} |`,
    );
  }
  return out.join("\n");
}

function largestTable(rows, base) {
  const out = ["| Trang | 5 request lớn nhất (đã nén khi truyền) |", "|---|---|"];
  for (const r of rows) {
    const list = r.largest.map((x) => `\`${shortUrl(x.url, base)}\` ${kb(x.transferSize)}`).join("<br>");
    out.push(`| \`${r.path}\` | ${list || "–"} |`);
  }
  return out.join("\n");
}

function flowTable(flows) {
  const out = ["| Luồng | Mục tiêu | Lần đầu (cold) | Lần sau (warm) | Ghi chú |", "|---|---|---|---|---|"];
  for (const f of flows) {
    const cell = (k) => {
      const x = f[k];
      if (x.ms == null) return `bỏ qua / lỗi (${x.runs.find((r) => r.error)?.error ?? "?"})`;
      const errs = x.errors ? ` (${x.errors} lỗi)` : "";
      return `${msOrS(x.ms)} ${mark(x.ms, f.target)}${errs}`;
    };
    const notes = [...new Set([...f.cold.runs, ...f.warm.runs].map((r) => r.note).filter(Boolean))][0] ?? "";
    const prompts = [...f.cold.runs, ...f.warm.runs].some((r) => r.prompts) ? " · có hộp “Tải dữ liệu?” (tự bấm, không tính giờ người đọc)" : "";
    out.push(`| **${f.id}** ${f.name} | ≤${msOrS(f.target)} | ${cell("cold")} | ${cell("warm")} | ${notes}${prompts} |`);
    if (f.tapTarget) {
      const tap = (k) => (f[k].tapMs == null ? "–" : `${msOrS(f[k].tapMs)} ${mark(f[k].tapMs, f.tapTarget)}`);
      out.push(`| **${f.id}·chạm** chạm một từ → thẻ từ hiện ra | ≤${msOrS(f.tapTarget)} | ${tap("cold")} | ${tap("warm")} | gần với INP |`);
    }
  }
  return out.join("\n");
}

function passCount(result) {
  let pass = 0;
  let total = 0;
  const add = (v, t) => {
    if (v == null) return;
    total++;
    if (v <= t) pass++;
  };
  for (const r of result.lighthouse?.mobile ?? []) {
    if (!r.median) continue;
    for (const k of ["ttfb", "fcp", "lcp", "cls"]) add(r.median[k], PAGE_TARGETS[k]);
  }
  for (const f of result.flows ?? []) {
    add(f.cold.ms, f.target);
    if (f.tapTarget) add(f.cold.tapMs, f.tapTarget);
  }
  return { pass, total };
}

export function toMarkdown(result) {
  const { meta } = result;
  const { pass, total } = passCount(result);
  const lines = [
    `# Đo tốc độ: ${meta.label} (${meta.date})`,
    "",
    `- Trang: ${meta.baseUrl}`,
    `- Đo từ: ${meta.where}`,
    `- Số lần mỗi phép đo: ${meta.runs} (bảng ghi trung vị)`,
    `- Trình duyệt: ${meta.browser}; Lighthouse ${meta.lighthouseVersion}, Playwright ${meta.playwrightVersion}`,
    `- Lệnh: \`${meta.command}\``,
    "",
    `**Đạt ${pass}/${total} mục tiêu** (tải trang di động: TTFB, FCP, LCP, CLS; luồng: lần đầu).`,
    "",
  ];
  if (result.lighthouse?.mobile) {
    lines.push(
      "## Tải trang: Lighthouse di động",
      "",
      "Giả lập mặc định của Lighthouse (4G chậm, CPU chậm 4 lần). TTFB là số đo thật từ máy này tới Vercel; FCP, LCP, TBT là số Lighthouse ước tính cho máy chậm.",
      "",
      pageTable(result.lighthouse.mobile),
      "",
    );
  }
  if (result.lighthouse?.desktop) {
    lines.push("## Tải trang: Lighthouse máy tính", "", "Preset desktop của Lighthouse, 1 lần mỗi trang.", "", pageTable(result.lighthouse.desktop), "");
  }
  if (result.flows) {
    lines.push(
      "## Thời gian ra kết quả",
      "",
      `Playwright + Chromium giả lập điện thoại tầm trung (${meta.device}, CPU chậm ${meta.cpuSlowdown} lần, mạng ${meta.network}). Đo trong trang, từ lúc bấm/dán tới khung hình đầu tiên có kết quả. **Lần đầu** = trình duyệt mới (chưa có cache, chưa lưu gì); **lần sau** = mở lại trang trong cùng trình duyệt.`,
      "",
      flowTable(result.flows),
      "",
    );
  }
  if (result.lighthouse?.mobile) {
    lines.push("## Request lớn nhất (Lighthouse di động)", "", largestTable(result.lighthouse.mobile, meta.baseUrl), "");
  }
  lines.push("Số liệu đầy đủ từng lần chạy: file `.json` cùng tên.", "");
  return lines.join("\n");
}
