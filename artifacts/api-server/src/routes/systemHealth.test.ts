import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";

const mockDbExecute = vi.fn();
const mockGetRedisStatus = vi.fn();
const mockGetBackupSyncStatus = vi.fn();

vi.mock("../lib/scheduler", () => ({
  getBackupSyncStatus: (...args: unknown[]) => mockGetBackupSyncStatus(...args),
}));

vi.mock("../middlewares/adminAuth", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../lib/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../lib/redis", () => ({
  getRedisStatus: (...args: unknown[]) => mockGetRedisStatus(...args),
  redisCacheGet: vi.fn().mockResolvedValue(null),
  redisCacheDel: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../lib/objectStorage", () => ({
  ObjectStorageService: class {
    getBackendName() {
      return "r2";
    }
  },
}));

vi.mock("../lib/telegram", () => ({
  tgIsConfigured: () => false,
  tgSend: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  db: { execute: (...args: unknown[]) => mockDbExecute(...args) },
}));

import systemHealthRouter, { probe, resetLiveProbeCache } from "./systemHealth";
import { requestMetrics } from "../lib/requestMetrics";

function makeApp() {
  const app = express();
  app.use(systemHealthRouter);
  return app;
}

const REDIS_ENV = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] as const;

describe("GET /admin/system/health", () => {
  beforeEach(() => {
    mockDbExecute.mockReset().mockResolvedValue([{ ok: 1 }]);
    mockGetRedisStatus.mockReset().mockResolvedValue({ mode: "ok", detail: "healthy:primary" });
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.invalid";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token-not-a-secret";
  });

  afterEach(() => {
    for (const name of REDIS_ENV) delete process.env[name];
  });

  it("reports healthy services with measured latency", async () => {
    const res = await request(makeApp()).get("/admin/system/health").expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.services.database.status).toBe("ok");
    expect(res.body.services.redis.status).toBe("ok");
    expect(typeof res.body.services.database.latencyMs).toBe("number");
    expect(typeof res.body.services.redis.latencyMs).toBe("number");
    expect(res.body.services.database.detail).toBeUndefined();
  });

  it("reports a real Redis outage as an error instead of ok", async () => {
    // Regression: the old check wrote to the in-process fallback cache and
    // never threw, so a configured-but-down Upstash still showed as "ok".
    mockGetRedisStatus.mockResolvedValue({ mode: "error", detail: "All configured Upstash backends unavailable" });
    const res = await request(makeApp()).get("/admin/system/health").expect(200);
    expect(res.body.services.redis.status).toBe("error");
    // The API itself is still up; only the database decides the top-level flag.
    expect(res.body.ok).toBe(true);
  });

  it("reports a Redis probe that throws as an error", async () => {
    mockGetRedisStatus.mockRejectedValue(new Error("socket hang up"));
    const res = await request(makeApp()).get("/admin/system/health").expect(200);
    expect(res.body.services.redis.status).toBe("error");
    expect(res.body.services.redis.detail).toBe("unreachable");
  });

  it("reports an unconfigured Redis as not_configured, not as an error", async () => {
    mockGetRedisStatus.mockResolvedValue({ mode: "not_configured" });
    const res = await request(makeApp()).get("/admin/system/health").expect(200);
    expect(res.body.services.redis.status).toBe("not_configured");
  });

  it("reports a connecting Redis as degraded", async () => {
    mockGetRedisStatus.mockResolvedValue({ mode: "connecting" });
    const res = await request(makeApp()).get("/admin/system/health").expect(200);
    expect(res.body.services.redis.status).toBe("degraded");
  });

  it("marks the API not ok when the database is unreachable, without leaking the error text", async () => {
    mockDbExecute.mockRejectedValue(new Error("password authentication failed for user hunter2"));
    const res = await request(makeApp()).get("/admin/system/health").expect(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.services.database.status).toBe("error");
    expect(res.body.services.database.detail).toBe("unreachable");
    expect(JSON.stringify(res.body)).not.toMatch(/hunter2|password authentication/i);
  });
});

