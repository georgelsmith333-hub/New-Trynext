import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/adminAuth";
import { getAutomationConfig, setAutomationConfig, getAutomationLog, DEFAULT_AUTOMATION_CONFIG } from "../lib/automationConfig";
import { getAutomationStatus, runAutomationJobNow, getBackupSyncStatus } from "../lib/scheduler";
import { tgIsConfigured } from "../lib/telegram";

const router: IRouter = Router();

const VALID_JOBS = ["dailySummary", "lowStock", "staleOrders", "revenueMilestones", "keepAlive"] as const;
type JobId = (typeof VALID_JOBS)[number];

/** Full picture for the Automation Center: config, last-checked timestamps
 *  per job, whether Telegram delivery is even configured, and backup-sync
 *  status (the one automation job that isn't Telegram-gated). */
router.get("/admin/automation/status", requireAdmin, async (req, res) => {
  try {
    const [config, status, log] = await Promise.all([
      getAutomationConfig(true),
      Promise.resolve(getAutomationStatus()),
      getAutomationLog(),
    ]);
    res.json({
      config,
      defaults: DEFAULT_AUTOMATION_CONFIG,
      telegramConfigured: tgIsConfigured(),
      lastCheckedMs: status.lastCheckedMs,
      backupSync: getBackupSyncStatus(),
      log: log.slice(0, 20),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to load automation status");
    res.status(500).json({ error: "internal_error", message: "Failed to load automation status" });
  }
});

router.put("/admin/automation/config", requireAdmin, async (req, res) => {
  try {
    const body = req.body ?? {};
    const allowedKeys: (keyof typeof DEFAULT_AUTOMATION_CONFIG)[] = [
      "dailySummaryEnabled", "lowStockEnabled", "lowStockThreshold",
      "staleOrdersEnabled", "staleOrdersHours", "revenueMilestonesEnabled", "keepAliveEnabled",
    ];
    const partial: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (key in body) partial[key] = body[key];
    }
    const next = await setAutomationConfig(partial);
    res.json({ success: true, config: next });
  } catch (err) {
    req.log.error({ err }, "Failed to update automation config");
    res.status(500).json({ error: "internal_error", message: "Failed to update automation config" });
  }
});

router.get("/admin/automation/log", requireAdmin, async (req, res) => {
  try {
    const log = await getAutomationLog();
    res.json({ log });
  } catch (err) {
    req.log.error({ err }, "Failed to load automation log");
    res.status(500).json({ error: "internal_error", message: "Failed to load automation log" });
  }
});

/** Forces the named job to run immediately, bypassing its normal dedup
 *  window, so an admin can verify a job actually works without waiting for
 *  its scheduled hour. Uses the exact same code path as the real schedule. */
router.post("/admin/automation/run/:job", requireAdmin, async (req, res) => {
  const job = req.params.job as JobId;
  if (!VALID_JOBS.includes(job)) {
    res.status(400).json({ error: "validation_error", message: `Unknown job: ${job}` });
    return;
  }
  try {
    await runAutomationJobNow(job);
    const log = await getAutomationLog();
    res.json({ success: true, log: log.slice(0, 20) });
  } catch (err) {
    req.log.error({ err, job }, "Failed to run automation job");
    res.status(500).json({ error: "internal_error", message: "Job run failed" });
  }
});

export default router;
