import { createHash } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Duplicate-submit protection for POST requests that create something (orders).
 *
 * The browser sends one `Idempotency-Key` per checkout attempt and keeps it
 * across its automatic retries. If the first request actually succeeded but its
 * reply was lost (gateway timeout, cold start), the retry would otherwise create
 * a second order. Here a repeated key replays the first successful reply instead
 * of running the handler again, so no second order, stock change, promo use or
 * notification happens. Two requests with the same key at the same moment run
 * the handler once; the second waits and gets the same reply.
 *
 * Limits (deliberate, no database change): memory only, per process, bounded in
 * size and time. It covers retries and double clicks within minutes, not a
 * server restart or several API instances. Only successful (2xx) replies are
 * kept; a failed attempt can be retried normally. A key reused with a different
 * request body is refused, so a key cannot be used to read another request's reply.
 */
export interface IdempotencyOptions {
  ttlMs?: number;
  maxEntries?: number;
  /** Longest a duplicate waits for the first request to finish. */
  maxWaitMs?: number;
  now?: () => number;
}

interface Entry {
  fingerprint: string;
  createdAt: number;
  state: "pending" | "done";
  status?: number;
  body?: unknown;
  waiters: Array<() => void>;
}

const KEY_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export function createIdempotency(options: IdempotencyOptions = {}) {
  const ttlMs = options.ttlMs ?? 30 * 60 * 1000;
  const maxEntries = options.maxEntries ?? 1000;
  const maxWaitMs = options.maxWaitMs ?? 20_000;
  const now = options.now ?? (() => Date.now());
  const store = new Map<string, Entry>();

  function wake(entry: Entry): void {
    const waiters = entry.waiters.splice(0);
    for (const w of waiters) w();
  }

  function prune(): void {
    const cutoff = now() - ttlMs;
    for (const [key, entry] of store) {
      if (entry.state === "done" && entry.createdAt < cutoff) store.delete(key);
    }
    // Hard cap: drop the oldest entries first (Map keeps insertion order).
    while (store.size > maxEntries) {
      const oldest = store.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      const entry = store.get(oldest);
      store.delete(oldest);
      if (entry) wake(entry);
    }
  }

  const middleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers["idempotency-key"];
    if (header === undefined) { next(); return; }
    const key = Array.isArray(header) ? header[0] : header;
    if (!key || !KEY_PATTERN.test(key)) {
      res.status(400).json({ error: "invalid_idempotency_key", message: "Idempotency-Key must be 16 to 128 letters, digits, dashes or underscores." });
      return;
    }
    const fingerprint = createHash("sha256").update(JSON.stringify(req.body ?? {})).digest("hex");

    for (let round = 0; round < 3; round++) {
      prune();
      const existing = store.get(key);
      if (!existing) break;
      if (existing.fingerprint !== fingerprint) {
        res.status(422).json({ error: "idempotency_key_reused", message: "This Idempotency-Key was already used for a different request." });
        return;
      }
      if (existing.state === "done") {
        res.setHeader("Idempotent-Replayed", "true");
        res.status(existing.status ?? 200).json(existing.body);
        return;
      }
      // Same request still running: wait for it, then look again.
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, maxWaitMs);
        existing.waiters.push(() => { clearTimeout(timer); resolve(); });
      });
      if (res.destroyed || res.headersSent) return; // the client left while it waited
      if (round === 2 || store.get(key)?.state === "pending") {
        res.setHeader("Retry-After", "2");
        res.status(503).json({ error: "request_in_progress", message: "The first attempt of this request is still being processed. Please try again in a moment." });
        return;
      }
    }

    const entry: Entry = { fingerprint, createdAt: now(), state: "pending", waiters: [] };
    store.set(key, entry);
    prune(); // keep the cap exact, counting this entry
    let settled = false;
    const release = () => {
      if (settled) return;
      settled = true;
      if (store.get(key) === entry) store.delete(key);
      wake(entry);
    };

    const originalJson = res.json.bind(res);
    res.json = ((body?: unknown) => {
      if (!settled) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          settled = true;
          entry.state = "done";
          entry.status = res.statusCode;
          entry.body = body;
          entry.createdAt = now();
          wake(entry);
        } else {
          release(); // failures are not kept, so the client can retry
        }
      }
      return originalJson(body);
    }) as Response["json"];
    res.on("close", release); // handler threw or the client went away before a reply

    next();
  };

  return { middleware, size: () => store.size, clear: () => store.clear() };
}

/** Shared guard for order creation. */
export const orderIdempotency = createIdempotency();
