import { describe, it, expect } from "vitest";
import { isUniqueViolation } from "./dbErrors";

describe("isUniqueViolation", () => {
  it("recognises a driver error carrying SQLSTATE 23505", () => {
    expect(isUniqueViolation(Object.assign(new Error("duplicate key value violates unique constraint"), { code: "23505" }))).toBe(true);
  });

  it("finds the code when the ORM wraps the driver error as `cause`", () => {
    const driver = Object.assign(new Error("duplicate key"), { code: "23505" });
    const wrapped = Object.assign(new Error("Failed query: insert into categories"), { cause: driver });
    expect(isUniqueViolation(wrapped)).toBe(true);
  });

  it("looks a few levels deep but not forever", () => {
    const deep = { cause: { cause: { cause: { cause: { code: "23505" } } } } };
    expect(isUniqueViolation({ cause: { cause: { code: "23505" } } })).toBe(true);
    expect(isUniqueViolation(deep)).toBe(false);
  });

  it("does not treat other database errors as duplicates", () => {
    expect(isUniqueViolation(Object.assign(new Error("fk"), { code: "23503" }))).toBe(false);
    expect(isUniqueViolation(Object.assign(new Error("not null"), { code: "23502" }))).toBe(false);
    expect(isUniqueViolation(new Error("connection refused"))).toBe(false);
  });

  it("is safe on junk input", () => {
    for (const value of [null, undefined, "23505", 23505, {}, []]) expect(isUniqueViolation(value)).toBe(false);
  });

  it("survives a self-referencing cause chain", () => {
    const loop: { cause?: unknown } = {};
    loop.cause = loop;
    expect(isUniqueViolation(loop)).toBe(false);
  });
});
