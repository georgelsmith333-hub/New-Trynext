/**
 * True when a database error is a unique-constraint violation (SQLSTATE 23505).
 * Drizzle wraps the driver error, so the code can sit on `cause` rather than on
 * the error itself; walk a few levels to find it.
 */
export function isUniqueViolation(err: unknown): boolean {
  let current: unknown = err;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    const candidate = current as { code?: unknown; cause?: unknown };
    if (candidate.code === "23505") return true;
    current = candidate.cause;
  }
  return false;
}
