import { describe, expect, it, vi } from "vitest";
import {
  FAILBACK_RETRY_INITIAL_MS,
  FAILBACK_RETRY_MAX_MS,
  RECOVERY_RETRY_INITIAL_MS,
  RECOVERY_RETRY_MAX_MS,
  findFirstReachable,
  higherPriorityCandidateIndexes,
  nextBackoffDelayMs,
} from "../src/probePolicy";

describe("database probe policy", () => {
  it("probes candidates sequentially and stops at the first approved reachable target", async () => {
    const calls: number[] = [];
    const result = await findFirstReachable([0, 1, 2], async (index) => {
      calls.push(index);
      return index === 1 ? "healthy-secondary" : null;
    });

    expect(result).toEqual({ index: 1, value: "healthy-secondary" });
    expect(calls).toEqual([0, 1]);
  });

  it("continues to the next configured candidate if a probe throws", async () => {
    const probe = vi.fn(async (index: number) => {
      if (index === 0) throw new Error("connection unavailable");
      return "healthy-next";
    });

    await expect(findFirstReachable([0, 1], probe)).resolves.toEqual({ index: 1, value: "healthy-next" });
    expect(probe).toHaveBeenCalledTimes(2);
  });

  it("returns only candidates with higher priority than the active candidate", () => {
    expect(higherPriorityCandidateIndexes(0)).toEqual([]);
    expect(higherPriorityCandidateIndexes(3)).toEqual([0, 1, 2]);
    expect(higherPriorityCandidateIndexes(-1)).toEqual([]);
  });

  it("backs off exponentially and caps recovery retries", () => {
    expect(nextBackoffDelayMs(0, RECOVERY_RETRY_INITIAL_MS, RECOVERY_RETRY_MAX_MS)).toBe(RECOVERY_RETRY_INITIAL_MS);
    expect(nextBackoffDelayMs(RECOVERY_RETRY_INITIAL_MS, RECOVERY_RETRY_INITIAL_MS, RECOVERY_RETRY_MAX_MS))
      .toBe(RECOVERY_RETRY_INITIAL_MS * 2);
    expect(nextBackoffDelayMs(RECOVERY_RETRY_MAX_MS, RECOVERY_RETRY_INITIAL_MS, RECOVERY_RETRY_MAX_MS))
      .toBe(RECOVERY_RETRY_MAX_MS);
    expect(nextBackoffDelayMs(FAILBACK_RETRY_MAX_MS, FAILBACK_RETRY_INITIAL_MS, FAILBACK_RETRY_MAX_MS))
      .toBe(FAILBACK_RETRY_MAX_MS);
  });

  it("rejects invalid backoff bounds", () => {
    expect(() => nextBackoffDelayMs(0, 0, 10)).toThrow(RangeError);
    expect(() => nextBackoffDelayMs(0, 20, 10)).toThrow(RangeError);
  });
});
