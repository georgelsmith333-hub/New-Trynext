/**
 * Sections 7/8/19: async render job queue. Redis isn't provisioned in this
 * environment yet (see render.yaml — REDIS_URL is an unpopulated optional
 * secret), so this is the "database queue" option Section 8 explicitly
 * allows, using the same in-process interval-polling pattern lib/scheduler.ts
 * already uses elsewhere in this codebase.
 */
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { db, mockupJobsTable, mockupTemplatesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";
import { ObjectStorageService } from "./objectStorage";
import { getMockupRenderer, RendererNotConfiguredError } from "./mockupRenderer";
import path from "node:path";

const objectStorageService = new ObjectStorageService();

const PREVIEW_MAX_PX = 1600;
const WORKER_CONCURRENCY = Math.max(1, Number(process.env.MOCKUP_WORKER_CONCURRENCY ?? "1"));
const POLL_INTERVAL_MS = 3_000;
const DEFAULT_RENDER_TIMEOUT_MS = Number(process.env.MOCKUP_RENDER_TIMEOUT_MS ?? "30000");

function cacheKeyFor(templateVersion: number, artworkHash: string, renderOptions: Record<string, unknown>): string {
  return createHash("sha256")
    .update(`${templateVersion}|${artworkHash}|${JSON.stringify(renderOptions)}`)
    .digest("hex");
}

export interface EnqueueParams {
  templateId: number;
  artworkBytes: Buffer;
  artworkExt: "png" | "jpg" | "jpeg" | "webp";
  renderOptions?: { outputFormat?: "png" | "webp" | "jpg" };
}

export class TemplateNotActiveError extends Error {
  constructor(templateId: number) {
    super(`Template ${templateId} is not active (not yet validated by an admin).`);
    this.name = "TemplateNotActiveError";
  }
}

/** Section 19: reuse a prior completed render for the same template version +
 *  artwork hash + options, rather than re-rendering. */
export async function enqueueRenderJob(params: EnqueueParams): Promise<{ jobId: string; reused: boolean }> {
  const [template] = await db.select().from(mockupTemplatesTable).where(eq(mockupTemplatesTable.id, params.templateId)).limit(1);
  if (!template) throw new Error(`Template ${params.templateId} does not exist.`);
  if (!template.active || !template.smartObjectId) throw new TemplateNotActiveError(params.templateId);

  const artworkHash = createHash("sha256").update(params.artworkBytes).digest("hex");
  const renderOptions = { outputFormat: params.renderOptions?.outputFormat ?? "png" };
  const cacheKey = cacheKeyFor(template.version, artworkHash, renderOptions);

  const [existing] = await db
    .select()
    .from(mockupJobsTable)
    .where(and(eq(mockupJobsTable.cacheKey, cacheKey), eq(mockupJobsTable.status, "completed")))
    .limit(1);
  if (existing) {
    logger.info({ jobId: existing.id, cacheKey }, "[mockupQueue] Reusing cached render");
    return { jobId: existing.id, reused: true };
  }

  const artworkPath = await objectStorageService.saveBuffer(params.artworkBytes, params.artworkExt, "mockup-artwork");

  const jobId = randomUUID();
  await db.insert(mockupJobsTable).values({
    id: jobId,
    templateId: template.id,
    templateVersion: template.version,
    status: "queued",
    progress: 0,
    artworkPath,
    artworkHash,
    renderOptions,
    cacheKey,
  });

  logger.info({ jobId, templateId: template.id }, "[mockupQueue] Job queued");
  return { jobId, reused: false };
}

let inFlight = 0;
let workerTimer: NodeJS.Timeout | null = null;

async function claimNextQueuedJob(): Promise<typeof mockupJobsTable.$inferSelect | null> {
  // Simple claim: mark one queued row as processing inside a transaction so
  // concurrent ticks (or a future multi-instance deployment) don't double-run
  // the same job. Good enough at MOCKUP_WORKER_CONCURRENCY=1..a few; a SELECT
  // ... FOR UPDATE SKIP LOCKED would be the next step if concurrency grows.
  return db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(mockupJobsTable)
      .where(eq(mockupJobsTable.status, "queued"))
      .orderBy(mockupJobsTable.createdAt)
      .limit(1);
    if (!job) return null;
    await tx
      .update(mockupJobsTable)
      .set({ status: "processing", startedAt: new Date(), updatedAt: new Date(), attempts: job.attempts + 1 })
      .where(eq(mockupJobsTable.id, job.id));
    return job;
  });
}

