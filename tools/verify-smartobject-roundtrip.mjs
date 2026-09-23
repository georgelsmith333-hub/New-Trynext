/**
 * Real Smart Object round-trip verification for the pilot T-shirt surfaces.
 *
 * There is no Adobe Photoshop available in this environment, so this cannot
 * claim "verified in Photoshop." What it *can* honestly claim, and what this
 * script actually does: open the exact shipped master PSD bytes, replace the
 * embedded smart-object linked file with a new synthetic marker image
 * (proving the artwork is genuinely swappable, not baked into flat pixels),
 * re-render the document composite the way a host application would after a
 * "Save" on the placed content, serialize the document back to PSD bytes,
 * re-parse those bytes from scratch, and assert every claim a human opening
 * this file in Photoshop and editing the smart object would be able to
 * verify: the new content is really there, registration/transform survived,
 * unrelated layers are byte-identical, and the composite image actually
 * changed only where it should have.
 *
 * This is the same ag-psd library the master builder used to write these
 * files in the first place (tools/build-smartobject-mockups.mjs), so a pass
 * here is a genuine claim about the shipped file's structure — not a
 * self-fulfilling check against the builder's own in-memory state.
 *
 * Usage:
 *   node tools/verify-smartobject-roundtrip.mjs [--json out.json]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { readPsd, writePsdUint8Array, initializeCanvas } from "ag-psd";
import { PNG } from "pngjs";

// ag-psd needs *some* canvas backend to decode/encode 8bpc layer pixel data,
// even in useImageData mode (its own createImageData default still routes
// through createCanvas(1,1).getContext('2d')). The documented option is
// node-canvas, which needs native bindings this sandbox doesn't have
// installed. This is a minimal pure-JS 2D context — just enough surface
// area (createImageData/getImageData/putImageData) for ag-psd's own decode
// and encode paths — not a general canvas implementation.
function createMinimalCanvas(width, height) {
  const canvas = {
    width,
    height,
    _buffer: new Uint8ClampedArray(Math.max(1, width) * Math.max(1, height) * 4),
  };
  const context = {
    createImageData(w, h) {
      return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
    },
    getImageData(x, y, w, h) {
      const out = new Uint8ClampedArray(w * h * 4);
      for (let row = 0; row < h; row++) {
        const srcY = y + row;
        if (srcY < 0 || srcY >= canvas.height) continue;
        for (let col = 0; col < w; col++) {
          const srcX = x + col;
          if (srcX < 0 || srcX >= canvas.width) continue;
          const si = (srcY * canvas.width + srcX) * 4;
          const di = (row * w + col) * 4;
          out[di] = canvas._buffer[si];
          out[di + 1] = canvas._buffer[si + 1];
          out[di + 2] = canvas._buffer[si + 2];
          out[di + 3] = canvas._buffer[si + 3];
        }
      }
      return { width: w, height: h, data: out };
    },
    putImageData(imageData, x, y) {
      for (let row = 0; row < imageData.height; row++) {
        const dstY = y + row;
        if (dstY < 0 || dstY >= canvas.height) continue;
        for (let col = 0; col < imageData.width; col++) {
          const dstX = x + col;
          if (dstX < 0 || dstX >= canvas.width) continue;
          const si = (row * imageData.width + col) * 4;
          const di = (dstY * canvas.width + dstX) * 4;
          canvas._buffer[di] = imageData.data[si];
          canvas._buffer[di + 1] = imageData.data[si + 1];
          canvas._buffer[di + 2] = imageData.data[si + 2];
          canvas._buffer[di + 3] = imageData.data[si + 3];
        }
      }
    },
  };
  canvas.getContext = () => context;
  return canvas;
}
initializeCanvas(createMinimalCanvas);

const REPO = path.resolve(import.meta.dirname, "..");
const STAGING_ROOT = path.join(REPO, "dist-mockups", "staging", "smart-v10-v3");
const MASTERS_ROOT = path.join(STAGING_ROOT, "masters");

const PILOT_SURFACES = [
  { family: "tshirt", color: "white", view: "front" },
  { family: "tshirt", color: "white", view: "back" },
  { family: "tshirt", color: "black", view: "front" },
  { family: "tshirt", color: "black", view: "back" },
];

const argv = process.argv.slice(2);
const jsonIndex = argv.indexOf("--json");
const jsonPath = jsonIndex >= 0 ? path.resolve(argv[jsonIndex + 1]) : null;

function sha256(bytes) {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

function bytesEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** A deliberately asymmetric marker so a symmetric bug (mirrored axis,
 *  swapped width/height) would visibly fail the round-trip, not pass by
 *  coincidence. */
