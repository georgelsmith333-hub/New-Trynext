import { beforeEach, describe, expect, it, vi } from "vitest";

const { valuesMock, loggerErrorMock } = vi.hoisted(() => ({
  valuesMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  db: { insert: vi.fn(() => ({ values: valuesMock })) },
  adminActivityLogsTable: {},
}));

vi.mock("./logger", () => ({
  logger: { error: loggerErrorMock },
}));

import { logActivity, redactActivityData } from "./activityLog";

const baseOptions = {
  action: "update" as const,
  entity: "setting",
  entityId: 0,
  entityName: "Site Settings",
  adminId: 1,
  before: { removeBgApiKey: "test-only-old-value", title: "Before" },
  after: { metaCapiToken: "test-only-new-value", title: "After" },
};

describe("activity-log secret redaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    valuesMock.mockResolvedValue(undefined);
  });

  it("redacts sensitive nested fields while preserving safe values and dates", () => {
    const timestamp = new Date("2026-10-20T00:00:00Z");
    const data = {
      removeBgApiKey: "test-only-secret",
      nested: { authorization: "test-only-header", featureEnabled: true },
      entries: [{ smtp_password: "test-only-password", label: "preview" }],
      timestamp,
    };

    expect(redactActivityData(data)).toEqual({
      removeBgApiKey: "[REDACTED]",
      nested: { authorization: "[REDACTED]", featureEnabled: true },
      entries: [{ smtp_password: "[REDACTED]", label: "preview" }],
      timestamp,
    });
    expect(data.removeBgApiKey).toBe("test-only-secret");
  });

  it("marks cycles safely and does not throw while persisting a circular snapshot", async () => {
    const circular: Record<string, unknown> = { apiKey: "test-only-secret" };
    circular.self = circular;

    expect(redactActivityData(circular)).toEqual({
      apiKey: "[REDACTED]",
      self: "[Circular]",
    });
    await expect(
      logActivity({ ...baseOptions, before: circular }),
    ).resolves.toBeUndefined();
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        before: { apiKey: "[REDACTED]", self: "[Circular]" },
      }),
    );
  });

  it("persists only redacted before/after snapshots", async () => {
    await logActivity(baseOptions);

    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        before: { removeBgApiKey: "[REDACTED]", title: "Before" },
        after: { metaCapiToken: "[REDACTED]", title: "After" },
      }),
    );
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it("does not include snapshots or error text in activity-log failure diagnostics", async () => {
    valuesMock.mockRejectedValueOnce(new Error("test-only database failure"));

    await logActivity(baseOptions);

    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    const loggedFields = loggerErrorMock.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(loggedFields).toMatchObject({
      action: "update",
      entity: "setting",
      entityId: "0",
    });
    expect(JSON.stringify(loggedFields)).not.toContain("test-only-old-value");
    expect(JSON.stringify(loggedFields)).not.toContain("test-only-new-value");
    expect(JSON.stringify(loggedFields)).not.toContain(
      "test-only database failure",
    );
  });
});
