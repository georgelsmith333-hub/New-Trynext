import crypto from "node:crypto";

/**
 * A short-lived, signed permission to upload ONE file to ONE object id through
 * the API (used when the browser cannot upload straight to the storage bucket,
 * for example because of the bucket's cross-origin rules). The grant is created
 * by POST /storage/uploads/request-url and binds the object id, an expiry, the
 * declared size (an upper bound) and the declared content type, so it cannot
 * be reused for another object, a bigger file or a different file type.
 * Nothing is stored server side; the signature is an HMAC with the server secret.
 */
// Looked up when a grant is signed or checked (not when this file loads). Production
// always has JWT_SECRET (the customer login code refuses to start without it);
// outside production an ephemeral per-process secret is used if none is set.
let ephemeralSecret: string | undefined;
function signingSecret(): string {
  const configured = process.env.JWT_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is required to sign upload grants");
  ephemeralSecret ??= process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
  return ephemeralSecret;
}

export const UPLOAD_GRANT_TTL_SEC = 15 * 60;

const OBJECT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface UploadGrant {
  objectId: string;
  /** Unix seconds. */
  exp: number;
  /** Largest body, in bytes, this grant accepts. */
  size: number;
  contentType: string;
}

export type GrantCheck = "ok" | "invalid" | "expired";

export function isUploadObjectId(value: unknown): value is string {
  return typeof value === "string" && OBJECT_ID.test(value);
}

function mac(grant: UploadGrant): Buffer {
  return crypto
    .createHmac("sha256", signingSecret())
    .update(`upload-grant|${grant.objectId}|${grant.exp}|${grant.size}|${grant.contentType}`)
    .digest();
}

export function signUploadGrant(grant: UploadGrant): string {
  return mac(grant).toString("base64url");
}

export function verifyUploadGrant(grant: UploadGrant, signature: string, nowMs = Date.now()): GrantCheck {
  if (!isUploadObjectId(grant.objectId) || !Number.isSafeInteger(grant.exp) || !Number.isSafeInteger(grant.size) || grant.size <= 0 || !grant.contentType) {
    return "invalid";
  }
  let given: Buffer;
  try {
    given = Buffer.from(signature, "base64url");
  } catch {
    return "invalid";
  }
  const expected = mac(grant);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return "invalid";
  return grant.exp * 1000 < nowMs ? "expired" : "ok";
}

/** Relative API path the browser PUTs the file to (the storefront resolves it against its API base). */
export function buildApiUploadPath(grant: UploadGrant): string {
  const query = new URLSearchParams({
    exp: String(grant.exp),
    size: String(grant.size),
    type: grant.contentType,
    sig: signUploadGrant(grant),
  });
  return `/api/storage/upload-via-api/${grant.objectId}?${query.toString()}`;
}

export function parseUploadGrant(objectId: unknown, query: Record<string, unknown>): { grant: UploadGrant; signature: string } | null {
  const { exp, size, type, sig } = query;
  if (!isUploadObjectId(objectId) || typeof exp !== "string" || typeof size !== "string" || typeof type !== "string" || typeof sig !== "string") {
    return null;
  }
  if (!/^\d{1,12}$/.test(exp) || !/^\d{1,10}$/.test(size)) return null;
  return { grant: { objectId, exp: Number(exp), size: Number(size), contentType: type.toLowerCase() }, signature: sig };
}
