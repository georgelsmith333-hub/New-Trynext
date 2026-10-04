import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  process.env.DATABASE_URL = "postgres://nobody:nothing@127.0.0.1:1/none";
  process.env.JWT_SECRET = "unit-test-secret-0123456789abcdef";
  return {
    tgSend: vi.fn(),
    activityInserts: [] as Array<Record<string, any>>,
    newsletterInserts: [] as Array<Record<string, any>>,
    failActivityInsert: false,
  };
});

vi.mock("../middlewares/adminAuth", () => ({ requireAdmin: (_q: unknown, _s: unknown, next: () => void) => next() }));
vi.mock("../lib/telegram", () => ({ tgSend: (...a: unknown[]) => state.tgSend(...a), tgIsConfigured: () => true }));
vi.mock("@workspace/db", async (importActual) => {
  const actual = await importActual<Record<string, any>>();
  return {
    ...actual,
    db: {
      insert: (table: unknown) => ({
        values: (v: Record<string, any>) => {
          if (table === actual.adminActivityLogsTable) {
            if (state.failActivityInsert) return Promise.reject(new Error("db down"));
            state.activityInserts.push(v);
            return Promise.resolve();
          }
          state.newsletterInserts.push(v);
          const p: any = Promise.resolve();
          p.onConflictDoNothing = () => Promise.resolve();
          return p;
        },
      }),
    },
  };
});

import newsletterRouter from "./newsletter";

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } as any;
  next();
});
app.use("/api", newsletterRouter);

let ipCounter = 0;
const send = (body: object) => request(app).post("/api/contact").set("X-Forwarded-For", `10.0.0.${++ipCounter}`).send(body);
const good = { name: "Rina", email: "rina@example.invalid", phone: "01700000000", subject: "Mug size", message: "Do you have a 15oz mug?" };

beforeEach(() => {
  state.tgSend.mockReset();
  state.activityInserts.length = 0;
  state.newsletterInserts.length = 0;
  state.failActivityInsert = false;
});

describe("POST /contact", () => {
  it("says received and records delivery when Telegram accepted it and it was saved", async () => {
    state.tgSend.mockResolvedValue(true);
    const res = await send(good);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, delivered: true, stored: true });
    expect(res.body.message).toMatch(/received/i);
    expect(res.body.message).not.toMatch(/\bsent\b/i);
    expect(state.activityInserts).toHaveLength(1);
    expect(state.activityInserts[0]).toMatchObject({ entity: "contact_message", action: "create", adminId: null });
    expect(state.activityInserts[0].after).toMatchObject({ name: "Rina", message: "Do you have a 15oz mug?", telegramDelivered: true });
  });

  it("still accepts the message when Telegram is not configured, because it was saved for the admin", async () => {
    state.tgSend.mockResolvedValue(false);
    const res = await send(good);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, delivered: false, stored: true });
    expect(state.activityInserts[0].after.telegramDelivered).toBe(false);
  });

  it("does NOT claim success when nobody can receive the message (no Telegram, save failed)", async () => {
    state.tgSend.mockResolvedValue(false);
    state.failActivityInsert = true;
    const res = await send(good);
    expect(res.status).toBe(503);
    expect(res.body.error).toBe("contact_unavailable");
    expect(res.body.message).toMatch(/WhatsApp/);
    expect(res.body.ok).toBeUndefined();
  });

  it("succeeds on Telegram alone if the save fails", async () => {
    state.tgSend.mockResolvedValue(true);
    state.failActivityInsert = true;
    const res = await send(good);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ delivered: true, stored: false });
  });

  it("escapes what the visitor typed before sending it to Telegram", async () => {
    state.tgSend.mockResolvedValue(true);
    await send({ ...good, name: "<b>Rina</b> & co", message: "a < b > c" });
    const text = state.tgSend.mock.calls[0][0] as string;
    expect(text).toContain("&lt;b&gt;Rina&lt;/b&gt; &amp; co");
    expect(text).toContain("a &lt; b &gt; c");
    expect(text).not.toContain("<b>Rina</b>");
  });

  it("treats a rejected Telegram call as not delivered, not as a crash", async () => {
    state.tgSend.mockRejectedValue(new Error("network"));
    const res = await send(good);
    expect(res.status).toBe(200);
    expect(res.body.delivered).toBe(false);
    expect(res.body.stored).toBe(true);
  });

  it("keeps the existing rules: name and message required, one message per minute per visitor", async () => {
    state.tgSend.mockResolvedValue(true);
    const missing = await send({ name: "x" });
    expect(missing.status).toBe(400);
    const ip = "10.9.9.9";
    const a = await request(app).post("/api/contact").set("X-Forwarded-For", ip).send(good);
    const b = await request(app).post("/api/contact").set("X-Forwarded-For", ip).send(good);
    expect(a.status).toBe(200);
    expect(b.status).toBe(429);
  });

  it("still subscribes a valid email to the newsletter", async () => {
    state.tgSend.mockResolvedValue(true);
    await send(good);
    expect(state.newsletterInserts[0]).toMatchObject({ email: "rina@example.invalid", source: "contact_form" });
  });
});
