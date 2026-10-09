import { describe, expect, it, vi } from "vitest";

// The backend is chosen when the module loads, so the (fake) R2 settings must
// exist before it is imported. These are stand-in values, never real ones.
vi.hoisted(() => {
  process.env.R2_ACCOUNT_ID = "stand-in-account";
  process.env.R2_ACCESS_KEY_ID = "stand-in-access-key";
  process.env.R2_SECRET_ACCESS_KEY = "stand-in-secret-key";
  process.env.R2_BUCKET = "stand-in-bucket";
});

import { ObjectStorageService } from "./objectStorage";

describe("R2 presigned upload URL", () => {
  it("does not bind the upload to a body checksum the browser cannot satisfy", async () => {
    const storage = new ObjectStorageService();
    expect(storage.getBackendName()).toBe("r2");

    const { uploadURL, objectId } = await storage.getObjectEntityUploadTarget();
    const url = new URL(uploadURL);

    expect(url.hostname).toBe("stand-in-bucket.stand-in-account.r2.cloudflarestorage.com");
    expect(url.pathname).toBe(`/uploads/${objectId}`);

    // With the SDK default ("WHEN_SUPPORTED") the URL is signed with the
    // checksum of an EMPTY body (x-amz-checksum-crc32=AAAAAA==), so the bucket
    // refuses every real file the browser then PUTs to it.
    const names = [...url.searchParams.keys()].map((k) => k.toLowerCase());
    expect(names.filter((k) => k.includes("checksum"))).toEqual([]);
    expect(names).toContain("x-amz-signature");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toBe("host");
  });
});
