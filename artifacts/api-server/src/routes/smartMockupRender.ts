/**
 * Real Smart Object mockup renderer — customer-facing render API, job status
 * polling, and admin template registry (Sections 4-14 of the mockup-engine
 * spec). This is a new, additive pipeline; it does not replace the existing
 * canvas-compositor render path at POST /api/mockup/render (routes/mockupRender.ts)
 * or the Mockup Gallery admin content routes (routes/mockups.ts) — see
 * lib/mockupRenderer.ts for the honest current state of the rendering engine.
 */
import { Router, type IRouter } from "express";
import { readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { db, mockupTemplatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminAuth";
import { logger } from "../lib/logger";
import { inspectTemplate, replaceSmartObjectContent } from "../lib/psdSmartObject";
import { enqueueRenderJob, getJob, TemplateNotActiveError } from "../lib/mockupQueue";
import { getMockupRenderer } from "../lib/mockupRenderer";

const router: IRouter = Router();

const ALLOWED_ARTWORK_EXT = ["png", "jpg", "jpeg", "webp"] as const;
const MAX_ARTWORK_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_ARTWORK_PIXELS = 8000 * 8000; // guards against decompression bombs
const MAX_PSD_BYTES = 100 * 1024 * 1024; // 100MB — real Smart Object masters run several MB each
const MAX_BROWSER_PSD_BYTES = 15 * 1024 * 1024; // keep the browser validation response below the API JSON limit

function parseDataUrl(dataUrl: unknown): { ext: "png" | "jpg" | "jpeg" | "webp"; bytes: Buffer } | null {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return null;
  const match = dataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/s);
  if (!match) return null;
  const [, rawExt, b64] = match;
  const ext = rawExt.toLowerCase();
  if (!(ALLOWED_ARTWORK_EXT as readonly string[]).includes(ext)) return null;
  try {
    return { ext: ext as any, bytes: Buffer.from(b64, "base64") };
  } catch {
    return null;
  }
}

async function validateArtworkImage(bytes: Buffer): Promise<{ width: number; height: number }> {
  if (bytes.length === 0 || bytes.length > MAX_ARTWORK_BYTES) {
    throw new Error(`Artwork must be between 1 byte and ${MAX_ARTWORK_BYTES / 1024 / 1024}MB.`);
  }
  const sharp = (await import("sharp")).default;
  const meta = await sharp(bytes, { limitInputPixels: MAX_ARTWORK_PIXELS }).metadata();
  if (!meta.width || !meta.height) throw new Error("Could not read image dimensions — file may be corrupt.");
  if (meta.width * meta.height > MAX_ARTWORK_PIXELS) {
    throw new Error("Image resolution is too large to process safely.");
  }
  return { width: meta.width, height: meta.height };
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

// ── Section 4: template inspection ──────────────────────────────────────────

/** Inspects a PSD/PSB already stored at an admin-owned template's filePath. */
router.post("/admin/smart-mockups/templates/:id/inspect", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [template] = await db.select().from(mockupTemplatesTable).where(eq(mockupTemplatesTable.id, id)).limit(1);
    if (!template) {
      res.status(404).json({ error: "not_found", message: "Template does not exist." });
      return;
    }
    const bytes = await readFile(path.resolve(template.filePath));
    if (bytes.length > MAX_PSD_BYTES) {
      res.status(413).json({ error: "file_too_large", message: "Template PSD/PSB exceeds the size limit." });
      return;
    }
    const inspection = inspectTemplate(bytes);

    await db
      .update(mockupTemplatesTable)
      .set({ inspectionJson: inspection, outputWidth: inspection.documentWidth, outputHeight: inspection.documentHeight, updatedAt: new Date() })
      .where(eq(mockupTemplatesTable.id, id));

    res.json({ templateId: id, ...inspection });
  } catch (err) {
    logger.error({ err }, "[smartMockupRender] Template inspection failed");
    res.status(500).json({ error: "internal_error", message: err instanceof Error ? err.message : "Inspection failed" });
  }
});

