import { memo, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Activity, AlertTriangle, CheckCircle2, CircleHelp, Cpu, Database, Gauge,
  History, Pause, Play, RefreshCw, Wifi, XCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getApiUrl, getAuthHeaders } from "@/lib/utils";
import {
  THRESHOLDS, assessHealth, describeSeries, fetchLiveHealth, formatRelative, formatUptime,
  requestsPerMinute, verdictLabel,
  type HealthLevel, type LiveFetchResult, type LiveHealthSnapshot, type ProbeStatus, type TrafficPoint,
} from "@/lib/liveHealth";

/** How often the page asks for fresh data while it is open and visible. */
const REFRESH_MS = 10_000;

type Tone = "ok" | "warn" | "bad" | "muted";

interface ActivityRow {
  id: number;
  adminName: string | null;
  action: string;
  entity: string;
  entityName: string | null;
  createdAt: string;
}

const TONE_CLASSES: Record<Tone, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  bad: "border-red-200 bg-red-50 text-red-900",
  muted: "border-gray-200 bg-gray-50 text-gray-700",
};

const LEVEL_TONE: Record<HealthLevel, Tone> = { ok: "ok", degraded: "warn", critical: "bad", unknown: "muted" };

function probeTone(status: ProbeStatus, latencyMs?: number): Tone {
  if (status === "error") return "bad";
  if (status === "degraded") return "warn";
  if (status === "not_configured") return "muted";
  if (typeof latencyMs === "number" && latencyMs >= THRESHOLDS.dbVerySlowMs) return "bad";
  if (typeof latencyMs === "number" && latencyMs >= THRESHOLDS.dbSlowMs) return "warn";
  return "ok";
}

const PROBE_WORD: Record<ProbeStatus, string> = {
  ok: "Online",
  error: "Down",
  degraded: "Reconnecting",
  not_configured: "Not configured",
};

function ToneIcon({ tone, className = "h-5 w-5" }: { tone: Tone; className?: string }) {
  if (tone === "ok") return <CheckCircle2 className={className} aria-hidden="true" />;
  if (tone === "warn") return <AlertTriangle className={className} aria-hidden="true" />;
  if (tone === "bad") return <XCircle className={className} aria-hidden="true" />;
  return <CircleHelp className={className} aria-hidden="true" />;
}

