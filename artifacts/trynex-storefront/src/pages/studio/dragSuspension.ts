export interface DraggableLike {
  draggable(): boolean;
  draggable(value: boolean): unknown;
}

/**
 * Konva stops delivering Stage touchmove once a drag starts, and the first finger of a
 * pinch has usually armed a drag on the artwork under it. Switch dragging off for the
 * pinch and hand back exactly the nodes that were switched off.
 */
export function suspendDragging<T extends DraggableLike>(nodes: T[]): T[] {
  const suspended = nodes.filter((node) => node.draggable());
  suspended.forEach((node) => node.draggable(false));
  return suspended;
}

export function resumeDragging<T extends DraggableLike>(suspended: T[]): void {
  suspended.forEach((node) => node.draggable(true));
}
