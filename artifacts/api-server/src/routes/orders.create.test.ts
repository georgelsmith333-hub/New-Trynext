import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A scripted stand-in for the database. Nothing here connects to a real database,
// payment provider, or notification service.
const fake = vi.hoisted(() => {
  process.env.DATABASE_URL = "postgres://nobody:nothing@127.0.0.1:1/none";
  process.env.JWT_SECRET = "unit-test-secret-0123456789abcdef";
  return {
    product: { id: 5, name: "Test Tee", price: "500", discountPrice: null, imageUrl: null, stock: 50, variants: [] as unknown[] },
    promo: null as null | Record<string, unknown>,
    promoClaimed: true,
    stockLeft: true,
    noProduct: false,
    inserted: [] as Record<string, unknown>[],
    promoUpdates: 0,
  };
});

vi.mock("../middlewares/adminAuth", () => ({ requireAdmin: (_q: unknown, _s: unknown, next: () => void) => next() }));
vi.mock("../lib/activityLog", () => ({ logActivity: vi.fn(), getAdminId: () => 1 }));
vi.mock("../lib/email", () => ({ sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined), sendStatusUpdateEmail: vi.fn() }));
vi.mock("../lib/telegram", () => ({ tgSend: vi.fn().mockResolvedValue(false), getEffectiveChatId: vi.fn() }));
vi.mock("../lib/scheduler", () => ({ checkRevenueMilestone: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../lib/objectStorage", () => ({
  ObjectStorageService: class { saveMockupImage() { return Promise.resolve(null); } },
}));
vi.mock("@workspace/db", async (importActual) => {
  const actual = await importActual<Record<string, any>>();
  const rowsFor = (table: unknown): unknown[] => {
    if (table === actual.productsTable) return fake.noProduct ? [] : [fake.product];
    if (table === actual.promoCodesTable) return fake.promo ? [fake.promo] : [];
    return [];
  };
  const select = () => ({
    from: (table: unknown) => {
      const rows = rowsFor(table);
      const chain: any = { where: () => chain, limit: () => chain, orderBy: () => chain, then: (res: any, rej: any) => Promise.resolve(rows).then(res, rej) };
      return chain;
    },
  });
  const update = (table: unknown) => ({
    set: () => ({
      where: () => ({
        returning: () => {
          if (table === actual.promoCodesTable) { fake.promoUpdates += 1; return Promise.resolve(fake.promoClaimed ? [{ id: 1 }] : []); }
          if (table === actual.productsTable) return Promise.resolve(fake.stockLeft ? [{ stock: 1 }] : []);
          return Promise.resolve([{}]);
        },
      }),
    }),
  });
  const insert = () => ({
    values: (v: Record<string, unknown>) => {
      fake.inserted.push(v);
      const row = { id: 1, status: "pending", paymentStatus: "pending", createdAt: new Date(), updatedAt: new Date(), ...v };
      return Object.assign(Promise.resolve(undefined), { returning: () => Promise.resolve([row]) });
    },
  });
  const tx = { select, update, insert };
  return { ...actual, db: { ...tx, execute: () => Promise.resolve(undefined), transaction: (cb: (t: typeof tx) => unknown) => cb(tx) } };
});

import ordersRouter from "./orders";

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } as any;
  next();
});
app.use("/api", ordersRouter);

const customer = { customerName: "Test Customer", customerPhone: "01700000000", shippingAddress: "1 Test Road", paymentMethod: "cod" };
const catalogItem = (quantity = 1, extra: Record<string, unknown> = {}) => ({ productId: 5, name: "Test Tee", quantity, ...extra });
const studioItem = (product: string, extra: Record<string, unknown> = {}) => ({
  productId: 0, name: `Custom ${product}`, quantity: 1, customNote: JSON.stringify({ studioDesign: true, product }), ...extra,
});

beforeEach(() => {
  fake.product = { id: 5, name: "Test Tee", price: "500", discountPrice: null, imageUrl: null, stock: 50, variants: [] };
  fake.promo = null;
  fake.promoClaimed = true;
  fake.stockLeft = true;
  fake.noProduct = false;
  fake.inserted = [];
  fake.promoUpdates = 0;
});

