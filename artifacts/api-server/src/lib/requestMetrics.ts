import type { NextFunction, Request, Response } from "express";
import { monitorEventLoopDelay } from "node:perf_hooks";

/**
 * In-memory request metrics for the admin "Live Health" page.
 *
 * Everything here is bounded and process-local:
 *   - one bucket per minute for the last 60 minutes,
 *   - a fixed latency histogram per bucket (no raw samples),
 *   - at most MAX_ROUTE_KEYS routes and MAX_RECENT_ERRORS recent errors.
 * Nothing is written to the database, and the numbers reset when the API
 * restarts or sleeps (the admin page says so). Recording is best-effort and
 * must never affect the request being measured.
 */

export const WINDOW_MINUTES = 60;
const BUCKET_MS = 60_000;
// Upper bounds in ms; samples above the last bound land in one overflow bucket.
const LATENCY_BOUNDS_MS = [25, 50, 100, 250, 500, 1_000, 2_500, 5_000] as const;
const MAX_RECENT_ERRORS = 50;
const MAX_ROUTE_KEYS = 200;
const MAX_ERROR_MESSAGE_LENGTH = 160;
const TOP_ROUTES_LIMIT = 8;
const UNMATCHED_ROUTE = "(unmatched route)";

interface Bucket {
  minute: number;
  count: number;
  s4xx: number;
  s5xx: number;
  latency: number[];
}

interface RouteStats {
  count: number;
  errors5xx: number;
  totalMs: number;
  maxMs: number;
}

export interface RequestSample {
  method: string;
  /** The actual request path, without the query string. */
  path: string;
  /** The matched Express route pattern, when there is one. */
  route?: string | null;
  status: number;
  durationMs: number;
  /** Already-redacted failure text, for unhandled errors only. */
  message?: string;
}

export interface TrafficWindow {
  requests: number;
  errors4xx: number;
  errors5xx: number;
  /** 5xx responses divided by requests, 0 when there was no traffic. */
  errorRate5xx: number;
  /** Histogram upper bounds, so treat as "at most about this many ms". */
  p50Ms: number;
  p95Ms: number;
}

export interface TrafficSeriesPoint {
  t: string;
  requests: number;
  errors4xx: number;
  errors5xx: number;
  p95Ms: number;
}

export interface TopRoute {
  route: string;
  requests: number;
  errors5xx: number;
  avgMs: number;
  maxMs: number;
}

export interface RecentError {
  at: string;
  method: string;
  path: string;
  status: number;
  message?: string;
}

export interface TrafficSnapshot {
  windowMinutes: number;
  last1m: TrafficWindow;
  last5m: TrafficWindow;
  last60m: TrafficWindow;
  series: TrafficSeriesPoint[];
  slowestRoutes: TopRoute[];
  failingRoutes: TopRoute[];
  recentErrors: RecentError[];
}

function emptyLatency(): number[] {
  return new Array<number>(LATENCY_BOUNDS_MS.length + 1).fill(0);
}

function latencySlot(durationMs: number): number {
  for (let i = 0; i < LATENCY_BOUNDS_MS.length; i += 1) {
    if (durationMs <= LATENCY_BOUNDS_MS[i]) return i;
  }
  return LATENCY_BOUNDS_MS.length;
}

/** Smallest histogram upper bound that covers `quantile` of the samples. */
function percentileMs(latency: number[], quantile: number): number {
  const total = latency.reduce((sum, n) => sum + n, 0);
  if (total === 0) return 0;
  const target = Math.ceil(total * quantile);
  let seen = 0;
  for (let i = 0; i < latency.length; i += 1) {
    seen += latency[i];
    if (seen >= target) {
      return LATENCY_BOUNDS_MS[Math.min(i, LATENCY_BOUNDS_MS.length - 1)];
    }
  }
  return LATENCY_BOUNDS_MS[LATENCY_BOUNDS_MS.length - 1];
}

/**
 * Strips secrets and anything that looks like one from an error message so it
 * is safe to show to an admin and to keep in memory. Deliberately aggressive:
 * a message that loses a little detail is better than one that leaks a token.
 */
export function redactErrorMessage(input: unknown): string {
  const raw = input instanceof Error ? input.message : typeof input === "string" ? input : "";
  return raw
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s"'<>]+/gi, "[redacted-url]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/\b(password|passwd|pwd|secret|token|api[_-]?key)\s*[=:]\s*\S+/gi, "$1=[redacted]")
    .replace(/\buser\s+"?[A-Za-z0-9_.@-]+"?/gi, "user [redacted]")
    .replace(/\b[A-Fa-f0-9]{24,}\b/g, "[redacted]")
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_ERROR_MESSAGE_LENGTH);
}

