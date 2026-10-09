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

/**
 * Allowed forward-only status moves (owner decision T7, 2026-10-09). A status
 * with no entry is terminal. Setting an order to the status it already has is
 * handled by the caller as a harmless no-op, not as a move.
 */
const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["ongoing", "shipped", "cancelled"],
  ongoing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function allowedNextOrderStatuses(from: string): readonly OrderStatus[] {
  return isOrderStatus(from) ? ORDER_STATUS_TRANSITIONS[from] : [];
}

export function canMoveOrderStatus(from: string, to: OrderStatus): boolean {
  return allowedNextOrderStatuses(from).includes(to);
}

export function invalidTransitionMessage(from: string, to: string): string {
  const next = allowedNextOrderStatuses(from);
  return next.length
    ? `An order that is "${from}" cannot be set to "${to}". Allowed next: ${next.join(", ")}.`
    : `An order that is "${from}" is final and cannot be changed to "${to}".`;
}
