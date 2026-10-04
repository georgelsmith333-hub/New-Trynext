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
