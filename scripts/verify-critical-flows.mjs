/**
 * Non-mutating smoke checks for the highest-value customer and admin flows.
 *
 * This intentionally checks page delivery and auth boundaries only. It never
 * creates orders, payments, uploads, reviews, sessions, or admin mutations.
 *
 * Usage:
 *   node scripts/verify-critical-flows.mjs
 *   BASE_URL=https://trynext.shop node scripts/verify-critical-flows.mjs
 */

const BASE_URL = (process.env.BASE_URL ?? "https://trynext.shop").replace(/\/+$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 15_000);

const customerPages = [
  "/",
  "/shop",
  "/products",
  "/design-studio",
  "/cart",
  "/checkout",
  "/account",
  "/login",
  "/signup",
  "/track",
  "/hampers",
];

const adminPages = [
  "/admin/login",
  "/admin",
  "/admin/products",
  "/admin/orders",
  "/admin/customers",
  "/admin/settings",
  "/admin/mockups",
  "/admin/deployment",
  "/admin/roles",
];

const publicApis = [
  { path: "/api/health/readiness", check: (body) => body?.status === "ok" },
  { path: "/api/products?limit=1", check: (body) => Array.isArray(body?.products) },
  { path: "/api/categories", check: (body) => Array.isArray(body?.categories) || Array.isArray(body) },
  { path: "/api/settings", check: (body) => body && typeof body === "object" },
];

const protectedApis = [
  "/api/orders/my",
  "/api/admin/me",
  "/api/admin/stats",
  "/api/admin/sessions",
  "/api/admin/system/health",
];

const guestSafeApis = [
  { path: "/api/orders/my/messages/unread-count", check: (body) => Number.isInteger(body?.count) && body.count >= 0 },
];

function withTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, redirect: "manual", signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

async function checkPage(path) {
  const response = await withTimeout(`${BASE_URL}${path}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status !== 200 || !contentType.includes("text/html")) {
    throw new Error(`${path}: expected HTML 200, got ${response.status} ${contentType}`);
  }
}

async function checkPublicApi({ path, check }) {
  const response = await withTimeout(`${BASE_URL}${path}`, {
    headers: { accept: "application/json" },
  });
  const body = await response.json().catch(() => null);
  if (response.status !== 200 || !check(body)) {
    throw new Error(`${path}: expected valid JSON 200, got ${response.status}`);
  }
}

async function checkProtectedApi(path) {
  const response = await withTimeout(`${BASE_URL}${path}`, {
    headers: { accept: "application/json" },
  });
  if (![401, 403].includes(response.status)) {
    throw new Error(`${path}: expected unauthenticated 401/403, got ${response.status}`);
  }
}

async function checkGuestSafeApi({ path, check }) {
  const response = await withTimeout(`${BASE_URL}${path}`, {
    headers: { accept: "application/json" },
  });
  const body = await response.json().catch(() => null);
  if (response.status !== 200 || !check(body)) {
    throw new Error(`${path}: expected guest-safe JSON 200, got ${response.status}`);
  }
}

const failures = [];
for (const path of customerPages) {
  try {
    await checkPage(path);
    console.log(`PASS customer page ${path}`);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}
for (const path of adminPages) {
  try {
    await checkPage(path);
    console.log(`PASS admin page ${path}`);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}
for (const api of publicApis) {
  try {
    await checkPublicApi(api);
    console.log(`PASS public API ${api.path}`);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}
for (const path of protectedApis) {
  try {
    await checkProtectedApi(path);
    console.log(`PASS protected API ${path}`);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}
for (const api of guestSafeApis) {
  try {
    await checkGuestSafeApi(api);
    console.log(`PASS guest-safe API ${api.path}`);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}

const total = customerPages.length + adminPages.length + publicApis.length + protectedApis.length + guestSafeApis.length;
if (failures.length) {
  console.error(`Critical-flow smoke checks FAILED: ${failures.length}/${total}`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Critical-flow smoke checks passed: ${total}/${total} (${BASE_URL})`);