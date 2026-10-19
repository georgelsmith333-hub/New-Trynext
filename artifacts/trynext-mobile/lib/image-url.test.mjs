import assert from "node:assert/strict";
import test from "node:test";
import { resolveImageUrl } from "./image-url.ts";

const baseUrl = "https://trynext.shop/api/v1";

test("resolves root-relative catalog image paths against the site origin", () => {
  assert.equal(
    resolveImageUrl("/assets/products/item.webp", baseUrl),
    "https://trynext.shop/assets/products/item.webp",
  );
});

test("resolves relative catalog image paths from the site root", () => {
  assert.equal(
    resolveImageUrl("assets/products/item.webp", baseUrl),
    "https://trynext.shop/assets/products/item.webp",
  );
});

test("preserves absolute HTTPS image URLs", () => {
  assert.equal(
    resolveImageUrl("https://cdn.example.test/item.webp", baseUrl),
    "https://cdn.example.test/item.webp",
  );
});

test("uses HTTPS for protocol-relative image URLs", () => {
  assert.equal(
    resolveImageUrl("//cdn.example.test/item.webp", baseUrl),
    "https://cdn.example.test/item.webp",
  );
});

test("preserves native local-file URIs", () => {
  assert.equal(
    resolveImageUrl("file:///data/user/0/app/item.webp", baseUrl),
    "file:///data/user/0/app/item.webp",
  );
});

test("preserves data and Android content image URIs", () => {
  assert.equal(
    resolveImageUrl("data:image/png;base64,AA==", baseUrl),
    "data:image/png;base64,AA==",
  );
  assert.equal(
    resolveImageUrl("content://media/item/42", baseUrl),
    "content://media/item/42",
  );
});

test("rejects unsupported executable URI schemes", () => {
  assert.equal(resolveImageUrl("javascript:alert(1)", baseUrl), null);
});

test("returns null for missing or whitespace-only image URLs", () => {
  assert.equal(resolveImageUrl(undefined, baseUrl), null);
  assert.equal(resolveImageUrl(null, baseUrl), null);
  assert.equal(resolveImageUrl("   ", baseUrl), null);
});

test("returns null when the configured base URL is invalid", () => {
  assert.equal(
    resolveImageUrl("/assets/products/item.webp", "not a URL"),
    null,
  );
});
