import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("social authentication availability", () => {
  it("keeps Facebook visible on both customer auth screens when the provider is not configured", () => {
    const login = readFileSync(new URL("./Login.tsx", import.meta.url), "utf8");
    const signup = readFileSync(new URL("./Signup.tsx", import.meta.url), "utf8");

    expect(login).toContain("Sign in with Facebook");
    expect(signup).toContain("Sign up with Facebook");
    expect(login).toContain("Facebook sign-in is awaiting provider setup.");
    expect(signup).toContain("Facebook sign-in is awaiting provider setup.");
    expect(login).not.toContain("{facebookAppId && (");
    expect(signup).not.toContain("{facebookAppId && (");
  });

  it("documents the database-backed OAuth settings and production origins", () => {
    const guide = readFileSync(new URL("./admin/AdminFacebookGuide.tsx", import.meta.url), "utf8");

    expect(guide).toContain("Authentication &amp; OAuth");
    expect(guide).toContain("https://trynext.shop");
    expect(guide).toContain("https://www.trynext.shop");
    expect(guide).toContain("loads and initializes the Facebook SDK automatically");
    expect(guide).toContain("loads the Google Identity Services script automatically");
  });
});
