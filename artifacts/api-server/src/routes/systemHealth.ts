import { Router } from "express";
import { requireAdmin } from "../middlewares/adminAuth";
import { logger } from "../lib/logger";
import { getRedisStatus, redisCacheGet, redisCacheDel } from "../lib/redis";
import { ObjectStorageService } from "../lib/objectStorage";
import { tgIsConfigured, tgSend } from "../lib/telegram";
import { getBackupSyncStatus } from "../lib/scheduler";
import { readEventLoopLag, requestMetrics } from "../lib/requestMetrics";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import os from "os";
function osLoadAvg(): number[] {
  try { return os.loadavg(); } catch { return [0, 0, 0]; }
}

const router = Router();
const storageService = new ObjectStorageService();

// A dependency that hangs must not hang the admin dashboard with it.
const HEALTH_CHECK_TIMEOUT_MS = 5_000;

class HealthCheckTimeout extends Error {}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new HealthCheckTimeout("timed out")), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

type Probe<T> =
  | { ok: true; value: T; latencyMs: number }
  | { ok: false; timedOut: boolean; latencyMs: number };

// Runs one dependency check with a deadline and measures how long it took.
// Exported so the deadline behaviour can be unit-tested without a 5 s wait.
export async function probe<T>(name: string, work: () => Promise<T>, ms = HEALTH_CHECK_TIMEOUT_MS): Promise<Probe<T>> {
  const started = Date.now();
  try {
    const value = await withTimeout(work(), ms);
    return { ok: true, value, latencyMs: Date.now() - started };
  } catch (err) {
    const timedOut = err instanceof HealthCheckTimeout;
    // Log the failure server-side; the response only carries a fixed, safe detail.
    logger.warn({ check: name, timedOut }, "[system-health] dependency check failed");
    return { ok: false, timedOut, latencyMs: Date.now() - started };
  }
}

type RedisHealthStatus = "ok" | "error" | "degraded" | "not_configured";

const probeDetail = (result: Probe<unknown>): string | undefined =>
  result.ok ? undefined : result.timedOut ? "timed out" : "unreachable";

// One real probe of the database and of Upstash. The Redis probe deliberately
// bypasses the in-process fallback cache: a cache write that lands in memory
// proves nothing about Redis.
async function runCoreProbes() {
  const [dbProbe, redisProbe] = await Promise.all([
    probe("database", () => db.execute(sql`SELECT 1 AS ok`)),
    probe("redis", () => getRedisStatus()),
  ]);
  return { dbProbe, redisProbe };
}
type CoreProbes = Awaited<ReturnType<typeof runCoreProbes>>;

// The live page refreshes every few seconds in every open admin tab. Share one
// probe between them so polling cannot multiply load on the database.
const CORE_PROBE_TTL_MS = 5_000;
let coreProbeCache: { at: number; pending: Promise<CoreProbes> } | null = null;

function getCoreProbesCached(nowMs: number = Date.now()): Promise<CoreProbes> {
  if (coreProbeCache && nowMs - coreProbeCache.at < CORE_PROBE_TTL_MS) return coreProbeCache.pending;
  const pending = runCoreProbes();
  coreProbeCache = { at: nowMs, pending };
  return pending;
}

/** Test helper: forget the shared probe so the next live request probes again. */
export function resetLiveProbeCache(): void {
  coreProbeCache = null;
}

function describeCoreServices({ dbProbe, redisProbe }: CoreProbes) {
  const dbStatus = dbProbe.ok ? "ok" : "error";
  const redisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  let redisStatus: RedisHealthStatus;
  if (!redisProbe.ok) {
    redisStatus = "error";
  } else if (redisProbe.value.mode === "not_configured") {
    redisStatus = "not_configured";
  } else if (redisProbe.value.mode === "ok") {
    redisStatus = "ok";
  } else if (redisProbe.value.mode === "connecting") {
    redisStatus = "degraded";
  } else {
    redisStatus = "error";
  }
  return {
    dbStatus,
    database: {
      status: dbStatus,
      backend: "postgresql",
      configured: !!process.env.DATABASE_URL,
      latencyMs: dbProbe.latencyMs,
      ...(probeDetail(dbProbe) ? { detail: probeDetail(dbProbe) } : {}),
    },
    redis: {
      status: redisStatus,
      backend: "upstash",
      configured: redisConfigured,
      latencyMs: redisProbe.latencyMs,
      ...(probeDetail(redisProbe) ? { detail: probeDetail(redisProbe) } : {}),
    },
  };
}

