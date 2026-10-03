import type { Pool } from "pg";
import { logger } from "./logger";
import { redactErrorMessage } from "./requestMetrics";

/**
 * pg emits an "error" event on a Pool when the server drops an idle client
 * (Postgres restart, failover, Neon's idle suspend). With no listener Node
 * treats that as an uncaught exception and kills the whole API process, taking
 * every in-flight request with it. pg discards the broken client and opens a
 * new one on demand, so logging and carrying on is the correct handling.
 */
export function guardPool<T extends Pool>(pool: T, label: string): T {
  pool.on("error", (err: Error & { code?: unknown }) => {
    logger.warn(
      {
        pool: label,
        code: typeof err.code === "string" ? err.code : "unknown",
        message: redactErrorMessage(err),
      },
      "[db] idle client error ignored; the pool reconnects on demand",
    );
  });
  return pool;
}
