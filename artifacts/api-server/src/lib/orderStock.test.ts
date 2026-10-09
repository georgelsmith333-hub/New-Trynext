import { describe, expect, it, vi } from "vitest";
// Table definitions load for real; this URL is never connected to (the
// transaction is replaced by a stand-in in each test).
vi.hoisted(() => { process.env.DATABASE_URL = "postgres://nobody:nothing@127.0.0.1:1/none"; });

import { restoreOrderStock } from "./orderStock";

describe("restoreOrderStock", () => {
  it("skips studio lines and empty or invalid lines without touching the database", async () => {
    const tx = { select: vi.fn(), update: vi.fn() };
    const res = await restoreOrderStock(tx, [
      { isStudio: true, productId: 1, quantity: 2 },
      { productId: 0, quantity: 2 },
      { productId: 5, quantity: 0 },
      null,
    ]);
    expect(res).toEqual({ restored: [], skipped: [] });
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.select).not.toHaveBeenCalled();
  });

  it("tolerates a non-array items value", async () => {
    const tx = { select: vi.fn(), update: vi.fn() };
    expect(await restoreOrderStock(tx, null)).toEqual({ restored: [], skipped: [] });
    expect(await restoreOrderStock(tx, "x")).toEqual({ restored: [], skipped: [] });
  });

  it("puts back a plain product, each hamper constituent, and reports a missing product", async () => {
    const answers = [[{ id: 1 }], [{ id: 2 }], [{ id: 3 }], []]; // last product is gone
    const update = vi.fn(() => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve(answers.shift()) }) }) }));
    const res = await restoreOrderStock({ select: vi.fn(), update }, [
      { productId: 1, quantity: 2 },
      { isHamper: true, productId: 0, quantity: 1, constituentProducts: [{ productId: 2, quantity: 3 }, { productId: 3, quantity: 1 }] },
      { productId: 9, quantity: 4 },
    ]);
    expect(res.restored).toEqual([
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 3 },
      { productId: 3, quantity: 1 },
    ]);
    expect(res.skipped).toEqual([{ productId: 9, quantity: 4, reason: "product_missing" }]);
  });

  it("restores a selected variant by id and reports a variant that no longer exists", async () => {
    const selects = [[{ variants: [{ id: "a" }, { id: "b" }] }], [{ variants: [{ id: "a" }] }], []];
    const select = vi.fn(() => ({ from: () => ({ where: () => Promise.resolve(selects.shift()) }) }));
    const update = vi.fn(() => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([{ id: 1 }]) }) }) }));
    const res = await restoreOrderStock({ select, update }, [
      { productId: 1, variantId: "b", quantity: 2 },
      { productId: 1, variantId: "gone", quantity: 1 },
      { productId: 7, variantId: "a", quantity: 1 },
    ]);
    expect(res.restored).toEqual([{ productId: 1, variantId: "b", quantity: 2 }]);
    expect(res.skipped).toEqual([
      { productId: 1, variantId: "gone", quantity: 1, reason: "variant_missing" },
      { productId: 7, variantId: "a", quantity: 1, reason: "product_missing" },
    ]);
    expect(update).toHaveBeenCalledTimes(1);
  });
});
