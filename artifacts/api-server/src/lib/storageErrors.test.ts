import { describe, expect, it } from "vitest";
import { classifyStorageWriteError } from "./storageErrors";

const sdk = (name: string, status: number, Code?: string) => Object.assign(new Error("provider text with FAKE-KEY"), { name, Code, $metadata: { httpStatusCode: status } });

describe("classifyStorageWriteError", () => {
  it.each([
    [sdk("AccessDenied", 403), "storage_access_denied"],
    [sdk("Forbidden", 403), "storage_access_denied"],
    [sdk("SignatureDoesNotMatch", 403), "storage_credentials_rejected"],
    [sdk("InvalidAccessKeyId", 403, "InvalidAccessKeyId"), "storage_credentials_rejected"],
    [sdk("NoSuchBucket", 404), "storage_bucket_missing"],
    [Object.assign(new Error("x"), { code: "ENOTFOUND" }), "storage_unreachable"],
    [Object.assign(new Error("x"), { name: "TimeoutError" }), "storage_unreachable"],
    [sdk("InternalError", 500), "storage_error"],
    ["plain string", "storage_error"],
    [null, "storage_error"],
  ])("sorts %# into %s", (err, reason) => {
    expect(classifyStorageWriteError(err).reason).toBe(reason);
  });

  it("never carries the provider message", () => {
    expect(JSON.stringify(classifyStorageWriteError(sdk("AccessDenied", 403)))).not.toContain("FAKE-KEY");
  });
});
