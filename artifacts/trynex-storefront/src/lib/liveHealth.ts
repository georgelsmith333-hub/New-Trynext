/**
 * Logic for the admin "Live Health" page: response types, the health verdict,
 * outage classification, and display helpers. Kept free of React and DOM so it
 * can be unit-tested in plain Node.
 */

export type ProbeStatus = "ok" | "error" | "degraded" | "not_configured";

export interface ServiceProbe {
  status: ProbeStatus;
  latencyMs?: number;
  detail?: string;
  backend?: string;
  configured?: boolean;
}

export interface TrafficWindow {
  requests: number;
  errors4xx: number;
  errors5xx: number;
  errorRate5xx: number;
  p50Ms: number;
  p95Ms: number;
}

export interface TrafficPoint {
  t: string;
  requests: number;
  errors4xx: number;
  errors5xx: number;
  p95Ms: number;
}

export interface RouteRow {
  route: string;
  requests: number;
  errors5xx: number;
  avgMs: number;
  maxMs: number;
}

export interface ErrorRow {
  at: string;
  method: string;
  path: string;
  status: number;
  message?: string;
}

export interface LiveHealthSnapshot {
  timestamp: string;
  startedAt: string;
  uptimeSeconds: number;
  services: {
    database: ServiceProbe;
    redis: ServiceProbe;
    storage: { backend: string; configured: boolean };
    telegram: { configured: boolean };
  };
  runtime: {
    role: string;
    nodeEnv: string;
    nodeVersion: string;
    cpuCores: number;
    loadAverage: number[];
  };
  process: {
    rssMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
    memoryLimitMB: number | null;
    eventLoopLag: { meanMs: number; p99Ms: number; maxMs: number };
  };
  traffic: {
    windowMinutes: number;
    last1m: TrafficWindow;
    last5m: TrafficWindow;
    last60m: TrafficWindow;
    series: TrafficPoint[];
    slowestRoutes: RouteRow[];
    failingRoutes: RouteRow[];
    recentErrors: ErrorRow[];
  };
  backup: {
    enabled: boolean;
    lastRunAt: string | null;
    consecutiveFailures: number;
    circuitOpen: boolean;
    lastTargets: { ok: number; failed: number; skipped: number };
  };
  note: string;
}

/** Why a refresh did not produce a snapshot. */
export type LiveOutage =
  | { kind: "unreachable" }
  | { kind: "session-expired" }
  | { kind: "api-error"; httpStatus: number; apiHealth?: PublicHealth };

export interface PublicHealth {
  status?: string;
  db?: string;
  redis?: string;
}

export type LiveFetchResult =
  | { ok: true; snapshot: LiveHealthSnapshot; fetchedAt: number }
  | { ok: false; outage: LiveOutage; fetchedAt: number };

export type HealthLevel = "ok" | "degraded" | "critical" | "unknown";

export interface HealthFinding {
  level: Exclude<HealthLevel, "ok">;
  title: string;
  detail: string;
}

/** Thresholds are exported so tests and the page agree on them. */
export const THRESHOLDS = {
  /** Traffic findings need this many requests in 5 minutes to avoid noise on a quiet site. */
  minRequestsForRates: 20,
  errorRateDegraded: 0.05,
  errorRateCritical: 0.25,
  p95DegradedMs: 2_500,
  dbSlowMs: 1_000,
  dbVerySlowMs: 3_000,
  loopLagDegradedMs: 200,
  loopLagCriticalMs: 1_000,
  memoryDegradedRatio: 0.85,
  memoryCriticalRatio: 0.95,
} as const;

const LEVEL_RANK: Record<HealthLevel, number> = { ok: 0, unknown: 1, degraded: 2, critical: 3 };

const worst = (a: HealthLevel, b: HealthLevel): HealthLevel => (LEVEL_RANK[b] > LEVEL_RANK[a] ? b : a);

const percent = (ratio: number) => `${(ratio * 100).toFixed(ratio < 0.1 ? 1 : 0)}%`;

