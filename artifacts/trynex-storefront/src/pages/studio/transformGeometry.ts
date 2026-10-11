export interface ImageTransformLike {
  scale: number;
  scaleX?: number;
  scaleY?: number;
}

export interface RenderedImageSize {
  width: number;
  height: number;
  effectiveScaleX: number;
  effectiveScaleY: number;
}

function positive(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && Math.abs(value as number) > 0 ? Math.abs(value as number) : fallback;
}

/**
 * The Studio transform convention is:
 * rendered width = natural width × scale × scaleX
 * rendered height = natural height × scale × scaleY
 *
 * scaleX/scaleY are relative axes, not absolute scales. Keeping this rule in
 * one place prevents processed-image replacement from applying the base scale
 * twice or dropping it when an axis override exists.
 */
export function getRenderedImageSize(
  naturalW: number,
  naturalH: number,
  transform: ImageTransformLike,
): RenderedImageSize {
  const baseScale = positive(transform.scale, 1);
  const axisX = positive(transform.scaleX, 1);
  const axisY = positive(transform.scaleY, 1);
  const effectiveScaleX = baseScale * axisX;
  const effectiveScaleY = baseScale * axisY;
  return {
    width: Math.max(1, naturalW) * effectiveScaleX,
    height: Math.max(1, naturalH) * effectiveScaleY,
    effectiveScaleX,
    effectiveScaleY,
  };
}

/**
 * Preserve the rendered size and base scale while swapping in a bitmap with
 * different intrinsic dimensions. The returned axes remain relative to scale.
 */
export function preserveRenderedImageSize(
  previousNaturalW: number,
  previousNaturalH: number,
  nextNaturalW: number,
  nextNaturalH: number,
  transform: ImageTransformLike,
): { scaleX: number; scaleY: number } {
  const previous = getRenderedImageSize(previousNaturalW, previousNaturalH, transform);
  const baseScale = positive(transform.scale, 1);
  return {
    scaleX: previous.width / Math.max(1, nextNaturalW) / baseScale,
    scaleY: previous.height / Math.max(1, nextNaturalH) / baseScale,
  };
}

export interface PinchStart {
  distance: number;
  angle: number;
  scale: number;
  rotation: number;
}

export interface PinchPair {
  distance: number;
  angle: number;
}

/**
 * Two-finger pinch: change the base scale once and rotate by the change in
 * finger angle. scaleX/scaleY are relative axes (see getRenderedImageSize), so
 * they must be left alone; overwriting them with the new base scale applied the
 * scale twice and squared every pinch.
 */
export function applyPinchTransform<T extends ImageTransformLike & { rotation: number }>(
  transform: T,
  start: PinchStart,
  pair: PinchPair,
): T {
  const ratio = pair.distance / Math.max(1, start.distance);
  return {
    ...transform,
    scale: Math.max(0.05, Math.min(8, start.scale * ratio)),
    rotation: start.rotation + ((pair.angle - start.angle) * 180) / Math.PI,
  };
}
