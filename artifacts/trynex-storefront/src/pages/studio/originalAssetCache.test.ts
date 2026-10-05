import { describe, it, expect } from "vitest";
import { OriginalAssetCache } from "./originalAssetCache";

const asset = { objectPath: "/objects/a", filename: "a.png", mime: "image/png", bytes: 10 };

describe("OriginalAssetCache", () => {
  it("returns a stored upload for the same image data", () => {
    const cache = new OriginalAssetCache();
    cache.set("data:image/png;base64,AAA", asset);
    expect(cache.get("data:image/png;base64,AAA")).toEqual(asset);
  });

  it("does not reuse an upload for different image data", () => {
    const cache = new OriginalAssetCache();
    cache.set("data:image/png;base64,AAA", asset);
    expect(cache.get("data:image/png;base64,BBB")).toBeUndefined();
  });

  it("forgets everything on clear", () => {
    const cache = new OriginalAssetCache();
    cache.set("x", asset);
    cache.clear();
    expect(cache.get("x")).toBeUndefined();
  });
});
