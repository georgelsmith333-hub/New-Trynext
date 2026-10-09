/**
 * The value stored as an order's `shippingCity`.
 *
 * Invoices, emails, Telegram alerts and the admin all show it next to the
 * district ("Adabor, Dhaka"), so it should name the local area the customer
 * picked. The mobile app already stores the area; the web checkout used to store
 * the division, which printed "Dhaka, Dhaka". Fall back to the division when no
 * area is chosen.
 */
export function resolveShippingCity(area: unknown, division: unknown): string {
  const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return clean(area) || clean(division);
}