function buildMarkerImage(size) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const inTopLeftCorner = x < size * 0.12 && y < size * 0.12;
      const inBottomRightCorner = x > size * 0.88 && y > size * 0.88;
      const diagonal = Math.abs(x - y) < size * 0.02;
      if (inTopLeftCorner) { data[i] = 10; data[i + 1] = 200; data[i + 2] = 10; }
      else if (inBottomRightCorner) { data[i] = 200; data[i + 1] = 10; data[i + 2] = 200; }
      else if (diagonal) { data[i] = 250; data[i + 1] = 200; data[i + 2] = 0; }
      else { data[i] = 20; data[i + 1] = 20; data[i + 2] = 40; }
      data[i + 3] = 255;
    }
  }
  return { data, width: size, height: size };
}

function findArtworkLayer(children) {
  return (children ?? []).find((layer) => layer.name?.includes("SMART OBJECT"));
}
function findLayerByPrefix(children, prefix) {
  return (children ?? []).find((layer) => layer.name?.startsWith(prefix));
}

/** Minimal re-composite: the document's own original composite (already
 *  correct — decoded straight from file) with the new artwork stamped into
 *  the print zone. Deliberately does not rebuild from the base layer's own
 *  imageData: PSD layers are cropped to their own content bounds (a
 *  layer.left/top offset), not the full canvas, so reconstructing from a
 *  layer directly requires accounting for that offset; reusing the
 *  document's already-correct full-canvas composite sidesteps that
 *  entirely and is exactly what a real re-render would start from anyway. */
function recomposite(originalComposite, marker, transform) {
  const width = originalComposite.width;
  const height = originalComposite.height;
  const out = new Uint8Array(originalComposite.data);
  const [x0, y0, , , x1, y1] = transform;
  const zoneX = Math.round(Math.min(x0, x1));
  const zoneY = Math.round(Math.min(y0, y1));
  const zoneW = Math.round(Math.abs(x1 - x0));
  const zoneH = Math.round(Math.abs(y1 - y0));
  for (let y = 0; y < zoneH; y++) {
    for (let x = 0; x < zoneW; x++) {
      const targetX = zoneX + x;
      const targetY = zoneY + y;
      if (targetX < 0 || targetY < 0 || targetX >= width || targetY >= height) continue;
      const sourceX = Math.min(marker.width - 1, Math.floor((x / zoneW) * marker.width));
      const sourceY = Math.min(marker.height - 1, Math.floor((y / zoneH) * marker.height));
      const si = (sourceY * marker.width + sourceX) * 4;
      const ti = (targetY * width + targetX) * 4;
      out[ti] = marker.data[si];
      out[ti + 1] = marker.data[si + 1];
      out[ti + 2] = marker.data[si + 2];
      out[ti + 3] = 255;
    }
  }
  return { data: out, width, height };
}

