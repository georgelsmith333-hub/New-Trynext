import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";

const warn = vi.fn();
const error = vi.fn();
vi.mock("./logger", () => ({
  logger: { warn: (...a: unknown[]) => warn(...a), error: (...a: unknown[]) => error(...a), info: vi.fn(), debug: vi.fn() },
}));

import { globalErrorHandler } from "./errorHandler";
import { requestMetrics, requestMetricsMiddleware } from "./requestMetrics";

function makeApp() {
  const app = express();
  app.use(requestMetricsMiddleware);
  app.use(express.json({ limit: "1kb" }));
  app.post("/echo", (_req, res) => {
    res.json({ ok: true });
  });
  app.get("/boom", () => {
    throw new Error("query failed: password=hunter2 for user bob at postgres://bob:pw@db.example.invalid/app");
  });
  app.get("/async-boom", async () => {
    throw new Error("async failure");
  });
  app.get("/cors", (_req, _res, next) => next(new Error("CORS: origin https://evil.example.invalid not allowed")));
  app.get("/teapot", (_req, _res, next) => next(Object.assign(new Error("short and stout"), { status: 418, expose: true })));
  app.get("/hidden-4xx", (_req, _res, next) => next(Object.assign(new Error("internal detail"), { status: 409 })));
  app.use(globalErrorHandler);
  return app;
}

const originalEnv = process.env.NODE_ENV;

describe("globalErrorHandler", () => {
  beforeEach(() => {
    warn.mockClear();
    error.mockClear();
    requestMetrics.reset();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("answers malformed JSON with 400, not 500, and does not echo the parser message", async () => {
    // Regression: this used to be HTTP 500 "internal_error" plus an error-level log.
    const res = await request(makeApp()).post("/echo").set("Content-Type", "application/json").send("{bad json").expect(400);
    expect(res.body).toEqual({ error: "invalid_json", message: "Request body is not valid JSON." });
    expect(JSON.stringify(res.body)).not.toMatch(/Expected property|position/i);
  });

  it("answers an oversized body with 413", async () => {
    const res = await request(makeApp())
      .post("/echo")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ blob: "x".repeat(5_000) }))
      .expect(413);
    expect(res.body.error).toBe("payload_too_large");
  });

  it("answers an unsupported charset with 415", async () => {
    const res = await request(makeApp())
      .post("/echo")
      .set("Content-Type", "application/json; charset=iso-8859-1")
      .send("{}")
      .expect(415);
    expect(res.body.error).toBe("unsupported_media_type");
  });

  it("shows an exposed client-error message but hides an unexposed one", async () => {
    const teapot = await request(makeApp()).get("/teapot").expect(418);
    expect(teapot.body).toEqual({ error: "bad_request", message: "short and stout" });
    const hidden = await request(makeApp()).get("/hidden-4xx").expect(409);
    expect(hidden.body).toEqual({ error: "bad_request", message: "Bad request." });
  });

  it("logs client mistakes as warnings and keeps them out of the server-error figures", async () => {
    const app = makeApp();
    await request(app).post("/echo").set("Content-Type", "application/json").send("{bad").expect(400);
    await request(app).post("/echo").set("Content-Type", "application/json").send("{also bad").expect(400);
    await request(app).get("/teapot").expect(418);
    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(3);
    const snap = requestMetrics.snapshot();
    expect(snap.last60m.errors4xx).toBe(3);
    expect(snap.last60m.errors5xx).toBe(0);
    expect(snap.recentErrors).toHaveLength(0);
  });

  it("answers a genuine server error with 500 and records a redacted message", async () => {
    process.env.NODE_ENV = "test";
    const res = await request(makeApp()).get("/boom").expect(500);
    expect(res.body.error).toBe("internal_error");
    expect(error).toHaveBeenCalledTimes(1);
    const snap = requestMetrics.snapshot();
    expect(snap.last60m.errors5xx).toBe(1);
    const message = snap.recentErrors[0].message ?? "";
    expect(message).not.toMatch(/hunter2|bob|db\.example|postgres:\/\//);
  });

  it("hides internal error text from the client in production", async () => {
    process.env.NODE_ENV = "production";
    const res = await request(makeApp()).get("/boom").expect(500);
    expect(res.body).toEqual({ error: "internal_error", message: "An unexpected error occurred." });
    expect(JSON.stringify(res.body)).not.toMatch(/hunter2|query failed/);
  });

  it("handles a rejected async handler the same way", async () => {
    process.env.NODE_ENV = "test";
    const res = await request(makeApp()).get("/async-boom").expect(500);
    expect(res.body).toEqual({ error: "internal_error", message: "async failure" });
  });

  it("keeps CORS rejections as 403 and does not log them as server errors", async () => {
    const res = await request(makeApp()).get("/cors").expect(403);
    expect(res.body.error).toBe("cors_error");
    expect(res.body.message).toMatch(/^CORS:/);
    expect(error).not.toHaveBeenCalled();
    expect(requestMetrics.snapshot().recentErrors).toHaveLength(0);
  });

  it("hands off to Express when the response has already started instead of hanging", () => {
    const failure = new Error("late failure");
    const next = vi.fn();
    const status = vi.fn();
    const res = { headersSent: true, locals: {}, status, json: vi.fn() } as any;
    globalErrorHandler(failure, { method: "GET", url: "/x" } as any, res, next);
    expect(next).toHaveBeenCalledWith(failure);
    expect(status).not.toHaveBeenCalled();
  });
});
