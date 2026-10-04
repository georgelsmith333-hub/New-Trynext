import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => { process.env.JWT_SECRET = "unit-test-secret-0123456789abcdef"; });

import { buildApiUploadPath, isUploadObjectId, parseUploadGrant, signUploadGrant, verifyUploadGrant, type UploadGrant } from "./uploadGrant";

const ID = "123e4567-e89b-42d3-a456-426614174000";
const future = () => Math.floor(Date.now() / 1000) + 600;
const base = (over: Partial<UploadGrant> = {}): UploadGrant => ({ objectId: ID, exp: future(), size: 1000, contentType: "image/png", ...over });

describe("upload grants", () => {
  it("accepts a freshly signed grant", () => {
    const g = base();
    expect(verifyUploadGrant(g, signUploadGrant(g))).toBe("ok");
  });

  it("rejects a changed object id, size, type or expiry", () => {
    const g = base();
    const sig = signUploadGrant(g);
    expect(verifyUploadGrant({ ...g, objectId: "123e4567-e89b-42d3-a456-426614174001" }, sig)).toBe("invalid");
    expect(verifyUploadGrant({ ...g, size: g.size + 1 }, sig)).toBe("invalid");
    expect(verifyUploadGrant({ ...g, contentType: "image/jpeg" }, sig)).toBe("invalid");
    expect(verifyUploadGrant({ ...g, exp: g.exp + 60 }, sig)).toBe("invalid");
  });

  it("rejects garbage signatures", () => {
    const g = base();
    for (const sig of ["", "x", "!!!", signUploadGrant(g).slice(0, -2)]) expect(verifyUploadGrant(g, sig)).toBe("invalid");
  });

  it("reports an expired but correctly signed grant as expired", () => {
    const g = base({ exp: Math.floor(Date.now() / 1000) - 5 });
    expect(verifyUploadGrant(g, signUploadGrant(g))).toBe("expired");
  });

  it("rejects non-UUID object ids and non-positive sizes even when signed", () => {
    for (const bad of [base({ objectId: "../etc/passwd" }), base({ size: 0 }), base({ contentType: "" })]) {
      expect(verifyUploadGrant(bad, signUploadGrant(bad))).toBe("invalid");
    }
    expect(isUploadObjectId(ID)).toBe(true);
    expect(isUploadObjectId("not-an-id")).toBe(false);
    expect(isUploadObjectId(undefined)).toBe(false);
  });

  it("builds a relative path that parses back to the same grant", () => {
    const g = base();
    const path = buildApiUploadPath(g);
    expect(path.startsWith(`/api/storage/upload-via-api/${ID}?`)).toBe(true);
    const query = Object.fromEntries(new URL(`http://x${path}`).searchParams.entries());
    const parsed = parseUploadGrant(ID, query)!;
    expect(parsed.grant).toEqual(g);
    expect(verifyUploadGrant(parsed.grant, parsed.signature)).toBe("ok");
  });

  it("refuses incomplete or malformed query values", () => {
    expect(parseUploadGrant(ID, {})).toBeNull();
    expect(parseUploadGrant(ID, { exp: "abc", size: "1", type: "image/png", sig: "s" })).toBeNull();
    expect(parseUploadGrant(ID, { exp: "1", size: "-1", type: "image/png", sig: "s" })).toBeNull();
    expect(parseUploadGrant("nope", { exp: "1", size: "1", type: "image/png", sig: "s" })).toBeNull();
  });
});
