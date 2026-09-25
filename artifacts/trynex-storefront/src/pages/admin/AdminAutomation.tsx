import { AdminLayout } from "@/components/layout/AdminLayout";
import { getAuthHeaders, getApiUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";
import {
  Zap, Loader2, Play, CheckCircle2, AlertTriangle, MessageCircleWarning,
  Sunrise, PackageX, Clock3, TrendingUp, HeartPulse, ShieldCheck, ShieldAlert,
} from "lucide-react";

interface AutomationConfig {
  dailySummaryEnabled: boolean;
  lowStockEnabled: boolean;
  lowStockThreshold: number;
  staleOrdersEnabled: boolean;
  staleOrdersHours: number;
  revenueMilestonesEnabled: boolean;
  keepAliveEnabled: boolean;
}

interface AutomationLogEntry {
  id: string;
  job: string;
  at: string;
  summary: string;
  triggeredBy: "schedule" | "manual";
}

interface BackupSyncStatus {
  lastRunMs: number;
  consecutiveFailures: number;
  circuitOpen: boolean;
}

interface AutomationStatusResponse {
  config: AutomationConfig;
  telegramConfigured: boolean;
  lastCheckedMs: Record<string, number>;
  backupSync: BackupSyncStatus;
  log: AutomationLogEntry[];
}

type JobId = "dailySummary" | "lowStock" | "staleOrders" | "revenueMilestones" | "keepAlive";

const JOBS: { id: JobId; name: string; description: string; icon: typeof Zap; schedule: string }[] = [
  { id: "dailySummary", name: "Daily Summary", description: "Orders, revenue and pending count sent every morning.", icon: Sunrise, schedule: "9:00 AM BST" },
  { id: "lowStock", name: "Low Stock Alert", description: "Warns when product stock drops at or below the threshold.", icon: PackageX, schedule: "10 AM & 8 PM BST" },
  { id: "staleOrders", name: "Stale Pending Orders", description: "Flags pending orders older than the configured window for follow-up.", icon: Clock3, schedule: "Every 2h BST" },
  { id: "revenueMilestones", name: "Revenue Milestones", description: "Celebrates when today's revenue crosses a threshold (৳10k–৳1M).", icon: TrendingUp, schedule: "Checked after every order" },
  { id: "keepAlive", name: "Keep-Alive Ping", description: "Self-pings the API so it doesn't cold-start on free-tier hosting.", icon: HeartPulse, schedule: "Every 14 min" },
];

function timeAgo(ms: number): string {
  if (!ms) return "never";
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

export default function AdminAutomation() {
  const { toast } = useToast();
  const [status, setStatus] = useState<AutomationStatusResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [runningJob, setRunningJob] = useState<JobId | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/api/admin/automation/status"), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Could not load automation status (HTTP ${res.status})`);
      const data = await res.json();
      setStatus(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load automation status.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const patchConfig = async (partial: Partial<AutomationConfig>, key: string) => {
    if (!status) return;
    setSavingKey(key);
    const prevConfig = status.config;
    setStatus({ ...status, config: { ...status.config, ...partial } });
    try {
      const res = await fetch(getApiUrl("/api/admin/automation/config"), {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (!res.ok) throw new Error(`Save failed (HTTP ${res.status})`);
      const data = await res.json();
      setStatus((s) => (s ? { ...s, config: data.config } : s));
    } catch (err) {
      setStatus((s) => (s ? { ...s, config: prevConfig } : s));
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  const runNow = async (job: JobId) => {
    setRunningJob(job);
    try {
      const res = await fetch(getApiUrl(`/api/admin/automation/run/${job}`), {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Run failed (HTTP ${res.status})`);
      const data = await res.json();
      toast({ title: "Job executed", description: "Check the event log below for the result." });
      setStatus((s) => (s ? { ...s, log: data.log } : s));
      void load();
    } catch (err) {
      toast({ title: "Run failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#fef3c7" }}>
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight text-gray-900">Automation Center</h1>
            <p className="text-sm text-gray-500 mt-1">Configure and monitor every background job running on your store.</p>
          </div>
        </div>

        {!status?.telegramConfigured && status && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <MessageCircleWarning className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Telegram is not configured</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Daily Summary, Low Stock, Stale Orders and Revenue Milestones send their alerts over Telegram. They will run
                and log to the event log below, but no message will be delivered until a bot token and chat ID are set.
              </p>
            </div>
          </div>
        )}

        {loadError ? (
          <div className="p-6 rounded-2xl bg-white border border-red-200 shadow-sm">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" /> {loadError}
            </div>
          </div>
        ) : !status ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading automation status…
          </div>
        ) : (
          <div className="space-y-4">
            {JOBS.map((job) => {
              const enabledKey = `${job.id}Enabled` as keyof AutomationConfig;
              const enabled = Boolean(status.config[enabledKey]);
              const lastChecked = status.lastCheckedMs[job.id];
              const Icon = job.icon;
              return (
                <div key={job.id} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: enabled ? "#f0fdf4" : "#f9fafb" }}>
                        <Icon className={`w-5 h-5 ${enabled ? "text-green-600" : "text-gray-400"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{job.name}</h3>
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{ background: "#f3f4f6", color: "#6b7280" }}>{job.schedule}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{job.description}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Last checked: <span className="font-semibold text-gray-500">{lastChecked ? timeAgo(lastChecked) : "not yet since server start"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void runNow(job.id)}
                        disabled={runningJob === job.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all hover:-translate-y-0.5 disabled:opacity-50"
                        style={{ background: "#f9fafb", borderColor: "#e5e7eb", color: "#374151" }}
                      >
                        {runningJob === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Run Now
                      </button>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => void patchConfig({ [enabledKey]: !enabled } as Partial<AutomationConfig>, enabledKey)}
                        disabled={savingKey === enabledKey}
                        className="relative w-11 h-6 rounded-full transition-colors disabled:opacity-50"
                        style={{ background: enabled ? "#16a34a" : "#d1d5db" }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                          style={{ transform: enabled ? "translateX(20px)" : "translateX(0)" }}
                        />
                      </button>
                    </div>
                  </div>

                  {job.id === "lowStock" && (
                    <div className="mt-4 flex items-center gap-3">
                      <label className="text-xs font-bold text-gray-600">Alert when stock ≤</label>
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        defaultValue={status.config.lowStockThreshold}
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n !== status.config.lowStockThreshold) {
                            void patchConfig({ lowStockThreshold: n }, "lowStockThreshold");
                          }
                        }}
                        className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-800"
                      />
                      <span className="text-xs text-gray-400">units</span>
                    </div>
                  )}

                  {job.id === "staleOrders" && (
                    <div className="mt-4 flex items-center gap-3">
                      <label className="text-xs font-bold text-gray-600">Flag pending orders older than</label>
                      <input
                        type="number"
                        min={1}
                        max={240}
                        defaultValue={status.config.staleOrdersHours}
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n !== status.config.staleOrdersHours) {
                            void patchConfig({ staleOrdersHours: n }, "staleOrdersHours");
                          }
                        }}
                        className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-800"
                      />
                      <span className="text-xs text-gray-400">hours</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Backup sync — config lives on env, but it's part of the same
                automation picture, so link across rather than duplicate it. */}
            <a href="/admin/backup" className="block p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:-translate-y-0.5 transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: status.backupSync.circuitOpen ? "#fef2f2" : "#f0fdf4" }}>
                  {status.backupSync.circuitOpen ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <ShieldCheck className="w-5 h-5 text-green-600" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">DB Backup Sync</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Mirrors to backup databases every 30 min. Last run: {timeAgo(status.backupSync.lastRunMs)}.
                    Manage thresholds and run manually on the Backup page →
                  </p>
                </div>
              </div>
            </a>

            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">Event Log</h3>
              {status.log.length === 0 ? (
                <p className="text-sm text-gray-400">No automation events yet. Use "Run Now" above to generate one.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {status.log.map((entry) => {
                    const job = JOBS.find((j) => j.id === entry.job);
                    return (
                      <div key={entry.id} className="flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: "#f9fafb" }}>
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-800">{job?.name ?? entry.job}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                              style={{ background: entry.triggeredBy === "manual" ? "#eff6ff" : "#f3f4f6", color: entry.triggeredBy === "manual" ? "#2563eb" : "#6b7280" }}>
                              {entry.triggeredBy}
                            </span>
                            <span className="text-[11px] text-gray-400">{new Date(entry.at).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{entry.summary}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
