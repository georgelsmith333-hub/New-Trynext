import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import type pg from "pg";
import { watchPoolConnectionErrors } from "../src/poolRecovery";

function fakePool(connect: (...args: any[]) => any): pg.Pool {
  const pool = new EventEmitter() as unknown as pg.Pool;
  pool.connect = connect as pg.Pool["connect"];
  return pool;
}

describe("watchPoolConnectionErrors", () => {
  it("observes a rejected promise acquisition and propagates the original error", async () => {
    const error = Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" });
    const pool = fakePool(() => Promise.reject(error));
    const onError = vi.fn();
    watchPoolConnectionErrors(pool, onError);

    await expect(pool.connect()).rejects.toBe(error);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("observes callback-style acquisition failures without changing the callback result", async () => {
    const error = Object.assign(new Error("connection timeout"), { code: "ETIMEDOUT" });
    const pool = fakePool((callback) => callback(error, undefined, undefined));
    const onError = vi.fn();
    watchPoolConnectionErrors(pool, onError);

    const callbackResult = new Promise<unknown[]>((resolve) => {
      pool.connect((...args) => resolve(args));
    });

    await expect(callbackResult).resolves.toEqual([error, undefined, undefined]);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("observes an error from a checked-out client without replaying its query", async () => {
    const client = new EventEmitter() as unknown as pg.PoolClient;
    const pool = fakePool(() => Promise.resolve(client));
    const onError = vi.fn();
    watchPoolConnectionErrors(pool, onError);

    await pool.connect();
    const error = Object.assign(new Error("server closed connection"), { code: "57P01" });
    client.emit("error", error);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error);
  });
});
