# Quiz: choose the question order (random or grouped by type)

## Context

`/tools/quiz` always shuffles every question together (`buildQuiz` ends with `shuffle(questions, rng)` in `lib/quiz/build.ts`). Teachers want a second option: questions **grouped by type**, like a printed test with sections (all "Chữ Hán → Nghĩa", then all "Chữ Hán → Pinyin", …). Random stays the default.

## Behaviour

- New setting on the setup screen, **Thứ tự câu hỏi**, with two radios:
  - **Ngẫu nhiên** (default): what happens today.
  - **Theo loại câu hỏi**: types follow the `KINDS` order (the same order as the checkboxes). Within each type, words keep the order the user typed them.
- The answer options (A–D) and the ordering-question tokens are still shuffled in both modes.
- **Làm lại (đổi thứ tự)** and **Làm lại các câu sai**: in grouped mode the question order stays grouped and only the options and tokens are reshuffled. In random mode nothing changes.
- The print sheet, answer key and TSV follow `questions`, so they use the chosen order with no extra work.

## Changes

1. **`lib/quiz/types.ts`**: `export const ORDERS = ["random", "byKind"] as const; export type QuizOrder = …`.
2. **`lib/quiz/build.ts`**:
   - `buildQuiz(data, entries, kinds, rng, order: QuizOrder = "random")`. For `byKind`, loop `kinds` outside and words inside (today it is the reverse), and skip the final `shuffle`. Random mode keeps its loop and shuffle exactly as they are, so it uses the RNG the same way and existing seeded tests don't change.
   - `reshuffle(questions, rng, order = "random")`: in `byKind`, keep the question order and only reshuffle options and tokens. Factor out the per-question part that already exists.
3. **`app/tools/quiz/page.tsx`**: `const [order, setOrder] = useState<QuizOrder>("random")`. Add a radio `fieldset` under the "Loại câu hỏi" fieldset, styled the same way. Pass `order` to `buildQuiz` and to both `reshuffle` calls.
4. **`lib/i18n/vi.ts`** (`quiz`): `orderLabel: "Thứ tự câu hỏi"`, `orders: { random: "Ngẫu nhiên", byKind: "Theo loại câu hỏi" }`.
5. **Tests** (`lib/quiz/build.test.ts`):
   - In `byKind`, kinds appear in contiguous blocks in `KINDS` order and words follow input order.
   - The default is still random and unchanged (existing tests).
   - `reshuffle` in `byKind` keeps the question order (`word`/`kind` sequence) and the right answers stay correct.
6. **User guide** `userguide/quiz.md`: a step for **Thứ tự câu hỏi** using the exact labels, plus a "Lỗi thường gặp" row: "Muốn đề chia theo từng phần" → choose **Theo loại câu hỏi**.

## Verification

- `pnpm test`, `pnpm run lint`, `pnpm run build`.
- `pnpm run dev` → `/tools/quiz` → sample words, all types:
  - **Theo loại câu hỏi** → the questions run type by type, and the print preview and TSV match.
  - **Làm lại (đổi thứ tự)** keeps the groups and the options change.
  - **Ngẫu nhiên** is still mixed.
- Check the new radios in dark mode.