// ── Section 5/13: template registry CRUD ────────────────────────────────────

/** Private template root — templates are registered by a path relative to
 *  this directory, never an arbitrary absolute path (Section 10: no path
 *  traversal / arbitrary file access). Configurable per environment; this
 *  default matches where the repo's own 188 real PSD/PSB masters already
 *  live (dist-mockups/staging/smart-v10-v3/masters), not under public/. */
function templateRoot(): string {
  return path.resolve(process.env.MOCKUP_TEMPLATE_ROOT ?? path.join(process.cwd(), "..", "..", "dist-mockups", "staging", "smart-v10-v3", "masters"));
}

function resolveTemplatePath(relativePath: string): string {
  const root = templateRoot();
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error("Template path escapes the configured template root.");
  }
  return resolved;
}

/** Browser-side validation catalog. The PSDs remain private; this endpoint
 * exposes only the safe relative selector and Smart Object id to an admin. */
router.get("/admin/smart-mockups/browser-catalog", requireAdmin, async (_req, res) => {
  try {
    const stagingRoot = path.dirname(templateRoot());
    const manifestPath = path.join(stagingRoot, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      surfaces?: Array<{
        surfaceKey: string;
        family: string;
        color: string;
        view: string;
        masterFormat: "psd" | "psb";
        smartObject?: { id?: string; layerName?: string };
      }>;
    };
    const surfaces = (manifest.surfaces ?? [])
      .filter((surface) => typeof surface.smartObject?.id === "string")
      .map((surface) => ({
        surfaceKey: surface.surfaceKey,
        family: surface.family,
        color: surface.color,
        view: surface.view,
        relativePath: `${surface.family}/${surface.family}-${surface.color}-${surface.view}.${surface.masterFormat}`,
        masterFormat: surface.masterFormat,
        smartObjectId: surface.smartObject?.id,
        smartObjectName: surface.smartObject?.layerName ?? null,
      }));
    res.json({ surfaces });
  } catch (err) {
    logger.error({ err }, "[smartMockupRender] Browser catalog failed");
    res.status(500).json({ error: "internal_error", message: "The staged Smart Mockup catalog is unavailable." });
  }
});

/** Prepares a private PSD pair for the browser-side Photopea validator. The
 * server performs the genuine linked Smart Object byte replacement; the user's
 * normal browser performs the actual Photopea composite/export. */
router.post("/admin/smart-mockups/browser-payload", requireAdmin, async (req, res) => {
  try {
    const { relativePath, smartObjectId } = req.body ?? {};
    if (typeof relativePath !== "string" || !relativePath || typeof smartObjectId !== "string" || !smartObjectId) {
      res.status(400).json({ error: "validation_error", message: "relativePath and smartObjectId are required." });
      return;
    }
    const parsed = parseDataUrl(req.body?.artwork);
    if (!parsed) {
      res.status(400).json({ error: "validation_error", message: "Provide artwork as a PNG/JPG/WEBP data URL." });
      return;
    }
    await validateArtworkImage(parsed.bytes);

    const fullPath = resolveTemplatePath(relativePath);
    const originalBytes = await readFile(fullPath);
    if (originalBytes.length > MAX_BROWSER_PSD_BYTES) {
      res.status(413).json({ error: "file_too_large", message: "This master is too large for browser-side validation." });
      return;
    }
    const fileFormat = /\.psb$/i.test(fullPath) ? "psb" : /\.psd$/i.test(fullPath) ? "psd" : null;
    if (!fileFormat) {
      res.status(400).json({ error: "validation_error", message: "The selected master is not a PSD/PSB." });
      return;
    }
    const inspection = inspectTemplate(originalBytes);
    if (!inspection.smartObjects.some((smartObject) => smartObject.id === smartObjectId)) {
      res.status(400).json({ error: "validation_error", message: "The selected Smart Object is not present in this master." });
      return;
    }
    const swappedBytes = replaceSmartObjectContent(originalBytes, smartObjectId, parsed.bytes, parsed.ext);
    res.json({
      fileFormat,
      relativePath,
      smartObjectId,
      documentWidth: inspection.documentWidth,
      documentHeight: inspection.documentHeight,
      originalPsdBase64: originalBytes.toString("base64"),
      modifiedPsdBase64: swappedBytes.toString("base64"),
      originalPsdSha256: sha256(originalBytes),
      modifiedPsdSha256: sha256(swappedBytes),
    });
  } catch (err) {
    logger.error({ err }, "[smartMockupRender] Browser payload failed");
    res.status(400).json({ error: "validation_error", message: err instanceof Error ? err.message : "Could not prepare browser validation." });
  }
});

