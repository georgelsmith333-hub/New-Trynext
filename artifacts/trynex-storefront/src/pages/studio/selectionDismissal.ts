/**
 * Decides whether a pointer-down outside the canvas should clear the selected
 * artwork. The Studio tools (Edit, Crop, Remove background, text and colour
 * controls) live outside the canvas and act on the *selected* layer, so a tap
 * on them must keep the selection; only a tap on inert page background clears it.
 */
export const SELECTION_PRESERVING_SELECTOR = [
  "[data-studio-tools]",
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "[contenteditable='true']",
  "[role='dialog']",
  "[role='alertdialog']",
  "[role='slider']",
  "[role='menu']",
  "[role='listbox']",
  "[role='tab']",
].join(",");

type ClosestCapable = { closest?: (selector: string) => unknown };

export function shouldDismissSelectionOnOutsidePointer(target: unknown, insideCanvas: boolean): boolean {
  if (insideCanvas) return false;
  const element = target as ClosestCapable | null;
  if (!element || typeof element.closest !== "function") return false;
  return !element.closest(SELECTION_PRESERVING_SELECTOR);
}
