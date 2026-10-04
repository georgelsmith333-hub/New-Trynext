/**
 * One Idempotency-Key per checkout attempt. The same key is reused while the
 * order payload is unchanged (for example when the page retries after a gateway
 * error, or the customer taps the button again after a lost reply), so the API
 * can recognise a repeat and not create a second order. Any change to the
 * payload (a different cart, address, payment method) gets a fresh key. The key
 * is cleared once an order is created.
 */
const STORAGE_KEY = "trynext_checkout_idem";
const MAX_AGE_MS = 25 * 60 * 1000; // shorter than the API's memory (30 minutes)

interface Stored { fingerprint: string; key: string; createdAt: number }

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface IdempotencyDeps {
  storage?: StorageLike | null;
  now?: () => number;
  newKey?: () => string;
}

/** Small stable hash of the payload text (not security sensitive). */
export function fingerprintPayload(text: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
  }
  return `${text.length}-${h1.toString(16)}-${h2.toString(16)}`;
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

function defaultKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`.padEnd(16, "0");
}

export function getCheckoutIdempotencyKey(payloadText: string, deps: IdempotencyDeps = {}): string {
  const storage = deps.storage === undefined ? defaultStorage() : deps.storage;
  const now = (deps.now ?? Date.now)();
  const newKey = deps.newKey ?? defaultKey;
  const fingerprint = fingerprintPayload(payloadText);
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Stored>;
      if (saved.fingerprint === fingerprint && typeof saved.key === "string" && typeof saved.createdAt === "number" && now - saved.createdAt < MAX_AGE_MS) {
        return saved.key;
      }
    }
  } catch {
    /* unreadable: make a new key */
  }
  const key = newKey();
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ fingerprint, key, createdAt: now } satisfies Stored));
  } catch {
    /* storage blocked: the key still protects retries within this page */
  }
  return key;
}

export function clearCheckoutIdempotencyKey(deps: Pick<IdempotencyDeps, "storage"> = {}): void {
  const storage = deps.storage === undefined ? defaultStorage() : deps.storage;
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
