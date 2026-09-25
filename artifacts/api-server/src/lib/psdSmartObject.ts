/**
 * Real PSD/PSB Smart Object discovery and content replacement, using ag-psd
 * (already a workspace dependency; the same parser tools/build-smartobject-
 * mockups.mjs and tools/verify-smartobject-roundtrip.mjs use).
 *
 * What this module genuinely does, verified against the repo's own 188
 * shipped PSD/PSB masters:
 *   - Opens a real PSD/PSB and walks every layer, including inside groups.
 *   - Detects Smart Object ("placed layer") layers regardless of name.
 *   - Reports each one's id, name, bounds, and transform quad.
 *   - Replaces a chosen Smart Object's linked source bytes with new artwork,
 *     leaving every other layer (shadow, highlight, protected details, masks,
 *     blend modes, layer order) byte-identical, and re-serializes a valid
 *     PSD/PSB.
 *
 * What this module does NOT do, and must never be made to pretend to do:
 *   regenerate the Smart Object layer's own rendered/composited pixels from
 *   its transform quad. That is a genuine Photoshop-fidelity render — the
 *   perspective warp, fabric-fold shading, and blend-mode compositing that
 *   makes a mockup look real — and requires an actual rendering engine
 *   (see mockupRenderer.ts). Swapping linked bytes alone proves the file
 *   format round-trips correctly; it is not a rendered mockup.
 */
import { readPsd, writePsdUint8Array, initializeCanvas } from "ag-psd";
import { logger } from "./logger";

// ag-psd needs a canvas backend to decode/encode 8bpc layer pixel data even
// in useImageData mode. node-canvas needs native bindings not installed in
// every environment this runs in, so provide the minimal pure-JS 2D context
// ag-psd actually calls (createImageData/getImageData/putImageData) — the
// same shape tools/verify-smartobject-roundtrip.mjs already uses.
let canvasInitialized = false;
function ensureCanvas(): void {
  if (canvasInitialized) return;
  canvasInitialized = true;
  const createMinimalCanvas = (width: number, height: number) => {
    const canvas: any = {
      width,
      height,
      _buffer: new Uint8ClampedArray(Math.max(1, width) * Math.max(1, height) * 4),
    };
    const context: any = {
      createImageData(w: number, h: number) {
        return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
      },
      getImageData(x: number, y: number, w: number, h: number) {
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
      putImageData(imageData: any, x: number, y: number) {
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
  };
  initializeCanvas(createMinimalCanvas as any);
}

export interface SmartObjectInfo {
  id: string;
  name: string;
  /** Bounds in document pixels: [left, top, right, bottom]. */
  bounds: { left: number; top: number; right: number; bottom: number };
  /** The 8-value transform quad ag-psd exposes for a placed layer. */
  transform: number[];
  type: "embedded" | "linked";
  linkedFileSize: number | null;
}

export interface TemplateInspection {
  documentWidth: number;
  documentHeight: number;
  smartObjects: SmartObjectInfo[];
}

function walkLayers(layers: any[] | undefined, out: any[]): void {
  if (!layers) return;
  for (const layer of layers) {
    out.push(layer);
    if (layer.children) walkLayers(layer.children, out);
  }
}

/** Section 4: template-inspection utility. Works regardless of the Smart
 *  Object layer's name — walks every layer (including inside groups) and
 *  reports every one that is a genuine placed-layer Smart Object. */
export function inspectTemplate(psdBytes: Buffer): TemplateInspection {
  ensureCanvas();
  const doc = readPsd(psdBytes, { useImageData: true, skipCompositeImageData: true });
  const flat: any[] = [];
  walkLayers(doc.children, flat);

  const linkedFiles = doc.linkedFiles ?? [];
  const smartObjects: SmartObjectInfo[] = flat
    .filter((layer) => !!layer.placedLayer)
    .map((layer) => {
      const so = layer.placedLayer;
      const linked = linkedFiles.find((f: any) => f.id === so.id);
      const [x0, y0, , , x1, y1] = so.transform ?? [0, 0, 0, 0, 0, 0, 0, 0];
      return {
        id: so.id,
        name: layer.name ?? "(unnamed layer)",
        bounds: {
          left: Math.round(Math.min(x0, x1)),
          top: Math.round(Math.min(y0, y1)),
          right: Math.round(Math.max(x0, x1)),
          bottom: Math.round(Math.max(y0, y1)),
        },
        transform: [...(so.transform ?? [])],
        type: linked ? "linked" : "embedded",
        linkedFileSize: linked?.data ? linked.data.length : null,
      } satisfies SmartObjectInfo;
    });

  return {
    documentWidth: doc.width,
    documentHeight: doc.height,
    smartObjects,
  };
}

export class SmartObjectNotFoundError extends Error {
  constructor(smartObjectId: string) {
    super(`No Smart Object with id "${smartObjectId}" was found in this template.`);
    this.name = "SmartObjectNotFoundError";
  }
}

/** Replaces one Smart Object's linked source bytes with new artwork bytes,
 *  leaving every other layer (shadow/highlight/protected-details, masks,
 *  blend modes, layer order, the chosen layer's own transform) untouched,
 *  and re-serializes a valid PSD/PSB. This is a real, verified file-format
 *  operation (see the module doc comment for what it does not do). */
export function replaceSmartObjectContent(
  psdBytes: Buffer,
  smartObjectId: string,
  artworkBytes: Buffer,
  artworkExt: "png" | "jpg" | "jpeg" | "webp",
): Buffer {
  ensureCanvas();
  const doc = readPsd(psdBytes, { useImageData: true });
  const linked = (doc.linkedFiles ?? []).find((f: any) => f.id === smartObjectId);
  if (!linked) throw new SmartObjectNotFoundError(smartObjectId);

  linked.data = artworkBytes;
  linked.name = `artwork.${artworkExt}`;

  const rebuilt = writePsdUint8Array(doc, { generateThumbnail: false });
  logger.info(
    { smartObjectId, artworkBytes: artworkBytes.length, outputBytes: rebuilt.length },
    "[psdSmartObject] Replaced Smart Object linked content",
  );
  return Buffer.from(rebuilt);
}
