/**
 * A resize/rotate handle gesture belongs to the pointer that started it.
 * Without this, a second finger on another handle replaced the gesture and any
 * pointer's moves resized the artwork (M5b: scaleX collapsed to its 0.15 floor).
 */
export interface GesturePointerOwner {
  pointerId: number;
}

export function canStartSelectionGesture(active: GesturePointerOwner | null): boolean {
  return active === null;
}

export function isSelectionGesturePointer(active: GesturePointerOwner | null, pointerId: number): boolean {
  return active !== null && active.pointerId === pointerId;
}