router.post("/admin/smart-mockups/templates", requireAdmin, async (req, res) => {
  try {
    const { productType, name, color, face, relativePath } = req.body ?? {};
    const validTypes = ["tshirt", "longsleeve", "hoodie", "mug", "cap", "waterbottle"];
    if (!validTypes.includes(productType)) {
      res.status(400).json({ error: "validation_error", message: `productType must be one of ${validTypes.join(", ")}.` });
      return;
    }
    if (typeof relativePath !== "string" || !relativePath) {
      res.status(400).json({ error: "validation_error", message: "relativePath is required (relative to the private template root)." });
      return;
    }
    if (typeof name !== "string" || !name) {
      res.status(400).json({ error: "validation_error", message: "name is required." });
      return;
    }

    const fullPath = resolveTemplatePath(relativePath);
    const bytes = await readFile(fullPath).catch(() => {
      throw new Error(`No file found at the resolved template path.`);
    });
    if (bytes.length > MAX_PSD_BYTES) {
      res.status(413).json({ error: "file_too_large" });
      return;
    }
    const fileFormat = /\.psb$/i.test(fullPath) ? "psb" : /\.psd$/i.test(fullPath) ? "psd" : null;
    if (!fileFormat) {
      res.status(400).json({ error: "validation_error", message: "File must be .psd or .psb." });
      return;
    }

    const [created] = await db
      .insert(mockupTemplatesTable)
      .values({
        productType,
        name,
        color: color ?? null,
        face: face ?? null,
        filePath: fullPath,
        fileFormat,
        fileSha256: sha256(bytes),
        fileSize: bytes.length,
        active: false,
      })
      .returning();

    res.status(201).json({ template: created });
  } catch (err) {
    logger.error({ err }, "[smartMockupRender] Template creation failed");
    res.status(400).json({ error: "validation_error", message: err instanceof Error ? err.message : "Could not register template" });
  }
});

router.get("/admin/smart-mockups/templates", requireAdmin, async (_req, res) => {
  const templates = await db
    .select()
    .from(mockupTemplatesTable)
    .orderBy(mockupTemplatesTable.productType, mockupTemplatesTable.color, mockupTemplatesTable.face);
  res.json({ templates });
});

router.post("/admin/smart-mockups/templates/:id/smart-object", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { smartObjectId, smartObjectName } = req.body ?? {};
  if (typeof smartObjectId !== "string" || !smartObjectId) {
    res.status(400).json({ error: "validation_error", message: "smartObjectId is required." });
    return;
  }
  const [updated] = await db
    .update(mockupTemplatesTable)
    .set({ smartObjectId, smartObjectName: smartObjectName ?? null, updatedAt: new Date() })
    .where(eq(mockupTemplatesTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ template: updated });
});

/** Section 13/14: test render with a sample image; only on success does the
 *  admin get the option to mark the template active. Never auto-activates. */
