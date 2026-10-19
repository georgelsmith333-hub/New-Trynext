import type { Request } from "express";
import { db, adminActivityLogsTable } from "@workspace/db";
import { logger } from "./logger";

export type ActivityAction = "create" | "update" | "delete" | "rollback";
export type ActivityEntity =
  | "product" | "order" | "blog" | "category"
  | "setting" | "hamper" | "promo" | "review" | "customer";

/** Extend Express Request with the session property set by requireAdmin middleware */
export interface AdminRequest extends Request {
  adminSession?: { adminId?: number | null; role?: string };
}

const SENSITIVE_ACTIVITY_KEY = /(?:password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|authorization|cookie|credential)/i;

function redactNestedActivityData(value: unknown, ancestors: WeakSet<object>): unknown {
  if (value instanceof Date || value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (ancestors.has(value)) return "[Circular]";

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((nested) => redactNestedActivityData(nested, ancestors));
    }
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      SENSITIVE_ACTIVITY_KEY.test(key) && nested !== null && nested !== undefined
        ? "[REDACTED]"
        : redactNestedActivityData(nested, ancestors),
    ]));
  } finally {
    ancestors.delete(value);
  }
}

/** Redact credential-like fields before activity snapshots leave process memory. */
export function redactActivityData(value: unknown): unknown {
  return redactNestedActivityData(value, new WeakSet<object>());
}

/**
 * Log an admin mutation. Never throws — logging failures are caught and
 * logged to stderr so they never interrupt the primary request.
 */
export async function logActivity(opts: {
  action: ActivityAction;
  entity: ActivityEntity | string;
  entityId: string | number;
  entityName: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  adminId?: number | null;
}): Promise<void> {
  try {
    const safeBefore = opts.before === undefined ? undefined : redactActivityData(opts.before) as Record<string, unknown> | null;
    const safeAfter = opts.after === undefined ? undefined : redactActivityData(opts.after) as Record<string, unknown> | null;
    await db.insert(adminActivityLogsTable).values({
      adminId: opts.adminId ?? null,
      action: opts.action,
      entity: opts.entity,
      entityId: String(opts.entityId),
      entityName: opts.entityName,
      before: safeBefore ?? null,
      after: safeAfter ?? null,
    });
  } catch (err) {
    logger.error({
      errorType: err instanceof Error ? err.name : typeof err,
      action: opts.action,
      entity: opts.entity,
      entityId: String(opts.entityId),
    }, "[activity-log] Failed to insert activity log");
  }
}

/**
 * Extract a numeric admin ID from the request object (set by requireAdmin middleware).
 * Returns null if not available.
 */
export function getAdminId(req: AdminRequest): number | null {
  return req.adminSession?.adminId ?? null;
}
