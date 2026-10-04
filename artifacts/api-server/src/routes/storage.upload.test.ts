import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => { process.env.JWT_SECRET = "unit-test-secret-0123456789abcdef"; });

const { storeUploadedObject, backend } = vi.hoisted(() => ({ storeUploadedObject: vi.fn(), backend: { name: "r2" } }));
const ID = "123e4567-e89b-42d3-a456-426614174000";

vi.mock("../lib/adminSessions", () => ({ validateAdminSession: vi.fn() }));
vi.mock("../lib/customerAuth", () => ({ extractCustomerToken: () => null, verifyCustomerToken: () => null }));
vi.mock("../middlewares/adminAuth", () => ({ requireAdmin: (_q: unknown, _s: unknown, next: () => void) => next() }));
vi.mock("../lib/objectStorage", () => ({
  ObjectNotFoundError: class ObjectNotFoundError extends Error {},
  ObjectStorageService: class {
    getBackendName() { return backend.name; }
    getObjectEntityUploadTarget() {
      return Promise.resolve({ uploadURL: `https://bucket.invalid/uploads/${ID}?X-Amz-Signature=secret`, objectId: ID });
    }
    normalizeObjectEntityPath() { return `/objects/${ID}`; }
    storeUploadedObject(...args: unknown[]) { return storeUploadedObject(...args); }
  },
}));

import storageRouter from "./storage";
import { buildApiUploadPath, signUploadGrant } from "../lib/uploadGrant";

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } as any;
  next();
});
app.use("/api", storageRouter);

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 1)]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(40, 2)]);
const future = () => Math.floor(Date.now() / 1000) + 600;
const grant = (over: Partial<{ exp: number; size: number; contentType: string; objectId: string }> = {}) =>
  ({ objectId: ID, exp: future(), size: 4096, contentType: "image/png", ...over });
const put = (path: string, body: Buffer, type = "image/png") => request(app).put(path).set("Content-Type", type).send(body);

beforeEach(() => { storeUploadedObject.mockReset(); storeUploadedObject.mockResolvedValue(undefined); backend.name = "r2"; });

describe("POST /storage/uploads/request-url", () => {
  it("offers a through-the-API upload with a cloud bucket, bound to this object, size and type", async () => {
    const res = await request(app).post("/api/storage/uploads/request-url").send({ name: "a.png", size: 1234, contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.uploadURL).toContain("bucket.invalid");
    expect(res.body.fallbackUploadURL).toMatch(new RegExp(`^/api/storage/upload-via-api/${ID}\\?`));
    const q = new URL(`http://x${res.body.fallbackUploadURL}`).searchParams;
    expect(q.get("size")).toBe("1234");
    expect(q.get("type")).toBe("image/png");
    expect(res.body.fallbackExpiresAt).toBeGreaterThan(Date.now());
  });

  it("offers no through-the-API link on the local backend (its direct upload is already the API)", async () => {
    backend.name = "local";
    const res = await request(app).post("/api/storage/uploads/request-url").send({ name: "a.png", size: 10, contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.fallbackUploadURL).toBeUndefined();
  });
});

describe("PUT /storage/upload-via-api/:objectId", () => {
  it("stores a valid file and returns the object path", async () => {
    const res = await put(buildApiUploadPath(grant()), PNG);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, objectPath: `/objects/${ID}`, detectedType: "image/png", via: "api" });
    expect(storeUploadedObject).toHaveBeenCalledTimes(1);
    const [id, body, type] = storeUploadedObject.mock.calls[0];
    expect(id).toBe(ID);
    expect(Buffer.compare(body as Buffer, PNG)).toBe(0);
    expect(type).toBe("image/png");
  });

  it("refuses a missing, tampered, mismatched or other-object grant without touching storage", async () => {
    const path = buildApiUploadPath(grant());
    expect((await put(`/api/storage/upload-via-api/${ID}`, PNG)).status).toBe(400);
    expect((await put(path.replace(/sig=[^&]+/, "sig=AAAA"), PNG)).status).toBe(401);
    expect((await put(path.replace("size=4096", "size=999999"), PNG)).status).toBe(401);
    expect((await put(path.replace("type=image%2Fpng", "type=image%2Fjpeg"), PNG)).status).toBe(401);
    const other = path.replace(ID, "223e4567-e89b-42d3-a456-426614174000");
    expect((await put(other, PNG)).status).toBe(401);
    expect((await put(`/api/storage/upload-via-api/not-a-uuid?exp=1&size=1&type=image%2Fpng&sig=x`, PNG)).status).toBe(400);
    expect(storeUploadedObject).not.toHaveBeenCalled();
  });

  it("refuses an expired grant with a clear message", async () => {
    const res = await put(buildApiUploadPath(grant({ exp: Math.floor(Date.now() / 1000) - 10 })), PNG);
    expect(res.status).toBe(410);
    expect(res.body.error).toBe("upload_grant_expired");
    expect(storeUploadedObject).not.toHaveBeenCalled();
  });

  it("refuses a body larger than the size the grant was issued for", async () => {
    const res = await put(buildApiUploadPath(grant({ size: 20 })), PNG);
    expect(res.status).toBe(413);
    expect(storeUploadedObject).not.toHaveBeenCalled();
  });

  it("refuses a file whose bytes are not the declared type, even with a matching header", async () => {
    expect((await put(buildApiUploadPath(grant()), JPEG)).status).toBe(415);
    expect((await put(buildApiUploadPath(grant()), Buffer.from("<script>alert(1)</script>"))).status).toBe(415);
    expect(storeUploadedObject).not.toHaveBeenCalled();
  });

  it("refuses a Content-Type header that disagrees with the grant", async () => {
    const res = await put(buildApiUploadPath(grant()), PNG, "image/jpeg");
    expect(res.status).toBe(415);
    expect(res.body.error).toBe("content_type_mismatch");
  });

  it("refuses an empty body", async () => {
    expect((await put(buildApiUploadPath(grant()), Buffer.alloc(0))).status).toBe(400);
  });

  it("reports a storage failure plainly and leaks nothing", async () => {
    storeUploadedObject.mockRejectedValue(new Error("AccessDenied: key AKIA123 secret"));
    const res = await put(buildApiUploadPath(grant()), PNG);
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toMatch(/AKIA|secret|X-Amz/i);
  });

  it("signature helper and route agree (a hand-built signature works, a wrong key does not)", async () => {
    const g = grant();
    const sig = signUploadGrant(g);
    const q = new URLSearchParams({ exp: String(g.exp), size: String(g.size), type: g.contentType, sig });
    expect((await put(`/api/storage/upload-via-api/${ID}?${q}`, PNG)).status).toBe(200);
  });
});