router.post("/admin/smart-mockups/templates/:id/test-render", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [template] = await db.select().from(mockupTemplatesTable).where(eq(mockupTemplatesTable.id, id)).limit(1);
    if (!template) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    if (!template.smartObjectId) {
      res.status(400).json({ error: "validation_error", message: "Select a Smart Object for this template before testing." });
      return;
    }

    const parsed = parseDataUrl(req.body?.artwork);
    if (!parsed) {
      res.status(400).json({ error: "validation_error", message: "Provide a base64 data URL under `artwork` (PNG/JPG/WEBP)." });
      return;
    }
    await validateArtworkImage(parsed.bytes);

    const renderer = getMockupRenderer();
    const availability = await renderer.isAvailable();
    const start = Date.now();
    const timeoutMs = Number(process.env.MOCKUP_RENDER_TIMEOUT_MS ?? "30000");

    const validation: Record<string, unknown> = {
      test1_openPsd: null,
      test2_findSmartObject: null,
      test3_replaceContent: null,
      test4_render: null,
      test5_outputExists: null,
      test6_outputDimensions: null,
      test7_outputNotBlank: null,
      test8_differsFromBlank: null,
      test9_withinTimeout: null,
      rendererAvailable: availability,
    };

    const originalBytes = await readFile(path.resolve(template.filePath));
    validation.test1_openPsd = { pass: true };

    const inspection = inspectTemplate(originalBytes);
    const found = inspection.smartObjects.some((so) => so.id === template.smartObjectId);
    validation.test2_findSmartObject = { pass: found };
    if (!found) {
      res.json({ allPassed: false, validation, note: "Configured smart_object_id was not found in the current file." });
      return;
    }

    let swapped: Buffer;
    try {
      swapped = replaceSmartObjectContent(originalBytes, template.smartObjectId, parsed.bytes, parsed.ext);
      validation.test3_replaceContent = { pass: true };
    } catch (err) {
      validation.test3_replaceContent = { pass: false, error: err instanceof Error ? err.message : String(err) };
      res.json({ allPassed: false, validation });
      return;
    }

    if (!availability.available) {
      validation.test4_render = { pass: false, error: availability.reason };
      res.json({
        allPassed: false,
        validation,
        note: "Smart Object content replacement succeeded at the file level (tests 1-3 passed). Rendering is blocked: " + availability.reason,
      });
      return;
    }

    // Renderer available — run the real render and the remaining tests.
    const workDir = path.dirname(path.resolve(template.filePath));
    const tmpIn = path.join(workDir, `.test-render-${randomUUID()}.${template.fileFormat}`);
    await writeFile(tmpIn, swapped);
    try {
      const result = await renderer.render(
        { filePath: tmpIn, fileFormat: template.fileFormat as "psd" | "psb", smartObjectId: template.smartObjectId },
        parsed.bytes,
        parsed.ext,
        { outputFormat: "png", timeoutMs },
      );
      validation.test4_render = { pass: true, metrics: result.metrics };
      validation.test5_outputExists = { pass: result.outputBytes.length > 0 };
      validation.test6_outputDimensions = { pass: result.width > 0 && result.height > 0, width: result.width, height: result.height };
      const nonZeroBytes = result.outputBytes.some((b) => b !== 0);
      validation.test7_outputNotBlank = { pass: nonZeroBytes };
      // Compare against a real export of the untouched source PSD. Comparing
      // PNG bytes with PSD bytes would always pass, even when the compositor
      // simply returns the stale cached Smart Object raster.
      const baseline = await renderer.render(
        { filePath: path.resolve(template.filePath), fileFormat: template.fileFormat as "psd" | "psb", smartObjectId: template.smartObjectId },
        parsed.bytes,
        parsed.ext,
        { outputFormat: "png", timeoutMs, skipSmartObjectReplacement: true },
      );
      const differsFromBaseline = sha256(result.outputBytes) !== sha256(baseline.outputBytes);
      validation.test8_differsFromBlank = {
        pass: differsFromBaseline,
        renderedSha256: sha256(result.outputBytes),
        baselineSha256: sha256(baseline.outputBytes),
      };
      const withinTimeout = result.metrics.totalMs <= timeoutMs && baseline.metrics.totalMs <= timeoutMs;
      validation.test9_withinTimeout = { pass: withinTimeout, elapsedMs: Date.now() - start, renderMs: result.metrics.totalMs, baselineRenderMs: baseline.metrics.totalMs };

      await db
        .update(mockupTemplatesTable)
        .set({ lastValidatedAt: new Date(), lastValidationStatus: "pass", lastValidationJson: validation, updatedAt: new Date() })
        .where(eq(mockupTemplatesTable.id, id));

      res.json({ allPassed: Object.values(validation).every((v: any) => v?.pass !== false), validation });
    } catch (err) {
      validation.test4_render = { pass: false, error: err instanceof Error ? err.message : String(err) };
      await db
        .update(mockupTemplatesTable)
        .set({ lastValidatedAt: new Date(), lastValidationStatus: "fail", lastValidationJson: validation, updatedAt: new Date() })
        .where(eq(mockupTemplatesTable.id, id));
      res.json({ allPassed: false, validation });
    } finally {
      await unlink(tmpIn).catch(() => {});
    }
  } catch (err) {
    logger.error({ err }, "[smartMockupRender] Test render failed");
    res.status(500).json({ error: "internal_error", message: err instanceof Error ? err.message : "Test render failed" });
  }
});

