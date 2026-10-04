import { describe, expect, it } from "vitest";
import { WATERBOTTLE_BACK_PZ, WATERBOTTLE_PZ } from "../design-studio/mockups";
import { getRenderedImageSize, preserveRenderedImageSize } from "./transformGeometry";

describe("water-bottle print zones", () => {
  it("uses the measured centered front proposal", () => {
    expect(WATERBOTTLE_PZ).toMatchObject({ x: 382, y: 313, w: 233, h: 576, shape: "bottle-body" });
    expect(WATERBOTTLE_PZ.x + WATERBOTTLE_PZ.w / 2).toBeCloseTo(498.5, 5);
  });

  it("uses a narrower, independently centered back proposal", () => {
    expect(WATERBOTTLE_BACK_PZ).toMatchObject({ x: 391, y: 313, w: 218, h: 576, shape: "bottle-body" });
    expect(WATERBOTTLE_BACK_PZ.w).toBeLessThan(WATERBOTTLE_PZ.w);
    expect(WATERBOTTLE_BACK_PZ.x + WATERBOTTLE_BACK_PZ.w / 2).toBeCloseTo(500, 5);
  });
});

describe("image transform invariants", () => {
  it("applies base scale and relative axes exactly once", () => {
    expect(getRenderedImageSize(1000, 500, { scale: 0.5, scaleX: 0.8, scaleY: 1.2 })).toMatchObject({
      width: 400,
      height: 300,
      effectiveScaleX: 0.4,
      effectiveScaleY: 0.6,
    });
  });

  it("preserves rendered dimensions when the processed bitmap has the same intrinsic size", () => {
    const transform = { scale: 0.42, scaleX: 0.9, scaleY: 1.1 };
    const before = getRenderedImageSize(1600, 900, transform);
    const axes = preserveRenderedImageSize(1600, 900, 1600, 900, transform);
    const after = getRenderedImageSize(1600, 900, { ...transform, scaleX: axes.scaleX, scaleY: axes.scaleY });
    expect(after.width).toBeCloseTo(before.width, 8);
    expect(after.height).toBeCloseTo(before.height, 8);
  });

  it("preserves rendered dimensions when processing changes intrinsic dimensions", () => {
    const transform = { scale: 0.5, scaleX: 0.75, scaleY: 1.25 };
    const before = getRenderedImageSize(1200, 800, transform);
    const axes = preserveRenderedImageSize(1200, 800, 2400, 1600, transform);
    const after = getRenderedImageSize(2400, 1600, { ...transform, scaleX: axes.scaleX, scaleY: axes.scaleY });
    expect(after.width).toBeCloseTo(before.width, 8);
    expect(after.height).toBeCloseTo(before.height, 8);
  });
});
