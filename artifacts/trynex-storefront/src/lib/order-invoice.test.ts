import { describe, expect, it } from "vitest";
import { getExpectedDelivery, getInvoicePaymentBreakdown, getInvoicePaymentMethodName } from "./order-invoice";

describe("order invoice payment summary", () => {
  const baseOrder = {
    total: 1000,
    notes: "Payment plan: 25% advance + cash on delivery",
  };

  it("does not count a requested advance as paid", () => {
    expect(getInvoicePaymentBreakdown({ ...baseOrder, paymentStatus: "pending" })).toMatchObject({
      expectedNow: 250,
      verifiedPaid: 0,
      submittedAmount: 0,
      totalDue: 1000,
      advanceDue: 250,
      deliveryBalance: 750,
    });
  });

  it("labels a submitted amount as unverified", () => {
    expect(getInvoicePaymentBreakdown({ ...baseOrder, paymentStatus: "submitted" })).toMatchObject({
      verifiedPaid: 0,
      submittedAmount: 250,
      totalDue: 1000,
      advanceDue: 0,
    });
  });

  it("counts the standard advance only after verification", () => {
    expect(getInvoicePaymentBreakdown({ ...baseOrder, paymentStatus: "verified" })).toMatchObject({
      verifiedPaid: 250,
      submittedAmount: 0,
      totalDue: 750,
      deliveryBalance: 750,
    });
  });

  it("counts a verified full payment as paid in full", () => {
    expect(getInvoicePaymentBreakdown({
      total: 1000,
      notes: "Payment plan: full payment",
      paymentStatus: "verified",
    })).toMatchObject({
      isFullPayment: true,
      verifiedPaid: 1000,
      totalDue: 0,
      deliveryBalance: 0,
    });
  });

  it("does not show a refunded order as an unpaid balance", () => {
    expect(getInvoicePaymentBreakdown({
      total: 1000,
      notes: "Payment plan: full payment",
      paymentStatus: "refunded",
    })).toMatchObject({
      verifiedPaid: 0,
      totalDue: 0,
      advanceDue: 0,
      deliveryBalance: 0,
      isRefunded: true,
    });
  });

  it("recognizes Rocket and Dhaka district names", () => {
    expect(getInvoicePaymentMethodName("rocket")).toBe("Rocket");
    expect(getExpectedDelivery({ shippingDistrict: "Dhaka District" })).toContain("2–3 business days");
  });

  it("uses the published delivery estimates by district", () => {
    expect(getExpectedDelivery({ shippingDistrict: "Dhaka" })).toContain("2–3 business days");
    expect(getExpectedDelivery({ shippingDistrict: "Sylhet" })).toContain("3–5 business days");
  });
});