async function processJob(job: typeof mockupJobsTable.$inferSelect): Promise<void> {
  try {
    const [template] = await db.select().from(mockupTemplatesTable).where(eq(mockupTemplatesTable.id, job.templateId)).limit(1);
    if (!template || !template.smartObjectId) {
      throw new Error("Template no longer exists or has no smart object mapped.");
    }

    const artworkBuffer = await readArtwork(job.artworkPath);
    const renderer = getMockupRenderer();
    const availability = await renderer.isAvailable();
    if (!availability.available) {
      throw new RendererNotConfiguredError(renderer.engineName, availability.reason ?? "unknown");
    }

    const outputFormat = (job.renderOptions as any)?.outputFormat ?? "png";
    const result = await renderer.render(
      {
        filePath: path.resolve(template.filePath),
        fileFormat: template.fileFormat as "psd" | "psb",
        smartObjectId: template.smartObjectId,
      },
      artworkBuffer,
      guessExt(job.artworkPath),
      { outputFormat, timeoutMs: DEFAULT_RENDER_TIMEOUT_MS },
    );

    const sharp = (await import("sharp")).default;
    const previewBytes = await sharp(result.outputBytes)
      .resize({ width: PREVIEW_MAX_PX, height: PREVIEW_MAX_PX, fit: "inside", withoutEnlargement: true })
      .toFormat("webp", { quality: 82 })
      .toBuffer();

    const previewUrl = await objectStorageService.saveBuffer(previewBytes, "webp", "mockup-preview");
    const finalUrl = await objectStorageService.saveBuffer(result.outputBytes, outputFormat, "mockup-final");

    await db
      .update(mockupJobsTable)
      .set({
        status: "completed",
        progress: 100,
        previewUrl,
        finalUrl,
        renderingEngine: result.engine,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mockupJobsTable.id, job.id));

    logger.info({ jobId: job.id, metrics: result.metrics }, "[mockupQueue] Job completed");
  } catch (err) {
    await handleJobFailure(job, err);
  }
}

async function handleJobFailure(job: typeof mockupJobsTable.$inferSelect, err: unknown): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const willRetry = job.attempts < job.maxAttempts;
  logger.warn({ jobId: job.id, attempts: job.attempts, willRetry, err }, "[mockupQueue] Job failed");
  await db
    .update(mockupJobsTable)
    .set({
      status: willRetry ? "queued" : "failed",
      errorMessage: message,
      updatedAt: new Date(),
    })
    .where(eq(mockupJobsTable.id, job.id));
}

async function readArtwork(objectUrl: string): Promise<Buffer> {
  const canonical = objectStorageService.normalizeObjectEntityPath(objectUrl);
  return objectStorageService.getObjectBuffer(canonical);
}

function guessExt(objectUrl: string): "png" | "jpg" | "jpeg" | "webp" {
  const ext = path.extname(objectUrl).replace(".", "").toLowerCase();
  return (["png", "jpg", "jpeg", "webp"] as const).includes(ext as any) ? (ext as any) : "png";
}

async function tick(): Promise<void> {
  while (inFlight < WORKER_CONCURRENCY) {
    const job = await claimNextQueuedJob().catch((err) => {
      logger.error({ err }, "[mockupQueue] Failed to claim job");
      return null;
    });
    if (!job) break;
    inFlight++;
    processJob(job).finally(() => {
      inFlight--;
    });
  }
}

export function startMockupWorker(): void {
  if (workerTimer) return;
  logger.info({ concurrency: WORKER_CONCURRENCY }, "[mockupQueue] Worker started");
  workerTimer = setInterval(() => {
    void tick();
  }, POLL_INTERVAL_MS);
  workerTimer.unref();
}

export async function getJob(jobId: string) {
  const [job] = await db.select().from(mockupJobsTable).where(eq(mockupJobsTable.id, jobId)).limit(1);
  return job ?? null;
}
