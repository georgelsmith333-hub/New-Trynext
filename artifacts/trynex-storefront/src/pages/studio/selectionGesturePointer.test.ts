import { describe, expect, it } from "vitest";
import { canStartSelectionGesture, isSelectionGesturePointer } from "./selectionGesturePointer";

// M5b (2026-10-12): in a 390x844 touch emulator a two-finger pinch over a small
// artwork landed on two resize handles. The second pointerdown replaced the
// first gesture and every pointer's moves resized the artwork, so one pinch left
// scaleX at its 0.15 floor while scaleY stayed 1. One gesture must follow one
// pointer; a second finger must not start or steer it.
describe("selection gesture pointer ownership", () => {
  it("lets the first pointer start a gesture", () => {
    expect(canStartSelectionGesture(null)).toBe(true);
  });

  it("refuses a second pointer while a gesture is active", () => {
    expect(canStartSelectionGesture({ pointerId: 1 })).toBe(false);
  });

  it("only follows moves and releases from the pointer that started it", () => {
    expect(isSelectionGesturePointer({ pointerId: 1 }, 1)).toBe(true);
    expect(isSelectionGesturePointer({ pointerId: 1 }, 2)).toBe(false);
  });

  it("ignores every pointer when no gesture is active", () => {
    expect(isSelectionGesturePointer(null, 1)).toBe(false);
  });
});

describe("two fingers on two separate handles (M5b preview retest)", () => {
  it("lets only the first pointer steer the gesture from start to release", () => {
    let active: { pointerId: number } | null = null;
    const down = (id: number) => {
      if (canStartSelectionGesture(active)) active = { pointerId: id };
    };
    const up = (id: number) => {
      if (isSelectionGesturePointer(active, id)) active = null;
    };

    down(1); // west handle
    down(2); // east handle: refused
    expect(active).toEqual({ pointerId: 1 });
    expect(isSelectionGesturePointer(active, 2)).toBe(false); // its moves are ignored
    expect(isSelectionGesturePointer(active, 1)).toBe(true);
    up(2); // releasing the second finger does not end the first gesture
    expect(active).toEqual({ pointerId: 1 });
    up(1);
    expect(active).toBeNull();
  });
});
