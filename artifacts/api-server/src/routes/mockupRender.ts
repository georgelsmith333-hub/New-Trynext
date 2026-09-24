import { Router, type Request, type Response } from "express";
import { createHash } from "node:crypto";
import sharp, { type OverlayOptions } from "sharp";
import {
  OPTIONAL_RUNTIME_ROLES,
  REQUIRED_RUNTIME_ROLES,
  validateRenderSurfaceManifest,
  type OptionalRuntimeRole,
  type RuntimeRole,
  type SmartMockupIngestionManifest,
} from "../lib/mockupContract";
import { applyServerPhotoLighting } from "../lib/photoLighting";

/** Matches the browser compositor's own bound (composer.ts
 *  DISPLACEMENT_MAX_OFFSET_PX_AT_1024) so server and browser renders agree. */
const DISPLACEMENT_MAX_OFFSET_PX_AT_1024 = 4;

const router = Router();
const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const MAX_OUTPUT_PIXELS = 4096 * 4096;

function decodeImage(value: unknown): Buffer {
  if (typeof value !== "string" || !value.startsWith("data:image/")) {
    throw new Error("image_must_be_data_url");
  }
  const comma = value.indexOf(",");
  if (comma < 0) throw new Error("invalid_data_url");
  const buffer = Buffer.from(value.slice(comma + 1), "base64");
  if (!buffer.length || buffer.length > MAX_INPUT_BYTES) throw new Error("image_too_large");
  return buffer;
}

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function numberInRange(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function ensureRoleImages(
  value: unknown,
  surface: SmartMockupIngestionManifest,
): Record<RuntimeRole, Buffer> & Partial<Record<OptionalRuntimeRole, Buffer>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("runtime_role_images_required");
  }
  const input = value as Record<string, unknown>;
  const result = {} as Record<RuntimeRole, Buffer> & Partial<Record<OptionalRuntimeRole, Buffer>>;
  for (const role of REQUIRED_RUNTIME_ROLES) {
    const buffer = decodeImage(input[role]);
    if (sha256(buffer) !== surface.runtimeRoles[role].sha256.toLowerCase()) {
      throw new Error(`runtime_role_checksum_mismatch:${role}`);
    }
    result[role] = buffer;
  }
  for (const role of OPTIONAL_RUNTIME_ROLES) {
    const expected = surface.runtimeRoles[role];
    if (!expected) continue;
    const buffer = decodeImage(input[role]);
    if (sha256(buffer) !== expected.sha256.toLowerCase()) {
      throw new Error(`runtime_role_checksum_mismatch:${role}`);
    }
    result[role] = buffer;
  }
  return result;
}

/**
 * Real per-pixel geometric displacement (the Photoshop "Displace" filter
 * mechanic), applied server-side against a raw RGBA buffer so it matches the
 * browser compositor's applyDisplacementMap pixel-for-pixel. `artworkFull` is
 * the masked artwork already placed at its final position on a
 * canvas-sized transparent buffer; `displacementPng` is the two-channel
 * (R=dx, G=dy, 128=zero) map for this surface's view.
 */
