import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAutomationConfig: vi.fn(async () => ({
    dailySummaryEnabled: true,
    lowStockEnabled: true,
    lowStockThreshold: 3,
    staleOrdersEnabled: true,
    staleOrdersHours: 24,
    revenueMilestonesEnabled: true,
  })),
  appendAutomationLog: vi.fn(async () => {}),
  markJobChecked: vi.fn(),
  getLastCheckedMs: vi.fn(() => ({})),
  checkNeonUsage: vi.fn(async () => {}),
  runBackupSync: vi.fn(async () => []),
  tgSend: vi.fn(async () => {}),
  tgIsConfigured: vi.fn(() => false),
}));

vi.mock("@workspace/db", () => ({
  db: {},
  ordersTable: {},
  productsTable: {},
}));
vi.mock("./logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("./telegram", () => ({ tgSend: mocks.tgSend, tgIsConfigured: mocks.tgIsConfigured }));
vi.mock("./dbBackupSync", () => ({ runBackupSync: mocks.runBackupSync }));
vi.mock("./automationConfig", () => ({
  getAutomationConfig: mocks.getAutomationConfig,
  appendAutomationLog: mocks.appendAutomationLog,
  markJobChecked: mocks.markJobChecked,
  getLastCheckedMs: mocks.getLastCheckedMs,
}));
vi.mock("./neonQuotaMonitor", () => ({ checkNeonUsage: mocks.checkNeonUsage }));

import { runAutomationJobNow, startScheduler } from "./scheduler";

describe("scheduler free-tier polling policy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-18T12:30:00.000Z"));
    vi.stubEnv("SCHEDULER_ENABLED", "true");
    vi.stubEnv("BACKUP_SYNC_ENABLED", "false");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok", { status: 200 })));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("does not automatically ping healthz or load automation config on minute ticks", async () => {
    startScheduler();
    await vi.advanceTimersByTimeAsync(61_000);

    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.getAutomationConfig).not.toHaveBeenCalled();
  });

  it("keeps an explicit manual keep-alive action available", async () => {
    await runAutomationJobNow("keepAlive");

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.appendAutomationLog).toHaveBeenCalledWith(expect.objectContaining({
      job: "keepAlive",
      triggeredBy: "manual",
    }));
  });
});
