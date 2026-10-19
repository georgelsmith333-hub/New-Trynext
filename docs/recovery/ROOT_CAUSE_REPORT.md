# TryNext Root-Cause Report — 2026-10-20

## 1. Production catalog/API outage

**Observed:** direct GET to Render `/api/health/liveness` returned 200. `/api/health/readiness` returned 503 with `status=error`, `db=false`, `catalog=false`, and `dbLatencyMs=0`. `/api/products?limit=1` returned 500 with generic `internal_error`, both through `https://trynext.shop` and the Render origin. No raw error message was recorded.

**Correlated provider evidence:** read-only Neon metadata showed primary `production` branches archived in both known projects: `trynex` and `trynex-db`. This is consistent with a database connectivity failure and is the strongest available explanation.

**Root cause status:** database dependency failure is confirmed by the live readiness response. The exact root cause is **not fully proven** because the Render database connection target was intentionally not inspected, no SQL was run, and no provider state was changed. The owner must identify which project is authoritative, confirm the service’s target in the dashboard without sharing values, and restore that branch/compute under owner control. Do not start, unarchive, or reconfigure a database automatically.

## 2. Additional code-level causes identified and locally addressed

| Issue | Source-level cause | Local correction | Validation |
|---|---|---|---|
| Mobile product images missing on native clients | Catalog image paths can be `/assets/...`; React Native native `Image` receives them without an origin. | Shared `resolveImageUrl` resolves relative paths against API site origin, allows only supported image URI schemes, and is used in product cards, detail gallery, and cart. | 9 Node tests; mobile typecheck; web and Android exports pass. Device runtime remains UNVERIFIED. |
| Candidate mockup surface may be exposed as approved | Runtime role construction did not consume per-surface review status. | Added a fail-closed allowlist and test comparing all 188 manifest rows; water-bottle hold retained. | Storefront suite, typecheck/build, structural validators pass. No visual approval or promotion. |
| Storage-health exception detail leak | Catch block returned raw `Error.message` to a public endpoint. | Response now uses stable `storage_unavailable`. | Focused regression and full API suite pass. |
| Activity-log secret exposure | Before/after snapshots could be persisted, returned, or included in rollback responses without recursive masking; failure diagnostics could include snapshots/error text. | Redact secret-like fields before persistence; redact response snapshots and rollback results; log only safe metadata on write failure. | Helper and route regressions; full API suite passes. Historical DB rows remain unchanged but are masked at the API boundary. |
| Backup export/import secret settings | Export serialized all settings; import accepted secret-like setting keys. | Exclude sensitive setting-key rows from exports; skip them on import and report only a count. | Mocked route tests; full API suite/typecheck/build pass. No live backup was created/imported. |

## 3. Not established as root causes

The previously reported product-price mismatch, R2 `AccessDenied`, Studio pinch behavior, possible database-candidate scoring issue, CDN/cache behavior, and seven-day operational impact were not re-established as current live root causes in this run. The historical pinch fix remains in PR #67 and is not merged. The current `db=false` evidence does not establish whether R2 is reachable or whether M1 is complete.

## 4. Safety and release status

All code corrections are on `manus/recovery-phase1-2026-10-16`, based on main `1d8fb7b…`; implementation commit `5d61f91` is pushed in draft PR #71. The PR is not merged or deployed. No production data, provider settings, schema, orders, payments, or customer records were changed or accessed.


## Status update — 2026-10-20

The code corrections and reports are now pushed in draft [PR #71](https://github.com/georgelsmith333-hub/New-Trynext/pull/71), implementation commit `5d61f91`. CI was pending at the report timestamp; the PR is not merged or deployed. The database dependency root cause remains operationally unresolved and owner-controlled.
