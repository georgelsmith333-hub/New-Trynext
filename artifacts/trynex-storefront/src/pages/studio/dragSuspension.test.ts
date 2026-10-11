import { describe, expect, it } from "vitest";
import { resumeDragging, suspendDragging } from "./dragSuspension";

function fakeNode(initial: boolean) {
  let value = initial;
  return {
    draggable(next?: boolean) {
      if (next === undefined) return value;
      value = next;
      return this;
    },
  } as { draggable(): boolean; draggable(value: boolean): unknown };
}

describe("drag suspension during a pinch", () => {
  it("switches off only draggable nodes and restores exactly those", () => {
    const a = fakeNode(true);
    const locked = fakeNode(false);
    const b = fakeNode(true);

    const suspended = suspendDragging([a, locked, b]);
    expect(suspended).toEqual([a, b]);
    expect([a.draggable(), locked.draggable(), b.draggable()]).toEqual([false, false, false]);

    resumeDragging(suspended);
    expect([a.draggable(), locked.draggable(), b.draggable()]).toEqual([true, false, true]);
  });

  it("is a no-op for an empty list", () => {
    expect(suspendDragging([])).toEqual([]);
    expect(() => resumeDragging([])).not.toThrow();
  });
});
