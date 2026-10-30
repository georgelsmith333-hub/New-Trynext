import { appendAutomationLog, markJobChecked } from "./automationConfig";
import { logger } from "./logger";
import { tgIsConfigured, tgSend } from "./telegram";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const WARNING_RATIO = 0.8;
const CRITICAL_RATIO = 0.9;
const FREE_PLAN_LIMITS = {
  compute_time_seconds: 100 * 60 * 60,
  data_transfer_bytes: 5 * 1024 ** 3,
  logical_size_for_root_bytes: 1 * 1024 ** 3,
} as const;

type MetricName = keyof typeof FREE_PLAN_LIMITS;
type UsagePayload = Record<string, unknown>;

let lastCheckMs = 0;
const alerted = new Map<string, string>();

function enabled(): boolean {
  return Boolean(process.env.NEON_API_KEY && process.env.NEON_PROJECT_ID)
    && process.env.NEON_MONITOR_ENABLED !== "false";
}

async function getJson(path: string): Promise<UsagePayload> {
  const response = await fetch(`https://console.neon.tech/api/v2${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.NEON_API_KEY}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Neon API returned ${response.status} for ${path}`);
  return response.json() as Promise<UsagePayload>;
}

function ratioFor(metric: MetricName, project: UsagePayload, consumption: UsagePayload): number {
  const raw = metric === "logical_size_for_root_bytes"
    ? consumption[metric]
    : project[metric] ?? consumption[metric];
  const value = typeof raw === "number" ? raw : Number(raw ?? 0);
  return Number.isFinite(value) ? value / FREE_PLAN_LIMITS[metric] : 0;
}

async function notify(message: string): Promise<void> {
  logger.warn({ message }, "[neon-monitor] threshold alert");
  if (tgIsConfigured()) await tgSend(message);
}

export async function checkNeonUsage(force = false): Promise<void> {
  markJobChecked("neonQuota");
  if (!enabled()) return;
  if (!force && Date.now() - lastCheckMs < CHECK_INTERVAL_MS) return;
  lastCheckMs = Date.now();

  try {
    const projectId = process.env.NEON_PROJECT_ID!;
    const [projectResponse, consumption] = await Promise.all([
      getJson(`/projects/${projectId}`),
      getJson(`/projects/${projectId}/consumption`),
    ]);
    const project = (projectResponse.project ?? projectResponse) as UsagePayload;
    const alerts: string[] = [];

    for (const metric of Object.keys(FREE_PLAN_LIMITS) as MetricName[]) {
      const ratio = ratioFor(metric, project, consumption);
      const level = ratio >= CRITICAL_RATIO ? "critical" : ratio >= WARNING_RATIO ? "warning" : "normal";
      const previous = alerted.get(metric);
      if (level !== "normal" && previous !== level) {
        alerted.set(metric, level);
        alerts.push(`${metric}=${Math.round(ratio * 100)}% (${level})`);
      } else if (level === "normal" && previous) {
        alerted.delete(metric);
      }
    }

    const standbyBranch = process.env.NEON_STANDBY_BRANCH_ID;
    if (standbyBranch) {
      const standby = await getJson(`/projects/${projectId}/branches/${standbyBranch}`);
      const standbyBranchData = (standby.branch ?? standby) as UsagePayload;
      const state = String(standbyBranchData.current_state ?? "unknown");
      if (state !== "ready") alerts.push(`standby branch state=${state}`);
    }

    if (alerts.length > 0) {
      const message = `Trynext Neon monitor\n${alerts.join("\n")}\nPrimary: ${project.name ?? projectId}`;
      await notify(message);
      await appendAutomationLog({
        job: "neonQuota",
        triggeredBy: "schedule",
        summary: alerts.join("; ") + (tgIsConfigured() ? " (Telegram sent)" : " (logged; Telegram not configured)"),
      });
    } else {
      logger.info({ projectId }, "[neon-monitor] usage and standby checks normal");
    }
  } catch (err) {
    logger.error({ err }, "[neon-monitor] usage check failed");
    await appendAutomationLog({
      job: "neonQuota",
      triggeredBy: "schedule",
      summary: `Monitor failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
