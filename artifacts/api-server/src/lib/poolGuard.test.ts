import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "node:events";
import type { Pool } from "pg";

const warn = vi.fn();
vi.mock("./logger", () => ({ logger: { warn: (...args: unknown[]) => warn(...args), info: vi.fn(), error: vi.fn() } }));

import { guardPool } from "./poolGuard";

function fakePool(): Pool {
  return new EventEmitter() as unknown as Pool;
}

describe("guardPool", () => {
  it("documents the failure it prevents: an unguarded pool throws on an idle-client error", () => {
    const pool = fakePool();
    const terminated = Object.assign(new Error("terminating connection due to administrator command"), { code: "57P01" });
    // Node turns an "error" event with no listener into an uncaught exception.
    expect(() => pool.emit("error", terminated)).toThrow(/terminating connection/);
  });

  it("swallows an idle-client error and logs it instead of crashing the process", () => {
    warn.mockClear();
    const pool = guardPool(fakePool(), "active");
    const terminated = Object.assign(new Error("terminating connection due to administrator command"), { code: "57P01" });
    expect(() => pool.emit("error", terminated)).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    const [fields] = warn.mock.calls[0];
    expect(fields).toMatchObject({ pool: "active", code: "57P01" });
  });

  it("keeps handling repeated errors", () => {
    warn.mockClear();
    const pool = guardPool(fakePool(), "probe");
    for (let i = 0; i < 3; i += 1) pool.emit("error", new Error("Connection terminated unexpectedly"));
    expect(warn).toHaveBeenCalledTimes(3);
  });

  it("does not put connection strings or credentials in the log", () => {
    warn.mockClear();
    const pool = guardPool(fakePool(), "backup-target");
    pool.emit("error", new Error("connect failed postgres://user:hunter2@db.example.invalid:5432/app password=hunter2"));
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(/hunter2|db\.example/);
  });

  it("uses an 'unknown' code when the error has none, and returns the same pool", () => {
    warn.mockClear();
    const raw = fakePool();
    const pool = guardPool(raw, "cluster-probe");
    expect(pool).toBe(raw);
    pool.emit("error", new Error("boom"));
    expect(warn.mock.calls[0][0]).toMatchObject({ code: "unknown" });
  });
});
