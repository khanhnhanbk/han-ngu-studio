# Decompose: start the sound part (Gợi âm) collapsed

## Context

On `/tools/decompose`, every top-level part currently opens to show its own parts (`OPEN_DEPTH = 1` in `components/decompose/ComponentTree.tsx`). The sound part is usually a whole character (青 in 清, 音 in 意), and learners treat it as one unit: what matters is its reading and its family, not its sub-parts. Opening it adds noise. The owner wants parts tagged **Gợi âm** to start collapsed, with the **Mở rộng** button showing. They can still be opened on demand.

## Change

`components/decompose/ComponentTree.tsx`, in `CharRow`:

- `role` is already computed: `depth === 0 ? props.roles.get(node.char) : undefined`. Move that line above the `useState`.
- Change the initial state to `useState(depth < OPEN_DEPTH && role !== "phonetic")`.
- Update the `OPEN_DEPTH` comment: "Levels shown open at first, except the sound part (Gợi âm), which is learnt as a whole; deeper parts open on demand."

The tree is already keyed by character (`key={current}` in `app/tools/decompose/page.tsx`), so switching characters resets the open state. Nothing else changes: the semantic part and parts of non-pictophonetic characters still start open, and selection, highlighting and families are unaffected.

## Docs

`userguide/decompose.md`, step 3: after "Bấm **Mở rộng** để xem thành phần đó lại gồm những phần nào; **Thu gọn** để ẩn đi.", add: "Phần **Gợi âm** lúc đầu được thu gọn (thường học cả khối); bấm **Mở rộng** nếu muốn xem nó gồm những phần nào."

## Verification

1. `pnpm run lint`, `pnpm test`, `pnpm run build`.
2. Browser (Playwright script in the scratchpad, as before): `#c=清` shows 青 with **Gợi âm** and a **Mở rộng** button, and 龶/月 are hidden. 氵 is unchanged. Clicking **Mở rộng** shows 龶 and 月. `#c=國` (hội ý) still opens 或. `#c=意`: 音 is collapsed.
3. Commit on main and push (Vercel deploys), then confirm the commit status is `success`.
