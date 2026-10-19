# TryNext Implementation Plan — 2026-10-20

## P0 — Restore production database readiness (owner-controlled)

1. Owner identifies which Neon project/branch is the intended production database for Render. Both known primary `production` branches are currently archived; neither is selected automatically.
2. Owner restores/unarchives the correct production branch/compute through the provider dashboard and verifies the Render service targets it, without putting connection strings in chat or GitHub.
3. Wait for Render to report live; then Manus may run read-only liveness/readiness and catalog GETs. Do not run SQL migrations or modify rows.
4. Keep the storefront/API outage open until readiness is 200 and product GETs are valid. Distinguish provider recovery from the local code PR.

## P1 — Submit the independent safe code fixes

Current local branch `manus/recovery-phase1-2026-10-16` includes:

- Relative image URL resolution for mobile cards, detail and cart, with Node regression tests and CI wiring.
- Fail-closed mockup review-status gate, with a manifest-wide regression; keep 94 candidate surfaces and the bottle hold unchanged.
- Sanitized public storage-health errors.
- Activity-log secret redaction before write and on API/rollback responses.
- Secret-like setting filtering for backup export/import.

Before PR: incorporate independent review findings; run API/storefront/mobile tests, typechecks, builds, mockup validators, `git diff --check`, and security scan/CI. Push one focused PR. **Do not merge or deploy without owner approval for that specific code PR.** The current branch has not yet been pushed.

## P1 — R2 upload and Design Studio

- M1 remains owner-only: verify intended R2 bucket token has Object Read & Write and that Render setting names point to the same account/bucket/endpoint. Never copy values.
- M2 waits for explicit owner `M1 done`; then run one harmless small-image Studio test, remove the temporary cart item, and stop before checkout.
- Do not perform uploads, cart mutations, or live design persistence tests before that gate.

## P2 — Mockup visual evidence and gesture

- M4: obtain the authenticated Photopea validator report/hash list for the 94 candidate rows. The local code gate prevents candidates from resolving but does not visually approve assets.
- Keep the water-bottle print area on hold until authenticated visual proof and owner decision.
- PR #67 remains draft/open. Owner decides merge/hold and the 44px handle spacing; physical-phone test remains UNVERIFIED. Do not merge/deploy #67 without the decision.
- Do not add Playwright/browser dependencies until owner says exactly `add the browser test`.

## P2 — Product, log, and token owner inputs

- D1: for products 1–9 and 20 choose first-party replacement, hide/deactivate, or keep.
- D5/T9: owner verifies/revokes the historical compromised GitHub token in GitHub settings; do not search for or reproduce it.
- M6/T8: provide sanitized seven-day request/error logs if an authorized source becomes available; otherwise retain PARTIAL/UNAVAILABLE.
- D2 stays `not yet`; D3 stays Admin Activity Log; D4 remains a design/dry-run only; D6 no action. Keep D10’s Meta Ads and production migration prohibitions intact.

## P3 — After recovery

Once readiness is restored and safe PRs are reviewed: verify browser rendering, cache headers and protected-route behavior; inspect price consistency using read-only product GETs; use a real phone only with owner authorization. Do not simulate payment, submit checkout, run production migrations, or claim live pass without direct evidence.

## Dependencies / acceptance criteria

- DB acceptance: liveness 200; readiness 200 with DB/catalog ready; `/api/products` 200 with expected schema; current deployed commit recorded. Do not inspect customer/order records.
- Code PR acceptance: all local checks and CI green; security scan clear; owner review; merge, deployment and live verification reported as separate states.
- Upload acceptance: only after M1 explicit completion; harmless test asset, truthful status/content type, cart item removed, checkout untouched.
- Mockup acceptance: validator hashes plus visual/authenticated evidence; no candidate promotion by structural checks alone.