import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SELECTION_PRESERVING_SELECTOR, shouldDismissSelectionOnOutsidePointer } from "./selectionDismissal";

/** Minimal stand-in for a DOM element: `closest` matches when the element is
 * tagged with any selector fragment the production selector lists. */
function element(...matches: string[]) {
  return {
    closest: (selector: string) => (matches.some((m) => selector.split(",").includes(m)) ? {} : null),
  };
}

describe("shouldDismissSelectionOnOutsidePointer", () => {
  it("never dismisses for a tap inside the canvas", () => {
    expect(shouldDismissSelectionOnOutsidePointer(element(), true)).toBe(false);
  });

  it("keeps the selection for taps inside the Studio tools panel", () => {
    expect(shouldDismissSelectionOnOutsidePointer(element("[data-studio-tools]"), false)).toBe(false);
  });

  it("keeps the selection for taps on buttons, inputs and dialogs outside the canvas", () => {
    for (const match of ["button", "input", "textarea", "select", "[role='dialog']", "[role='slider']", "[role='tab']"]) {
      expect(shouldDismissSelectionOnOutsidePointer(element(match), false), match).toBe(false);
    }
  });

  it("dismisses for a tap on inert page background", () => {
    expect(shouldDismissSelectionOnOutsidePointer(element(), false)).toBe(true);
  });

  it("does not dismiss when the target is not an element", () => {
    expect(shouldDismissSelectionOnOutsidePointer(null, false)).toBe(false);
    expect(shouldDismissSelectionOnOutsidePointer({}, false)).toBe(false);
  });

  it("lists every fragment the tests rely on", () => {
    const fragments = SELECTION_PRESERVING_SELECTOR.split(",");
    for (const fragment of ["[data-studio-tools]", "button", "input", "[role='dialog']", "[role='slider']"]) {
      expect(fragments).toContain(fragment);
    }
  });
});

describe("Studio wiring", () => {
  it("canvas outside-tap handler goes through the shared decision helper", () => {
    const canvas = readFileSync(new URL("./CanvasArea.tsx", import.meta.url), "utf8");
    expect(canvas).toContain("shouldDismissSelectionOnOutsidePointer");
  });

  it("marks the tools sheet/sidebar so its taps keep the selected artwork", () => {
    const studio = readFileSync(new URL("./DesignStudioV2.tsx", import.meta.url), "utf8");
    expect(studio).toContain("data-studio-tools");
  });
});