function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  );
}

// ── GET /api/admin/system/health ─────────────────────────────────────────────
// Returns live status of DB, Redis, R2/storage, Telegram, and env config.
// Safe to call from the admin dashboard on every load.
router.get("/admin/system/health", requireAdmin, async (_req, res) => {
  const core = describeCoreServices(await runCoreProbes());
  const dbStatus = core.dbStatus;

  const storageBackend = storageService.getBackendName();
  const r2Configured = isR2Configured();

  const telegramConfigured = tgIsConfigured();

  const jwtConfigured = !!(process.env.JWT_SECRET && process.env.ADMIN_JWT_SECRET);
  const adminPasswordConfigured = !!process.env.ADMIN_PASSWORD;

  const apiPublicUrl = process.env.API_PUBLIC_URL || null;

  res.json({
    ok: dbStatus === "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: core.database,
      redis: core.redis,
      storage: {
        status: "ok",
        backend: storageBackend,
        configured: storageBackend === "r2" ? r2Configured : storageBackend === "s3" ? true : true,
        bucket: process.env.R2_BUCKET || null,
      },
      telegram: {
        status: telegramConfigured ? "ok" : "not_configured",
        configured: telegramConfigured,
        username: process.env.TELEGRAM_BOT_USERNAME || null,
      },
      auth: {
        status: jwtConfigured && adminPasswordConfigured ? "ok" : "partial",
        jwtConfigured,
        adminPasswordConfigured,
      },
    },
    deployment: {
      apiPublicUrl,
      nodeEnv: process.env.NODE_ENV || "development",
    },
    performance: {
      uptime: Math.floor(process.uptime()),
      memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      memoryHeapMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      cpuLoad: osLoadAvg(),
      nodeVersion: process.version,
    },
  });
});

const CPU_CORES = (() => {
  try { return os.cpus().length; } catch { return 0; }
})();

const toMB = (bytes: number) => Math.round(bytes / 1024 / 1024);

// ── GET /api/admin/system/live ───────────────────────────────────────────────
// Snapshot for the admin "Live Health" page, polled every few seconds while the
// page is open. Small, cheap and secret-free: database and Redis probes are
// shared for 5 s, traffic figures come from in-memory counters.
router.get("/admin/system/live", requireAdmin, async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const core = describeCoreServices(await getCoreProbesCached());
  const memory = process.memoryUsage();
  const backup = getBackupSyncStatus();
  const storageBackend = storageService.getBackendName();
  const constrainedBytes = (process as unknown as { constrainedMemory?: () => number }).constrainedMemory?.() ?? 0;
  const backupTargets = { ok: 0, failed: 0, skipped: 0 };
  for (const target of backup.lastResults) {
    if (target.status === "ok") backupTargets.ok += 1;
    else if (target.status === "error") backupTargets.failed += 1;
    else backupTargets.skipped += 1;
  }

  res.json({
    timestamp: new Date().toISOString(),
    startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      database: core.database,
      redis: core.redis,
      storage: {
        backend: storageBackend,
        configured: storageBackend === "r2" ? isR2Configured() : true,
      },
      telegram: { configured: tgIsConfigured() },
    },
    runtime: {
      role: process.env.TRYNEXT_RUNTIME_ROLE ?? "primary",
      nodeEnv: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      cpuCores: CPU_CORES,
      loadAverage: osLoadAvg().map((value) => Math.round(value * 100) / 100),
    },
    process: {
      rssMB: toMB(memory.rss),
      heapUsedMB: toMB(memory.heapUsed),
      heapTotalMB: toMB(memory.heapTotal),
      memoryLimitMB: constrainedBytes > 0 ? toMB(constrainedBytes) : null,
      eventLoopLag: readEventLoopLag(),
    },
    traffic: requestMetrics.snapshot(),
    backup: {
      enabled: process.env.BACKUP_SYNC_ENABLED === "true",
      lastRunAt: backup.lastRunMs > 0 ? new Date(backup.lastRunMs).toISOString() : null,
      consecutiveFailures: backup.consecutiveFailures,
      circuitOpen: backup.circuitOpen,
      lastTargets: backupTargets,
    },
    note: "Traffic figures are kept in memory and reset whenever the API restarts or sleeps.",
  });
});

