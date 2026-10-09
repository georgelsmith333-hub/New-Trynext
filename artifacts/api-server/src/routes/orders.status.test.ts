import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbCalls = vi.hoisted(() => {
  // Table definitions are loaded for real; the URL is never connected to (db is replaced below).
  process.env.DATABASE_URL = "postgres://nobody:nothing@127.0.0.1:1/none";
  process.env.JWT_SECRET = "unit-test-secret-0123456789abcdef";
  return { select: vi.fn(), update: vi.fn(), current: { status: "pending", items: [] as unknown[] }, restore: vi.fn() };
});

vi.mock("../middlewares/adminAuth", () => ({ requireAdmin: (_q: unknown, _s: unknown, next: () => void) => next() }));
vi.mock("../lib/activityLog", () => ({ logActivity: vi.fn(), getAdminId: () => 1 }));
vi.mock("../lib/email", () => ({ sendOrderConfirmationEmail: vi.fn(), sendStatusUpdateEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../lib/telegram", () => ({ tgSend: vi.fn(), getEffectiveChatId: vi.fn() }));
vi.mock("../lib/orderStock", () => ({
  restoreOrderStock: (...a: unknown[]) => { dbCalls.restore(...a); return Promise.resolve({ restored: [{ productId: 1, quantity: 2 }], skipped: [] }); },
}));
vi.mock("../lib/scheduler", () => ({ checkRevenueMilestone: vi.fn() }));
vi.mock("@workspace/db", async (importActual) => {
  const actual = await importActual<Record<string, unknown>>();
  const row = () => ({ id: 7, orderNumber: "TNX-7", status: dbCalls.current.status, customerId: null, customerName: "x", customerPhone: "0", total: 1, paymentMethod: "cod", items: dbCalls.current.items });
  const tx = {
    select: (...a: unknown[]) => { dbCalls.select(...a); return { from: () => ({ where: () => ({ for: () => Promise.resolve(dbCalls.current.status === "missing" ? [] : [row()]) }) }) }; },
    update: (...a: unknown[]) => {
      dbCalls.update(...a);
      return { set: (v: Record<string, unknown>) => ({ where: () => ({ returning: () => Promise.resolve([{ ...row(), ...v }]) }) }) };
    },
  };
  return {
    ...actual,
    db: {
      execute: () => Promise.resolve(undefined),
      transaction: (fn: (t: typeof tx) => unknown) => Promise.resolve(fn(tx)),
    },
  };
});

import ordersRouter from "./orders";

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } as any;
  next();
});
app.use("/api", ordersRouter);

beforeEach(() => { dbCalls.select.mockClear(); dbCalls.update.mockClear(); dbCalls.restore.mockClear(); dbCalls.current.status = "pending"; dbCalls.current.items = []; });

describe("PUT /orders/:id/status", () => {
  it.each(["processing", "cancelled"])("accepts the allowed move pending -> %s", async (status) => {
    const res = await request(app).put("/api/orders/7/status").send({ status });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(status);
    expect(dbCalls.update).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["pending", "delivered"], ["pending", "shipped"], ["pending", "ongoing"],
    ["processing", "pending"], ["processing", "delivered"], ["ongoing", "processing"],
    ["shipped", "cancelled"], ["shipped", "processing"], ["delivered", "cancelled"],
    ["delivered", "pending"], ["cancelled", "pending"], ["cancelled", "processing"],
  ])("refuses the move %s -> %s with a clear 400 and changes nothing", async (from, to) => {
    dbCalls.current.status = from;
    const res = await request(app).put("/api/orders/7/status").send({ status: to });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
    expect(res.body.code).toBe("invalid_status_transition");
    expect(res.body.message).toContain(`"${from}"`);
    expect(dbCalls.update).not.toHaveBeenCalled();
    expect(dbCalls.restore).not.toHaveBeenCalled();
  });

  it("walks the whole forward path", async () => {
    for (const [from, to] of [["pending", "processing"], ["processing", "ongoing"], ["ongoing", "shipped"], ["shipped", "delivered"]]) {
      dbCalls.current.status = from;
      expect((await request(app).put("/api/orders/7/status").send({ status: to })).status).toBe(200);
    }
    expect(dbCalls.restore).not.toHaveBeenCalled();
  });

  it("restores reserved stock when an order is cancelled before shipping", async () => {
    dbCalls.current.status = "processing";
    dbCalls.current.items = [{ productId: 1, quantity: 2 }];
    const res = await request(app).put("/api/orders/7/status").send({ status: "cancelled" });
    expect(res.status).toBe(200);
    expect(dbCalls.restore).toHaveBeenCalledTimes(1);
    expect(dbCalls.restore.mock.calls[0][1]).toEqual([{ productId: 1, quantity: 2 }]);
  });

  it("does not restore stock again on a repeated cancel (double click)", async () => {
    dbCalls.current.status = "cancelled";
    const res = await request(app).put("/api/orders/7/status").send({ status: "cancelled" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
    expect(dbCalls.update).not.toHaveBeenCalled();
    expect(dbCalls.restore).not.toHaveBeenCalled();
  });

  it("does not restore stock for other moves", async () => {
    await request(app).put("/api/orders/7/status").send({ status: "processing" });
    expect(dbCalls.restore).not.toHaveBeenCalled();
  });

  it("answers 404 for an order that does not exist", async () => {
    dbCalls.current.status = "missing";
    const res = await request(app).put("/api/orders/7/status").send({ status: "processing" });
    expect(res.status).toBe(404);
  });

  it.each(["refunded", "Delivered", "shipped ", "'; drop table orders; --", 5, {}, ["pending"]])(
    "answers 400, not 500, for the unknown status %j and never touches the database",
    async (status) => {
      const res = await request(app).put("/api/orders/7/status").send({ status });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("validation_error");
      expect(res.body.message).toMatch(/pending, processing, ongoing, shipped, delivered, cancelled/);
      expect(dbCalls.select).not.toHaveBeenCalled();
      expect(dbCalls.update).not.toHaveBeenCalled();
    },
  );

  it("still says status is required when it is missing", async () => {
    const res = await request(app).patch("/api/orders/7/status").send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("status is required");
  });

  it("still rejects a bad order id first", async () => {
    const res = await request(app).put("/api/orders/abc/status").send({ status: "pending" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid order id");
  });
});
