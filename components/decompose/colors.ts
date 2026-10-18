/** Number of --part-* colours defined in app/globals.css. */
const PART_COLORS = 6;

/** CSS colour for a part's colour index (theme-aware, see --part-* in globals.css). */
export function partColor(index: number): string {
  return `rgb(var(--part-${index % PART_COLORS}))`;
}
