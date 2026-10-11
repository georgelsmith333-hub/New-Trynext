export interface PinchPair {
  distance: number;
  /** Radians, from atan2 of the second touch relative to the first. */
  angle: number;
}

/**
 * Two-finger pinch on the selected artwork. Studio rendered size is
 * natural x scale x scaleX, so a pinch changes only the base `scale` (scaleX and
 * scaleY keep any axis stretch) and rotation follows the finger-angle change.
 */
export function pinchScaleRotation(
  start: { scale: number; rotation: number },
  startPair: PinchPair,
  pair: PinchPair,
): { scale: number; rotation: number } {
  const ratio = pair.distance / Math.max(1, startPair.distance);
  return {
    scale: Math.max(0.05, Math.min(8, start.scale * ratio)),
    rotation: start.rotation + ((pair.angle - startPair.angle) * 180) / Math.PI,
  };
}
