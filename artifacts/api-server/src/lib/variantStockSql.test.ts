import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// A real Postgres is needed to see this bug (an untyped parameter after `->` is
// read as a text key, which finds nothing in a JSON array), so guard the source:
// every JSONB array position used for variant stock must be cast to int.
describe("variant stock SQL keeps the array position typed", () => {
  it.each(["../routes/orders.ts", "./orderStock.ts"])("%s casts the position with ::int", (file) => {
    const src = readFileSync(new URL(file, import.meta.url), "utf8");
    expect(src).toMatch(/::int/);
    // No bare `->${index}` (untyped parameter) anywhere.
    expect(src).not.toMatch(/->\$\{index\}/);
  });
});
