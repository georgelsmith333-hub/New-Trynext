/**
 * Parses an optional price bound from a query string value. Returns a whole,
 * non-negative number, or undefined when the value is absent or not usable, so
 * a bad value is ignored and never changes the query.
 */
export function parsePriceBound(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 10_000_000) return undefined;
  return Math.floor(n);
}

/** When both bounds are given in the wrong order, swap them instead of returning nothing. */
export function normalizePriceRange(min: number | undefined, max: number | undefined): { min?: number; max?: number } {
  if (min !== undefined && max !== undefined && min > max) return { min: max, max: min };
  return { min, max };
}
