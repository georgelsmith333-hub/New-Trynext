/**
 * Resilient PostgreSQL connection with automatic failover.
 *
 * Priority order for connection URLs:
 *   1. DATABASE_URL_MAIN     (Neon primary — transactional source)
 *   2. DATABASE_FAILOVER     (Neon failover — transactional standby)
 *   3. DATABASE_ANALYTICS     (full mirror — preserves orders and admin data)
 *   4. DATABASE_URL_TRYNEXT_DB (Neon secondary — transactional standby)
 *   5. DATABASE_URL            (Replit built-in — local development last resort)
 *
 * DATABASE_PRODUCTS is intentionally excluded from this chain. It is a catalog
 * satellite and may not contain orders, admin data, or the current schema.
 *
 * The probe validates that a connection both connects AND has the expected
 * transactional schema (`products` and `orders`). This prevents a catalog-only
 * database from silently becoming the live source of truth.
 *
 * Startup probes candidates sequentially and stops at the first reachable
 * transactional schema. Recovery probes are connection-error-driven with
 * bounded backoff; a healthy primary is not periodically scanned. Candidate
 * order is the operator-approved authority order. Schema reachability alone
 * does not prove that independent databases are synchronized or safe to write.
 * All callers use the same `db` and `pool` exports.
 */

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { watchPoolConnectionErrors } from "./poolRecovery";
import {
  CONNECTION_ERROR_PROBE_DELAY_MS,
  FAILBACK_RETRY_INITIAL_MS,
  FAILBACK_RETRY_MAX_MS,
  RECOVERY_RETRY_INITIAL_MS,
  RECOVERY_RETRY_MAX_MS,
  findFirstReachable,
  higherPriorityCandidateIndexes,
  nextBackoffDelayMs,
} from "./probePolicy";

const { Pool } = pg;

/* ─── Candidate URL resolution ───────────────────────────────────────────── */
function getCandidateUrls(): string[] {
  const candidates = [
    process.env.DATABASE_URL_MAIN,      // Neon primary — preferred production DB
    process.env.DATABASE_FAILOVER,      // Neon failover — ep-crimson-dawn
    process.env.DATABASE_ANALYTICS,     // Full mirror — preserves historical orders/admin data
    process.env.DATABASE_URL_TRYNEXT_DB, // Neon secondary (if configured)
    process.env.DATABASE_URL,           // Replit built-in — last resort
  ].filter((url): url is string => typeof url === "string" && url.trim().length > 0);

  // Preserve insertion order, deduplicate
  return [...new Set(candidates)];
}

const urls = getCandidateUrls();

if (urls.length === 0) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const primaryUrl = urls[0];

/* ─── Pool error guard ───────────────────────────────────────────────────── */
// pg emits "error" on a Pool when the server drops an idle client (Postgres
// restart, failover, Neon idle suspend). With no listener Node treats that as
// an uncaught exception and kills the whole API process. pg discards the
// broken client and opens a new one on demand, so log and carry on.
function guardPool(p: pg.Pool, label: string): pg.Pool {
  p.on("error", (err: Error & { code?: unknown }) => {
    console.warn(
      `[DB] ${label}: idle client error ignored (${typeof err.code === "string" ? err.code : "unknown"}); reconnecting on demand`,
    );
  });
  return p;
}

/* ─── Internal mutable state (switched on failover) ─────────────────────── */
let _activePool: pg.Pool = guardPool(new Pool({
  connectionString: primaryUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
}), "active");

let _activeDb: NodePgDatabase<typeof schema> = drizzle(_activePool, { schema });
let _activeUrl = primaryUrl;
watchActivePool(_activePool);

