import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The API rejects any cookie-carrying POST/PUT/PATCH/DELETE that lacks
// `X-Requested-With: XMLHttpRequest` (403 csrf_blocked). A customer who is
// signed in therefore could not add a Studio design to the cart when one
// request in the chain forgot the header. Guard every mutating Studio request.
const files = [
  "./DesignStudioV2.tsx",
  "./AIPanel.tsx",
  "../design-studio/server-mockup-render.ts",
];

describe("Studio mutating requests carry the CSRF header", () => {
  for (const file of files) {
    it(`${file}: every POST/PUT/PATCH/DELETE fetch sends X-Requested-With`, () => {
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      const calls = [...source.matchAll(/fetch\(/g)].map((m) => source.slice(m.index!, m.index! + 420));
      const mutating = calls.filter((c) => /method:\s*["'](POST|PUT|PATCH|DELETE)["']/.test(c));
      for (const call of mutating) {
        expect(call, call.slice(0, 120)).toContain("X-Requested-With");
      }
    });
  }

  it("the add-to-cart chain actually contains mutating requests (guards against a vacuous pass)", () => {
    const render = readFileSync(new URL("../design-studio/server-mockup-render.ts", import.meta.url), "utf8");
    expect(render).toMatch(/\/api\/mockup\/render/);
    expect(render).toMatch(/method:\s*"POST"/);
  });
});
