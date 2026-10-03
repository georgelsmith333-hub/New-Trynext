import { jsPDF } from "jspdf";

export type InvoiceOrderItem = {
  name?: unknown;
  productName?: unknown;
  quantity?: unknown;
  price?: unknown;
  size?: unknown;
  color?: unknown;
};

export type InvoiceOrder = {
  orderNumber?: unknown;
  customerName?: unknown;
  customerEmail?: unknown;
  customerPhone?: unknown;
  shippingAddress?: unknown;
  shippingCity?: unknown;
  shippingDistrict?: unknown;
  trackingNumber?: unknown;
  trackingUrl?: unknown;
  courierName?: unknown;
  paymentMethod?: unknown;
  paymentStatus?: unknown;
  notes?: unknown;
  items?: unknown;
  subtotal?: unknown;
  shippingCost?: unknown;
  promoDiscount?: unknown;
  total?: unknown;
  createdAt?: unknown;
};

export type InvoiceBusinessProfile = {
  siteName?: string;
  email?: string;
  phone?: string;
  address?: string;
};

const amount = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const text = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

export function getInvoicePaymentBreakdown(order: InvoiceOrder) {
  const total = amount(order.total);
  const status = text(order.paymentStatus).toLowerCase();
  const isFullPayment = /payment plan:\s*full payment/i.test(text(order.notes));
  const isRefunded = status === "refunded";
  const expectedNow = isFullPayment ? total : Math.ceil(total * 0.25);
  const verifiedPaid = isRefunded
    ? 0
    : status === "paid"
    ? total
    : status === "verified"
      ? expectedNow
      : 0;
  const submittedAmount = status === "submitted" ? expectedNow : 0;

  return {
    status,
    isFullPayment,
    isRefunded,
    expectedNow,
    verifiedPaid,
    submittedAmount,
    totalDue: isRefunded ? 0 : Math.max(0, total - verifiedPaid),
    advanceDue: !isRefunded && !isFullPayment && status !== "submitted" && status !== "verified" && status !== "paid"
      ? expectedNow
      : 0,
    deliveryBalance: isRefunded || isFullPayment ? 0 : Math.max(0, total - expectedNow),
  };
}

export function getExpectedDelivery(order: InvoiceOrder): string {
  return /^dhaka(?:\b|$)/i.test(text(order.shippingDistrict))
    ? "Estimated 2–3 business days after order confirmation for Dhaka."
    : "Estimated 3–5 business days after order confirmation for other districts.";
}

