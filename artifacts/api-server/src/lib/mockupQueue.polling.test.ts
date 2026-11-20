import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const queryBuilder: any = {};
  queryBuilder.from = vi.fn(() => queryBuilder);
  queryBuilder.where = vi.fn(() => queryBuilder);
  queryBuilder.orderBy = vi.fn(() => queryBuilder);
  queryBuilder.limit = vi.fn(async () => []);
  queryBuilder.values = vi.fn(async () => undefined);

  const tx = {
    select: vi.fn(() => queryBuilder),
    update: vi.fn(() => queryBuilder),
  };
  const db = {
    select: vi.fn(() => queryBuilder),
    transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
    insert: vi.fn(() => queryBuilder),
    update: vi.fn(() => queryBuilder),
  };

  return {
    db,
    tx,
    queryBuilder,
    mockupJobsTable: { id: "id", status: "status", createdAt: "createdAt" },
    mockupTemplatesTable: { id: "id" },
    objectStorageSaveBuffer: vi.fn(async () => "stored/mockup-artwork.png"),
  };
});

vi.mock("@workspace/db", () => ({
  db: mocks.db,
  mockupJobsTable: mocks.mockupJobsTable,
  mockupTemplatesTable: mocks.mockupTemplatesTable,
}));
vi.mock("drizzle-orm", () => ({
  and: vi.fn((...conditions: unknown[]) => conditions),
  eq: vi.fn((column: unknown, value: unknown) => [column, value]),
  notInArray: vi.fn((column: unknown, values: unknown[]) => [column, values]),
}));
vi.mock("./logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("./objectStorage", () => ({
  ObjectStorageService: class {
    saveBuffer = mocks.objectStorageSaveBuffer;
  },
}));
vi.mock("./mockupRenderer", () => ({
  getMockupRenderer: vi.fn(),
  RendererNotConfiguredError: class extends Error {},
}));

let startMockupWorker: typeof import("./mockupQueue").startMockupWorker;
let enqueueRenderJob: typeof import("./mockupQueue").enqueueRenderJob;
let mockupRetryDelayMs: typeof import("./mockupQueue").mockupRetryDelayMs;
let mockupAttemptHasRetryBudget: typeof import("./mockupQueue").mockupAttemptHasRetryBudget;

async function flushMicrotasks(): Promise<void> {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

describe("mockup worker free-tier polling policy", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-20T17:00:00.000Z"));
    vi.clearAllMocks();
    mocks.queryBuilder.limit.mockResolvedValue([]);
    mocks.queryBuilder.values.mockResolvedValue(undefined);
    mocks.objectStorageSaveBuffer.mockResolvedValue("stored/mockup-artwork.png");

    const queue = await import("./mockupQueue");
    startMockupWorker = queue.startMockupWorker;
    enqueueRenderJob = queue.enqueueRenderJob;
    mockupRetryDelayMs = queue.mockupRetryDelayMs;
    mockupAttemptHasRetryBudget = queue.mockupAttemptHasRetryBudget;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("checks for durable work once at startup and performs no recurring idle query", async () => {
    startMockupWorker();
    await flushMicrotasks();

    expect(mocks.db.transaction).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);

    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(mocks.db.transaction).toHaveBeenCalledTimes(1);
  });

  it("wakes a running worker after the durable enqueue path inserts a job", async () => {
    startMockupWorker();
    await flushMicrotasks();
    expect(mocks.db.transaction).toHaveBeenCalledTimes(1);
    mocks.db.transaction.mockClear();

    mocks.queryBuilder.limit
      .mockResolvedValueOnce([{
        id: 7,
        active: true,
        smartObjectId: "smart-object-7",
        version: 1,
      }])
      .mockResolvedValueOnce([]);

    await enqueueRenderJob({
      templateId: 7,
      artworkBytes: Buffer.from("test-artwork"),
      artworkExt: "png",
    });
    await flushMicrotasks();

    expect(mocks.db.insert).toHaveBeenCalledTimes(1);
    expect(mocks.db.transaction).toHaveBeenCalledTimes(1);
  });

  it("retries transient claim errors with one-shot exponential delays, then returns to idle", async () => {
    mocks.db.transaction
      .mockRejectedValueOnce(new Error("temporary database failure"))
      .mockRejectedValueOnce(new Error("temporary database failure"));

    startMockupWorker();
    await flushMicrotasks();
    expect(mocks.db.transaction).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);

    await vi.advanceTimersByTimeAsync(30_000);
    await flushMicrotasks();
    expect(mocks.db.transaction).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(1);

    await vi.advanceTimersByTimeAsync(59_999);
    await flushMicrotasks();
    expect(mocks.db.transaction).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    await flushMicrotasks();
    expect(mocks.db.transaction).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);

    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(mocks.db.transaction).toHaveBeenCalledTimes(3);
  });

  it("uses bounded exponential delays for failed-job retries", () => {
    expect(mockupRetryDelayMs(1)).toBe(30_000);
    expect(mockupRetryDelayMs(2)).toBe(60_000);
    expect(mockupRetryDelayMs(3)).toBe(120_000);
    expect(mockupRetryDelayMs(10)).toBe(5 * 60_000);
  });

  it("does not schedule another render once the max attempt count is reached", () => {
    expect(mockupAttemptHasRetryBudget(0, 3)).toBe(true);
    expect(mockupAttemptHasRetryBudget(1, 3)).toBe(true);
    expect(mockupAttemptHasRetryBudget(2, 3)).toBe(false);
    expect(mockupAttemptHasRetryBudget(0, 1)).toBe(false);
  });
});