async function applyServerDisplacement(
  artworkFull: Buffer,
  displacementPng: Buffer,
  canvasW: number,
  canvasH: number,
): Promise<Buffer> {
  const [art, disp] = await Promise.all([
    sharp(artworkFull).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(displacementPng).resize(canvasW, canvasH, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  const src = art.data;
  const d = disp.data;
  const out = Buffer.alloc(canvasW * canvasH * 4);
  const maxOffset = (DISPLACEMENT_MAX_OFFSET_PX_AT_1024 / 1024) * Math.max(canvasW, canvasH);

  for (let y = 0; y < canvasH; y++) {
    for (let x = 0; x < canvasW; x++) {
      const oi = (y * canvasW + x) * 4;
      const di = (y * canvasW + x) * 4;
      const dx = Math.round(((d[di] - 128) / 128) * maxOffset);
      const dy = Math.round(((d[di + 1] - 128) / 128) * maxOffset);
      const sxp = x + dx;
      const syp = y + dy;
      if (sxp < 0 || sxp >= canvasW || syp < 0 || syp >= canvasH) continue;
      const si = (syp * canvasW + sxp) * 4;
      out[oi] = src[si];
      out[oi + 1] = src[si + 1];
      out[oi + 2] = src[si + 2];
      out[oi + 3] = src[si + 3];
    }
  }
  return sharp(out, { raw: { width: canvasW, height: canvasH, channels: 4 } }).png().toBuffer();
}

/** Scale the image's own alpha. The previous version replaced the alpha
 *  channel with a constant, making transparent pixels opaque black. */
async function applyOpacity(image: Buffer, opacity: number): Promise<Buffer> {
  if (opacity >= 1) return image;
  const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) data[i] = Math.round(data[i] * opacity);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

/** Clip artwork to the print mask by multiplying alphas. Replacing the
 *  artwork's alpha with the mask (the previous behavior) turned every
 *  transparent pixel inside the print zone into an opaque black box —
 *  visible in cart and order previews behind any logo with a transparent
 *  background. */
async function clipToMask(image: Buffer, maskGrey: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = await sharp(maskGrey).resize(info.width, info.height, { fit: "fill" }).greyscale().raw().toBuffer();
  for (let p = 0, i = 3; p < mask.length; p++, i += 4) data[i] = Math.round((data[i] * mask[p]) / 255);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

router.post("/mockup/render", async (req: Request, res: Response) => {
  try {
    const validation = validateRenderSurfaceManifest(req.body?.surface);
    if (validation.errors.length > 0 || !validation.value) {
      throw new Error(`surface_contract_invalid:${validation.errors.join("|")}`);
    }
    const surface = validation.value;
    const roles = ensureRoleImages(req.body?.runtimeRoleImages, surface);
    const artwork = decodeImage(req.body?.artwork);

    const fit = req.body?.fit === "cover" ? "cover" : "contain";
    const opacity = numberInRange(req.body?.opacity, 0, 1, 1);
    const rotation = numberInRange(req.body?.rotation, -180, 180, 0);
    const brightness = numberInRange(req.body?.brightness, 0.4, 2.5, 1);
    const contrast = numberInRange(req.body?.contrast, 0.4, 2.5, 1);

    const baseImage = sharp(roles.base, { limitInputPixels: MAX_OUTPUT_PIXELS });
    const baseMeta = await baseImage.metadata();
    const canvasW = baseMeta.width ?? 1000;
    const canvasH = baseMeta.height ?? 1000;
    const zoneW = Math.max(1, Math.min(canvasW, Math.round(surface.printZone.w * canvasW)));
    const zoneH = Math.max(1, Math.min(canvasH, Math.round(surface.printZone.h * canvasH)));
    const zoneX = Math.round(numberInRange(surface.printZone.x, 0, 1, 0) * canvasW);
    const zoneY = Math.round(numberInRange(surface.printZone.y, 0, 1, 0) * canvasH);

    const artMeta = await sharp(artwork, { limitInputPixels: MAX_OUTPUT_PIXELS }).metadata();
    const artW = artMeta.width ?? zoneW;
    const artH = artMeta.height ?? zoneH;
    const scale = fit === "cover"
      ? Math.max(zoneW / artW, zoneH / artH)
      : Math.min(zoneW / artW, zoneH / artH);
    const resizedW = Math.max(1, Math.round(artW * scale));
    const resizedH = Math.max(1, Math.round(artH * scale));
    const left = Math.round(zoneX + (zoneW - resizedW) / 2);
    const top = Math.round(zoneY + (zoneH - resizedH) / 2);

    const renderedArtworkBase = await sharp(artwork, { limitInputPixels: MAX_OUTPUT_PIXELS })
      .resize(resizedW, resizedH, { fit: "fill", kernel: sharp.kernel.lanczos3 })
      .modulate({ brightness })
      .linear(contrast, 128 - 128 * contrast)
      .rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .png()
      .toBuffer();
    const renderedArtwork = await applyOpacity(renderedArtworkBase, opacity);

    const mask = await sharp(roles.printMask)
      .extract({ left: zoneX, top: zoneY, width: zoneW, height: zoneH })
      .resize(resizedW, resizedH, { fit: "fill" })
      .greyscale()
      .png()
      .toBuffer();
    const maskedArtwork = await clipToMask(renderedArtwork, mask);

    // Same pipeline as the browser compositor: place the design on a
    // transparent canvas-sized layer, bend it with the fabric folds where a
    // displacement map exists, relight only its pixels with the product
    // photo's own light, then composite. The shadow/highlight role images
    // are still required and checksum-verified as part of the asset
    // contract, but are no longer multiplied over the whole frame: that
    // darkened the bare garment (a visible rectangle / dull dark garments).
    let artworkLayer: Buffer = await sharp({
      create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: maskedArtwork, left, top }])
      .png()
      .toBuffer();
    if (roles.displacement) {
      artworkLayer = await applyServerDisplacement(artworkLayer, roles.displacement, canvasW, canvasH);
    }
    artworkLayer = await applyServerPhotoLighting(artworkLayer, roles.base, canvasW, canvasH, {
      x0: zoneX, y0: zoneY, x1: zoneX + zoneW, y1: zoneY + zoneH,
    });

    const background = await sharp(roles.studioBackground)
      .resize(canvasW, canvasH, { fit: "fill" })
      .ensureAlpha()
      .png()
      .toBuffer();
    const composites: OverlayOptions[] = [
      { input: roles.base, left: 0, top: 0 },
      { input: artworkLayer, left: 0, top: 0 },
      { input: await sharp(roles.protected).resize(canvasW, canvasH, { fit: "fill" }).ensureAlpha().png().toBuffer(), left: 0, top: 0 },
    ];

    const output = await sharp(background, { limitInputPixels: MAX_OUTPUT_PIXELS })
      .composite(composites)
      .png({ compressionLevel: 9 })
      .toBuffer();
    res.setHeader("Cache-Control", "private, max-age=60");
    res.setHeader("X-Mockup-Surface-Key", surface.sourceKitKey);
    res.type("image/png").send(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "render_failed";
    const status = message.startsWith("surface_contract_invalid") ||
      message === "runtime_role_images_required" ||
      message === "image_must_be_data_url" ||
      message === "invalid_data_url" ||
      message === "image_too_large" ||
      message.startsWith("runtime_role_checksum_mismatch")
      ? 400
      : 422;
    req.log.warn({ err: error }, "Mockup render failed");
    res.status(status).json({ error: "mockup_render_failed", message });
  }
});

export default router;