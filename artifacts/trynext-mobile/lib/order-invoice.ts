import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export type MobileInvoiceItem = {
  name?: unknown;
  productName?: unknown;
  quantity?: unknown;
  price?: unknown;
  size?: unknown;
  color?: unknown;
};

export type MobileInvoiceOrder = {
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
  paymentMode?: unknown;
  notes?: unknown;
  items?: unknown;
  subtotal?: unknown;
  shippingCost?: unknown;
  promoDiscount?: unknown;
  total?: unknown;
  createdAt?: unknown;
};

export type MobileInvoiceBusiness = {
  siteName?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
};

const asText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

const asAmount = (value: unknown): number => {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const escapeHtml = (value: unknown): string =>
  asText(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);

const money = (value: unknown): string =>
  `BDT ${asAmount(value).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

function getPaymentSummary(order: MobileInvoiceOrder) {
  const total = asAmount(order.total);
  const status = asText(order.paymentStatus).toLowerCase();
  const isFullPayment = order.paymentMode === "full" ||
    /payment plan:\s*full payment/i.test(asText(order.notes));
  const isRefunded = status === "refunded";
  const expectedNow = isFullPayment ? total : Math.ceil(total * 0.25);
  const verifiedPaid = isRefunded ? 0 : status === "paid" ? total : status === "verified" ? expectedNow : 0;
  const submittedAmount = status === "submitted" ? expectedNow : 0;
  const amountDueNow = !isRefunded && !["submitted", "verified", "paid"].includes(status) ? expectedNow : 0;
  const deliveryBalance = isRefunded || isFullPayment ? 0 : Math.max(0, total - expectedNow);
  const statusLabel: Record<string, string> = {
    pending: "Pending - no payment verified",
    submitted: "Submitted - awaiting verification",
    verified: "Payment verified",
    paid: "Paid in full",
    not_paid: "Not paid",
    wrong: "Payment needs review",
    refunded: "Refunded",
  };

  return {
    total,
    isFullPayment,
    isRefunded,
    status: statusLabel[status] ?? "Status unavailable",
    verifiedPaid,
    submittedAmount,
    amountDueNow,
    deliveryBalance,
    totalDue: isRefunded ? 0 : Math.max(0, total - verifiedPaid),
  };
}

function dateLabel(value: unknown): string {
  const date = new Date(asText(value));
  if (!asText(value) || Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

export function buildMobileOrderInvoiceHtml(
  order: MobileInvoiceOrder,
  business: MobileInvoiceBusiness = {},
): string {
  const payment = getPaymentSummary(order);
  const items = Array.isArray(order.items) ? order.items as MobileInvoiceItem[] : [];
  const itemRows = items.length
    ? items.map((item) => {
        const quantity = Math.max(1, Math.floor(asAmount(item.quantity) || 1));
        const name = escapeHtml(asText(item.productName) || asText(item.name) || "Product");
        const options = [asText(item.size), asText(item.color)].filter(Boolean).map(escapeHtml).join(" · ");
        const description = options ? `${name}<small>${options}</small>` : name;
        return `<tr><td>${description}</td><td class="qty">${quantity}</td><td class="money">${money(asAmount(item.price) * quantity)}</td></tr>`;
      }).join("")
    : `<tr><td colspan="3" class="empty">Order item details are not available.</td></tr>`;

  const totalRows = [
    ...(asAmount(order.subtotal) > 0 ? [`<tr><td>Subtotal</td><td class="money">${money(order.subtotal)}</td></tr>`] : []),
    ...(asAmount(order.shippingCost) > 0 ? [`<tr><td>Delivery</td><td class="money">${money(order.shippingCost)}</td></tr>`] : []),
    ...(asAmount(order.promoDiscount) > 0 ? [`<tr><td>Discount</td><td class="money">- ${money(order.promoDiscount)}</td></tr>`] : []),
    `<tr class="grand"><td>Order total</td><td class="money">${money(order.total)}</td></tr>`,
    `<tr><td>Verified payment</td><td class="money">${money(payment.verifiedPaid)}</td></tr>`,
    ...(payment.submittedAmount > 0 ? [`<tr><td>Submitted - awaiting verification</td><td class="money">${money(payment.submittedAmount)}</td></tr>`] : []),
    ...(payment.amountDueNow > 0 ? [`<tr><td>${payment.isFullPayment ? "Amount due now" : "Advance due to confirm"}</td><td class="money">${money(payment.amountDueNow)}</td></tr>`] : []),
    ...(payment.deliveryBalance > 0 ? [`<tr><td>Balance due on delivery</td><td class="money">${money(payment.deliveryBalance)}</td></tr>`] : []),
    `<tr class="grand due"><td>Total currently due</td><td class="money">${money(payment.totalDue)}</td></tr>`,
  ].join("");

  const storeName = escapeHtml(asText(business.siteName) || "Trynext Lifestyle");
  const contactLines = [business.address, business.phone, business.email]
    .map(escapeHtml)
    .filter(Boolean)
    .join(" · ");
  const deliveryEstimate = /^dhaka(?:\b|$)/i.test(asText(order.shippingDistrict))
    ? "Estimated 2-3 business days after order confirmation for Dhaka."
    : "Estimated 3-5 business days after order confirmation for other districts.";
  const paymentMethodLabels: Record<string, string> = {
    bkash: "bKash",
    nagad: "Nagad",
    rocket: "Rocket",
    upay: "uPay",
    bank: "Bank transfer",
    cod: "Cash on delivery",
    card: "Card on delivery",
  };
  const rawPaymentMethod = asText(order.paymentMethod).toLowerCase();
  const paymentMethod = escapeHtml(paymentMethodLabels[rawPaymentMethod] ?? (rawPaymentMethod.replace(/_/g, " ") || "Not specified"));
  const trackingDetails = [
    asText(order.courierName) ? `Courier: ${escapeHtml(order.courierName)}` : "",
    asText(order.trackingNumber) ? `Tracking number: ${escapeHtml(order.trackingNumber)}` : "",
    asText(order.trackingUrl) ? `Tracking URL: ${escapeHtml(order.trackingUrl)}` : "",
  ].filter(Boolean);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Order invoice ${escapeHtml(order.orderNumber)}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #1b232b; font: 13px Arial, Helvetica, sans-serif; }
    .header { padding: 24px; background: #1b232b; color: #fff; border-bottom: 4px solid #e85d04; }
    .header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
    h1 { margin: 0 0 8px; font-size: 22px; }
    .subtitle, .muted { color: #69717a; }
    .header .subtitle { color: #d8dce0; }
    .ref { text-align: right; }
    .ref strong { display: block; margin-top: 4px; font-size: 14px; }
    .content { padding: 22px 24px; }
    h2 { margin: 22px 0 9px; color: #e85d04; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .detail-card { padding: 13px; background: #f7f6f3; border-radius: 8px; line-height: 1.6; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 9px 8px; color: #58616a; background: #f7f6f3; font-size: 10px; text-align: left; }
    td { padding: 10px 8px; border-bottom: 1px solid #e8eaec; vertical-align: top; }
    td small { display: block; margin-top: 4px; color: #69717a; }
    .qty { width: 52px; text-align: center; }
    .money { text-align: right; white-space: nowrap; }
    .empty { color: #69717a; }
    .totals { width: 70%; margin: 14px 0 0 auto; }
    .totals td { padding: 7px 8px; }
    .grand { font-weight: 700; }
    .grand td { border-top: 1px solid #e85d04; }
    .estimate { line-height: 1.5; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e8eaec; font-size: 10px; line-height: 1.5; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-row">
      <div><h1>${storeName}</h1><div class="subtitle">Order invoice / receipt</div></div>
      <div class="ref"><span class="subtitle">Order reference</span><strong>#${escapeHtml(order.orderNumber || "Not available")}</strong><span class="subtitle">${escapeHtml(dateLabel(order.createdAt))}</span></div>
    </div>
  </header>
  <main class="content">
    <section class="details">
      <div><h2>Customer</h2><div class="detail-card">
        <strong>${escapeHtml(order.customerName || "Customer")}</strong><br>
        ${escapeHtml(order.customerPhone)}<br>
        ${escapeHtml(order.customerEmail)}<br>
        ${escapeHtml(order.shippingAddress)}<br>
        ${escapeHtml([asText(order.shippingCity), asText(order.shippingDistrict)].filter(Boolean).join(", "))}
      </div></div>
      <div><h2>Order details</h2><div class="detail-card">
        Payment method: ${paymentMethod}<br>
        Payment status: ${escapeHtml(payment.status)}<br>
        Delivery district: ${escapeHtml(order.shippingDistrict || "Bangladesh")}
      </div></div>
    </section>
    <h2>Items</h2>
    <table>
      <thead><tr><th>Product</th><th class="qty">Qty</th><th class="money">Amount</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <table class="totals"><tbody>${totalRows}</tbody></table>
    <h2>Delivery estimate</h2>
    <div class="estimate">${deliveryEstimate}<br><span class="muted">Timing is an estimate and can vary with production and courier conditions.</span></div>
    ${trackingDetails.length ? `<h2>Courier tracking</h2><div class="estimate">${trackingDetails.join("<br>")}</div>` : ""}
    ${contactLines ? `<h2>Store contact</h2><div class="estimate">${contactLines}</div>` : ""}
    ${payment.isRefunded ? `<div class="estimate">This order is marked refunded. Contact the store for the refund amount and settlement details.</div>` : ""}
    <div class="footer">
      This is an order invoice / receipt, not a tax invoice. Pending or submitted payments are not marked as received. Download an updated copy after payment verification.
    </div>
  </main>
</body>
</html>`;
}

export async function downloadMobileOrderInvoicePdf(
  order: MobileInvoiceOrder,
  business: MobileInvoiceBusiness = {},
): Promise<void> {
  const html = buildMobileOrderInvoiceHtml(order, business);
  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    const fileName = `Trynext-Invoice-${asText(order.orderNumber).replace(/[^a-zA-Z0-9_-]/g, "") || "order"}.pdf`;
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: fileName,
    });
    return;
  }
  await Print.printAsync({ html });
}