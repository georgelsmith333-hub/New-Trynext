import { describe, it, expect, vi } from "vitest";
import {
  THRESHOLDS,
  assessHealth,
  describeOutage,
  describeSeries,
  fetchLiveHealth,
  formatRelative,
  formatUptime,
  requestsPerMinute,
  verdictLabel,
  type LiveHealthSnapshot,
  type TrafficWindow,
} from "./liveHealth";

const quiet: TrafficWindow = { requests: 0, errors4xx: 0, errors5xx: 0, errorRate5xx: 0, p50Ms: 0, p95Ms: 0 };

function makeSnapshot(overrides: Partial<{
  database: Partial<LiveHealthSnapshot["services"]["database"]>;
  redis: Partial<LiveHealthSnapshot["services"]["redis"]>;
  last5m: Partial<TrafficWindow>;
  process: Partial<LiveHealthSnapshot["process"]>;
  backup: Partial<LiveHealthSnapshot["backup"]>;
}> = {}): LiveHealthSnapshot {
  return {
    timestamp: "2026-10-04T10:00:00.000Z",
    startedAt: "2026-10-04T09:00:00.000Z",
    uptimeSeconds: 3_600,
    services: {
      database: { status: "ok", latencyMs: 12, ...overrides.database },
      redis: { status: "ok", latencyMs: 30, ...overrides.redis },
      storage: { backend: "r2", configured: true },
      telegram: { configured: true },
    },
    runtime: { role: "primary", nodeEnv: "production", nodeVersion: "v22.0.0", cpuCores: 2, loadAverage: [0.1, 0.1, 0.1] },
    process: {
      rssMB: 150,
      heapUsedMB: 80,
      heapTotalMB: 120,
      memoryLimitMB: 512,
      eventLoopLag: { meanMs: 2, p99Ms: 10, maxMs: 20 },
      ...overrides.process,
    },
    traffic: {
      windowMinutes: 60,
      last1m: quiet,
      last5m: { requests: 100, errors4xx: 2, errors5xx: 0, errorRate5xx: 0, p50Ms: 50, p95Ms: 250, ...overrides.last5m },
      last60m: quiet,
      series: [],
      slowestRoutes: [],
      failingRoutes: [],
      recentErrors: [],
    },
    backup: { enabled: false, lastRunAt: null, consecutiveFailures: 0, circuitOpen: false, lastTargets: { ok: 0, failed: 0, skipped: 0 }, ...overrides.backup },
    note: "",
  };
}

describe("assessHealth: services", () => {
  it("reports ok with no findings for a healthy snapshot", () => {
    expect(assessHealth({ snapshot: makeSnapshot() })).toEqual({ level: "ok", findings: [] });
  });

  it("is critical when the database check fails, using the safe detail", () => {
    const { level, findings } = assessHealth({ snapshot: makeSnapshot({ database: { status: "error", detail: "timed out" } }) });
    expect(level).toBe("critical");
    expect(findings[0]).toMatchObject({ level: "critical", title: "Database is not responding" });
    expect(findings[0].detail).toContain("timed out");
  });

  it("flags a slow database as degraded, and a very slow one as critical", () => {
    expect(assessHealth({ snapshot: makeSnapshot({ database: { latencyMs: THRESHOLDS.dbSlowMs - 1 } }) }).level).toBe("ok");
    expect(assessHealth({ snapshot: makeSnapshot({ database: { latencyMs: THRESHOLDS.dbSlowMs } }) }).level).toBe("degraded");
    expect(assessHealth({ snapshot: makeSnapshot({ database: { latencyMs: THRESHOLDS.dbVerySlowMs } }) }).level).toBe("critical");
  });

  it("treats a Redis outage as degraded, never critical, and ignores an unconfigured Redis", () => {
    expect(assessHealth({ snapshot: makeSnapshot({ redis: { status: "error" } }) }).level).toBe("degraded");
    expect(assessHealth({ snapshot: makeSnapshot({ redis: { status: "degraded" } }) }).level).toBe("degraded");
    expect(assessHealth({ snapshot: makeSnapshot({ redis: { status: "not_configured" } }) }).level).toBe("ok");
  });
});

