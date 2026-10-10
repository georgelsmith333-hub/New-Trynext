# S1/S2/R2 manager audit — 2026-10-10

## S1 upload blocker

The application-side fixes are already present on `main`: commit `8eec152` removes the empty-body R2 checksum from presigned upload URLs, and commit `70acdb0` adds sanitized storage failure classification and short reason codes. The current API route returns a JSON `502` with a non-secret reason when the storage write itself fails. Focused tests passed: **25/25** across the R2 checksum configuration, storage error classification, and API upload route.

The latest public live capture still returned `502 text/html` with `server: cloudflare` for `upload-via-api`, not the current route’s JSON error shape. Therefore this is not an application-code defect that can be safely fixed from the repository. It requires the deployed Render/edge path and R2 account/bucket configuration to be checked by an owner with provider access. No provider setting was changed.

## S2 public checks

The recorded live checks remain passing for product totals and price filtering, optimized image responses, health endpoints, and the registered `/sw.js` service worker. The `/service-worker.js` HTML response is not a defect because the app registers `/sw.js`; no code change is justified. Focused storefront contracts passed: **21/21** across Studio regression, CSRF-header, and store behavior tests.

## R2 mockup gate

The local structural validator passed with `expectedSurfaces: 188`, `runtimeRoles: 1128`, and `status: accepted`. This is structural repository evidence only; it is **not** a Photopea validator report and does not prove the 94 side-view/mug-wrap surfaces. No `claude/evidence/photopea-validator-report.*` exists, so those 94 surfaces remain `candidate` and the release gate stays fail-closed.

No production data, provider settings, schema, orders, payments, customer data, or mockup activation state was changed.
