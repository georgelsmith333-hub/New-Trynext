import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Admin-facing config and history for the scheduler jobs in scheduler.ts.
 * Those jobs (daily summary, low-stock alert, stale-order alert, revenue
 * milestones, keep-alive, backup sync) already ran with hardcoded thresholds
 * and no way for an admin to see they exist, turn one off, or check whether
 * it actually fired — the only visible trace was a Telegram message or a
 * server log line. This stores the admin-editable config and a capped event
 * log in the settings table (same pattern as homepage_layout), so no schema
 * migration is needed.
 */

export type AutomationJobId =
  | "dailySummary"
  | "lowStock"
  | "staleOrders"
  | "revenueMilestones"
  | "keepAlive";

export interface AutomationConfig {
  dailySummaryEnabled: boolean;
  lowStockEnabled: boolean;
  lowStockThreshold: number;
  staleOrdersEnabled: boolean;
  staleOrdersHours: number;
  revenueMilestonesEnabled: boolean;
  keepAliveEnabled: boolean;
}

export const DEFAULT_AUTOMATION_CONFIG: AutomationConfig = {
  dailySummaryEnabled: true,
  lowStockEnabled: true,
  lowStockThreshold: 3,
  staleOrdersEnabled: true,
  staleOrdersHours: 24,
  revenueMilestonesEnabled: true,
  keepAliveEnabled: true,
};

const CONFIG_KEY = "automation_config";
const LOG_KEY = "automation_log";
const MAX_LOG_ENTRIES = 100;

export interface AutomationLogEntry {
  id: string;
  job: AutomationJobId;
  at: string; // ISO timestamp
  summary: string;
  triggeredBy: "schedule" | "manual";
}

let cachedConfig: AutomationConfig | null = null;
let cachedConfigAtMs = 0;
const CONFIG_CACHE_TTL_MS = 30_000;

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}

function coerceConfig(raw: unknown): AutomationConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof AutomationConfig, unknown>>;
  return {
    dailySummaryEnabled: r.dailySummaryEnabled !== false,
    lowStockEnabled: r.lowStockEnabled !== false,
    lowStockThreshold: clampInt(r.lowStockThreshold, 0, 1000, DEFAULT_AUTOMATION_CONFIG.lowStockThreshold),
    staleOrdersEnabled: r.staleOrdersEnabled !== false,
    staleOrdersHours: clampInt(r.staleOrdersHours, 1, 240, DEFAULT_AUTOMATION_CONFIG.staleOrdersHours),
    revenueMilestonesEnabled: r.revenueMilestonesEnabled !== false,
    keepAliveEnabled: r.keepAliveEnabled !== false,
  };
}

/** Cached for 30s so the once-a-minute scheduler tick doesn't hit the DB on
 *  every single job check; the admin UI calls getAutomationConfig(true) to
 *  always read fresh after a save. */
export async function getAutomationConfig(forceFresh = false): Promise<AutomationConfig> {
  if (!forceFresh && cachedConfig && Date.now() - cachedConfigAtMs < CONFIG_CACHE_TTL_MS) {
    return cachedConfig;
  }
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, CONFIG_KEY)).limit(1);
    const parsed = row?.value ? JSON.parse(row.value) : {};
    cachedConfig = coerceConfig(parsed);
  } catch (err) {
    logger.warn({ err }, "[automation] Failed to load config, using defaults");
    cachedConfig = { ...DEFAULT_AUTOMATION_CONFIG };
  }
  cachedConfigAtMs = Date.now();
  return cachedConfig;
}

export async function setAutomationConfig(partial: Partial<AutomationConfig>): Promise<AutomationConfig> {
  const current = await getAutomationConfig(true);
  const next = coerceConfig({ ...current, ...partial });
  await db.insert(settingsTable).values({ key: CONFIG_KEY, value: JSON.stringify(next) })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: JSON.stringify(next), updatedAt: new Date() } });
  cachedConfig = next;
  cachedConfigAtMs = Date.now();
  return next;
}

export async function appendAutomationLog(entry: Omit<AutomationLogEntry, "id" | "at">): Promise<void> {
  try {
    const full: AutomationLogEntry = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: new Date().toISOString() };
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, LOG_KEY)).limit(1);
    const existing: AutomationLogEntry[] = row?.value ? JSON.parse(row.value) : [];
    const next = [full, ...existing].slice(0, MAX_LOG_ENTRIES);
    await db.insert(settingsTable).values({ key: LOG_KEY, value: JSON.stringify(next) })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value: JSON.stringify(next), updatedAt: new Date() } });
  } catch (err) {
    logger.warn({ err }, "[automation] Failed to append log entry");
  }
}

export async function getAutomationLog(): Promise<AutomationLogEntry[]> {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, LOG_KEY)).limit(1);
    return row?.value ? JSON.parse(row.value) : [];
  } catch (err) {
    logger.warn({ err }, "[automation] Failed to load log");
    return [];
  }
}

// In-memory only (does not need to survive a restart): when each job last
// actually ran its check, regardless of whether it fired anything. This is
// what proves to an admin the scheduler tick is alive, not just that an
// alert happened to fire recently.
const lastCheckedMs: Partial<Record<AutomationJobId, number>> = {};
export function markJobChecked(job: AutomationJobId): void {
  lastCheckedMs[job] = Date.now();
}
export function getLastCheckedMs(): Partial<Record<AutomationJobId, number>> {
  return { ...lastCheckedMs };
}
