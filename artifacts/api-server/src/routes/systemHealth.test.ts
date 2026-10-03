import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";

const mockDbExecute = vi.fn();
const mockGetRedisStatus = vi.fn();

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

import systemHealthRouter, { probe } from "./systemHealth";

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
