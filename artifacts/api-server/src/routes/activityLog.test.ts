import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

let capturedShapes: Array<Record<string, unknown>> = [];
const rows = [
  { id: 2, adminId: 1, adminName: "admin", action: "create", entity: "category", entityId: 7, entityName: "Mugs", createdAt: new Date("2026-10-04T10:00:00Z") },
];

vi.mock("../middlewares/adminAuth", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../lib/activityLog", () => ({
  logActivity: vi.fn(),
  getAdminId: () => 1,
}));

vi.mock("@workspace/db", () => {
  const table = (name: string) => new Proxy({}, { get: (_t, column) => ({ name: `${name}.${String(column)}` }) });
  const listChain = {
    from: () => ({
      leftJoin: () => ({
        where: () => ({ orderBy: () => ({ limit: () => ({ offset: () => Promise.resolve(rows) }) }) }),
      }),
    }),
  };
  const countChain = { from: () => ({ where: () => Promise.resolve([{ count: 1 }]) }) };
  return {
    db: {
      select: (shape: Record<string, unknown>) => {
        capturedShapes.push(shape);
        return "count" in shape ? countChain : listChain;
      },
    },
    adminActivityLogsTable: table("admin_activity_logs"),
    adminTable: table("admin"),
    productsTable: table("products"),
    blogPostsTable: table("blog_posts"),
    categoriesTable: table("categories"),
    ordersTable: table("orders"),
    hamperPackagesTable: table("hamper_packages"),
    promoCodesTable: table("promo_codes"),
    reviewsTable: table("reviews"),
    settingsTable: table("settings"),
    customersTable: table("customers"),
  };
});

import activityLogRouter from "./activityLog";

const app = express();
app.use(express.json());
app.use((req: any, _res, next) => {
  req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
  next();
});
app.use("/api", activityLogRouter);

const listShape = () => capturedShapes.find((shape) => !("count" in shape)) ?? {};

describe("GET /api/admin/activity-logs", () => {
  beforeEach(() => {
    capturedShapes = [];
  });

  it("returns the full record snapshots by default, as the Activity Log page expects", async () => {
    const res = await request(app).get("/api/admin/activity-logs?limit=5").expect(200);
    expect(Object.keys(listShape())).toEqual(expect.arrayContaining(["id", "action", "entity", "before", "after"]));
    expect(res.body).toMatchObject({ total: 1, page: 1, limit: 5, logs: [{ id: 2, action: "create", entityName: "Mugs" }] });
  });

  it("leaves out the heavy before/after snapshots in summary mode", async () => {
    const res = await request(app).get("/api/admin/activity-logs?limit=8&summary=1").expect(200);
    const keys = Object.keys(listShape());
    expect(keys).toEqual(expect.arrayContaining(["id", "adminName", "action", "entity", "entityName", "createdAt"]));
    expect(keys).not.toContain("before");
    expect(keys).not.toContain("after");
    expect(res.body.logs).toHaveLength(1);
  });

  it("treats any other summary value as the normal full listing", async () => {
    await request(app).get("/api/admin/activity-logs?summary=0").expect(200);
    expect(Object.keys(listShape())).toEqual(expect.arrayContaining(["before", "after"]));
  });

  it("still caps the page size", async () => {
    const res = await request(app).get("/api/admin/activity-logs?limit=100000&summary=1").expect(200);
    expect(res.body.limit).toBe(100);
  });
});
