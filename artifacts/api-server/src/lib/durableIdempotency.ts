import { createHash } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { and, eq, lt } from "drizzle-orm";
import { db, orderIdempotencyKeysTable } from "@workspace/db";
import { orderIdempotency } from "./idempotency";

const KEY_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const DEFAULT_TTL_MS = 30 * 60 * 1000;
const DEFAULT_WAIT_MS = 20_000;
const POLL_MS = 250;

type DurableOptions = {
  ttlMs?: number;
  maxWaitMs?: number;
  now?: () => Date;
};

function fingerprint(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body ?? {})).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Database-backed counterpart to the process-local order guard. Keep this
 * behind migration 008 until the table exists in the selected production DB.
 */
export function createDurableIdempotency(options: DurableOptions = {}) {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const maxWaitMs = options.maxWaitMs ?? DEFAULT_WAIT_MS;
  const now = options.now ?? (() => new Date());

  const middleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const rawHeader = req.headers["idempotency-key"];
    if (rawHeader === undefined) {
      return next();
    }
    const key = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    if (!key || !KEY_PATTERN.test(key)) {
      res.status(400).json({ error: "invalid_idempotency_key", message: "Idempotency-Key must be 16 to 128 letters, digits, dashes or underscores." });
      return;
    }

    const requestFingerprint = fingerprint(req.body);
    const expiresAt = new Date(now().getTime() + ttlMs);
    const startedAt = Date.now();

    try {
      await db.delete(orderIdempotencyKeysTable).where(lt(orderIdempotencyKeysTable.expiresAt, now()));
      const [inserted] = await db.insert(orderIdempotencyKeysTable).values({
        key,
        fingerprint: requestFingerprint,
        state: "pending",
        expiresAt,
      }).onConflictDoNothing().returning({ key: orderIdempotencyKeysTable.key });

      if (!inserted) {
        while (Date.now() - startedAt < maxWaitMs) {
          const [existing] = await db.select().from(orderIdempotencyKeysTable)
            .where(eq(orderIdempotencyKeysTable.key, key)).limit(1);
          if (!existing) break;
          if (existing.fingerprint !== requestFingerprint) {
            res.status(422).json({ error: "idempotency_key_reused", message: "This Idempotency-Key was already used for a different request." });
            return;
          }
          if (existing.state === "done") {
            res.setHeader("Idempotent-Replayed", "true");
            res.status(existing.responseStatus ?? 200).json(existing.responseBody);
            return;
          }
          await sleep(POLL_MS);
        }
        const [existing] = await db.select({ state: orderIdempotencyKeysTable.state })
          .from(orderIdempotencyKeysTable)
          .where(and(eq(orderIdempotencyKeysTable.key, key), eq(orderIdempotencyKeysTable.fingerprint, requestFingerprint)))
          .limit(1);
        if (existing) {
          res.setHeader("Retry-After", "2");
          res.status(503).json({ error: "request_in_progress", message: "The first attempt of this request is still being processed. Please try again in a moment." });
          return;
        }
        return middleware(req, res, next);
      }

      let settled = false;
      const release = async () => {
        if (settled) return;
        settled = true;
        await db.delete(orderIdempotencyKeysTable).where(eq(orderIdempotencyKeysTable.key, key));
      };
      const originalJson = res.json.bind(res);
      res.json = ((body?: unknown) => {
        if (!settled) {
          settled = true;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            void db.update(orderIdempotencyKeysTable).set({
              state: "done",
              responseStatus: res.statusCode,
              responseBody: body,
              expiresAt,
            }).where(eq(orderIdempotencyKeysTable.key, key));
          } else {
            void db.delete(orderIdempotencyKeysTable).where(eq(orderIdempotencyKeysTable.key, key));
          }
        }
        return originalJson(body);
      }) as Response["json"];
      res.on("close", () => { void release(); });
      return next();
    } catch {
      // The migration is release-gated. If the table is not available, preserve
      // the existing process-local guard rather than blocking checkout.
      return orderIdempotency.middleware(req, res, next);
    }
  };

  return { middleware };
}

export const durableOrderIdempotency = createDurableIdempotency();