describe("POST /orders validation", () => {
  it("rejects a missing phone, an empty cart and an unsupported payment method before any order is stored", async () => {
    for (const body of [
      { ...customer, customerPhone: undefined, items: [catalogItem()] },
      { ...customer, items: [] },
      { ...customer, paymentMethod: "cheque", items: [catalogItem()] },
    ]) {
      const res = await request(app).post("/api/orders").send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("validation_error");
    }
    expect(fake.inserted).toHaveLength(0);
  });

  it("rejects quantities outside 1-100", async () => {
    for (const quantity of [0, 101, 1.5, -2]) {
      const res = await request(app).post("/api/orders").send({ ...customer, items: [catalogItem(quantity)] });
      expect(res.status).toBe(400);
    }
    expect(fake.inserted).toHaveLength(0);
  });

  it("refuses custom water bottle orders while the bottle is on hold", async () => {
    const res = await request(app).post("/api/orders").send({ ...customer, items: [studioItem("Water Bottle")] });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("mockup_not_approved");
    expect(fake.inserted).toHaveLength(0);
  });
});

describe("POST /orders pricing", () => {
  it("prices a catalog item from the database, ignoring the price the browser sends", async () => {
    const res = await request(app).post("/api/orders").send({ ...customer, items: [catalogItem(2, { price: 1 })] });
    expect(res.status).toBe(201);
    expect(res.body.subtotal).toBe(1000);
    expect(res.body.shippingCost).toBe(100);
    expect(res.body.total).toBe(1100);
  });

  it("prices a Studio design on the server and ignores the browser price", async () => {
    const res = await request(app).post("/api/orders").send({ ...customer, items: [studioItem("T-Shirt", { price: 1 })] });
    expect(res.status).toBe(201);
    expect(res.body.items[0].price).toBe(549);
    expect(res.body.total).toBe(649);
  });

  it("makes delivery free once the subtotal reaches the free-shipping threshold", async () => {
    const res = await request(app).post("/api/orders").send({ ...customer, items: [catalogItem(3)] });
    expect(res.status).toBe(201);
    expect(res.body.subtotal).toBe(1500);
    expect(res.body.shippingCost).toBe(0);
    expect(res.body.total).toBe(1500);
  });

  it("answers 409 stock_out and stores nothing when stock is gone at the moment of ordering", async () => {
    fake.stockLeft = false;
    const res = await request(app).post("/api/orders").send({ ...customer, items: [catalogItem(2)] });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("stock_out");
    expect(fake.inserted).toHaveLength(0);
  });

  it("answers 400 product_missing for a product that no longer exists", async () => {
    fake.noProduct = true;
    const res = await request(app).post("/api/orders").send({ ...customer, items: [catalogItem(1, { productId: 999 })] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("product_missing");
    expect(fake.inserted).toHaveLength(0);
  });
});

describe("POST /orders promo codes", () => {
  const promo = { id: 1, code: "SAVE10", active: true, discountType: "percentage", discountValue: "10", maxUses: 1, usedCount: 0, expiresAt: null, minOrderAmount: null };

  it("applies a valid promo and claims exactly one redemption", async () => {
    fake.promo = promo;
    const res = await request(app).post("/api/orders").send({ ...customer, promoCode: "save10", items: [catalogItem(2)] });
    expect(res.status).toBe(201);
    expect(res.body.promoCode).toBe("SAVE10");
    expect(res.body.promoDiscount).toBe(100);
    expect(res.body.total).toBe(1000);
    expect(fake.promoUpdates).toBe(1);
  });

  it("refuses the order when another order took the last redemption after this one read the code", async () => {
    fake.promo = promo; // looked unused when read...
    fake.promoClaimed = false; // ...but the conditional update finds the limit already reached
    const res = await request(app).post("/api/orders").send({ ...customer, promoCode: "SAVE10", items: [catalogItem()] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("promo_invalid");
    expect(fake.inserted).toHaveLength(0);
  });

  it("refuses an expired, inactive, used-up or below-minimum promo without claiming it", async () => {
    for (const patch of [
      { expiresAt: new Date(Date.now() - 1000).toISOString() },
      { active: false },
      { maxUses: 1, usedCount: 1 },
      { minOrderAmount: "5000" },
    ]) {
      fake.promo = { ...promo, ...patch };
      fake.promoUpdates = 0;
      const res = await request(app).post("/api/orders").send({ ...customer, promoCode: "SAVE10", items: [catalogItem()] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("promo_invalid");
      expect(fake.promoUpdates).toBe(0);
    }
    expect(fake.inserted).toHaveLength(0);
  });

  it("never discounts below zero", async () => {
    fake.promo = { ...promo, discountType: "fixed", discountValue: "999999" };
    const res = await request(app).post("/api/orders").send({ ...customer, promoCode: "SAVE10", items: [catalogItem()] });
    expect(res.status).toBe(201);
    expect(res.body.total).toBe(0);
  });
});