describe("GET /admin/system/live", () => {
  beforeEach(() => {
    resetLiveProbeCache();
    requestMetrics.reset();
    mockDbExecute.mockReset().mockResolvedValue([{ ok: 1 }]);
    mockGetRedisStatus.mockReset().mockResolvedValue({ mode: "ok", detail: "healthy:primary" });
    mockGetBackupSyncStatus.mockReset().mockReturnValue({
      lastRunMs: 0,
      consecutiveFailures: 0,
      circuitOpen: false,
      circuitOpenSince: 0,
      lastResults: [],
    });
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.invalid";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token-not-a-secret";
  });

  afterEach(() => {
    for (const name of REDIS_ENV) delete process.env[name];
    delete process.env.DATABASE_URL;
    delete process.env.BACKUP_SYNC_ENABLED;
  });

  it("returns the live snapshot shape and is never cached", async () => {
    const res = await request(makeApp()).get("/admin/system/live").expect(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.body.services.database).toMatchObject({ status: "ok" });
    expect(typeof res.body.services.database.latencyMs).toBe("number");
    expect(res.body.services.redis.status).toBe("ok");
    expect(res.body.runtime).toMatchObject({ role: "primary" });
    expect(typeof res.body.process.rssMB).toBe("number");
    expect(res.body.process.eventLoopLag).toMatchObject({ meanMs: expect.any(Number), p99Ms: expect.any(Number) });
    expect(res.body.traffic.series).toHaveLength(60);
    expect(res.body.traffic.windowMinutes).toBe(60);
    expect(typeof res.body.uptimeSeconds).toBe("number");
    expect(res.body.note).toMatch(/restart/i);
  });

  it("shares one database and Redis probe between rapid polls", async () => {
    const app = makeApp();
    await request(app).get("/admin/system/live").expect(200);
    await request(app).get("/admin/system/live").expect(200);
    await request(app).get("/admin/system/live").expect(200);
    expect(mockDbExecute).toHaveBeenCalledTimes(1);
    expect(mockGetRedisStatus).toHaveBeenCalledTimes(1);

    resetLiveProbeCache();
    await request(app).get("/admin/system/live").expect(200);
    expect(mockDbExecute).toHaveBeenCalledTimes(2);
  });

  it("reports a down database and a Redis outage without leaking error text", async () => {
    mockDbExecute.mockRejectedValue(new Error("connect ECONNREFUSED postgres://user:pw-leak@host.example.invalid/db"));
    mockGetRedisStatus.mockResolvedValue({ mode: "error", detail: "All configured Upstash backends unavailable" });
    const res = await request(makeApp()).get("/admin/system/live").expect(200);
    expect(res.body.services.database).toMatchObject({ status: "error", detail: "unreachable" });
    expect(res.body.services.redis.status).toBe("error");
    expect(JSON.stringify(res.body)).not.toMatch(/pw-leak|host\.example|ECONNREFUSED/);
  });

  it("never exposes connection strings or tokens from the environment", async () => {
    process.env.DATABASE_URL = "postgres://dbuser:db-pass-leak@db.example.invalid/app";
    const res = await request(makeApp()).get("/admin/system/live").expect(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/db-pass-leak|dbuser|test-token-not-a-secret|redis\.example\.invalid/);
  });

  it("summarises backup results as counts only", async () => {
    process.env.BACKUP_SYNC_ENABLED = "true";
    mockGetBackupSyncStatus.mockReturnValue({
      lastRunMs: Date.UTC(2026, 9, 4, 8, 0, 0),
      consecutiveFailures: 2,
      circuitOpen: true,
      circuitOpenSince: Date.UTC(2026, 9, 4, 8, 5, 0),
      lastResults: [
        { id: "a", label: "Mirror at secret-host.example.invalid", status: "ok" },
        { id: "b", label: "Second mirror", status: "error", message: "login failed for user bkp-user" },
        { id: "c", label: "Third mirror", status: "skipped" },
        { id: "d", label: "Fourth mirror", status: "blocked" },
      ],
    });
    const res = await request(makeApp()).get("/admin/system/live").expect(200);
    expect(res.body.backup).toMatchObject({
      enabled: true,
      consecutiveFailures: 2,
      circuitOpen: true,
      lastRunAt: "2026-10-04T08:00:00.000Z",
      lastTargets: { ok: 1, failed: 1, skipped: 2 },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/secret-host|bkp-user|Mirror/);
  });

  it("reports no last backup run as null", async () => {
    const res = await request(makeApp()).get("/admin/system/live").expect(200);
    expect(res.body.backup).toMatchObject({ enabled: false, lastRunAt: null, lastTargets: { ok: 0, failed: 0, skipped: 0 } });
  });

  it("includes recorded traffic and recent errors", async () => {
    requestMetrics.record({ method: "GET", path: "/api/products", route: "/api/products", status: 200, durationMs: 12 });
    requestMetrics.record({
      method: "POST",
      path: "/api/orders",
      route: "/api/orders",
      status: 500,
      durationMs: 80,
      message: "something broke",
    });
    const res = await request(makeApp()).get("/admin/system/live").expect(200);
    expect(res.body.traffic.last60m).toMatchObject({ requests: 2, errors5xx: 1 });
    expect(res.body.traffic.recentErrors[0]).toMatchObject({ path: "/api/orders", status: 500, message: "something broke" });
    expect(res.body.traffic.failingRoutes[0].route).toBe("POST /api/orders");
  });
});

describe("probe()", () => {
  it("returns the value and a non-negative latency on success", async () => {
    const result = await probe("test", async () => "fine", 1_000);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("fine");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("gives up on a dependency that never answers and flags the timeout", async () => {
    const started = Date.now();
    const result = await probe("test", () => new Promise<never>(() => {}), 40);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.timedOut).toBe(true);
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it("flags a plain failure as not timed out", async () => {
    const result = await probe("test", async () => {
      throw new Error("boom");
    }, 1_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.timedOut).toBe(false);
  });
});
