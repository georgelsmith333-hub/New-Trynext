/**
 * Sorts a failed storage write into a short, non-secret reason code so the
 * through-the-API upload can say (and log) WHY storage refused it, without
 * copying provider messages, keys, bucket names or links into a response.
 */
export type StorageFailureReason =
  | "storage_access_denied"
  | "storage_credentials_rejected"
  | "storage_bucket_missing"
  | "storage_unreachable"
  | "storage_error";

export interface StorageFailureInfo {
  reason: StorageFailureReason;
  errorName: string;
  httpStatus: number | null;
  code: string | null;
}

const NETWORK_CODES = new Set(["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "EAI_AGAIN", "EPIPE", "UND_ERR_CONNECT_TIMEOUT"]);

export function classifyStorageWriteError(err: unknown): StorageFailureInfo {
  const e = (err && typeof err === "object" ? err : {}) as Record<string, unknown> & { $metadata?: { httpStatusCode?: number } };
  const errorName = typeof e.name === "string" ? e.name.slice(0, 60) : "Error";
  const code = typeof e.Code === "string" ? e.Code : typeof e.code === "string" ? e.code : null;
  const httpStatus = typeof e.$metadata?.httpStatusCode === "number" ? e.$metadata.httpStatusCode : null;
  const tag = `${errorName} ${code ?? ""}`;

  let reason: StorageFailureReason = "storage_error";
  if (/SignatureDoesNotMatch|InvalidAccessKeyId|ExpiredToken|InvalidToken/i.test(tag)) reason = "storage_credentials_rejected";
  else if (/AccessDenied|Forbidden/i.test(tag) || httpStatus === 403) reason = "storage_access_denied";
  else if (/NoSuchBucket/i.test(tag) || httpStatus === 404) reason = "storage_bucket_missing";
  else if ((code && NETWORK_CODES.has(code)) || /Timeout|TimeoutError|AbortError/i.test(errorName)) reason = "storage_unreachable";

  return { reason, errorName, httpStatus, code: code ? code.slice(0, 60) : null };
}
