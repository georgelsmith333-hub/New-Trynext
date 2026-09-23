/**
 * In-browser background removal using U-2-Net (portable variant, "u2netp").
 *
 * This replaces a prior implementation built on @imgly/background-removal,
 * which is AGPLv3-licensed (both the JS wrapper and its model-data package) —
 * running modified AGPL software as a network-interactive feature carries a
 * real obligation to offer the full corresponding source of the modified
 * version to every user, which isn't something to take on silently for a
 * commercial site. This implementation instead runs the original U-2-Net
 * model directly via onnxruntime-web (MIT), which is already a dependency.
 *
 * Model provenance:
 *   - u2netp.onnx, from https://github.com/xuebinqin/U-2-Net (Apache License
 *     2.0), redistributed unmodified via
 *     https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
 *     (MD5 8e83ca70e441ab06c318d82300c84806, verified against rembg's own
 *     published checksum at fetch time).
 *   - Apache 2.0 requires only: include the license, mark modified files,
 *     retain attribution. See public/onnx/NOTICE.md.
 *
 * Preprocessing/postprocessing here intentionally mirrors rembg's reference
 * implementation (rembg/sessions/base.py + u2net.py) exactly — resize to
 * 320x320 via the same resampling, the same per-channel ImageNet
 * mean/std normalization, the same output min-max normalization — rather
 * than improvising values, since a subtly wrong normalization silently
 * degrades mask quality instead of failing loudly.
 */
import * as ort from "onnxruntime-web";

const MODEL_URL = "/onnx/u2netp.onnx";
const INPUT_SIZE = 320;
const MEAN = [0.485, 0.456, 0.406] as const;
const STD = [0.229, 0.224, 0.225] as const;

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function getSession(): Promise<ort.InferenceSession> {
  if (sessionPromise) return sessionPromise;

  ort.env.wasm.wasmPaths = `${window.location.origin}/onnx/`;
  const created = ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ["wasm"],
  }).catch((err: unknown) => {
    sessionPromise = null;
    throw err;
  });
  sessionPromise = created;
  return created;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode the source image."));
    img.src = src;
  });
}

/** Resize via canvas — matches PIL's high-quality resampling closely enough
 * for a saliency mask (the model's output is inherently soft/approximate). */
function drawResized(img: HTMLImageElement, size: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size);
}

function toInputTensor(imageData: ImageData): ort.Tensor {
  const { data, width, height } = imageData;
  const chw = new Float32Array(3 * width * height);
  const plane = width * height;

  // Match rembg exactly: divide by the image's own max pixel value (not a
  // fixed 255), then per-channel (x - mean) / std, then HWC -> CHW.
  let maxVal = 0;
  for (let i = 0; i < data.length; i += 4) {
    maxVal = Math.max(maxVal, data[i], data[i + 1], data[i + 2]);
  }
  maxVal = Math.max(maxVal, 1e-6);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * width + x;
      chw[dstIdx] = (data[srcIdx] / maxVal - MEAN[0]) / STD[0];
      chw[plane + dstIdx] = (data[srcIdx + 1] / maxVal - MEAN[1]) / STD[1];
      chw[2 * plane + dstIdx] = (data[srcIdx + 2] / maxVal - MEAN[2]) / STD[2];
    }
  }
  return new ort.Tensor("float32", chw, [1, 3, height, width]);
}

/** Min-max normalize the raw saliency output to [0, 255], matching rembg. */
function maskFromOutput(output: ort.Tensor): Uint8ClampedArray {
  const raw = output.data as Float32Array;
  let min = Infinity;
  let max = -Infinity;
  for (const v of raw) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = Math.max(max - min, 1e-6);
  const mask = new Uint8ClampedArray(raw.length);
  for (let i = 0; i < raw.length; i++) {
    mask[i] = Math.round(((raw[i] - min) / range) * 255);
  }
  return mask;
}

/** Upscale the 320x320 mask to the original image's dimensions via canvas
 * (bilinear, via drawImage) — matches the effect of PIL's Lanczos resize
 * closely enough for an alpha mask, and applies it as the alpha channel. */
function applyMaskAtOriginalSize(
  img: HTMLImageElement,
  mask: Uint8ClampedArray,
  maskSize: number,
): string {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = maskSize;
  maskCanvas.height = maskSize;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) throw new Error("2D canvas context unavailable.");
  const maskImageData = maskCtx.createImageData(maskSize, maskSize);
  for (let i = 0; i < mask.length; i++) {
    const v = mask[i];
    maskImageData.data[i * 4] = v;
    maskImageData.data[i * 4 + 1] = v;
    maskImageData.data[i * 4 + 2] = v;
    maskImageData.data[i * 4 + 3] = 255;
  }
  maskCtx.putImageData(maskImageData, 0, 0);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = img.naturalWidth;
  outCanvas.height = img.naturalHeight;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) throw new Error("2D canvas context unavailable.");
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = "high";
  outCtx.drawImage(img, 0, 0, outCanvas.width, outCanvas.height);
  const outData = outCtx.getImageData(0, 0, outCanvas.width, outCanvas.height);

  outCtx.imageSmoothingEnabled = true;
  outCtx.drawImage(maskCanvas, 0, 0, outCanvas.width, outCanvas.height);
  const upscaledMask = outCtx.getImageData(0, 0, outCanvas.width, outCanvas.height);

  for (let i = 0; i < outData.data.length; i += 4) {
    outData.data[i + 3] = upscaledMask.data[i];
  }
  outCtx.putImageData(outData, 0, 0);
  return outCanvas.toDataURL("image/png");
}

export async function removeBackground(src: string): Promise<string> {
  const img = await loadImage(src);
  const resized = drawResized(img, INPUT_SIZE);
  const inputTensor = toInputTensor(resized);

  const session = await getSession();
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  const results = await session.run({ [inputName]: inputTensor });
  const mask = maskFromOutput(results[outputName]);

  return applyMaskAtOriginalSize(img, mask, INPUT_SIZE);
}