/** Collapses ids so a path is safe to display and group on. */
export function normalizePath(rawPath: string): string {
  const pathOnly = rawPath.split("?", 1)[0].split("#", 1)[0] || "/";
  return pathOnly
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      if (/^\d+$/.test(segment)) return ":id";
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return ":id";
      if (/^[0-9a-f]{16,}$/i.test(segment)) return ":id";
      if (/^[A-Za-z0-9_-]{24,}$/.test(segment)) return ":id";
      return segment;
    })
    .join("/")
    .slice(0, 120);
}

export class RequestMetrics {
  private readonly buckets = new Map<number, Bucket>();
  private readonly routes = new Map<string, RouteStats>();
  private recentErrors: RecentError[] = [];

  constructor(private readonly now: () => number = Date.now) {}

  record(sample: RequestSample): void {
    const nowMs = this.now();
    const minute = Math.floor(nowMs / BUCKET_MS);
    let bucket = this.buckets.get(minute);
    if (!bucket) {
      bucket = { minute, count: 0, s4xx: 0, s5xx: 0, latency: emptyLatency() };
      this.buckets.set(minute, bucket);
      this.prune(minute);
    }

    const status = sample.status;
    const duration = Number.isFinite(sample.durationMs) && sample.durationMs >= 0 ? sample.durationMs : 0;
    bucket.count += 1;
    if (status >= 500) bucket.s5xx += 1;
    else if (status >= 400) bucket.s4xx += 1;
    bucket.latency[latencySlot(duration)] += 1;

    const routeKey = sample.route ? `${sample.method} ${sample.route}` : `${sample.method} ${UNMATCHED_ROUTE}`;
    let stats = this.routes.get(routeKey);
    if (!stats && this.routes.size < MAX_ROUTE_KEYS) {
      stats = { count: 0, errors5xx: 0, totalMs: 0, maxMs: 0 };
      this.routes.set(routeKey, stats);
    }
    if (stats) {
      stats.count += 1;
      stats.totalMs += duration;
      stats.maxMs = Math.max(stats.maxMs, duration);
      if (status >= 500) stats.errors5xx += 1;
    }

    if (status >= 500) {
      this.recentErrors.push({
        at: new Date(nowMs).toISOString(),
        method: sample.method,
        // Prefer the route pattern so values in path parameters (referral codes,
        // tokens) never appear; fall back to an id-collapsed path when unmatched.
        path: sample.route ? sample.route : normalizePath(sample.path),
        status,
        ...(sample.message ? { message: sample.message } : {}),
      });
      if (this.recentErrors.length > MAX_RECENT_ERRORS) {
        this.recentErrors = this.recentErrors.slice(-MAX_RECENT_ERRORS);
      }
    }
  }

  snapshot(): TrafficSnapshot {
    const nowMinute = Math.floor(this.now() / BUCKET_MS);
    const firstMinute = nowMinute - (WINDOW_MINUTES - 1);

    const series: TrafficSeriesPoint[] = [];
    for (let minute = firstMinute; minute <= nowMinute; minute += 1) {
      const bucket = this.buckets.get(minute);
      series.push({
        t: new Date(minute * BUCKET_MS).toISOString(),
        requests: bucket?.count ?? 0,
        errors4xx: bucket?.s4xx ?? 0,
        errors5xx: bucket?.s5xx ?? 0,
        p95Ms: bucket ? percentileMs(bucket.latency, 0.95) : 0,
      });
    }

    const routeRows: TopRoute[] = [...this.routes.entries()].map(([route, stats]) => ({
      route,
      requests: stats.count,
      errors5xx: stats.errors5xx,
      avgMs: Math.round(stats.totalMs / Math.max(1, stats.count)),
      maxMs: Math.round(stats.maxMs),
    }));

    return {
      windowMinutes: WINDOW_MINUTES,
      last1m: this.windowFor(nowMinute, 1),
      last5m: this.windowFor(nowMinute, 5),
      last60m: this.windowFor(nowMinute, WINDOW_MINUTES),
      series,
      // Ignore routes seen once or twice so one cold request does not top the list.
      slowestRoutes: routeRows
        .filter((row) => row.requests >= 3)
        .sort((a, b) => b.avgMs - a.avgMs)
        .slice(0, TOP_ROUTES_LIMIT),
      failingRoutes: routeRows
        .filter((row) => row.errors5xx > 0)
        .sort((a, b) => b.errors5xx - a.errors5xx)
        .slice(0, TOP_ROUTES_LIMIT),
      recentErrors: [...this.recentErrors].reverse().slice(0, 20),
    };
  }

