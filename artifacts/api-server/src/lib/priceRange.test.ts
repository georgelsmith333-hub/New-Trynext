import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePriceRange, parsePriceBound } from "./priceRange";

describe("parsePriceBound", () => {
  it.each([["0", 0], ["500", 500], ["499.9", 499], [" 750 ", 750]])("accepts %j", (v, n) => expect(parsePriceBound(v)).toBe(n));
  it.each([undefined, "", "   ", "abc", "-1", "NaN", "Infinity", "99999999999", ["5"], 5, null])("ignores %j", (v) => expect(parsePriceBound(v)).toBeUndefined());
});

describe("normalizePriceRange", () => {
  it("keeps a valid range", () => expect(normalizePriceRange(100, 900)).toEqual({ min: 100, max: 900 }));
  it("swaps a reversed range instead of returning nothing", () => expect(normalizePriceRange(900, 100)).toEqual({ min: 100, max: 900 }));
  it("allows one open end", () => {
    expect(normalizePriceRange(100, undefined)).toEqual({ min: 100, max: undefined });
    expect(normalizePriceRange(undefined, 900)).toEqual({ min: undefined, max: 900 });
  });
});

// A filtered list must never be served from an unfiltered cache entry, so both
// cache keys (shared and in-process) have to carry the price range.
describe("product list cache keys carry the price range", () => {
  const src = readFileSync(new URL("../routes/products.ts", import.meta.url), "utf8");
  it("shared cache key includes min and max", () => {
    expect(src).toMatch(/const price = `\$\{params\.minPrice \?\? ""\}-\$\{params\.maxPrice \?\? ""\}`/);
    expect(src).toMatch(/:price\$\{price\}:/);
  });
  it("in-process cache key includes min and max", () => {
    const block = src.slice(src.indexOf("function localProductCacheKey"), src.indexOf("router.get(\"/products\""));
    expect(block).toContain("params.minPrice");
    expect(block).toContain("params.maxPrice");
  });
  it("the list handler passes the range to both keys and filters on the effective price", () => {
    expect(src.match(/minPrice: minPrice === undefined/g)?.length).toBe(2);
    expect(src).toContain("COALESCE(${productsTable.discountPrice}, ${productsTable.price})");
  });
});
