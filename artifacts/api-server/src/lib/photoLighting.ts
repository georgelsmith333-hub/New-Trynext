import sharp from "sharp";

// Must stay identical to the browser compositor's applyPhotoLighting
// (artifacts/trynex-storefront/src/pages/design-studio/composer.ts) so an
// exported mockup matches what the customer saw in the studio.
const LIGHTING_GAIN = 1.4;
const GRAIN_GAIN = 0.5;
const SHADE_MIN = 0.55;
const SHADE_MAX = 1.18;
const MIN_REFERENCE_LUMINANCE = 28;

export type PixelZone = { x0: number; y0: number; x1: number; y1: number };

function boxBlur(src: Float32Array, w: number, h: number, radius: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const span = radius * 2 + 1;
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let k = -radius; k <= radius; k++) acc += src[y * w + Math.min(w - 1, Math.max(0, k))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / span;
      acc += src[y * w + Math.min(w - 1, x + radius + 1)] - src[y * w + Math.max(0, x - radius)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let k = -radius; k <= radius; k++) acc += tmp[Math.min(h - 1, Math.max(0, k)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / span;
      acc += tmp[Math.min(h - 1, y + radius + 1) * w + x] - tmp[Math.max(0, y - radius) * w + x];
    }
  }
  return out;
}

/** Per-pixel shade factor from the product photo's own light (1 = typical
 *  garment brightness in the print zone, <1 folds/shadows, >1 highlights). */
export function computeShadeField(baseRgba: Uint8Array | Buffer, w: number, h: number, zone: PixelZone): Float32Array {
  const lum = new Float32Array(w * h);
  for (let i = 0; i < lum.length; i++) {
    lum[i] = 0.2126 * baseRgba[i * 4] + 0.7152 * baseRgba[i * 4 + 1] + 0.0722 * baseRgba[i * 4 + 2];
  }
  const radius = Math.max(2, Math.round(Math.max(w, h) / 300));
  const blurred = boxBlur(boxBlur(lum, w, h, radius), w, h, radius);

  const hist = new Uint32Array(256);
  let count = 0;
  for (let y = zone.y0; y < zone.y1; y++) {
    for (let x = zone.x0; x < zone.x1; x++) {
      hist[Math.min(255, Math.max(0, Math.round(blurred[y * w + x])))]++;
      count++;
    }
  }
  let reference = 128;
  for (let v = 0, seen = 0; v < 256; v++) {
    seen += hist[v];
    if (seen >= count / 2) { reference = v; break; }
  }
  const denom = Math.max(reference, MIN_REFERENCE_LUMINANCE);
  const shade = new Float32Array(w * h).fill(1);
  for (let y = zone.y0; y < zone.y1; y++) {
    for (let x = zone.x0; x < zone.x1; x++) {
      const i = y * w + x;
      const fold = (blurred[i] - reference) / denom;
      const grain = (lum[i] - blurred[i]) / denom;
      shade[i] = Math.min(SHADE_MAX, Math.max(SHADE_MIN, 1 + LIGHTING_GAIN * fold + GRAIN_GAIN * grain));
    }
  }
  return shade;
}

/** Relight a canvas-sized RGBA artwork buffer in place; only pixels with
 *  alpha > 0 inside the zone change, so the bare garment is never darkened. */
export function relightArtwork(artworkRgba: Uint8Array | Buffer, w: number, zone: PixelZone, shade: Float32Array): void {
  for (let y = zone.y0; y < zone.y1; y++) {
    for (let x = zone.x0; x < zone.x1; x++) {
      const p = y * w + x;
      const i = p * 4;
      if (artworkRgba[i + 3] === 0) continue;
      const s = shade[p];
      for (let c = 0; c < 3; c++) {
        const v = artworkRgba[i + c];
        artworkRgba[i + c] = s < 1 ? Math.round(v * s) : Math.round(v + (255 - v) * (s - 1));
      }
    }
  }
}

export async function applyServerPhotoLighting(
  artworkFullPng: Buffer,
  basePng: Buffer,
  canvasW: number,
  canvasH: number,
  zone: PixelZone,
): Promise<Buffer> {
  const clamped: PixelZone = {
    x0: Math.max(0, zone.x0), y0: Math.max(0, zone.y0),
    x1: Math.min(canvasW, zone.x1), y1: Math.min(canvasH, zone.y1),
  };
  const [art, base] = await Promise.all([
    sharp(artworkFullPng).ensureAlpha().raw().toBuffer(),
    sharp(basePng).resize(canvasW, canvasH, { fit: "fill" }).ensureAlpha().raw().toBuffer(),
  ]);
  if (clamped.x1 > clamped.x0 && clamped.y1 > clamped.y0) {
    relightArtwork(art, canvasW, clamped, computeShadeField(base, canvasW, canvasH, clamped));
  }
  return sharp(art, { raw: { width: canvasW, height: canvasH, channels: 4 } }).png().toBuffer();
}