  /** Test helper and restart-safe reset. */
  reset(): void {
    this.buckets.clear();
    this.routes.clear();
    this.recentErrors = [];
  }

  private windowFor(nowMinute: number, minutes: number): TrafficWindow {
    const latency = emptyLatency();
    let requests = 0;
    let errors4xx = 0;
    let errors5xx = 0;
    for (let minute = nowMinute - (minutes - 1); minute <= nowMinute; minute += 1) {
      const bucket = this.buckets.get(minute);
      if (!bucket) continue;
      requests += bucket.count;
      errors4xx += bucket.s4xx;
      errors5xx += bucket.s5xx;
      for (let i = 0; i < latency.length; i += 1) latency[i] += bucket.latency[i];
    }
    return {
      requests,
      errors4xx,
      errors5xx,
      errorRate5xx: requests > 0 ? errors5xx / requests : 0,
      p50Ms: percentileMs(latency, 0.5),
      p95Ms: percentileMs(latency, 0.95),
    };
  }

  private prune(currentMinute: number): void {
    const oldest = currentMinute - (WINDOW_MINUTES - 1);
    for (const minute of this.buckets.keys()) {
      if (minute < oldest) this.buckets.delete(minute);
    }
  }
}

export const requestMetrics = new RequestMetrics();

// Probes and uptime pings would dilute the figures, and the live page polling
// itself would count every refresh as traffic.
const EXCLUDED_PATHS = /^\/api\/(healthz|readyz|livez|health\/|uptime|admin\/system\/live$)/i;

/**
 * Express middleware. Measures the request and records it when the response
 * finishes. Every step is wrapped so a metrics failure can never break a request.
 */
export function requestMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const started = process.hrtime.bigint();
    res.on("finish", () => {
      try {
        const path = (req.originalUrl ?? req.url ?? "").split("?", 1)[0];
        if (EXCLUDED_PATHS.test(path)) return;
        const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
        const routePath = typeof req.route?.path === "string" ? req.route.path : null;
        requestMetrics.record({
          method: req.method,
          path,
          // All routers are mounted under /api, so the pattern is /api + route path.
          route: routePath ? `/api${routePath}` : null,
          status: res.statusCode,
          durationMs,
          message: typeof res.locals?.metricsErrorMessage === "string" ? res.locals.metricsErrorMessage : undefined,
        });
      } catch {
        // Best-effort only.
      }
    });
  } catch {
    // Best-effort only.
  }
  next();
}

export interface EventLoopLag {
  meanMs: number;
  p99Ms: number;
  maxMs: number;
}

const EVENT_LOOP_REFRESH_MS = 5_000;
let eventLoopHistogram: ReturnType<typeof monitorEventLoopDelay> | null = null;
let lastEventLoopRead: { at: number; value: EventLoopLag } | null = null;

/**
 * Event-loop delay since the previous read, refreshed at most every 5 s so
 * several admin tabs polling together do not keep resetting the histogram.
 */
export function readEventLoopLag(nowMs: number = Date.now()): EventLoopLag {
  try {
    if (!eventLoopHistogram) {
      eventLoopHistogram = monitorEventLoopDelay({ resolution: 20 });
      eventLoopHistogram.enable();
      lastEventLoopRead = { at: nowMs, value: { meanMs: 0, p99Ms: 0, maxMs: 0 } };
      return lastEventLoopRead.value;
    }
    if (lastEventLoopRead && nowMs - lastEventLoopRead.at < EVENT_LOOP_REFRESH_MS) {
      return lastEventLoopRead.value;
    }
    const toMs = (nanoseconds: number) => (Number.isFinite(nanoseconds) ? Math.round(nanoseconds / 1e6) : 0);
    const value: EventLoopLag = {
      meanMs: toMs(eventLoopHistogram.mean),
      p99Ms: toMs(eventLoopHistogram.percentile(99)),
      maxMs: toMs(eventLoopHistogram.max),
    };
    eventLoopHistogram.reset();
    lastEventLoopRead = { at: nowMs, value };
    return value;
  } catch {
    return { meanMs: 0, p99Ms: 0, maxMs: 0 };
  }
}