/* ─── Transparent proxies (callers see a stable reference) ──────────────── */
export const pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    return (_activePool as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    return (_activeDb as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/* ─── Schema validation helper ───────────────────────────────────────────── */
/**
 * Returns true if this pool can connect AND the database has both tables
 * required for transactional operation: products and orders.
 */
type ProbeResult = {
  ok: boolean;
  pool?: pg.Pool;
  error?: string;
};

async function hasSchema(testPool: pg.Pool): Promise<{ products: boolean; orders: boolean }> {
  const client = await testPool.connect();
  try {
    const result = await client.query(
      `SELECT
         EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AS products,
         EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='orders') AS orders`
    );
    return result.rows[0] ?? { products: false, orders: false };
  } finally {
    client.release();
  }
}

/* ─── Probe a single candidate URL (creates and ends its own test pool) ─── */
async function probeCandidate(url: string): Promise<ProbeResult> {
  // A probe pool that wins becomes the active pool, so it needs the guard too.
  const testPool = guardPool(new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 10_000 }), "probe");
  try {
    const schema = await hasSchema(testPool);
    if (!schema.products || !schema.orders) {
      await testPool.end().catch(() => {});
      const missing = [!schema.products ? "products" : null, !schema.orders ? "orders" : null].filter(Boolean).join(", ");
      return { ok: false, error: `missing transactional schema: ${missing}` };
    }
    return { ok: true, pool: testPool };
  } catch (err) {
    await testPool.end().catch(() => {});
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

type Candidate = { url: string; result: ProbeResult; index: number };

async function chooseBestCandidate(candidateIndexes = urls.map((_, index) => index)): Promise<Candidate | null> {
  const selected = await findFirstReachable(candidateIndexes, async (index) => {
    const url = urls[index];
    if (!url) return null;
    const result = await probeCandidate(url);
    return result.ok && result.pool ? { url, result, index } : null;
  });
  return selected?.value ?? null;
}

function hostOf(url: string): string {
  return url.split("@").pop()?.split("?")[0] ?? "unknown";
}

/* ─── Switch the active pool to a new URL (thread-safe-ish by design) ───── */
async function switchTo(url: string, pool: pg.Pool): Promise<void> {
  const prev = _activePool;
  _activePool = pool;
  _activeDb = drizzle(_activePool, { schema });
  _activeUrl = url;
  watchActivePool(_activePool);
  await prev.end().catch(() => {});
}

/* ─── Non-blocking startup probe + failover ─────────────────────────────── */
async function probeAndFailover(): Promise<boolean> {
  const winner = await chooseBestCandidate();
  if (!winner) {
    console.error(
      "[DB] WARNING: All database connection candidates failed at probe time. " +
      "The server will still start — recovery will retry with bounded backoff.",
    );
    return false;
  }
  await switchTo(winner.url, winner.result.pool!);
  const label = winner.index === 0 ? "primary" : `candidate #${winner.index + 1}`;
  console.info(`[DB] Connected to ${label} (${hostOf(winner.url)}; transactional schema verified)`);
  return true;
}

/* ─── Error-triggered recovery; no recurring probe while the primary is healthy ─ */
type RecoveryScope = "all" | "higher-priority";
let recoveryTimer: NodeJS.Timeout | null = null;
let recoveryScope: RecoveryScope = "all";
let recoveryProbeInFlight = false;
let recoveryRetryDelayMs = 0;
let failbackRetryDelayMs = 0;

function scheduleRecoveryProbe(scope: RecoveryScope, delayMs: number, replace = false): void {
  if (recoveryTimer) {
    if (!replace) return;
    clearTimeout(recoveryTimer);
    recoveryTimer = null;
  }
  recoveryScope = scope;
  recoveryTimer = setTimeout(() => {
    recoveryTimer = null;
    void runRecoveryProbe(recoveryScope);
  }, delayMs);
  recoveryTimer.unref();
}

function requestRecoveryProbe(): void {
  if (recoveryProbeInFlight) return;
  // Coalesce bursts and do not let repeated errors defeat a failed-probe backoff.
  // An actual active-pool error can, however, accelerate a scheduled failback check.
  if (recoveryTimer && recoveryScope === "all") return;
  scheduleRecoveryProbe("all", CONNECTION_ERROR_PROBE_DELAY_MS, true);
}

function watchActivePool(activePool: pg.Pool): void {
  const onConnectionError = () => {
    if (activePool === _activePool) requestRecoveryProbe();
  };
  watchPoolConnectionErrors(activePool, onConnectionError);
}

function scheduleFailbackProbe(): void {
  const activeIndex = urls.indexOf(_activeUrl);
  if (higherPriorityCandidateIndexes(activeIndex).length === 0) return;
  failbackRetryDelayMs = failbackRetryDelayMs || FAILBACK_RETRY_INITIAL_MS;
  scheduleRecoveryProbe("higher-priority", failbackRetryDelayMs);
}

async function runRecoveryProbe(scope: RecoveryScope): Promise<void> {
  if (recoveryProbeInFlight) return;
  const activeIndex = urls.indexOf(_activeUrl);
  const candidateIndexes = scope === "higher-priority"
    ? higherPriorityCandidateIndexes(activeIndex)
    : urls.map((_, index) => index);
  if (candidateIndexes.length === 0) return;

  recoveryProbeInFlight = true;
  try {
    const winner = await chooseBestCandidate(candidateIndexes);
    if (!winner) {
      if (scope === "higher-priority") {
        failbackRetryDelayMs = nextBackoffDelayMs(
          failbackRetryDelayMs,
          FAILBACK_RETRY_INITIAL_MS,
          FAILBACK_RETRY_MAX_MS,
        );
        scheduleRecoveryProbe(scope, failbackRetryDelayMs);
      } else {
        recoveryRetryDelayMs = nextBackoffDelayMs(
          recoveryRetryDelayMs,
          RECOVERY_RETRY_INITIAL_MS,
          RECOVERY_RETRY_MAX_MS,
        );
        scheduleRecoveryProbe(scope, recoveryRetryDelayMs);
      }
      return;
    }

    if (winner.url === _activeUrl) {
      await winner.result.pool!.end().catch(() => {});
    } else {
      const previousHost = hostOf(_activeUrl);
      await switchTo(winner.url, winner.result.pool!);
      const label = winner.index === 0 ? "primary" : `candidate #${winner.index + 1}`;
      console.warn(`[DB] Recovery probe switched from ${previousHost} to ${label} (${hostOf(winner.url)})`);
    }

    recoveryRetryDelayMs = 0;
    if (urls.indexOf(_activeUrl) === 0) {
      failbackRetryDelayMs = 0;
    } else {
      failbackRetryDelayMs = FAILBACK_RETRY_INITIAL_MS;
    }
  } catch {
    console.warn("[DB] Recovery probe failed; retrying with bounded backoff");
    if (scope === "higher-priority") {
      failbackRetryDelayMs = nextBackoffDelayMs(failbackRetryDelayMs, FAILBACK_RETRY_INITIAL_MS, FAILBACK_RETRY_MAX_MS);
      scheduleRecoveryProbe(scope, failbackRetryDelayMs);
    } else {
      recoveryRetryDelayMs = nextBackoffDelayMs(recoveryRetryDelayMs, RECOVERY_RETRY_INITIAL_MS, RECOVERY_RETRY_MAX_MS);
      scheduleRecoveryProbe(scope, recoveryRetryDelayMs);
    }
  } finally {
    recoveryProbeInFlight = false;
    if (!recoveryTimer && urls.indexOf(_activeUrl) > 0) scheduleFailbackProbe();
  }
}

/**
 * Manually trigger a re-probe of the whole database chain. Useful in tests
 * and admin endpoints that want to force a failover check.
 */
export async function probeDatabaseChain(): Promise<{ activeUrl: string; index: number }> {
  if (recoveryTimer) {
    clearTimeout(recoveryTimer);
    recoveryTimer = null;
  }
  await runRecoveryProbe("all");
  return { activeUrl: _activeUrl, index: urls.indexOf(_activeUrl) };
}

// Exported promise — await this before running migrations or seeding
// so the correct database is active before any schema queries run.
export const dbReady: Promise<void> = probeAndFailover()
  .then((connected) => {
    if (connected) {
      scheduleFailbackProbe();
    } else {
      recoveryRetryDelayMs = RECOVERY_RETRY_INITIAL_MS;
      scheduleRecoveryProbe("all", recoveryRetryDelayMs);
    }
  })
  .catch(() => {
    recoveryRetryDelayMs = RECOVERY_RETRY_INITIAL_MS;
    scheduleRecoveryProbe("all", recoveryRetryDelayMs);
  });

/* ─── DB health helper (used by /api/health/auth) ───────────────────────── */
export async function getActiveDbUrl(): Promise<string> {
  return _activeUrl;
}

export * from "./schema";
