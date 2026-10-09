import { describe, expect, it } from "vitest";
import { isOrderStatus, ORDER_STATUSES, ORDER_STATUS_MESSAGE } from "./orderStatus";

describe("order statuses", () => {
  it("lists exactly the statuses the database and admin screens use", () => {
    expect([...ORDER_STATUSES].sort()).toEqual(["cancelled", "delivered", "ongoing", "pending", "processing", "shipped"]);
  });

  it("accepts every known status and nothing else", () => {
    for (const s of ORDER_STATUSES) expect(isOrderStatus(s)).toBe(true);
    for (const bad of ["", "Delivered", "refunded", "confirmed", "shipped ", "delivered; drop table", 1, null, undefined, {}, ["pending"]]) {
      expect(isOrderStatus(bad)).toBe(false);
    }
  });

  it("names every allowed status in the error message", () => {
    for (const s of ORDER_STATUSES) expect(ORDER_STATUS_MESSAGE).toContain(s);
  });
});

import { allowedNextOrderStatuses, canMoveOrderStatus, invalidTransitionMessage } from "./orderStatus";

describe("order status transitions (owner decision T7)", () => {
  it("allows exactly the agreed forward moves", () => {
    expect(allowedNextOrderStatuses("pending")).toEqual(["processing", "cancelled"]);
    expect(allowedNextOrderStatuses("processing")).toEqual(["ongoing", "shipped", "cancelled"]);
    expect(allowedNextOrderStatuses("ongoing")).toEqual(["shipped", "cancelled"]);
    expect(allowedNextOrderStatuses("shipped")).toEqual(["delivered"]);
    expect(allowedNextOrderStatuses("delivered")).toEqual([]);
    expect(allowedNextOrderStatuses("cancelled")).toEqual([]);
  });

  it("allows no move out of a final status and no cancellation once shipped", () => {
    for (const to of ORDER_STATUSES) {
      expect(canMoveOrderStatus("delivered", to)).toBe(false);
      expect(canMoveOrderStatus("cancelled", to)).toBe(false);
    }
    expect(canMoveOrderStatus("shipped", "cancelled")).toBe(false);
  });

  it("treats an unknown current status as having no allowed moves", () => {
    expect(allowedNextOrderStatuses("weird")).toEqual([]);
    expect(canMoveOrderStatus("weird", "processing")).toBe(false);
  });

  it("explains a refused move", () => {
    expect(invalidTransitionMessage("pending", "delivered")).toContain("processing, cancelled");
    expect(invalidTransitionMessage("cancelled", "pending")).toContain("final");
  });
});