function StatCard({ icon, label, value, sub, tone, stale }: { icon: ReactNode; label: string; value: string; sub?: string; tone: Tone; stale?: boolean }) {
  // A reading from before an outage must not keep claiming "OK".
  const shownTone: Tone = stale ? "muted" : tone;
  const badge = stale ? "Stale" : tone === "ok" ? "OK" : tone === "warn" ? "Watch" : tone === "bad" ? "Problem" : "n/a";
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${stale ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
          {icon}
          {label}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${TONE_CLASSES[shownTone]}`}>
          <ToneIcon tone={shownTone} className="h-3 w-3" />
          {badge}
        </span>
      </div>
      <p className="mt-3 text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

/** Stacked bars: green = ok, amber = 4xx, red = 5xx, one bar per minute. */
const TrafficChart = memo(function TrafficChart({ series }: { series: TrafficPoint[] }) {
  const width = 600;
  const height = 140;
  const max = Math.max(1, ...series.map((point) => point.requests));
  const barWidth = width / Math.max(1, series.length);
  return (
    <div>
      <div className="flex items-end gap-2">
        <span className="w-8 shrink-0 text-right text-[10px] text-gray-400" aria-hidden="true">{max}</span>
        <svg
          role="img"
          aria-label={describeSeries(series)}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-36 w-full rounded-lg bg-gray-50"
        >
          <title>{describeSeries(series)}</title>
          {series.map((point, index) => {
            const ok = Math.max(0, point.requests - point.errors4xx - point.errors5xx);
            const unit = height / max;
            const x = index * barWidth + 0.5;
            const w = Math.max(1, barWidth - 1);
            const okH = ok * unit;
            const warnH = point.errors4xx * unit;
            const badH = point.errors5xx * unit;
            return (
              <g key={point.t}>
                <title>{`${new Date(point.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}: ${point.requests} requests, ${point.errors5xx} server errors`}</title>
                <rect x={x} y={height - okH} width={w} height={okH} fill="#34a36b" />
                <rect x={x} y={height - okH - warnH} width={w} height={warnH} fill="#f5a524" />
                <rect x={x} y={height - okH - warnH - badH} width={w} height={badH} fill="#e5484d" />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="ml-10 mt-1 flex justify-between text-[10px] text-gray-400" aria-hidden="true">
        <span>{series.length} min ago</span>
        <span>now</span>
      </div>
      <ul className="ml-10 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#34a36b]" aria-hidden="true" />Successful</li>
        <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#f5a524]" aria-hidden="true" />Client errors (4xx)</li>
        <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#e5484d]" aria-hidden="true" />Server errors (5xx)</li>
      </ul>
    </div>
  );
});

/** p95 response time per minute (minutes without traffic are skipped). */
const LatencyLine = memo(function LatencyLine({ series }: { series: TrafficPoint[] }) {
  const width = 600;
  const height = 60;
  const points = series
    .map((point, index) => ({ index, value: point.p95Ms, has: point.requests > 0 }))
    .filter((point) => point.has);
  const max = Math.max(100, ...points.map((point) => point.value));
  const step = width / Math.max(1, series.length - 1);
  const path = points.map((point) => `${(point.index * step).toFixed(1)},${(height - (point.value / max) * (height - 4) - 2).toFixed(1)}`).join(" ");
  return (
    <div>
      <div className="flex items-end gap-2">
        <span className="w-8 shrink-0 text-right text-[10px] text-gray-400" aria-hidden="true">{max}ms</span>
        <svg
          role="img"
          aria-label={points.length ? `Response time, 95th percentile, up to ${max} milliseconds` : "No response time data yet"}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-16 w-full rounded-lg bg-gray-50"
        >
          {points.length > 1 && <polyline points={path} fill="none" stroke="#e85d04" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
          {points.length === 1 && <circle cx={points[0].index * step} cy={height / 2} r="3" fill="#e85d04" />}
        </svg>
      </div>
    </div>
  );
});

function RoutesTable({ caption, rows, mode }: { caption: string; rows: LiveHealthSnapshot["traffic"]["slowestRoutes"]; mode: "slow" | "failing" }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400">{mode === "slow" ? "Nothing slow to show yet." : "No failing routes. Nice."}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-xs uppercase tracking-wide text-gray-400">
            <th scope="col" className="py-2 pr-3 font-bold">Route</th>
            <th scope="col" className="px-2 py-2 text-right font-bold">{mode === "slow" ? "Avg" : "5xx"}</th>
            <th scope="col" className="px-2 py-2 text-right font-bold">{mode === "slow" ? "Slowest" : "Requests"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.route}>
              <td className="max-w-[220px] truncate py-2 pr-3 font-mono text-xs text-gray-800" title={row.route}>{row.route}</td>
              <td className="px-2 py-2 text-right font-semibold text-gray-900">{mode === "slow" ? `${row.avgMs} ms` : row.errors5xx}</td>
              <td className="px-2 py-2 text-right text-gray-500">{mode === "slow" ? `${row.maxMs} ms` : row.requests}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Card({ title, icon, children, action }: { title: string; icon: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-black text-gray-900">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function AdminLiveHealth() {
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [lastGood, setLastGood] = useState<Extract<LiveFetchResult, { ok: true }> | null>(null);

  const live = useQuery({
    queryKey: ["admin-live-health"],
    queryFn: ({ signal }) => fetchLiveHealth({ apiUrl: getApiUrl, getHeaders: getAuthHeaders, signal }),
    // The interval stops while the tab is hidden, so an unattended tab costs nothing.
    refetchInterval: paused ? false : REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: false,
  });

  const activity = useQuery({
    queryKey: ["admin-live-activity"],
    queryFn: async ({ signal }) => {
      // summary=1 skips the large before/after snapshots; this feed polls often.
      const res = await fetch(getApiUrl("/api/admin/activity-logs?limit=8&summary=1"), { headers: getAuthHeaders(), cache: "no-store", signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return ((await res.json()) as { logs?: ActivityRow[] }).logs ?? [];
    },
    refetchInterval: paused ? false : REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (live.data?.ok) setLastGood(live.data);
  }, [live.data]);

  // Keeps "updated 12s ago" honest between refreshes.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const result = live.data;
  const outage = result && !result.ok ? result.outage : undefined;
  const fresh = result?.ok ? result.snapshot : undefined;
  const shown = fresh ?? lastGood?.snapshot;
  const stale = !!outage && !!shown;
  const fetchedAt = result?.ok ? result.fetchedAt : lastGood?.fetchedAt;
  const verdict = useMemo(() => assessHealth({ snapshot: fresh, outage }), [fresh, outage]);

  const refreshNow = () => {
    void live.refetch();
    void activity.refetch();
  };

  // Resuming should show fresh numbers straight away, not after the next tick.
  const togglePause = () => {
    if (paused) refreshNow();
    setPaused((value) => !value);
  };

  const pill = outage
    ? { text: "Disconnected", cls: "border-red-200 bg-red-50 text-red-800", dot: "bg-red-500" }
    : paused
      ? { text: "Paused", cls: "border-gray-200 bg-gray-50 text-gray-700", dot: "bg-gray-400" }
      : { text: `Live · every ${REFRESH_MS / 1000}s`, cls: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500 motion-safe:animate-pulse" };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
              <Activity className="h-6 w-6 text-orange-500" aria-hidden="true" />
              Live Health
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              How the site and API are doing right now. Refreshes on its own while this page is open.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${pill.cls}`}>
              <span className={`h-2 w-2 rounded-full ${pill.dot}`} aria-hidden="true" />
              {pill.text}
            </span>
            <span className="text-xs text-gray-500" data-testid="live-updated">
              Updated {formatRelative(fetchedAt, now)}
            </span>
            <button
              type="button"
              onClick={togglePause}
              aria-pressed={paused}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={refreshNow}
              disabled={live.isFetching}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 px-3 text-sm font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${live.isFetching ? "motion-safe:animate-spin" : ""}`} aria-hidden="true" />
              Refresh now
            </button>
          </div>
        </div>

        {live.isPending && !shown ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading live health">
            <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />)}
            </div>
          </div>
        ) : (
          <>
            <div
              role="status"
              aria-live="polite"
              data-testid="live-verdict"
              data-level={verdict.level}
              className={`rounded-2xl border p-4 ${TONE_CLASSES[LEVEL_TONE[verdict.level]]}`}
            >
              <div className="flex items-center gap-2 text-lg font-black">
                <ToneIcon tone={LEVEL_TONE[verdict.level]} className="h-6 w-6" />
                {verdictLabel(verdict.level)}
              </div>
              {verdict.findings.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {verdict.findings.map((finding) => (
                    <li key={finding.title} className="text-sm">
                      <span className="font-bold">{finding.title}.</span> {finding.detail}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm">Database, cache and traffic all look healthy.</p>
              )}
              {stale && (
                <p className="mt-3 border-t border-black/10 pt-2 text-xs">
                  The numbers below are the last good reading from {formatRelative(lastGood?.fetchedAt, now)}.
                </p>
              )}
            </div>

            {shown && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    stale={stale}
                    icon={<Database className="h-4 w-4" aria-hidden="true" />}
                    label="Database"
                    value={PROBE_WORD[shown.services.database.status]}
                    sub={typeof shown.services.database.latencyMs === "number" ? `${shown.services.database.latencyMs} ms for a test query` : shown.services.database.detail}
                    tone={probeTone(shown.services.database.status, shown.services.database.latencyMs)}
                  />
                  <StatCard
                    stale={stale}
                    icon={<Wifi className="h-4 w-4" aria-hidden="true" />}
                    label="Cache (Redis)"
                    value={PROBE_WORD[shown.services.redis.status]}
                    sub={shown.services.redis.status === "not_configured" ? "Using in-memory cache" : typeof shown.services.redis.latencyMs === "number" ? `${shown.services.redis.latencyMs} ms to check` : shown.services.redis.detail}
                    tone={probeTone(shown.services.redis.status)}
                  />
                  <StatCard
                    stale={stale}
                    icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
                    label="Traffic · last 5 min"
                    value={`${requestsPerMinute(shown.traffic.last5m, 5)}/min`}
                    sub={`${shown.traffic.last5m.requests} requests · ${shown.traffic.last5m.errors5xx} server errors · 95% under ${shown.traffic.last5m.p95Ms} ms`}
                    tone={shown.traffic.last5m.requests >= THRESHOLDS.minRequestsForRates && shown.traffic.last5m.errorRate5xx >= THRESHOLDS.errorRateDegraded ? "bad" : shown.traffic.last5m.requests === 0 ? "muted" : "ok"}
                  />
                  <StatCard
                    stale={stale}
                    icon={<Cpu className="h-4 w-4" aria-hidden="true" />}
                    label="Server"
                    value={`Up ${formatUptime(shown.uptimeSeconds)}`}
                    sub={`Memory ${shown.process.rssMB}${shown.process.memoryLimitMB ? ` of ${shown.process.memoryLimitMB}` : ""} MB · pauses up to ${shown.process.eventLoopLag.p99Ms} ms`}
                    tone={shown.process.eventLoopLag.p99Ms >= THRESHOLDS.loopLagDegradedMs ? "warn" : "ok"}
                  />
                </div>

                <Card title="Traffic over the last hour" icon={<Activity className="h-4 w-4 text-orange-500" aria-hidden="true" />}>
                  <TrafficChart series={shown.traffic.series} />
                  <p className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-gray-400">Response time (95th percentile)</p>
                  <LatencyLine series={shown.traffic.series} />
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card title="Slowest routes" icon={<Gauge className="h-4 w-4 text-orange-500" aria-hidden="true" />}>
                    <RoutesTable caption="Slowest API routes by average response time" rows={shown.traffic.slowestRoutes} mode="slow" />
                  </Card>
                  <Card title="Routes with server errors" icon={<XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />}>
                    <RoutesTable caption="API routes that returned server errors" rows={shown.traffic.failingRoutes} mode="failing" />
                  </Card>
                </div>

                <Card title="Recent server errors" icon={<AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />}>
                  {shown.traffic.recentErrors.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">No server errors since the API started.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {shown.traffic.recentErrors.map((error, index) => (
                        <li key={`${error.at}-${index}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm">
                          <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-700">{error.status}</span>
                          <span className="font-mono text-xs text-gray-800">{error.method} {error.path}</span>
                          <span className="text-xs text-gray-400">{formatRelative(error.at, now)}</span>
                          {error.message && <span className="w-full text-xs text-gray-500">{error.message}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </>
            )}

            <Card
              title="Live changes"
              icon={<History className="h-4 w-4 text-orange-500" aria-hidden="true" />}
              action={<Link href="/admin/logs" className="text-xs font-bold text-orange-600 hover:underline">Full activity log</Link>}
            >
              {activity.isError ? (
                <p className="py-4 text-center text-sm text-gray-400">The activity feed is unavailable right now.</p>
              ) : !activity.data ? (
                <div className="h-16 animate-pulse rounded-xl bg-gray-100" aria-busy="true" />
              ) : activity.data.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">No admin changes recorded yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100" data-testid="live-activity">
                  {activity.data.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm">
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-bold capitalize text-gray-700">{row.action}</span>
                      <span className="text-gray-800">{row.entity}{row.entityName ? ` · ${row.entityName}` : ""}</span>
                      <span className="text-xs text-gray-400">by {row.adminName ?? "system"} · {formatRelative(row.createdAt, now)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {shown && (
              <p className="text-xs text-gray-400">
                {shown.note} Running as <span className="font-semibold">{shown.runtime.role}</span> on Node {shown.runtime.nodeVersion} ({shown.runtime.cpuCores} CPU).
                {" "}Backup sync is {shown.backup.enabled ? `on (last run ${formatRelative(shown.backup.lastRunAt, now)})` : "off"}.
              </p>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