export function describeOutage(outage: LiveOutage): HealthFinding {
  switch (outage.kind) {
    case "session-expired":
      return {
        level: "unknown",
        title: "Admin session expired",
        detail: "Sign in again to keep watching. This is not a problem with the site itself.",
      };
    case "unreachable":
      return {
        level: "critical",
        title: "Cannot reach the API",
        detail: "The last refresh got no answer from the API. Check your connection, then the host (Render) status.",
      };
    case "api-error": {
      const db = outage.apiHealth?.db;
      if (db === "error") {
        return {
          level: "critical",
          title: "The API is running but its database is down",
          detail: "Admin checks need the database, so live details are unavailable until it is back. Storefront pages that are cached may still load.",
        };
      }
      if (outage.apiHealth) {
        return {
          level: "critical",
          title: `The API answered with an error (HTTP ${outage.httpStatus})`,
          detail: "The API is running, but it could not complete the live health check. Recent errors will appear here once it recovers.",
        };
      }
      return {
        level: "critical",
        title: `The API answered with an error (HTTP ${outage.httpStatus})`,
        detail: "The live health check failed and the API's own health check could not be read either.",
      };
    }
  }
}

/**
 * Turns a snapshot (and/or the reason the latest refresh failed) into one
 * overall verdict plus the specific findings behind it.
 */
export function assessHealth(input: { snapshot?: LiveHealthSnapshot; outage?: LiveOutage }): {
  level: HealthLevel;
  findings: HealthFinding[];
} {
  const findings: HealthFinding[] = [];
  const add = (finding: HealthFinding) => findings.push(finding);

  if (input.outage) add(describeOutage(input.outage));

  const snapshot = input.snapshot;
  // A failed refresh makes any older snapshot stale, so only judge a fresh one.
  if (snapshot && !input.outage) {
    const { database, redis } = snapshot.services;

    if (database.status !== "ok") {
      add({
        level: "critical",
        title: "Database is not responding",
        detail: database.detail ? `The database check ${database.detail}.` : "The database check failed.",
      });
    } else if (typeof database.latencyMs === "number") {
      if (database.latencyMs >= THRESHOLDS.dbVerySlowMs) {
        add({ level: "critical", title: "Database is very slow", detail: `A simple query took ${database.latencyMs} ms.` });
      } else if (database.latencyMs >= THRESHOLDS.dbSlowMs) {
        add({ level: "degraded", title: "Database is slow", detail: `A simple query took ${database.latencyMs} ms.` });
      }
    }

    if (redis.status === "error") {
      add({
        level: "degraded",
        title: "Cache (Redis) is unavailable",
        detail: "The site keeps working by caching in memory, but speed and cache sharing are reduced.",
      });
    } else if (redis.status === "degraded") {
      add({ level: "degraded", title: "Cache (Redis) is reconnecting", detail: "It should recover on its own." });
    }

    const traffic = snapshot.traffic.last5m;
    if (traffic.requests >= THRESHOLDS.minRequestsForRates) {
      if (traffic.errorRate5xx >= THRESHOLDS.errorRateCritical) {
        add({
          level: "critical",
          title: "Many requests are failing",
          detail: `${percent(traffic.errorRate5xx)} of the last ${traffic.requests} requests returned a server error.`,
        });
      } else if (traffic.errorRate5xx >= THRESHOLDS.errorRateDegraded) {
        add({
          level: "degraded",
          title: "Some requests are failing",
          detail: `${percent(traffic.errorRate5xx)} of the last ${traffic.requests} requests returned a server error.`,
        });
      }
      if (traffic.p95Ms >= THRESHOLDS.p95DegradedMs) {
        add({
          level: "degraded",
          title: "Responses are slow",
          detail: `95% of recent requests finished within ${traffic.p95Ms} ms or less, which is slower than usual.`,
        });
      }
    }

    const lag = snapshot.process.eventLoopLag.p99Ms;
    if (lag >= THRESHOLDS.loopLagCriticalMs) {
      add({ level: "critical", title: "The server is overloaded", detail: `It paused for up to ${lag} ms between tasks.` });
    } else if (lag >= THRESHOLDS.loopLagDegradedMs) {
      add({ level: "degraded", title: "The server is under load", detail: `It paused for up to ${lag} ms between tasks.` });
    }

    const limit = snapshot.process.memoryLimitMB;
    if (limit && limit > 0) {
      const ratio = snapshot.process.rssMB / limit;
      if (ratio >= THRESHOLDS.memoryCriticalRatio) {
        add({ level: "critical", title: "Memory almost full", detail: `Using ${snapshot.process.rssMB} of ${limit} MB. The host may restart the API.` });
      } else if (ratio >= THRESHOLDS.memoryDegradedRatio) {
        add({ level: "degraded", title: "Memory is high", detail: `Using ${snapshot.process.rssMB} of ${limit} MB.` });
      }
    }

    if (snapshot.backup.enabled && snapshot.backup.circuitOpen) {
      add({
        level: "degraded",
        title: "Backup sync is paused",
        detail: `It stopped after ${snapshot.backup.consecutiveFailures} failed runs and will retry after a cooldown.`,
      });
    } else if (snapshot.backup.enabled && snapshot.backup.lastTargets.failed > 0) {
      add({ level: "degraded", title: "A backup target failed", detail: `${snapshot.backup.lastTargets.failed} target(s) failed in the last run.` });
    }
  }

  const level = findings.reduce<HealthLevel>((acc, finding) => worst(acc, finding.level), "ok");
  // Most serious first, so the banner leads with what matters.
  findings.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level]);
  return { level, findings };
}

