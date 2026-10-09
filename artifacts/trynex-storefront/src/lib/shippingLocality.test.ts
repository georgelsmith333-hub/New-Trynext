import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveShippingCity } from "./shippingLocality";

describe("resolveShippingCity", () => {
  it("uses the local area when one was picked", () => expect(resolveShippingCity("Adabor", "Dhaka")).toBe("Adabor"));
  it("trims whitespace", () => expect(resolveShippingCity("  Gulshan ", " Dhaka ")).toBe("Gulshan"));
  it.each([[undefined], [null], [""], ["   "], [42]])("falls back to the division when the area is %j", (area) => {
    expect(resolveShippingCity(area, "Chattogram")).toBe("Chattogram");
  });
  it("returns an empty string when neither is known", () => expect(resolveShippingCity(undefined, undefined)).toBe(""));
});

describe("web checkout sends the area as shippingCity", () => {
  const src = readFileSync(new URL("../pages/Checkout.tsx", import.meta.url), "utf8");
  it("imports the helper and applies it after the form values are spread into the order payload", () => {
    expect(src).toContain('from "@/lib/shippingLocality"');
    const spread = src.indexOf("...rest,");
    const apply = src.indexOf("shippingCity: resolveShippingCity(shippingUpazila, rest.shippingCity)");
    expect(spread).toBeGreaterThan(-1);
    expect(apply).toBeGreaterThan(spread);
  });
});
