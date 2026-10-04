import { describe, expect, it } from "vitest";
import { clearCheckoutIdempotencyKey, fingerprintPayload, getCheckoutIdempotencyKey } from "./checkoutIdempotency";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

describe("checkout idempotency key", () => {
  it("reuses the key for the same payload, including after a reload (storage)", () => {
    const storage = memoryStorage();
    let n = 0;
    const deps = { storage, newKey: () => `key-${++n}`.padEnd(20, "0"), now: () => 1000 };
    const a = getCheckoutIdempotencyKey('{"items":[1]}', deps);
    const b = getCheckoutIdempotencyKey('{"items":[1]}', deps);
    expect(b).toBe(a);
    expect(n).toBe(1);
  });

  it("makes a new key when the payload changes", () => {
    const storage = memoryStorage();
    let n = 0;
    const deps = { storage, newKey: () => `key-${++n}`.padEnd(20, "0"), now: () => 1000 };
    const a = getCheckoutIdempotencyKey('{"items":[1]}', deps);
    const b = getCheckoutIdempotencyKey('{"items":[1,2]}', deps);
    expect(b).not.toBe(a);
  });

  it("makes a new key after it is too old", () => {
    const storage = memoryStorage();
    let n = 0;
    let t = 1000;
    const deps = { storage, newKey: () => `key-${++n}`.padEnd(20, "0"), now: () => t };
    const a = getCheckoutIdempotencyKey("p", deps);
    t += 24 * 60 * 1000;
    expect(getCheckoutIdempotencyKey("p", deps)).toBe(a);
    t += 2 * 60 * 1000;
    expect(getCheckoutIdempotencyKey("p", deps)).not.toBe(a);
  });

  it("makes a new key after the order was created (cleared)", () => {
    const storage = memoryStorage();
    let n = 0;
    const deps = { storage, newKey: () => `key-${++n}`.padEnd(20, "0"), now: () => 1000 };
    const a = getCheckoutIdempotencyKey("p", deps);
    clearCheckoutIdempotencyKey({ storage });
    expect(getCheckoutIdempotencyKey("p", deps)).not.toBe(a);
  });

  it("copes with blocked or corrupt storage", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(getCheckoutIdempotencyKey("p", { storage: blocked, newKey: () => "k".repeat(20) })).toBe("k".repeat(20));
    expect(() => clearCheckoutIdempotencyKey({ storage: blocked })).not.toThrow();
    const corrupt = memoryStorage({ trynext_checkout_idem: "{not json" });
    expect(getCheckoutIdempotencyKey("p", { storage: corrupt, newKey: () => "z".repeat(20) })).toBe("z".repeat(20));
    expect(getCheckoutIdempotencyKey("p", { storage: null, newKey: () => "n".repeat(20) })).toBe("n".repeat(20));
  });

  it("always produces keys the API accepts (16 to 128 safe characters)", () => {
    const key = getCheckoutIdempotencyKey("p", { storage: null });
    expect(key).toMatch(/^[A-Za-z0-9_-]{16,128}$/);
  });

  it("fingerprints are stable and differ for different text", () => {
    expect(fingerprintPayload("abc")).toBe(fingerprintPayload("abc"));
    expect(fingerprintPayload("abc")).not.toBe(fingerprintPayload("abd"));
  });
});