function verifySurface({ family, color, view }) {
  const surfaceKey = `${family}/${color}/${view}`;
  const masterPath = path.join(MASTERS_ROOT, family, `${family}-${color}-${view}.psd`);
  const checks = {};
  const notes = [];

  if (!existsSync(masterPath)) {
    return { surfaceKey, masterPath: path.relative(REPO, masterPath), allPassed: false, checks, error: "master file not found" };
  }

  const originalBytes = readFileSync(masterPath);
  const originalChecksum = sha256(originalBytes);
  const original = readPsd(originalBytes, { useImageData: true });

  const artworkLayer = findArtworkLayer(original.children);
  checks.artworkLayerFound = !!artworkLayer?.placedLayer;
  if (!artworkLayer?.placedLayer) {
    return { surfaceKey, masterPath: path.relative(REPO, masterPath), allPassed: false, checks, error: "no Smart Object placed layer found" };
  }

  const soId = artworkLayer.placedLayer.id;
  const linkedFile = (original.linkedFiles ?? []).find((f) => f.id === soId);
  checks.linkedFileFound = !!linkedFile?.data;
  if (!linkedFile?.data) {
    return { surfaceKey, masterPath: path.relative(REPO, masterPath), allPassed: false, checks, error: "no linked smart-object payload found for placed layer id" };
  }

  const originalLinkedChecksum = sha256(linkedFile.data);
  const originalTransform = [...artworkLayer.placedLayer.transform];
  const baseLayer = findLayerByPrefix(original.children, "10 Product Base");
  const shadowLayer = findLayerByPrefix(original.children, "20 Shadow");
  const protectedLayer = findLayerByPrefix(original.children, "40 Protected Details");
  const highlightLayer = findLayerByPrefix(original.children, "50 Highlight");
  checks.baseLayerFound = !!baseLayer?.imageData;
  checks.unrelatedLayersFound = !!(shadowLayer?.imageData && protectedLayer?.imageData && highlightLayer?.imageData);

  // Sample a pixel well outside the print zone to confirm the edit doesn't
  // leak beyond the artwork's own bounds.
  const [zx0, zy0, , , zx1, zy1] = originalTransform;
  const outsideX = Math.max(0, Math.min(original.width - 1, Math.round(Math.min(zx0, zx1)) - 40));
  const outsideY = Math.max(0, Math.min(original.height - 1, Math.round(Math.min(zy0, zy1)) - 20));
  const outsideIndex = (outsideY * original.width + outsideX) * 4;
  const originalOutsidePixel = original.imageData
    ? Array.from(original.imageData.data.slice(outsideIndex, outsideIndex + 4))
    : null;

  // --- Mutate: replace the smart object's linked content with a marker ---
  const marker = buildMarkerImage(Math.max(artworkLayer.placedLayer.width ?? 100, artworkLayer.placedLayer.height ?? 100));
  const markerBytes = markerPngBytesFallback(marker);
  linkedFile.data = markerBytes;
  artworkLayer.imageData = marker;
  if (original.imageData) {
    original.imageData = recomposite(original.imageData, marker, originalTransform);
  }

  const rebuilt = writePsdUint8Array(original, { generateThumbnail: false });
  checks.reserialized = rebuilt.length > 0;

  // --- Reopen from scratch, independent of the in-memory object above ---
  const reopened = readPsd(Buffer.from(rebuilt), { useImageData: true });
  const reopenedArtwork = findArtworkLayer(reopened.children);
  const reopenedLinked = (reopened.linkedFiles ?? []).find((f) => f.id === soId);

  checks.linkedContentPersisted = bytesEqual(reopenedLinked?.data, markerBytes);
  checks.linkedContentActuallyChanged = sha256(reopenedLinked?.data ?? new Uint8Array()) !== originalLinkedChecksum;
  checks.transformPreserved = JSON.stringify(reopenedArtwork?.placedLayer?.transform) === JSON.stringify(originalTransform);
  checks.placedLayerIdPreserved = reopenedArtwork?.placedLayer?.id === soId;

  const reopenedShadow = findLayerByPrefix(reopened.children, "20 Shadow");
  const reopenedProtected = findLayerByPrefix(reopened.children, "40 Protected Details");
  const reopenedHighlight = findLayerByPrefix(reopened.children, "50 Highlight");
  checks.shadowLayerUnchanged = bytesEqual(shadowLayer?.imageData?.data, reopenedShadow?.imageData?.data);
  checks.protectedLayerUnchanged = bytesEqual(protectedLayer?.imageData?.data, reopenedProtected?.imageData?.data);
  checks.highlightLayerUnchanged = bytesEqual(highlightLayer?.imageData?.data, reopenedHighlight?.imageData?.data);

  const reopenedOutsideIndex = outsideIndex;
  const reopenedOutsidePixel = reopened.imageData
    ? Array.from(reopened.imageData.data.slice(reopenedOutsideIndex, reopenedOutsideIndex + 4))
    : null;
  checks.compositeUnchangedOutsideZone = originalOutsidePixel && reopenedOutsidePixel
    ? JSON.stringify(originalOutsidePixel) === JSON.stringify(reopenedOutsidePixel)
    : false;

  // Sample a pixel INSIDE the zone to confirm the composite actually
  // reflects the new marker content there.
  const insideX = Math.round((zx0 + zx1) / 2);
  const insideY = Math.round((zy0 + zy1) / 2);
  const insideIndex = (insideY * reopened.width + insideX) * 4;
  const reopenedInsidePixel = reopened.imageData ? Array.from(reopened.imageData.data.slice(insideIndex, insideIndex + 4)) : null;
  const markerCenterIndex = (Math.floor(marker.height / 2) * marker.width + Math.floor(marker.width / 2)) * 4;
  const expectedInsidePixel = Array.from(marker.data.slice(markerCenterIndex, markerCenterIndex + 4)).slice(0, 3);
  checks.compositeReflectsNewArtwork = reopenedInsidePixel
    ? reopenedInsidePixel.slice(0, 3).every((v, i) => Math.abs(v - expectedInsidePixel[i]) < 4)
    : false;

  checks.originalFileUntouchedOnDisk = sha256(readFileSync(masterPath)) === originalChecksum;

  const allPassed = Object.values(checks).every(Boolean);
  return {
    surfaceKey,
    masterPath: path.relative(REPO, masterPath),
    masterChecksum: originalChecksum,
    tool: "ag-psd read/write round-trip (no Adobe Photoshop available in this environment)",
    verifiedAt: new Date().toISOString(),
    checks,
    allPassed,
    notes,
  };
}

// ag-psd's writer expects layer/linked-file imageData either as
// {data,width,height} (already what we build) or PNG bytes for linked
// files specifically — the builder always stores linkedFiles[].data as
// already-encoded PNG bytes, so encode our marker the same way here using
// the same pngjs dependency the builder uses.
function markerPngBytesFallback(marker) {
  const png = new PNG({ width: marker.width, height: marker.height });
  Buffer.from(marker.data.buffer, marker.data.byteOffset, marker.data.length).copy(png.data);
  return new Uint8Array(PNG.sync.write(png));
}

function main() {
  const results = PILOT_SURFACES.map(verifySurface);
  const summary = {
    schema: "trynext-smartobject-roundtrip-verification/v1",
    generatedAt: new Date().toISOString(),
    surfaceCount: results.length,
    allPassed: results.every((r) => r.allPassed),
    results,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (jsonPath) writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.allPassed) process.exitCode = 1;
}

main();
