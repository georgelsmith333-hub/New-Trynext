import { describe, expect, it } from "vitest";
import { WATERBOTTLE_BACK_PZ, WATERBOTTLE_PZ } from "../design-studio/mockups";
import { applyPinchTransform, getRenderedImageSize, preserveRenderedImageSize } from "./transformGeometry";

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

describe("two-finger pinch transform", () => {
  const start = { distance: 100, angle: 0, scale: 0.5, rotation: 10 };

  it("scales the base scale once and leaves the relative axes alone", () => {
    const transform = { scale: 0.5, scaleX: 1, scaleY: 1, rotation: 10, x: 5, y: 6 };
    const next = applyPinchTransform(transform, start, { distance: 50, angle: 0 });
    expect(next.scale).toBeCloseTo(0.25, 6);
    expect(next.scaleX).toBe(1);
    expect(next.scaleY).toBe(1);
    // A 50% pinch must give a 50% rendered size, not 25% (scale applied twice).
    const before = getRenderedImageSize(64, 64, transform);
    const after = getRenderedImageSize(64, 64, next);
    expect(after.width).toBeCloseTo(before.width * 0.5, 6);
    expect(after.height).toBeCloseTo(before.height * 0.5, 6);
  });

  it("keeps a non-uniform aspect ratio while pinching", () => {
    const transform = { scale: 0.5, scaleX: 0.8, scaleY: 1.2, rotation: 0 };
    const next = applyPinchTransform(transform, start, { distance: 200, angle: 0 });
    const size = getRenderedImageSize(100, 100, next);
    expect(size.width / size.height).toBeCloseTo((0.8 / 1.2), 6);
    expect(next.scale).toBeCloseTo(1, 6);
  });

  it("rotates by the change in finger angle and keeps other fields", () => {
    const transform = { scale: 0.5, scaleX: 1, scaleY: 1, rotation: 10, x: 5, y: 6 };
    const next = applyPinchTransform(transform, start, { distance: 100, angle: Math.PI / 6 });
    expect(next.rotation).toBeCloseTo(40, 6);
    expect(next).toMatchObject({ x: 5, y: 6 });
  });

  it("clamps the scale to the Studio limits", () => {
    const transform = { scale: 0.5, scaleX: 1, scaleY: 1, rotation: 0 };
    expect(applyPinchTransform(transform, start, { distance: 1, angle: 0 }).scale).toBe(0.05);
    expect(applyPinchTransform(transform, start, { distance: 10000, angle: 0 }).scale).toBe(8);
  });
});
