# TryNext Release Checklist — 2026-10-20

## Before code review

- [ ] Confirm branch is based on current `main`; inspect full diff and `git diff --check`.
- [ ] Run API, storefront, mobile, shared-library tests/typechecks/builds and mockup validators; record exact results in `TEST_REPORT.md`.
- [ ] Review secret handling, auth/CSRF, upload, order, payment, and database boundaries; run security scan.
- [ ] Confirm no real secrets, customer records, signed URLs, or production data entered files or logs.
- [ ] Confirm no new dependencies or lockfile changes without the owner’s browser-test authorization.
- [ ] Preserve Bangladesh 25% advance COD, water-bottle hold, candidate mockups, and all production migration gates.

## Before merge

- [ ] Required PR CI checks green on the exact head SHA.
- [ ] Independent review findings resolved.
- [ ] Owner has explicitly approved merge of this exact code PR.
- [ ] Confirm no hidden behavior changes to orders, payments, stock, auth, or provider settings.

## Before production deployment

- [ ] Owner has identified and restored the correct Neon production branch; readiness must report DB/catalog ready.
- [ ] Confirm release commit matches approved main commit; record Pages and Render deployments separately.
- [ ] No production schema migration, provider credential change, catalog promotion, or data mutation without separate explicit approval.
- [ ] Have rollback commit and provider procedure ready.

## After deployment

- [ ] Run bounded read-only liveness, readiness, route, and catalog checks; record status only and sanitize errors.
- [ ] Verify the visible product page in a browser and record DevTools request status only; do not capture customer data.
- [ ] Verify deployment identity, cache behavior, and route/deep-link behavior.
- [ ] Do not test upload/Add to Cart until owner reports M1 complete; if allowed, use one harmless asset, remove cart item, and stop before checkout.
- [ ] Do not place an order or submit payment. Keep 25% advance COD unchanged.
- [ ] Report separately: FIXED/TESTED LOCALLY, CI VERIFIED, MERGED, DEPLOYED, LIVE VERIFIED, BLOCKED/NEEDS OWNER INPUT, NOT TESTED.
