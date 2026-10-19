import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const { settingsRows, insertedSettings } = vi.hoisted(() => ({
  settingsRows: [
    { key: "siteName", value: "TryNext" },
    { key: "themeColor", value: "#123456" },
    { key: "removeBgApiKey", value: "test-only-export-secret" },
    { key: "metaCapiToken", value: "test-only-export-token" },
  ],
  insertedSettings: [] as Array<Record<string, unknown>>,
}));

vi.mock("../middlewares/adminAuth", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("drizzle-orm", () => ({
  desc: (value: unknown) => value,
  sql: vi.fn(),
}));

vi.mock("../lib/dbBackupSync", () => ({
  repairTargetSchemas: vi.fn(),
  runBackupSync: vi.fn(),
}));

vi.mock("../lib/scheduler", () => ({
  getBackupSyncStatus: vi.fn(() => ({})),
  recordBackupSyncResults: vi.fn(),
}));

vi.mock("@workspace/db", () => {
  const ordersTable = { createdAt: "orders.createdAt" };
  const productsTable = {};
  const categoriesTable = {};
  const settingsTable = {};
  const blogPostsTable = {};

  return {
    db: {
      select: () => ({
        from: (table: unknown) => {
          if (table === ordersTable || table === productsTable) {
            return { orderBy: () => Promise.resolve([]) };
          }
          if (table === settingsTable) return Promise.resolve(settingsRows);
          if (table === blogPostsTable) return Promise.resolve([]);
          return Promise.resolve([]);
        },
      }),
      insert: () => ({
        values: (value: Record<string, unknown>) => {
          insertedSettings.push(value);
          return {
            onConflictDoNothing: () => Promise.resolve(),
            onConflictDoUpdate: () => Promise.resolve(),
          };
        },
      }),
    },
    ordersTable,
    productsTable,
    categoriesTable,
    settingsTable,
    blogPostsTable,
  };
});

import backupRouter from "./backup";

const app = express();
app.use(express.json());
app.use((req: any, _res, next) => {
  req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
  next();
});
app.use("/api", backupRouter);

describe("admin backup secret-setting boundary", () => {
  beforeEach(() => {
    insertedSettings.length = 0;
  });

  it("omits secret-like settings from the downloadable backup", async () => {
    const res = await request(app).get("/api/admin/backup/export").expect(200);

    expect(res.body.data.settings).toEqual([
      { key: "siteName", value: "TryNext" },
      { key: "themeColor", value: "#123456" },
    ]);
    expect(JSON.stringify(res.body)).not.toContain("test-only-export-secret");
    expect(JSON.stringify(res.body)).not.toContain("test-only-export-token");
  });

  it("skips secret-like settings on import and reports only the skipped count", async () => {
    const res = await request(app)
      .post("/api/admin/backup/import")
      .send({
        version: 1,
        data: {
          settings: [
            { key: "themeColor", value: "#abcdef" },
            { key: "removeBgApiKey", value: "test-only-import-secret" },
            { key: "externalAccessToken", value: "test-only-import-token" },
            { key: "missingValue" },
            { key: "objectValue", value: { unexpected: true } },
          ],
        },
      })
      .expect(200);

    expect(insertedSettings).toEqual([{ key: "themeColor", value: "#abcdef" }]);
    expect(res.body).toEqual({
      success: true,
      imported: { settings: 1, sensitiveSettingsSkipped: 2 },
    });
    expect(JSON.stringify(res.body)).not.toContain("test-only-import-secret");
    expect(JSON.stringify(res.body)).not.toContain("test-only-import-token");
  });
});
