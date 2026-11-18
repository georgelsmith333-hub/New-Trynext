export const CONNECTION_ERROR_PROBE_DELAY_MS = 5_000;
export const RECOVERY_RETRY_INITIAL_MS = 30 * 60 * 1_000;
export const RECOVERY_RETRY_MAX_MS = 6 * 60 * 60 * 1_000;
export const FAILBACK_RETRY_INITIAL_MS = 6 * 60 * 60 * 1_000;
export const FAILBACK_RETRY_MAX_MS = 24 * 60 * 60 * 1_000;

/** Return candidate indexes with higher authority priority than the active one. */
export function higherPriorityCandidateIndexes(activeIndex: number): number[] {
  if (!Number.isInteger(activeIndex) || activeIndex <= 0) return [];
  return Array.from({ length: activeIndex }, (_, index) => index);
}

/**
 * Probe candidates one at a time, in the supplied authority order, and stop at
 * the first healthy result. Failed probes must return null; a thrown probe is
 * treated as a failed candidate so lower-priority candidates can still serve.
 */
export async function findFirstReachable<T>(
  candidateIndexes: readonly number[],
  probe: (index: number) => Promise<T | null>,
): Promise<{ index: number; value: T } | null> {
  for (const index of candidateIndexes) {
    try {
      const value = await probe(index);
      if (value !== null) return { index, value };
    } catch {
      // One unavailable candidate must not prevent trying the next approved one.
    }
  }
  return null;
}

/** Double a failed retry delay, starting at `initialMs` and never exceeding `maxMs`. */
export function nextBackoffDelayMs(currentMs: number, initialMs: number, maxMs: number): number {
  if (initialMs <= 0 || maxMs <= 0) throw new RangeError("Retry delays must be positive");
  if (maxMs < initialMs) throw new RangeError("Maximum retry delay must be at least the initial delay");
  if (!Number.isFinite(currentMs) || currentMs <= 0) return initialMs;
  return Math.min(maxMs, currentMs * 2);
}
