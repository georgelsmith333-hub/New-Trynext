/**
 * Pilot displacement-map generator — T-shirt front/back only.
 *
 * Builds a real per-pixel geometric displacement field (not just a
 * multiply/screen shading overlay) from the reviewed source photo's own
 * fold structure, so artwork placed on the surface can actually bend with
 * the garment instead of sitting on a flat plane.
 *
 * Technique: treat the blurred photo luminance as a height-field proxy
 * (this is the same "bump map" convention Photoshop's own Filter > Distort
 * > Displace uses), then take its local gradient as a two-channel
 * horizontal/vertical displacement map (R = dx, G = dy, 128 = zero offset).
 * This is a legitimate, standard image-based displacement technique — it is
 * not invented data; the fold pattern comes from the real photographed
 * garment, only reframed as an offset field instead of a shading overlay.
 *
 * Scope: front/back only (the two authentic-preserved T-shirt views). One
 * map per view, shared across every color of that view, since garment
 * geometry does not change with color — only fabric tint does.
 *
 * Usage:
 *   node tools/build-displacement-maps.mjs
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const REPO = path.resolve(import.meta.dirname, "..");
const DEFAULT_STAGING_ROOT = path.join(REPO, "dist-mockups", "staging", "smart-v10-v3");

const CANVAS = 1024;
const BLUR_SIGMA = 16; // smooths away fabric micro-texture/print noise, keeps fold structure
const GRADIENT_SAMPLE = 3; // px offset for the central-difference gradient
export const MAX_DISPLACEMENT_PX = 10; // clamp so artwork bends with folds without visibly buckling

const PILOT_VIEWS = [
  { view: "front", zone: { x: 240, y: 185, w: 520, h: 580 } },
  { view: "back", zone: { x: 240, y: 185, w: 520, h: 580 } },
];
const CALIBRATION_COLOR = "white"; // best fold visibility, least color interference
const NORMALIZATION_PERCENTILE = 0.97;

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function percentile(sortedAsc, p) {
  const index = Math.min(sortedAsc.length - 1, Math.max(0, Math.floor(sortedAsc.length * p)));
  return sortedAsc[index];
}

async function buildDisplacementMap(sourceRoot, view, zone) {
  const sourcePath = path.join(sourceRoot, "tshirt", CALIBRATION_COLOR, `${view}.png`);
  if (!existsSync(sourcePath)) throw new Error(`missing calibration source: ${sourcePath}`);

  // 1. Height-field proxy: blurred greyscale luminance of the real photo.
  const height = await sharp(sourcePath)
    .resize(CANVAS, CANVAS, { fit: "fill" })
    .greyscale()
    .blur(BLUR_SIGMA)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const h = height.data; // 1 channel, CANVAS*CANVAS

  const at = (x, y) => {
    const cx = Math.max(0, Math.min(CANVAS - 1, x));
    const cy = Math.max(0, Math.min(CANVAS - 1, y));
    return h[cy * CANVAS + cx];
  };

  // 2. Gradient of the height field -> horizontal/vertical displacement.
  const gradients = new Float32Array(CANVAS * CANVAS * 2);
  // The garment-silhouette-vs-background edge produces a gradient spike far
  // larger than any interior fold. Normalizing against the whole-canvas max
  // would crush the actually-interesting print-zone fold gradients to near
  // zero. Normalize against a high percentile measured inside the print
  // zone itself instead, then clip outliers there.
  const zoneMagnitudes = [];
  for (let y = 0; y < CANVAS; y++) {
    for (let x = 0; x < CANVAS; x++) {
      const gx = at(x + GRADIENT_SAMPLE, y) - at(x - GRADIENT_SAMPLE, y);
      const gy = at(x, y + GRADIENT_SAMPLE) - at(x, y - GRADIENT_SAMPLE);
      const i = (y * CANVAS + x) * 2;
      gradients[i] = gx;
      gradients[i + 1] = gy;
      if (x >= zone.x && x < zone.x + zone.w && y >= zone.y && y < zone.y + zone.h) {
        zoneMagnitudes.push(Math.abs(gx), Math.abs(gy));
      }
    }
  }
  zoneMagnitudes.sort((a, b) => a - b);
  const scale = Math.max(1, percentile(zoneMagnitudes, NORMALIZATION_PERCENTILE));

  const out = Buffer.alloc(CANVAS * CANVAS * 4);
  for (let y = 0; y < CANVAS; y++) {
    for (let x = 0; x < CANVAS; x++) {
      const gi = (y * CANVAS + x) * 2;
      const oi = (y * CANVAS + x) * 4;
      const nx = Math.max(-1, Math.min(1, gradients[gi] / scale));
      const ny = Math.max(-1, Math.min(1, gradients[gi + 1] / scale));
      out[oi] = Math.round(128 + nx * 127);     // R = horizontal offset
      out[oi + 1] = Math.round(128 + ny * 127); // G = vertical offset
      out[oi + 2] = 127; // B unused
      out[oi + 3] = 255;
    }
  }

  // A light final blur smooths pixel-level jaggedness in the offset field
  // into a gentler warp, without erasing the underlying fold structure.
  const png = await sharp(out, { raw: { width: CANVAS, height: CANVAS, channels: 4 } })
    .blur(2)
    .png()
    .toBuffer();
  return { png, sourcePath, scale };
}

/**
 * Generate (or regenerate) the shared pilot displacement maps under a given
 * staging root. Exported so build-smartobject-runtime-roles.mjs can call it
 * inline as part of one pipeline run — that script wipes and rebuilds its
 * entire runtime-roles output directory on every run, so anything shared
 * (like these per-view, cross-color maps) needs to be regenerated in the
 * same pass rather than depend on script run order.
 */
export async function generateDisplacementMaps(stagingRoot = DEFAULT_STAGING_ROOT) {
  const sourceRoot = path.join(stagingRoot, "sources");
  const outDir = path.join(stagingRoot, "runtime-roles", "tshirt", "_shared");
  mkdirSync(outDir, { recursive: true });
  const results = [];
  for (const { view, zone } of PILOT_VIEWS) {
    const { png, sourcePath, scale } = await buildDisplacementMap(sourceRoot, view, zone);
    const outPath = path.join(outDir, `${view}-displacement.png`);
    writeFileSync(outPath, png);
    results.push({
      view,
      path: path.relative(REPO, outPath),
      sha256: sha256(png),
      calibrationSource: path.relative(REPO, sourcePath),
      maxOffsetPx: MAX_DISPLACEMENT_PX,
      technique: "blurred-luminance-height-proxy-gradient",
      blurSigma: BLUR_SIGMA,
      gradientSamplePx: GRADIENT_SAMPLE,
      normalizationScale: scale,
    });
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const results = await generateDisplacementMaps();
  console.log(JSON.stringify(results, null, 2));
}