describe("assessHealth: traffic", () => {
  const busy = THRESHOLDS.minRequestsForRates;

  it("does not alarm on a quiet site, even when every request failed", () => {
    const snap = makeSnapshot({ last5m: { requests: busy - 1, errors5xx: busy - 1, errorRate5xx: 1, p95Ms: 9_000 } });
    expect(assessHealth({ snapshot: snap })).toEqual({ level: "ok", findings: [] });
  });

  it("flags error rate at the degraded and critical thresholds", () => {
    const at = (rate: number) => assessHealth({ snapshot: makeSnapshot({ last5m: { requests: 200, errors5xx: Math.round(200 * rate), errorRate5xx: rate } }) }).level;
    expect(at(THRESHOLDS.errorRateDegraded - 0.01)).toBe("ok");
    expect(at(THRESHOLDS.errorRateDegraded)).toBe("degraded");
    expect(at(THRESHOLDS.errorRateCritical)).toBe("critical");
  });

  it("flags slow responses as degraded once there is enough traffic", () => {
    const { level, findings } = assessHealth({ snapshot: makeSnapshot({ last5m: { requests: busy, p95Ms: THRESHOLDS.p95DegradedMs } }) });
    expect(level).toBe("degraded");
    expect(findings[0].title).toBe("Responses are slow");
  });

  it("reports the percentage of failing requests in plain words", () => {
    const { findings } = assessHealth({ snapshot: makeSnapshot({ last5m: { requests: 100, errors5xx: 30, errorRate5xx: 0.3 } }) });
    expect(findings[0].detail).toContain("30%");
    expect(findings[0].detail).toContain("100");
  });
});

describe("assessHealth: runtime and backup", () => {
  it("flags event-loop pauses", () => {
    const lag = (p99Ms: number) => assessHealth({ snapshot: makeSnapshot({ process: { eventLoopLag: { meanMs: 1, p99Ms, maxMs: p99Ms } } }) }).level;
    expect(lag(THRESHOLDS.loopLagDegradedMs - 1)).toBe("ok");
    expect(lag(THRESHOLDS.loopLagDegradedMs)).toBe("degraded");
    expect(lag(THRESHOLDS.loopLagCriticalMs)).toBe("critical");
  });

  it("flags memory pressure only when a limit is known", () => {
    const mem = (rssMB: number, memoryLimitMB: number | null) => assessHealth({ snapshot: makeSnapshot({ process: { rssMB, memoryLimitMB } }) }).level;
    expect(mem(430, 512)).toBe("ok");
    expect(mem(440, 512)).toBe("degraded");
    expect(mem(490, 512)).toBe("critical");
    expect(mem(5_000, null)).toBe("ok");
  });

  it("flags a paused or failing backup only when backups are enabled", () => {
    expect(assessHealth({ snapshot: makeSnapshot({ backup: { enabled: true, circuitOpen: true, consecutiveFailures: 3 } }) }).findings[0].title).toBe("Backup sync is paused");
    expect(assessHealth({ snapshot: makeSnapshot({ backup: { enabled: true, lastTargets: { ok: 1, failed: 1, skipped: 0 } } }) }).findings[0].title).toBe("A backup target failed");
    expect(assessHealth({ snapshot: makeSnapshot({ backup: { enabled: false, circuitOpen: true } }) }).level).toBe("ok");
  });

  it("lists the most serious finding first and takes the worst level", () => {
    const snap = makeSnapshot({ redis: { status: "error" }, database: { status: "error" } });
    const { level, findings } = assessHealth({ snapshot: snap });
    expect(level).toBe("critical");
    expect(findings.map((f) => f.level)).toEqual(["critical", "degraded"]);
  });
});

describe("assessHealth: outages", () => {
  it("ignores a stale snapshot when the latest refresh failed", () => {
    const stale = makeSnapshot({ redis: { status: "error" } });
    const { level, findings } = assessHealth({ snapshot: stale, outage: { kind: "unreachable" } });
    expect(level).toBe("critical");
    expect(findings).toHaveLength(1);
    expect(findings[0].title).toBe("Cannot reach the API");
  });

  it("treats an expired session as unknown, not as a site problem", () => {
    const { level, findings } = assessHealth({ outage: { kind: "session-expired" } });
    expect(level).toBe("unknown");
    expect(findings[0].detail).toMatch(/not a problem with the site/i);
  });

  it("explains a database outage when the public health check says the database is down", () => {
    const finding = describeOutage({ kind: "api-error", httpStatus: 500, apiHealth: { status: "error", db: "error" } });
    expect(finding).toMatchObject({ level: "critical", title: "The API is running but its database is down" });
  });

  it("falls back to a generic message when the API's own check is unreadable", () => {
    const finding = describeOutage({ kind: "api-error", httpStatus: 502 });
    expect(finding.title).toContain("HTTP 502");
    expect(finding.detail).toMatch(/could not be read/i);
  });

  it("reports an API error even when the database is fine", () => {
    const finding = describeOutage({ kind: "api-error", httpStatus: 500, apiHealth: { status: "ok", db: "ok" } });
    expect(finding.title).toContain("HTTP 500");
    expect(finding.detail).toMatch(/running/i);
  });
});

