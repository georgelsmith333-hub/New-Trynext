import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbCalls = vi.hoisted(() => {
  // Table definitions are loaded for real; the URL is never connected to (db is replaced below).
  process.env.DATABASE_URL = "postgres://nobody:nothing@127.0.0.1:1/none";
  process.env.JWT_SECRET = "unit-test-secret-0123456789abcdef";
  return { select: vi.fn(), update: vi.fn() };
});

vi.mock("../middlewares/adminAuth", () => ({ requireAdmin: (_q: unknown, _s: unknown, next: () => void) => next() }));
vi.mock("../lib/activityLog", () => ({ logActivity: vi.fn(), getAdminId: () => 1 }));
vi.mock("../lib/email", () => ({ sendOrderConfirmationEmail: vi.fn(), sendStatusUpdateEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../lib/telegram", () => ({ tgSend: vi.fn(), getEffectiveChatId: vi.fn() }));
vi.mock("../lib/scheduler", () => ({ checkRevenueMilestone: vi.fn() }));
vi.mock("@workspace/db", async (importActual) => {
  const actual = await importActual<Record<string, unknown>>();
  const order = { id: 7, orderNumber: "TNX-7", status: "pending", customerId: null, customerName: "x", customerPhone: "0", total: 1, paymentMethod: "cod", items: [] };
  return {
    ...actual,
    db: {
      execute: () => Promise.resolve(undefined),
      select: (...a: unknown[]) => { dbCalls.select(...a); return { from: () => ({ where: () => Promise.resolve([order]) }) }; },
      update: (...a: unknown[]) => {
        dbCalls.update(...a);
        return { set: (v: Record<string, unknown>) => ({ where: () => ({ returning: () => Promise.resolve([{ ...order, ...v }]) }) }) };
      },
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

beforeEach(() => { dbCalls.select.mockClear(); dbCalls.update.mockClear(); });

describe("PUT /orders/:id/status", () => {
  it.each(["delivered", "cancelled", "processing"])("accepts the known status %s", async (status) => {
    const res = await request(app).put("/api/orders/7/status").send({ status });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(status);
    expect(dbCalls.update).toHaveBeenCalledTimes(1);
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
