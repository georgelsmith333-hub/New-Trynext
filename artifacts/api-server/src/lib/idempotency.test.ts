import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createIdempotency } from "./idempotency";

const KEY = "11111111-2222-3333-4444-555555555555";
const KEY2 = "99999999-2222-3333-4444-555555555555";

function build(options: Parameters<typeof createIdempotency>[0] = {}, handler?: express.RequestHandler) {
  const guard = createIdempotency(options);
  const calls = { n: 0 };
  const app = express();
  app.use(express.json());
  app.post("/orders", guard.middleware, handler ?? (async (req, res) => {
    calls.n++;
    await new Promise((r) => setTimeout(r, 30));
    res.status(201).json({ orderNumber: `TNX-${calls.n}`, echo: req.body.v });
  }));
  return { app, calls, guard };
}
const post = (app: express.Express, body: object, key?: string) => {
  const r = request(app).post("/orders");
  if (key !== undefined) r.set("Idempotency-Key", key);
  return r.send(body);
};

describe("idempotency middleware", () => {
  it("runs the handler once and replays the first reply for a repeated key", async () => {
    const { app, calls } = build();
    const a = await post(app, { v: 1 }, KEY);
    const b = await post(app, { v: 1 }, KEY);
    expect(calls.n).toBe(1);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(b.body).toEqual(a.body);
    expect(a.headers["idempotent-replayed"]).toBeUndefined();
    expect(b.headers["idempotent-replayed"]).toBe("true");
  });

  it("runs the handler once for simultaneous duplicates and gives all of them the same reply", async () => {
    const { app, calls } = build();
    const results = await Promise.all([1, 2, 3, 4, 5].map(() => post(app, { v: 1 }, KEY)));
    expect(calls.n).toBe(1);
    expect(new Set(results.map((r) => r.body.orderNumber)).size).toBe(1);
    expect(results.every((r) => r.status === 201)).toBe(true);
  });

  it("does nothing without a key (every request runs)", async () => {
    const { app, calls } = build();
    await post(app, { v: 1 });
    await post(app, { v: 1 });
    expect(calls.n).toBe(2);
  });

  it("treats different keys as different requests", async () => {
    const { app, calls } = build();
    await post(app, { v: 1 }, KEY);
    await post(app, { v: 1 }, KEY2);
    expect(calls.n).toBe(2);
  });

  it("refuses a key reused with a different body, without running the handler or leaking the first reply", async () => {
    const { app, calls } = build();
    const first = await post(app, { v: 1 }, KEY);
    const second = await post(app, { v: 2 }, KEY);
    expect(second.status).toBe(422);
    expect(second.body.error).toBe("idempotency_key_reused");
    expect(JSON.stringify(second.body)).not.toContain(first.body.orderNumber);
    expect(calls.n).toBe(1);
  });

  it("rejects malformed keys", async () => {
    const { app, calls } = build();
    for (const bad of ["short", "has spaces in the key 1234567890", "x".repeat(129), "../../etc/passwd-0000000000"]) {
      const res = await post(app, { v: 1 }, bad);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_idempotency_key");
    }
    expect(calls.n).toBe(0);
  });

  it("does not keep failures, so a retry runs the handler again", async () => {
    let n = 0;
    const { app } = build({}, (_req, res) => {
      n++;
      if (n === 1) { res.status(500).json({ error: "boom" }); return; }
      res.status(201).json({ ok: true, n });
    });
    const first = await post(app, { v: 1 }, KEY);
    const retry = await post(app, { v: 1 }, KEY);
    expect(first.status).toBe(500);
    expect(retry.status).toBe(201);
    expect(retry.headers["idempotent-replayed"]).toBeUndefined();
    expect(n).toBe(2);
  });

  it("lets a duplicate run the handler itself if the first attempt failed while it waited", async () => {
    let n = 0;
    const { app } = build({}, async (_req, res) => {
      n++;
      const mine = n;
      await new Promise((r) => setTimeout(r, 40));
      if (mine === 1) { res.status(502).json({ error: "bad gateway" }); return; }
      res.status(201).json({ ok: true, by: mine });
    });
    const [a, b] = await Promise.all([post(app, { v: 1 }, KEY), post(app, { v: 1 }, KEY)]);
    expect([a.status, b.status].sort()).toEqual([201, 502]);
    expect(n).toBe(2);
  });

  it("forgets a reply after the time limit", async () => {
    let t = 1_000;
    const { app, calls } = build({ ttlMs: 60_000, now: () => t });
    await post(app, { v: 1 }, KEY);
    t += 30_000;
    await post(app, { v: 1 }, KEY);
    expect(calls.n).toBe(1);
    t += 40_000;
    await post(app, { v: 1 }, KEY);
    expect(calls.n).toBe(2);
  });

  it("stays within its size limit", async () => {
    const { app, guard } = build({ maxEntries: 3 });
    for (let i = 0; i < 6; i++) await post(app, { v: i }, `${i}`.repeat(20));
    expect(guard.size()).toBeLessThanOrEqual(3);
  });

  it("answers 503 with Retry-After when the first attempt is still running after the wait limit", async () => {
    const { app } = build({ maxWaitMs: 30 }, async (_req, res) => {
      await new Promise((r) => setTimeout(r, 300));
      res.status(201).json({ ok: true });
    });
    const [a, b] = await Promise.all([post(app, { v: 1 }, KEY), post(app, { v: 1 }, KEY)]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 503]);
    const slow = a.status === 503 ? a : b;
    expect(slow.headers["retry-after"]).toBe("2");
    expect(slow.body.error).toBe("request_in_progress");
  });
});