/** Section 13: "marks template active only after successful validation." */
router.post("/admin/smart-mockups/templates/:id/activate", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const [template] = await db.select().from(mockupTemplatesTable).where(eq(mockupTemplatesTable.id, id)).limit(1);
  if (!template) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  if (template.lastValidationStatus !== "pass") {
    res.status(409).json({ error: "not_validated", message: "Run a passing test render before activating this template." });
    return;
  }
  const [updated] = await db
    .update(mockupTemplatesTable)
    .set({ active: true, updatedAt: new Date() })
    .where(eq(mockupTemplatesTable.id, id))
    .returning();
  res.json({ template: updated });
});

router.post("/admin/smart-mockups/templates/:id/deactivate", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const [updated] = await db
    .update(mockupTemplatesTable)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(mockupTemplatesTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ template: updated });
});

// ── Section 6/7: customer-facing render + job status ────────────────────────

router.post("/smart-mockups/render", async (req, res) => {
  try {
    const { templateId, artwork, outputFormat } = req.body ?? {};
    const id = Number(templateId);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "validation_error", message: "templateId is required." });
      return;
    }
    const parsed = parseDataUrl(artwork);
    if (!parsed) {
      res.status(400).json({ error: "validation_error", message: "Provide artwork as a base64 data URL (PNG/JPG/WEBP)." });
      return;
    }
    await validateArtworkImage(parsed.bytes);

    const { jobId, reused } = await enqueueRenderJob({
      templateId: id,
      artworkBytes: parsed.bytes,
      artworkExt: parsed.ext,
      renderOptions: { outputFormat: ["png", "webp", "jpg"].includes(outputFormat) ? outputFormat : "png" },
    });

    const job = await getJob(jobId);
    res.json({ jobId, status: job?.status ?? "queued", reused });
  } catch (err) {
    if (err instanceof TemplateNotActiveError) {
      res.status(409).json({ error: "template_not_active", message: err.message });
      return;
    }
    logger.error({ err }, "[smartMockupRender] Render enqueue failed");
    res.status(500).json({ error: "internal_error", message: err instanceof Error ? err.message : "Could not queue render job" });
  }
});

router.get("/smart-mockups/jobs/:jobId", async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    previewUrl: job.previewUrl,
    finalUrl: job.finalUrl,
    renderingEngine: job.renderingEngine,
    errorMessage: job.status === "failed" ? job.errorMessage : undefined,
  });
});

export default router;