describe("display helpers", () => {
  it("labels each verdict", () => {
    expect(verdictLabel("ok")).toBe("All systems normal");
    expect(verdictLabel("degraded")).toBe("Needs attention");
    expect(verdictLabel("critical")).toBe("Critical problem");
    expect(verdictLabel("unknown")).toBe("Status unknown");
  });

  it("computes requests per minute and guards a zero window", () => {
    expect(requestsPerMinute({ requests: 45 }, 5)).toBe(9);
    expect(requestsPerMinute({ requests: 7 }, 5)).toBe(1.4);
    expect(requestsPerMinute({ requests: 7 }, 0)).toBe(0);
  });

  it("formats uptime compactly", () => {
    expect(formatUptime(42)).toBe("42s");
    expect(formatUptime(125)).toBe("2m");
    expect(formatUptime(3_700)).toBe("1h 1m");
    expect(formatUptime(90_000)).toBe("1d 1h");
    expect(formatUptime(-5)).toBe("0s");
  });

  it("formats relative times and tolerates bad input", () => {
    const now = Date.parse("2026-10-04T12:00:00.000Z");
    expect(formatRelative(now - 2_000, now)).toBe("just now");
    expect(formatRelative(now - 30_000, now)).toBe("30s ago");
    expect(formatRelative("2026-10-04T11:55:00.000Z", now)).toBe("5m ago");
    expect(formatRelative("2026-10-04T08:00:00.000Z", now)).toBe("4h ago");
    expect(formatRelative("2026-10-01T12:00:00.000Z", now)).toBe("3d ago");
    expect(formatRelative(null, now)).toBe("never");
    expect(formatRelative("not a date", now)).toBe("unknown");
  });

  it("describes the chart in one sentence for screen readers", () => {
    expect(describeSeries([])).toBe("No requests in the last hour.");
    const text = describeSeries([
      { t: "a", requests: 3, errors4xx: 0, errors5xx: 1, p95Ms: 25 },
      { t: "b", requests: 9, errors4xx: 0, errors5xx: 0, p95Ms: 25 },
    ]);
    expect(text).toBe("12 requests in the last 2 minutes, 1 server errors. Busiest minute had 9 requests.");
  });
});

describe("fetchLiveHealth", () => {
  const apiUrl = (path: string) => `https://api.example.invalid${path}`;
  const snapshot = makeSnapshot();
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  it("returns the snapshot on success and sends auth headers without caching", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(snapshot));
    const result = await fetchLiveHealth({ fetchFn, apiUrl, getHeaders: () => ({ Authorization: "Bearer test" }), now: () => 123 });
    expect(result).toEqual({ ok: true, snapshot, fetchedAt: 123 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.example.invalid/api/admin/system/live");
    expect(init).toMatchObject({ cache: "no-store", headers: { Authorization: "Bearer test" } });
  });

  it("classifies 401 and 403 as an expired session without touching the public check", async () => {
    for (const status of [401, 403]) {
      const fetchFn = vi.fn().mockResolvedValue(json({ error: "unauthorized" }, status));
      const result = await fetchLiveHealth({ fetchFn, apiUrl });
      expect(result).toMatchObject({ ok: false, outage: { kind: "session-expired" } });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    }
  });

  it("reads the public health check when the admin endpoint fails with a server error", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(json({ error: "internal_error", message: "Auth check failed" }, 500))
      .mockResolvedValueOnce(json({ status: "error", db: "error", redis: "not_configured", extra: "ignored" }, 503));
    const result = await fetchLiveHealth({ fetchFn, apiUrl });
    expect(result).toMatchObject({
      ok: false,
      outage: { kind: "api-error", httpStatus: 500, apiHealth: { status: "error", db: "error", redis: "not_configured" } },
    });
    expect(fetchFn.mock.calls[1][0]).toBe("https://api.example.invalid/api/healthz");
    expect(JSON.stringify(result)).not.toContain("ignored");
  });

  it("still reports an api-error when the public check cannot be read", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(json({}, 502))
      .mockRejectedValueOnce(new TypeError("network down"));
    const result = await fetchLiveHealth({ fetchFn, apiUrl });
    expect(result).toMatchObject({ ok: false, outage: { kind: "api-error", httpStatus: 502 } });
    if (!result.ok && result.outage.kind === "api-error") expect(result.outage.apiHealth).toBeUndefined();
  });

  it("reports an unreachable API when the request itself fails", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await fetchLiveHealth({ fetchFn, apiUrl })).toMatchObject({ ok: false, outage: { kind: "unreachable" } });
  });

  it("calls the global fetch without a foreign `this`, as browsers require", async () => {
    // Regression: storing `fetch` on an object and calling it as a method throws
    // "Illegal invocation" in a real browser, which surfaced as "Cannot reach the API".
    const strictFetch = vi.fn(function (this: unknown) {
      if (this !== undefined && this !== globalThis) throw new TypeError("Illegal invocation");
      return Promise.resolve(json(snapshot));
    });
    vi.stubGlobal("fetch", strictFetch);
    try {
      const result = await fetchLiveHealth({ apiUrl });
      expect(result).toMatchObject({ ok: true });
      expect(strictFetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rethrows an abort so the caller can ignore a cancelled refresh", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError"));
    await expect(fetchLiveHealth({ fetchFn, apiUrl })).rejects.toMatchObject({ name: "AbortError" });
  });
});
