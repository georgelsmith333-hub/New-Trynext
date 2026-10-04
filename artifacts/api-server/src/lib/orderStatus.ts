/**
 * The order statuses the database accepts (see the `orders_status_check`
 * constraint in lib/db/src/schema/index.ts) and the admin screens offer.
 * Keep this list in step with that constraint.
 */
export const ORDER_STATUSES = ["pending", "processing", "ongoing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export const ORDER_STATUS_MESSAGE = `status must be one of: ${ORDER_STATUSES.join(", ")}`;
