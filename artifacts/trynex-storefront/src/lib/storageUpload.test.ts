import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDirectUploadMemory, StorageUploadError, uploadToStorage } from "./storageUpload";

const target = { uploadURL: "https://bucket.invalid/uploads/abc?sig=1", fallbackUploadURL: "/api/storage/upload-via-api/abc?sig=2" };
const blob = new Blob(["png"]);
const resolveApiUrl = (p: string) => `https://api.invalid${p}`;
const ok = () => new Response(null, { status: 200 });
const status = (code: number, body?: unknown) => new Response(body ? JSON.stringify(body) : null, { status: code, headers: { "Content-Type": "application/json" } });

beforeEach(() => resetDirectUploadMemory());

describe("uploadToStorage", () => {
  it("uses the direct upload when storage accepts it, and never calls the API", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());
    await expect(uploadToStorage(target, blob, "image/png", { fetchImpl, resolveApiUrl })).resolves.toBe("direct");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe(target.uploadURL);
  });

  it("falls back to the API when the browser is blocked from storage (no status)", async () => {
    const fetchImpl = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(ok());
    await expect(uploadToStorage(target, blob, "image/png", { fetchImpl, resolveApiUrl })).resolves.toBe("api");
    const [url, init] = fetchImpl.mock.calls[1];
    expect(url).toBe("https://api.invalid/api/storage/upload-via-api/abc?sig=2");
    expect(init.method).toBe("PUT");
    expect(init.headers["X-Requested-With"]).toBe("XMLHttpRequest");
    expect(init.headers["Content-Type"]).toBe("image/png");
    expect(init.body).toBe(blob);
  });

  it("falls back when storage answers 403, and remembers to skip the direct path afterwards", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(status(403)).mockResolvedValueOnce(ok()).mockResolvedValueOnce(ok());
    await uploadToStorage(target, blob, "image/png", { fetchImpl, resolveApiUrl });
    await expect(uploadToStorage(target, blob, "image/png", { fetchImpl, resolveApiUrl })).resolves.toBe("api");
    expect(fetchImpl).toHaveBeenCalledTimes(3); // 403, api, api (second upload skipped direct)
    expect(fetchImpl.mock.calls[2][0]).toContain("upload-via-api");
  });

  it("does not remember a temporary storage error (5xx)", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(status(503)).mockResolvedValueOnce(ok()).mockResolvedValueOnce(ok());
    await uploadToStorage(target, blob, "image/png", { fetchImpl, resolveApiUrl });
    await expect(uploadToStorage(target, blob, "image/png", { fetchImpl, resolveApiUrl })).resolves.toBe("direct");
  });

  it("fails truthfully, naming both attempts, when both paths fail", async () => {
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(status(413, { message: "The file is larger than the size it was declared with." }));
    const error = await uploadToStorage(target, blob, "image/png", { fetchImpl, resolveApiUrl }).catch((e) => e);
    expect(error).toBeInstanceOf(StorageUploadError);
    expect(error.message).toContain("could not reach storage directly");
    expect(error.message).toContain("our server answered 413");
    expect(error.message).toContain("larger than the size it was declared with");
  });

  it("shows the server's short reason code when storage refuses the write", async () => {
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(status(424, { message: "The file could not be saved to storage.", reason: "storage_access_denied" }));
    const error = await uploadToStorage(target, blob, "image/png", { fetchImpl, resolveApiUrl }).catch((e) => e);
    expect(error.message).toContain("our server answered 424");
    expect(error.message).toContain("[storage_access_denied]");
  });

  it("ignores a reason that is not a short code (no free text from the server)", async () => {
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(status(502, { reason: "<script>alert(1)</script>" }));
    const error = await uploadToStorage(target, blob, "image/png", { fetchImpl, resolveApiUrl }).catch((e) => e);
    expect(error.message).not.toContain("script");
  });

  it("fails clearly when the API cannot be reached either", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const error = await uploadToStorage(target, blob, "image/png", { fetchImpl, resolveApiUrl }).catch((e) => e);
    expect(error.message).toContain("our server could not be reached");
  });

  it("reports the direct failure when there is no fallback (local backend)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(status(500));
    const error = await uploadToStorage({ uploadURL: target.uploadURL }, blob, "image/png", { fetchImpl, resolveApiUrl }).catch((e) => e);
    expect(error).toBeInstanceOf(StorageUploadError);
    expect(error.message).toContain("storage answered 500");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
