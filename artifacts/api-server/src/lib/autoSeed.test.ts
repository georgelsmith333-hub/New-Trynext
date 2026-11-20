import { describe, expect, it } from "vitest";
import { shouldRunAutoSeed } from "./autoSeed";

describe("automatic demo seeding policy", () => {
  it("does not run demo seeding in production", () => {
    expect(shouldRunAutoSeed("production")).toBe(false);
  });

  it("retains the existing seed behavior outside production", () => {
    expect(shouldRunAutoSeed("development")).toBe(true);
    expect(shouldRunAutoSeed("test")).toBe(true);
    expect(shouldRunAutoSeed(undefined)).toBe(true);
  });
});
