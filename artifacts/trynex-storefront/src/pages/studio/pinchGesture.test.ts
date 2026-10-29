import { describe, expect, it } from "vitest";
import { pinchScaleRotation } from "./pinchGesture";
import { getRenderedImageSize } from "./transformGeometry";

// M5b (2026-10-12): the Stage pinch wrote scale AND scaleX/scaleY to the same
// value. The Studio convention is rendered size = natural x scale x scaleX, so a
// pinch grew the artwork (and its selection frame) by the square of the finger
// ratio, and flattened any axis stretch the user had made.
describe("pinch scale and rotation", () => {
  const start = { distance: 100, angle: 0 };

  it("scales the rendered size by exactly the finger-distance ratio", () => {
    const transform = { scale: 2.5, scaleX: 1, scaleY: 1 };
    const next = pinchScaleRotation({ scale: 2.5, rotation: 0 }, start, { distance: 150, angle: 0 });
    const before = getRenderedImageSize(64, 64, transform);
    const after = getRenderedImageSize(64, 64, { ...transform, scale: next.scale });
    expect(after.width / before.width).toBeCloseTo(1.5, 6);
    expect(after.height / before.height).toBeCloseTo(1.5, 6);
  });

  it("leaves an existing axis stretch untouched because it only returns scale", () => {
    const next = pinchScaleRotation({ scale: 1, rotation: 0 }, start, { distance: 200, angle: 0 });
    expect(Object.keys(next).sort()).toEqual(["rotation", "scale"]);
  });

  it("adds the finger-angle change to the starting rotation, in degrees", () => {
    const next = pinchScaleRotation({ scale: 1, rotation: 10 }, start, { distance: 100, angle: Math.PI / 4 });
    expect(next.rotation).toBeCloseTo(55, 6);
  });

  it("keeps the scale inside 0.05 to 8", () => {
    expect(pinchScaleRotation({ scale: 2, rotation: 0 }, start, { distance: 1000, angle: 0 }).scale).toBe(8);
    expect(pinchScaleRotation({ scale: 2, rotation: 0 }, start, { distance: 1, angle: 0 }).scale).toBe(0.05);
  });

  it("does not divide by a zero starting distance", () => {
    const next = pinchScaleRotation({ scale: 2, rotation: 0 }, { distance: 0, angle: 0 }, { distance: 50, angle: 0 });
    expect(Number.isFinite(next.scale)).toBe(true);
  });
});

describe("a pinch that keeps moving (M5b second-move regression)", () => {
  it("computes every move from the touchstart values, so later moves differ and the last one wins", () => {
    const begin = { scale: 2.5, rotation: 0 };
    const startPair = { distance: 8, angle: 0 };
    const moves = [
      { distance: 10, angle: 0 },
      { distance: 12, angle: 0.1 },
      { distance: 14, angle: 0.2 },
    ].map((pair) => pinchScaleRotation(begin, startPair, pair));

    expect(new Set(moves.map((m) => m.scale)).size).toBe(3);
    expect(new Set(moves.map((m) => m.rotation)).size).toBe(3);
    expect(moves[2].scale).toBeCloseTo(2.5 * (14 / 8), 6);
    expect(moves[2].rotation).toBeCloseTo((0.2 * 180) / Math.PI, 6);
  });
});
