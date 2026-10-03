import { describe, it, expect, beforeEach } from "vitest";
import { EventEmitter } from "node:events";
import {
  RequestMetrics,
  WINDOW_MINUTES,
  normalizePath,
  readEventLoopLag,
  redactErrorMessage,
  requestMetrics,
  requestMetricsMiddleware,
} from "./requestMetrics";

const MINUTE = 60_000;

function makeMetrics(start = Date.UTC(2026, 9, 4, 10, 0, 30)) {
  let now = start;
  const metrics = new RequestMetrics(() => now);
  return {
    metrics,
    advance(ms: number) {
      now += ms;
    },
  };
}

const ok = (overrides: Partial<Parameters<RequestMetrics["record"]>[0]> = {}) => ({
  method: "GET",
  path: "/api/products",
  route: "/api/products",
  status: 200,
  durationMs: 10,
  ...overrides,
});

describe("RequestMetrics windows", () => {
  it("counts requests and classifies 4xx and 5xx separately", () => {
    const { metrics } = makeMetrics();
    metrics.record(ok());
    metrics.record(ok({ status: 404 }));
    metrics.record(ok({ status: 500 }));
    const snap = metrics.snapshot();
    expect(snap.last1m.requests).toBe(3);
    expect(snap.last1m.errors4xx).toBe(1);
    expect(snap.last1m.errors5xx).toBe(1);
    expect(snap.last1m.errorRate5xx).toBeCloseTo(1 / 3, 5);
  });

  it("reports zero rates, not NaN, when there was no traffic", () => {
    const { metrics } = makeMetrics();
    const snap = metrics.snapshot();
    expect(snap.last5m).toMatchObject({ requests: 0, errorRate5xx: 0, p50Ms: 0, p95Ms: 0 });
  });

  it("derives percentiles from the latency histogram", () => {
    const { metrics } = makeMetrics();
    for (let i = 0; i < 90; i += 1) metrics.record(ok({ durationMs: 10 }));
    for (let i = 0; i < 10; i += 1) metrics.record(ok({ durationMs: 3_000 }));
    const { last1m } = metrics.snapshot();
    expect(last1m.p50Ms).toBe(25);
    expect(last1m.p95Ms).toBe(5_000);
  });

  it("keeps older minutes out of the 1 and 5 minute windows but inside the hour", () => {
    const { metrics, advance } = makeMetrics();
    metrics.record(ok());
    advance(10 * MINUTE);
    metrics.record(ok());
    const snap = metrics.snapshot();
    expect(snap.last1m.requests).toBe(1);
    expect(snap.last5m.requests).toBe(1);
    expect(snap.last60m.requests).toBe(2);
  });

  it("drops buckets that fall out of the 60 minute window", () => {
    const { metrics, advance } = makeMetrics();
    metrics.record(ok());
    advance((WINDOW_MINUTES + 5) * MINUTE);
    metrics.record(ok());
    expect(metrics.snapshot().last60m.requests).toBe(1);
  });

  it("returns a zero-filled series covering the whole window, oldest first", () => {
    const { metrics } = makeMetrics();
    metrics.record(ok({ status: 500 }));
    const { series } = metrics.snapshot();
    expect(series).toHaveLength(WINDOW_MINUTES);
    expect(series[series.length - 1]).toMatchObject({ requests: 1, errors5xx: 1 });
    expect(series[0].requests).toBe(0);
    expect(new Date(series[0].t).getTime()).toBeLessThan(new Date(series[series.length - 1].t).getTime());
  });

  it("treats a negative or non-finite duration as zero instead of corrupting the histogram", () => {
    const { metrics } = makeMetrics();
    metrics.record(ok({ durationMs: -5 }));
    metrics.record(ok({ durationMs: Number.NaN }));
    expect(metrics.snapshot().last1m.p95Ms).toBe(25);
  });
});

