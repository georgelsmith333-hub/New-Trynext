import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { validateAdminSession, verifyCustomerToken } = vi.hoisted(() => ({
  validateAdminSession: vi.fn(),
  verifyCustomerToken: vi.fn(),
}));

vi.mock("../lib/adminSessions", () => ({ validateAdminSession }));
vi.mock("../lib/customerAuth", () => ({
  extractCustomerToken: (req: { headers: { authorization?: string }; cookies?: Record<string, string> }) =>
    req.headers.authorization?.replace(/^Bearer\\s+/i, "").trim() ?? req.cookies?.customer_token ?? null,
  verifyCustomerToken,
}));
vi.mock("../middlewares/adminAuth", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
vi.mock("../lib/objectStorage", () => ({
  ObjectNotFoundError: class ObjectNotFoundError extends Error {},
  ObjectStorageService: class ObjectStorageService {
    getBackendName() { return "local"; }
    getObjectEntityUploadURL() { return Promise.resolve("http://localhost/api/storage/upload-direct/123e4567-e89b-12d3-a456-426614174000"); }
    normalizeObjectEntityPath() { return "/objects/123e4567-e89b-12d3-a456-426614174000"; }
    streamPublicObject() { return Promise.resolve(); }
    streamPrivateObject() { return Promise.resolve(); }
    saveLocalUpload() { return Promise.resolve(); }
    getObjectBuffer() { return Promise.resolve(Buffer.from("")); }
  },
}));

import storageRouter from "./storage";

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } as any;
  next();
});
app.use("/api", storageRouter);

describe("Private storage authorization", () => {
  beforeEach(() => {
    validateAdminSession.mockReset();
    verifyCustomerToken.mockReset();
    validateAdminSession.mockResolvedValue(null);
    verifyCustomerToken.mockReturnValue(null);
  });

  it("rejects unauthenticated private-object reads before storage access", async () => {
    const response = await request(app).get("/api/storage/objects/nonexistent");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: "unauthorized",
      message: "Authentication required for private object access",
    });
  });
});
