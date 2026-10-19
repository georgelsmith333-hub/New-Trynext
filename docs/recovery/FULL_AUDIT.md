# TryNext Full Audit — 2026-10-20

## Executive summary

The latest main commit is `1d8fb7bcde6ab91dbb84c33a802e918d1e3d8322` (PR #70, documentation only). Cloudflare Pages and Render both report that commit live. The storefront page routes sampled by GET returned HTTP 200, but that is not proof that client-side content rendered. The production API is currently unhealthy: `/api/health/liveness` returns 200, `/api/health/readiness` returns 503 with `db=false` and `catalog=false`, and `/api/products` returns 500 both through the public site and at the Render origin.

Both known Neon projects (`trynex` and `trynex-db`) currently report their primary `production` branches as archived. This strongly correlates with Render’s database failure, but the exact Render connection target is **UNVERIFIED** because connection values were not inspected. No branch was unarchived, no compute started, and no database contents were queried. Owner action is required to identify the authoritative project and restore it.

A recovery branch contains five code-level safeguards/fixes: native mobile relative-image URL resolution; fail-closed mockup review-status resolution; storage-health error redaction; activity-log secret redaction; and backup export/import secret-setting filtering. Commit `5d61f91` is pushed in draft PR #71. Local checks pass as described in `TEST_REPORT.md`; PR CI is pending. Nothing from this branch is merged or deployed.

## Severity-ranked findings

| Severity | Finding | Evidence/status |
|---|---|---|
| Critical operational | Production API cannot serve catalog requests. Liveness is 200, readiness is 503 (`db=false`, `catalog=false`), and `/api/products` is 500. | Direct public and Render-origin GETs on 2026-10-20. Database root cause is strongly suspected, not fully proven. |
| High operational | Both known Neon production branches are archived. | Read-only Neon metadata: `trynex` / `misty-dust-70559510` and `trynex-db` / `proud-dew-38401180`; no SQL/data access. Which project Render targets is unknown. |
| High security | Activity-log before/after snapshots could persist and return secret-like fields. | Local branch now redacts recursively before persistence and masks historical API responses/rollback output; old database rows are not scrubbed. Tests pass locally. |
| High security | Admin backup export previously included all settings; backup import could overwrite secret-key settings. | Local branch now excludes secret-like setting keys on export and skips them on import. Mocked route tests pass. No live export/import was run. |
| Medium security | Public storage-health response previously returned raw provider exception text. | Local branch returns stable `storage_unavailable`; route regression test passes. No provider exception or live write was triggered. |
| Medium integrity | Customer mockup resolver built runtime role URLs without checking each surface’s review status. | Local branch gates resolver by an allowlist regression-tested against the 188-row manifest; 94 candidate surfaces remain unavailable and the water-bottle hold remains. No promotion or live visual validation. |
| Medium mobile | API catalog image paths can be root-relative, but native React Native `Image` needs an absolute URI. | Source audit confirmed the path; local resolver is applied to product cards, product detail, and cart. Nine Node tests, typecheck, and Android/web exports pass; physical-device runtime remains UNVERIFIED. |
| Medium product quality | Product list/detail price mismatch was observed previously; source/cache explanation and server-authoritative price were not established. | Live pricing authority and checkout price behavior remain UNVERIFIED; no cart/checkout test was performed. |
| Medium Design Studio | The historical pinch defect and PR #67 gesture fix remain separate from this recovery branch. | PR #67 is still open/draft at `c9d55a3` with CI green; no merge or deployment. Physical-phone test and 44px-handle decision remain pending. |
| Owner-blocked | R2 write permission and live Studio upload. | M1 not verified; M2 must not run until owner explicitly reports `M1 done`. No upload or Add to Cart occurred. |
| Owner/tool-blocked | Photopea visual report/hash list for 94 surfaces. | No authenticated report found. Candidate status remains; no promotion. |
| Owner-blocked | Third-party images on products 1–9 and 20; historical GitHub token rotation; 44px handle choice; optional Playwright dependency/CI. | No product data or account settings were changed. |
| Evidence-blocked | Seven-day request/error logs and live browser Network evidence. | Render exposes no request-log type in prior audit; L5 DevTools check is UNVERIFIED. Subsequent public-site requests received Cloudflare 403, so no bypass was attempted. |

## Release and architecture snapshot

- Pages production deployment: `9cd98a6f-b6e7-4278-9d71-2ba59a456f8d`, commit `1d8fb7b…`, success.
- Render production deployment: `dep-dbb9553rjlhs73ck7r10`, commit `1d8fb7b…`, live.
- PR #70 merged. PR #67 remains open/draft; PR #69 remains open/unmerged; draft PR #71 contains the recovery branch. PR #67/#69 checks are green; PR #71 checks are running and its Pages preview check succeeded.
- Main source change in PR #70 was documentation only; the live application source was unchanged by that merge.
- Current code branch: `manus/recovery-phase1-2026-10-16`, based on main `1d8fb7b…`; implementation commit `5d61f91` is pushed in PR #71, not merged or deployed.
- Architecture remains Cloudflare Pages/Functions → Render API → Neon PostgreSQL, with Cloudflare R2 for object storage. Upstash is present in the repository; current quota/usage was not audited. Provider tier limits are account-specific and are not guessed here.

## Unverified acceptance areas

Real R2 direct/fallback upload, saved-design persistence, live cart behavior, checkout/order/payment behavior, server-side 25% advance-COD enforcement, customer ownership/authorization on production data, Photopea visual fidelity, physical-phone editing, browser DevTools L5, production database target, and seven-day route-level error impact are all **UNVERIFIED**. No real order, payment, checkout submission, production database mutation, migration, customer-data read, or provider-setting change occurred.

## Supporting reports

See `ROOT_CAUSE_REPORT.md`, `IMPLEMENTATION_PLAN.md`, `TEST_REPORT.md`, `DEPLOYMENT_REPORT.md`, `FREE_TIER_ARCHITECTURE.md`, `ROLLBACK_PLAN.md`, and `RELEASE_CHECKLIST.md`. The sanitized live evidence ledger is `claude/evidence/phase1-live-evidence-2026-10-20.md`, included in draft PR #71.