describe("RequestMetrics routes and errors", () => {
  it("lists the slowest routes but ignores routes seen fewer than three times", () => {
    const { metrics } = makeMetrics();
    for (let i = 0; i < 3; i += 1) metrics.record(ok({ route: "/api/slow", path: "/api/slow", durationMs: 900 }));
    for (let i = 0; i < 3; i += 1) metrics.record(ok({ route: "/api/fast", path: "/api/fast", durationMs: 20 }));
    metrics.record(ok({ route: "/api/once", path: "/api/once", durationMs: 4_000 }));
    const { slowestRoutes } = metrics.snapshot();
    expect(slowestRoutes.map((r) => r.route)).toEqual(["GET /api/slow", "GET /api/fast"]);
    expect(slowestRoutes[0]).toMatchObject({ requests: 3, avgMs: 900, maxMs: 900 });
  });

  it("ranks failing routes by 5xx count", () => {
    const { metrics } = makeMetrics();
    metrics.record(ok({ route: "/api/a", path: "/api/a", status: 500 }));
    metrics.record(ok({ route: "/api/b", path: "/api/b", status: 500 }));
    metrics.record(ok({ route: "/api/b", path: "/api/b", status: 502 }));
    metrics.record(ok({ route: "/api/c", path: "/api/c", status: 200 }));
    const { failingRoutes } = metrics.snapshot();
    expect(failingRoutes.map((r) => r.route)).toEqual(["GET /api/b", "GET /api/a"]);
    expect(failingRoutes[0].errors5xx).toBe(2);
  });

  it("groups requests that matched no route under one key", () => {
    const { metrics } = makeMetrics();
    for (let i = 0; i < 3; i += 1) metrics.record(ok({ route: null, path: `/api/scan-${i}`, status: 404 }));
    const keys = metrics.snapshot().slowestRoutes.map((r) => r.route);
    expect(keys).toEqual(["GET (unmatched route)"]);
  });

  it("caps tracked routes but keeps counting overall traffic", () => {
    const { metrics } = makeMetrics();
    for (let i = 0; i < 260; i += 1) metrics.record(ok({ route: `/api/r${i}`, path: `/api/r${i}`, status: 500 }));
    const snap = metrics.snapshot();
    expect(snap.last1m.requests).toBe(260);
    expect(snap.failingRoutes.length).toBeLessThanOrEqual(8);
  });

  it("keeps the newest errors first, caps the history, and normalises paths", () => {
    const { metrics } = makeMetrics();
    for (let i = 0; i < 60; i += 1) {
      metrics.record(ok({ path: `/api/orders/${1000 + i}`, route: null, status: 500, message: `boom ${i}` }));
    }
    const { recentErrors } = metrics.snapshot();
    expect(recentErrors).toHaveLength(20);
    expect(recentErrors[0]).toMatchObject({ path: "/api/orders/:id", status: 500, message: "boom 59" });
    expect(recentErrors[19].message).toBe("boom 40");
  });

  it("shows the route pattern, so values in path parameters never appear", () => {
    const { metrics } = makeMetrics();
    metrics.record(ok({ path: "/api/referrals/check/SECRET-CODE-123", route: "/api/referrals/check/:code", status: 500 }));
    const { recentErrors } = metrics.snapshot();
    expect(recentErrors[0].path).toBe("/api/referrals/check/:code");
    expect(JSON.stringify(recentErrors)).not.toContain("SECRET-CODE-123");
  });

  it("does not record non-5xx responses as errors", () => {
    const { metrics } = makeMetrics();
    metrics.record(ok({ status: 404 }));
    metrics.record(ok({ status: 429 }));
    expect(metrics.snapshot().recentErrors).toHaveLength(0);
  });

  it("reset() clears everything", () => {
    const { metrics } = makeMetrics();
    metrics.record(ok({ status: 500 }));
    metrics.reset();
    const snap = metrics.snapshot();
    expect(snap.last60m.requests).toBe(0);
    expect(snap.recentErrors).toHaveLength(0);
    expect(snap.failingRoutes).toHaveLength(0);
  });
});

describe("redactErrorMessage", () => {
  it("removes connection strings and URLs", () => {
    const text = redactErrorMessage(new Error("connect failed: postgres://admin:s3cretpw@db.example.invalid:5432/app"));
    expect(text).toContain("[redacted-url]");
    expect(text).not.toMatch(/s3cretpw|admin:|db\.example/);
  });

  it("removes bearer tokens and key=value credentials", () => {
    const text = redactErrorMessage("Authorization: Bearer abc.def-ghi_123 failed; password=hunter2 api_key: ZZZ999");
    expect(text).not.toMatch(/abc\.def|hunter2|ZZZ999/);
    expect(text).toContain("Bearer [redacted]");
  });

  it("removes database user names and long opaque tokens", () => {
    const text = redactErrorMessage(`password authentication failed for user "neondb_owner" token ${"a".repeat(40)}`);
    expect(text).not.toMatch(/neondb_owner|a{30}/);
  });

  it("truncates long messages and tolerates non-string input", () => {
    expect(redactErrorMessage("x ".repeat(500)).length).toBeLessThanOrEqual(160);
    expect(redactErrorMessage(undefined)).toBe("");
    expect(redactErrorMessage({ not: "a string" })).toBe("");
  });
});