function formatMoney(value: unknown): string {
  const safeAmount = amount(value);
  return `BDT ${safeAmount.toLocaleString("en-BD", {
    minimumFractionDigits: Number.isInteger(safeAmount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getInvoicePaymentMethodName(value: unknown): string {
  const method = text(value).toLowerCase();
  const labels: Record<string, string> = {
    bkash: "bKash",
    nagad: "Nagad",
    rocket: "Rocket",
    upay: "uPay",
    bank: "Bank transfer",
    cod: "Cash on delivery",
    card: "Card on delivery",
  };
  return labels[method] ?? (method ? method.replace(/_/g, " ") : "Not specified");
}

function paymentStatusName(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending — no payment verified",
    submitted: "Payment submitted — awaiting verification",
    verified: "Payment verified",
    paid: "Paid in full",
    not_paid: "Not paid",
    wrong: "Payment needs review",
    refunded: "Refunded",
  };
  return labels[status] ?? "Status unavailable";
}

function invoiceDate(value: unknown): string {
  const raw = text(value);
  if (!raw) return "Date not available";
  const date = new Date(raw);
  return Number.isNaN(date.getTime())
    ? "Date not available"
    : new Intl.DateTimeFormat("en-BD", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Dhaka",
      }).format(date);
}

function safeFilename(value: unknown): string {
  return text(value).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "order";
}

export function downloadOrderInvoicePdf(order: InvoiceOrder, business: InvoiceBusinessProfile): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const right = pageWidth - margin;
  const payment = getInvoicePaymentBreakdown(order);
  const orderNumber = text(order.orderNumber) || "Not available";
  const items = Array.isArray(order.items) ? order.items as InvoiceOrderItem[] : [];
  const storeName = business.siteName?.trim() || "Trynext Lifestyle";
  let y = 0;

  const drawHeader = (continued = false) => {
    doc.setFillColor(27, 35, 43);
    doc.rect(0, 0, pageWidth, 43, "F");
    doc.setFillColor(232, 93, 4);
    doc.rect(0, 41.5, pageWidth, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(storeName.slice(0, 48), margin, 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(continued ? "ORDER INVOICE — CONTINUED" : "ORDER INVOICE", margin, 25);
    doc.setFont("helvetica", "bold");
    doc.text(`Order #${orderNumber}`.slice(0, 54), right, 18, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(invoiceDate(order.createdAt), right, 26, { align: "right" });
    y = 53;
  };

  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - 16) return;
    doc.addPage();
    drawHeader(true);
  };

  const writeLines = (
    value: string,
    x: number,
    width: number,
    fontSize = 9,
    color: [number, number, number] = [55, 65, 81],
    style: "normal" | "bold" = "normal",
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(value || "—", width) as string[];
    const lineHeight = fontSize * 0.42 + 1;
    ensureSpace(lines.length * lineHeight + 1);
    doc.text(lines, x, y);
    y += lines.length * lineHeight;
  };

  const sectionLabel = (label: string) => {
    ensureSpace(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(232, 93, 4);
    doc.text(label.toUpperCase(), margin, y);
    y += 5;
  };

  const line = (label: string, value: string, bold = false) => {
    ensureSpace(7);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 10 : 9);
    doc.setTextColor(40, 48, 56);
    doc.text(label, margin, y);
    doc.text(value, right, y, { align: "right" });
    y += 6;
  };

  drawHeader();

  const columnWidth = 87;
  sectionLabel("Customer");
  writeLines(text(order.customerName) || "Customer", margin, columnWidth, 10, [27, 35, 43], "bold");
  for (const detail of [
    text(order.customerPhone),
    text(order.customerEmail),
    text(order.shippingAddress),
    [text(order.shippingCity), text(order.shippingDistrict)].filter(Boolean).join(", "),
  ]) {
    if (detail) writeLines(detail, margin, columnWidth);
  }

  const infoX = 112;
  doc.setFillColor(248, 247, 244);
  doc.roundedRect(infoX, 52, 84, 35, 3, 3, "F");
  const infoRows = [
    ["Payment method", getInvoicePaymentMethodName(order.paymentMethod)],
    ["Payment status", paymentStatusName(payment.status)],
    ["Delivery", text(order.shippingDistrict) || "Bangladesh"],
  ];
  let infoY = 60;
  for (const [label, value] of infoRows) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(label.toUpperCase(), infoX + 4, infoY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(40, 48, 56);
    const wrapped = doc.splitTextToSize(value, 76) as string[];
    doc.text(wrapped.slice(0, 2), infoX + 4, infoY + 4);
    infoY += 11;
  }

  y = 96;
  sectionLabel("Items");
  doc.setFillColor(248, 247, 244);
  doc.roundedRect(margin, y - 3, pageWidth - margin * 2, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(82, 88, 95);
  doc.text("PRODUCT", margin + 2, y + 3);
  doc.text("QTY", 151, y + 3, { align: "right" });
  doc.text("AMOUNT", right - 2, y + 3, { align: "right" });
  y += 11;

  items.forEach((item) => {
    const quantity = Math.max(1, Math.floor(amount(item.quantity) || 1));
    const name = text(item.productName) || text(item.name) || "Product";
    const options = [text(item.size), text(item.color)].filter(Boolean).join(" · ");
    const description = options ? `${name}\n${options}` : name;
    const descriptionLines = doc.splitTextToSize(description, 108) as string[];
    const rowHeight = Math.max(8, descriptionLines.length * 4.5 + 2);
    ensureSpace(rowHeight);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 48, 56);
    doc.text(descriptionLines, margin + 2, y);
    doc.text(String(quantity), 151, y, { align: "right" });
    const itemPrice = amount(item.price) * quantity;
    doc.text(itemPrice > 0 ? formatMoney(itemPrice) : "—", right - 2, y, { align: "right" });
    y += rowHeight;
    doc.setDrawColor(235, 237, 239);
    doc.line(margin, y - 1, right, y - 1);
  });

  if (items.length === 0) {
    writeLines("Order items are not available in this record.", margin + 2, 170);
  }

  y += 4;
  const subtotal = amount(order.subtotal);
  const shipping = amount(order.shippingCost);
  const discount = amount(order.promoDiscount);
  if (subtotal > 0) line("Subtotal", formatMoney(subtotal));
  if (shipping > 0) line("Delivery", formatMoney(shipping));
  if (discount > 0) line("Discount", `− ${formatMoney(discount)}`);
  doc.setDrawColor(232, 93, 4);
  doc.setLineWidth(0.5);
  doc.line(margin, y - 1, right, y - 1);
  line("Order total", formatMoney(order.total), true);
  line("Verified payment", formatMoney(payment.verifiedPaid));
  if (payment.submittedAmount > 0) {
    line("Submitted — awaiting verification", formatMoney(payment.submittedAmount));
  }
  if (payment.advanceDue > 0) {
    line("Advance due to confirm", formatMoney(payment.advanceDue));
  }
  if (payment.deliveryBalance > 0) {
    line("Balance due on delivery", formatMoney(payment.deliveryBalance));
  }
  line("Total currently due", formatMoney(payment.totalDue), true);

  y += 2;
  sectionLabel("Delivery estimate");
  writeLines(getExpectedDelivery(order), margin, 176);
  writeLines("Delivery timing is an estimate and may vary with production and courier conditions.", margin, 176, 8, [107, 114, 128]);
  const trackingDetails = [
    text(order.courierName) ? `Courier: ${text(order.courierName)}` : "",
    text(order.trackingNumber) ? `Tracking number: ${text(order.trackingNumber)}` : "",
    text(order.trackingUrl) ? `Tracking URL: ${text(order.trackingUrl)}` : "",
  ].filter(Boolean);
  if (trackingDetails.length) {
    y += 2;
    sectionLabel("Courier tracking");
    for (const detail of trackingDetails) writeLines(detail, margin, 176, 8);
  }
  if (payment.isRefunded) {
    y += 2;
    writeLines("This order is marked refunded. Contact the store for the refund amount and settlement details.", margin, 176, 8, [107, 114, 128]);
  }

  const contact = [
    business.address?.trim(),
    business.phone?.trim(),
    business.email?.trim(),
  ].filter(Boolean);
  if (contact.length > 0) {
    y += 2;
    sectionLabel("Store contact");
    writeLines(contact.join("  ·  "), margin, 176, 8);
  }

  y += 2;
  writeLines(
    "Generated from the order record. Pending or submitted payments are not marked as received; download again after verification for an updated payment status.",
    margin,
    176,
    7,
    [107, 114, 128],
  );

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(230, 232, 235);
    doc.line(margin, pageHeight - 12, right, pageHeight - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 126, 133);
    doc.text(storeName.slice(0, 55), margin, pageHeight - 7);
    doc.text(`Page ${page} of ${totalPages}`, right, pageHeight - 7, { align: "right" });
  }

  doc.save(`Trynext-Invoice-${safeFilename(order.orderNumber)}.pdf`);
}