// ── POST /api/admin/system/flush-cache ───────────────────────────────────────
// Clears the known Redis cache keys used by Trynext API.
router.post("/admin/system/flush-cache", requireAdmin, async (_req, res) => {
  const cacheKeys = [
    "admin_stats",
    "products_list",
    "categories_list",
    "blog_posts",
    "testimonials",
    "site_settings",
    "flash_sale",
    "featured_products",
    "referral_stats",
    "_trynext_health",
  ];

  try {
    const redisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    if (!redisConfigured) {
      res.json({
        success: true,
        message: "In-process cache cleared (Upstash Redis not configured — add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to use distributed cache)",
        keysCleared: 0,
        backend: "in-process",
      });
      return;
    }

    await redisCacheDel(...cacheKeys);
    logger.info({ cacheKeys }, "[system] Cache flushed by admin");

    res.json({
      success: true,
      message: `Flushed ${cacheKeys.length} cache keys from Upstash Redis`,
      keysCleared: cacheKeys.length,
      backend: "upstash",
    });
  } catch (err: any) {
    logger.error({ err }, "[system] Cache flush failed");
    res.status(500).json({ success: false, error: String(err?.message || "Flush failed") });
  }
});

// ── GET /api/admin/system/env-status ─────────────────────────────────────────
// Returns which production env vars are present/missing — NEVER reveals values.
router.get("/admin/system/env-status", requireAdmin, (_req, res) => {
  const vars = [
    { name: "DATABASE_URL",             label: "Database",                  group: "core",     required: true },
    { name: "JWT_SECRET",               label: "Customer JWT Secret",       group: "auth",     required: true },
    { name: "ADMIN_JWT_SECRET",         label: "Admin JWT Secret",          group: "auth",     required: true },
    { name: "ADMIN_PASSWORD",           label: "Admin Password",            group: "auth",     required: true },
    { name: "ALLOWED_ORIGINS",          label: "CORS Allowed Origins",      group: "security", required: true },
    { name: "UPSTASH_REDIS_REST_URL",   label: "Upstash Redis URL",         group: "cache",    required: false },
    { name: "UPSTASH_REDIS_REST_TOKEN", label: "Upstash Redis Token",       group: "cache",    required: false },
    { name: "R2_ACCOUNT_ID",            label: "R2 Account ID",             group: "storage",  required: false },
    { name: "R2_ACCESS_KEY_ID",         label: "R2 Access Key",             group: "storage",  required: false },
    { name: "R2_SECRET_ACCESS_KEY",     label: "R2 Secret Key",             group: "storage",  required: false },
    { name: "R2_BUCKET",                label: "R2 Bucket",                 group: "storage",  required: false },
    { name: "R2_ENDPOINT",              label: "R2 Endpoint URL",           group: "storage",  required: false },
    { name: "GOOGLE_CLIENT_ID",         label: "Google OAuth Client ID",    group: "oauth",    required: false },
    { name: "TELEGRAM_BOT_TOKEN",       label: "Telegram Bot Token",        group: "telegram", required: false },
    { name: "CLOUDFLARE_API_TOKEN",     label: "Cloudflare API Token",      group: "cdn",      required: false },
  ];

  const result = vars.map(v => ({
    name: v.name,
    label: v.label,
    group: v.group,
    required: v.required,
    set: !!process.env[v.name],
  }));

  const missing = result.filter(v => v.required && !v.set).map(v => v.name);
  const allRequiredSet = missing.length === 0;

  res.json({
    ok: allRequiredSet,
    allRequiredSet,
    missingRequired: missing,
    vars: result,
  });
});

// ── POST /api/admin/system/test-telegram ─────────────────────────────────────
// Sends a test message via Telegram bot to verify it's configured correctly.
router.post("/admin/system/test-telegram", requireAdmin, async (_req, res) => {
  if (!tgIsConfigured()) {
    res.status(400).json({
      success: false,
      error: "not_configured",
      message: "TELEGRAM_BOT_TOKEN is not set. Add it in Replit Secrets.",
    });
    return;
  }

  try {
    const sent = await tgSend("🔔 <b>Trynext Admin Test</b>\n\nTelegram notifications are working correctly! ✅");
    if (sent) {
      res.json({ success: true, message: "Test message sent to Telegram successfully." });
    } else {
      res.status(502).json({ success: false, error: "send_failed", message: "Could not send to Telegram. Check CHAT_ID is saved in Admin → Telegram settings." });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err?.message || "Unknown error") });
  }
});

export default router;