describe("normalizePath", () => {
  it("collapses numeric ids, uuids, and long tokens but keeps normal words", () => {
    expect(normalizePath("/api/orders/123/messages")).toBe("/api/orders/:id/messages");
    expect(normalizePath("/api/x/0b9f1f0e-1c2d-4a5b-8c9d-0123456789ab")).toBe("/api/x/:id");
    expect(normalizePath("/api/blog/my-first-post")).toBe("/api/blog/my-first-post");
    expect(normalizePath("/api/storage/objects/ABCDEFGHIJKLMNOPQRSTUVWXYZ012345")).toBe("/api/storage/objects/:id");
  });

  it("drops the query string and caps the length", () => {
    expect(normalizePath("/api/products?search=secret-term")).toBe("/api/products");
    expect(normalizePath("/ab".repeat(100)).length).toBe(120);
  });
});

describe("requestMetricsMiddleware", () => {
  beforeEach(() => requestMetrics.reset());

  function run(req: Record<string, unknown>, status: number, locals: Record<string, unknown> = {}) {
    const res: any = new EventEmitter();
    res.statusCode = status;
    res.locals = locals;
    let nextCalled = 0;
    requestMetricsMiddleware(req as any, res, () => {
      nextCalled += 1;
    });
    res.emit("finish");
    return nextCalled;
  }

  it("records a finished request with its route pattern and status", () => {
    const next = run({ method: "GET", originalUrl: "/api/orders/42?x=1", route: { path: "/orders/:id" } }, 200);
    expect(next).toBe(1);
    const snap = requestMetrics.snapshot();
    expect(snap.last1m.requests).toBe(1);
    expect(snap.last1m.errors5xx).toBe(0);
  });

  it("attaches the redacted error message to a failed request", () => {
    run(
      { method: "POST", originalUrl: "/api/orders", route: { path: "/orders" } },
      500,
      { metricsErrorMessage: "database exploded" },
    );
    const { recentErrors, failingRoutes } = requestMetrics.snapshot();
    expect(recentErrors[0]).toMatchObject({ method: "POST", path: "/api/orders", status: 500, message: "database exploded" });
    expect(failingRoutes[0].route).toBe("POST /api/orders");
  });

  it("does not count health probes, uptime pings, or the live page itself", () => {
    for (const url of [
      "/api/healthz",
      "/api/health/readiness",
      "/api/readyz",
      "/api/uptimerobot/webhook/not-a-real-secret",
      "/api/admin/system/live",
    ]) {
      run({ method: "GET", originalUrl: url }, 200);
    }
    expect(requestMetrics.snapshot().last60m.requests).toBe(0);
  });

  it("still counts the admin health check and normal API traffic", () => {
    run({ method: "GET", originalUrl: "/api/admin/system/health" }, 200);
    run({ method: "GET", originalUrl: "/api/products" }, 200);
    expect(requestMetrics.snapshot().last60m.requests).toBe(2);
  });

  it("never breaks the request if recording throws", () => {
    const res: any = new EventEmitter();
    res.statusCode = 200;
    res.on = () => {
      throw new Error("cannot attach listener");
    };
    let nextCalled = 0;
    expect(() => requestMetricsMiddleware({ method: "GET", originalUrl: "/api/x" } as any, res, () => {
      nextCalled += 1;
    })).not.toThrow();
    expect(nextCalled).toBe(1);
  });

  it("ignores a malformed request object on finish", () => {
    const next = run({}, 200);
    expect(next).toBe(1);
  });
});

describe("readEventLoopLag", () => {
  it("returns non-negative numbers and reuses a recent reading", () => {
    const base = Date.now() + 10_000_000;
    const first = readEventLoopLag(base);
    const second = readEventLoopLag(base + 1_000);
    expect(first.meanMs).toBeGreaterThanOrEqual(0);
    expect(first.p99Ms).toBeGreaterThanOrEqual(0);
    expect(first.maxMs).toBeGreaterThanOrEqual(0);
    expect(second).toBe(first);
  });
});