export function verdictLabel(level: HealthLevel): string {
  switch (level) {
    case "ok":
      return "All systems normal";
    case "degraded":
      return "Needs attention";
    case "critical":
      return "Critical problem";
    case "unknown":
      return "Status unknown";
  }
}

/** Requests per minute over a window, rounded to one decimal. */
export function requestsPerMinute(window: Pick<TrafficWindow, "requests">, minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.round((window.requests / minutes) * 10) / 10;
}

export function formatUptime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${total}s`;
}

export function formatRelative(iso: string | number | null | undefined, nowMs: number = Date.now()): string {
  if (iso === null || iso === undefined) return "never";
  const then = typeof iso === "number" ? iso : Date.parse(iso);
  if (!Number.isFinite(then)) return "unknown";
  const seconds = Math.round((nowMs - then) / 1_000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** One sentence describing the chart for screen readers. */
export function describeSeries(series: TrafficPoint[]): string {
  const requests = series.reduce((sum, point) => sum + point.requests, 0);
  const errors = series.reduce((sum, point) => sum + point.errors5xx, 0);
  const busiest = series.reduce<TrafficPoint | null>((best, point) => (!best || point.requests > best.requests ? point : best), null);
  if (requests === 0) return "No requests in the last hour.";
  return `${requests} requests in the last ${series.length} minutes, ${errors} server errors. Busiest minute had ${busiest?.requests ?? 0} requests.`;
}

interface FetchDeps {
  fetchFn?: typeof fetch;
  getHeaders?: () => Record<string, string>;
  apiUrl?: (path: string) => string;
  now?: () => number;
  signal?: AbortSignal;
}

async function readPublicHealth(deps: Required<Omit<FetchDeps, "signal">> & { signal?: AbortSignal }): Promise<PublicHealth | undefined> {
  try {
    const res = await deps.fetchFn(deps.apiUrl("/api/healthz"), { cache: "no-store", signal: deps.signal });
    // The public check answers 503 when a dependency is down but still returns the JSON body.
    const body = (await res.json()) as PublicHealth;
    return body && typeof body === "object" ? { status: body.status, db: body.db, redis: body.redis } : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Fetches the live snapshot. Failures come back as data, not exceptions, so
 * the page can keep showing the last good snapshot next to the reason it is
 * stale. When the admin endpoint fails with a server error, the public health
 * check is read too, because admin checks need the database and would
 * otherwise hide *why* they failed.
 */
export async function fetchLiveHealth(deps: FetchDeps): Promise<LiveFetchResult> {
  const resolved = {
    // Wrap the global instead of storing it: calling `window.fetch` as a method
    // of another object throws "Illegal invocation" in browsers.
    fetchFn: deps.fetchFn ?? ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)),
    getHeaders: deps.getHeaders ?? (() => ({})),
    apiUrl: deps.apiUrl ?? ((path: string) => path),
    now: deps.now ?? Date.now,
    signal: deps.signal,
  };
  try {
    const res = await resolved.fetchFn(resolved.apiUrl("/api/admin/system/live"), {
      headers: resolved.getHeaders(),
      cache: "no-store",
      signal: resolved.signal,
    });
    if (res.ok) {
      const snapshot = (await res.json()) as LiveHealthSnapshot;
      return { ok: true, snapshot, fetchedAt: resolved.now() };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, outage: { kind: "session-expired" }, fetchedAt: resolved.now() };
    }
    const apiHealth = await readPublicHealth(resolved);
    return { ok: false, outage: { kind: "api-error", httpStatus: res.status, apiHealth }, fetchedAt: resolved.now() };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    return { ok: false, outage: { kind: "unreachable" }, fetchedAt: resolved.now() };
  }
}
