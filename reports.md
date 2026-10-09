# Trynext Lifestyle — Claude Development Report

**Prepared:** 2026-10-04  
**Repository:** `georgelsmith333-hub/New-Trynext`  
**Purpose:** This is the working handoff and master backlog for Claude. Read this file together with the current `docs/` audit documents before changing production code. Do not treat an implementation, a passing local test, or a merged commit as proof that the live Cloudflare Pages site and Render API are healthy.

## 1. Non-negotiable working rules

1. **Inspect before editing.** Confirm the active production source of truth in `docs/SOURCE_OF_TRUTH.md`. Production storefront code is under `artifacts/trynex-storefront/`; production API code is under `artifacts/api-server/`. Do not fix an experimental or archived artifact by mistake.
2. **Keep claims honest.** Never fabricate products, orders, revenue, inventory, AI success, payment success, notifications, marketplace imports, or infrastructure health. Every unavailable dependency must produce a clear, truthful UI state with retry/help guidance.
3. **Use the release path.** For backend changes, build shared libraries first, build the API, run focused tests, deploy to preview, run browser/API smoke tests, then deploy Cloudflare Pages and Render together when the contract changed. Record the frontend and backend deployment identifiers.
4. **Protect secrets.** Never write tokens, passwords, private keys, payment data, or environment values into this report, source code, screenshots, Git history, or logs. Refer only to secret names. If an old secret was exposed, rotate it through the provider.
5. **No destructive production mutation without a controlled plan.** Database repair, catalog imports, order creation, provider configuration, and customer-impacting asset changes need a reversible migration, audit trail, dry run, and rollback path.
6. **Do not claim “complete” until evidence exists.** A task is complete only when code, tests, preview/live verification, and documentation agree. Attach URLs, timestamps, commit SHA, response status, screenshots, and logs with sensitive values redacted.
7. **Preserve rollback.** Keep `/design-studio-v1` available until V2 parity is evidenced. For releases, preserve the previous known-good GitHub commit and both provider rollback references.

## 2. Current state from the latest Claude handoff

The latest handoff reports that:

- PR #4 was merged as commit `595ab6f`, adding **Admin → System → Live Health**, fixing API crashes after dropped database connections, and returning 400/409 instead of 500 for client/duplicate errors.
- PR #5 was merged as commit `689ac7d`, documenting the measured water-bottle print-area mismatch and proposed corrected zones.
- The latest repository `main` is clean and contains those merged changes.
- The pre-merge checks reportedly passed: CI, active-app verification, security scan, and Cloudflare preview build. Confirm the checks for the actual current `main` commit in GitHub before relying on this statement.
- The live domain was not independently verified by Claude from its previous environment.
- The water-bottle custom-order hold remains in place because the print area is approximately **37–38 px left of center on both faces**, overhangs the left edge by approximately **33–44 px**, and the back needs a narrower zone for its slimmer body.
- The previous handoff asked for three follow-ups: correct the bottle print area, verify the live Live Health page, and inspect real Admin Activity Log/Render errors.

## 3. Immediate release blockers — do these first

### P0-A — Correct and validate water-bottle print zones

**Problem:** Custom bottle artwork can be visibly off-center and can cross the product edge. The current print area is not safe to release for customer orders.

**Claude must:**

- Read the latest bottle measurements, source geometry, checksums, and any checksum-bound release rules in the relevant `docs/` and `attached_assets/` files.
- Do not silently edit checksum-bound production assets. Create a versioned correction proposal first, with front and back measurements, normalized coordinates, product/color/view identity, and a before/after proof.
- Correct the front and back print-zone geometry using the shared source of truth in `src/pages/design-studio/mockups.tsx` (or the authoritative geometry file discovered during inspection), not duplicated one-off coordinates.
- Ensure the zone is clipped to the printable body and remains centered across supported bottle variants/colors.
- Verify uploaded artwork, text, export PNG, browser preview, API render, cart thumbnail, and production payload all use the same zone.
- Add regression tests for front/back placement, boundary clipping, product switching, and the processed-image replacement path.
- Keep the hold active until a human owner approves the corrected proof; after approval, regenerate checksum-bound files through the documented release process.

**Acceptance evidence:** corrected proof images; exact normalized geometry; test output; asset/checksum manifest; owner approval recorded; preview and live browser verification.

### P0-B — Verify the real live deployment and custom domain

**Problem:** The previous audit could not inspect `trynext.shop`, and earlier repository audits found custom-domain/Pages parity risk. A successful GitHub merge is not proof that the customer domain serves the current release.

**Claude must:**

- Verify the actual configured production domain(s), including `trynext.shop`, `www`, and the verified Pages hostname. Do not assume `trynext.pages.dev` and the custom domain are equivalent.
- Open the live homepage and `/admin/live-health` (authenticated where required) after deployment.
- Check `/api/healthz`, `/api/health/liveness`, `/api/health/readiness`, `/api/readyz` if supported, `/api/products`, `/api/categories`, `/api/mockups`, and a representative product detail route through the public proxy.
- Record status codes, commit/deployment IDs, API runtime role, database, Redis, storage, scheduler, and backup status. Reconcile stale health aliases and the Render blueprint health path if they disagree.
- Verify that Pages and Render are serving the same compatible release. If DNS, Cloudflare, Render, or network settings prevent verification, record the exact blocked step and the operator action required; do not call it passed.
- Check redirects, TLS, canonical host, cache headers, service-worker assets, and stale bundle references.

**Acceptance evidence:** redacted health snapshot, live URL results, deployment IDs, screenshots of the customer domain and Live Health page, and a documented discrepancy/repair if any.

### P0-C — Inspect real errors and make them actionable

**Problem:** The prior handoff requested Activity Log and Render errors, but the actual errors were not available to Claude.

**Claude must:**

- Review Admin → Activity Log and Render logs for the current deployment window.
- Group errors by route, status code, release, timestamp, correlation/request ID, and customer impact. Redact secrets, personal data, access tokens, addresses, phone numbers, and full payment/order details.
- Fix reproducible application errors, add tests, and improve error messages without exposing internals to customers.
- Add or confirm correlation IDs across Pages proxy, API, database, storage, AI, checkout, and notification operations.
- Ensure retries are bounded, idempotent, and do not duplicate orders or notifications.
- Add a clear admin action to copy/download a redacted diagnostic bundle.

**Acceptance evidence:** redacted error report, root-cause fixes, regression tests, and a before/after error-rate or reproduction result.

## 4. Product and catalog correctness

The repository audits contain contradictory historical snapshots: some older reports describe five/ten products or a 202-surface matrix, while newer live audits describe 70 products, seven categories, and a 188-surface smart-v10.3 runtime matrix. Reconcile before changing data.

Claude must:

- Declare one canonical catalog and one canonical mockup matrix. If the active contract is 188 surfaces, mark obsolete 202-surface documents as superseded and update validators, manifests, resolvers, catalog, and release docs. If 202 is required, create and validate the missing 14 bottle surfaces before release.
- Ensure the six advertised families are represented consistently in database, API, category navigation, search, filters, product detail, Design Studio picker, cart, and admin. Do not fabricate inventory to make counts look complete.
- Add catalog data validation for missing images, invalid prices, negative stock, duplicate slugs/names, unsupported variants, missing size/color options, and mismatched product families.
- Migrate approved production product assets away from fragile external URLs to Cloudflare R2 or versioned first-party assets. Preserve licensing/provenance records and provide a fallback image/error state.
- Reconcile historical stale data reports against the current database before importing or deleting anything. Use a dry-run import with duplicate detection, idempotency keys, audit logs, and rollback.
- Make product availability truthful: distinguish draft, active, out-of-stock, unavailable, and temporarily blocked custom products.
- Verify product detail gallery, thumbnail loading, color/size/variant selection, wishlist, quick view, related products, reviews, discount math, and WhatsApp/support links.

## 5. Design Studio and mockup system

The current audit says the system has a substantial candidate mockup pipeline but does **not** prove a full photorealistic Photoshop Smart Object system. Do not market or document it as fully photorealistic until the following gates pass.

### Required engineering fixes

- Define one transform convention. If using `scale`, `scaleX`, and `scaleY`, always calculate rendered dimensions as `naturalWidth × scale × scaleX` and `naturalHeight × scale × scaleY`, or replace the model with absolute product-coordinate dimensions.
- Fix the processed-image replacement path so background removal, upscale, or auto-fix cannot double-scale a design or jump it back to natural size. Add an invariant test with identical intrinsic dimensions.
- Keep browser compositor and API renderer on one shared geometry contract. The API must consume the same normalized frame, print mask, warp metadata, and relevant material settings as the browser.
- Do not call strip-based curvature a true perspective or displacement transform. Implement a tested projective transform/homography or clearly label the current method as an approximation. For products that need it, add documented displacement/depth maps and a renderer operation that consumes them.
- Reconcile rotation bounds after rendering so the rotated artwork cannot be clipped or shifted relative to the print mask.
- Explicitly link every runtime role to a checksummed surface manifest: base, alpha/silhouette, print mask, protected details, shadow, highlight, background, material/depth/displacement where applicable, PSD/PSB layer record, and provenance.
- Separate customer-ready release masters from proof previews. Reject placeholder payloads such as `TRY NEX`, `ARTWORK HERE`, checkerboards, magenta/chroma-key pixels, and proof labels from release assets.
- Mark generated derivatives as derived approximations. Do not inherit “authentic” provenance from source photographs.
- Verify any claimed Photoshop/Smart Object editability with an actual open, replace/relink, save, reopen, and visible-render-change test. File signatures and metadata alone are insufficient.
- Preserve variant identity when handing off from product detail to studio, from studio to cart, and from cart to production.
- Add browser/API pixel-parity tests for representative T-shirt, long sleeve, hoodie, mug, cap, and water-bottle surfaces, plus front/back/sleeve/neck views.

### Required UX fixes

- Provide a short first-use flow explaining print zone, safe area, layers, text editing, upload requirements, export, and how custom orders are reviewed.
- Make mobile editing usable: touch dragging, pinch zoom, accessible controls, fixed/sticky action bar, safe keyboard behavior, and no horizontal overflow.
- Preserve artwork, variant, face/view, and draft state across refresh and route changes with versioned local persistence and clear recovery.
- Show user-visible states for upload, image processing, AI generation, export, save, add-to-cart, and failure/retry. Never lose artwork silently.
- Validate maximum file size/type/dimensions, sanitize SVG/text, strip unsafe metadata where appropriate, and provide a customer-readable reason for rejection.
- Make “no design” and “custom order blocked” states explicit, including why the order is blocked and what the customer can do next.
- Ensure export dimensions, transparent background options, crop/bleed guidance, and production notes match what the fulfillment team actually receives.

## 6. Checkout, orders, payments, and customer trust

- Establish a safe non-customer test-order environment or an explicit test-order policy. Do not create a real customer order merely to prove a test.
- Test guest checkout, customer account checkout, validation, district/shipping calculation, promo codes, advance payment/COD remainder messaging, inventory reservation, idempotent submission, duplicate-click protection, confirmation page, email/WhatsApp/Telegram notifications, customer tracking, and admin visibility.
- Make order state transitions explicit and auditable: draft, pending payment, advance received, confirmed, production, ready, shipped, delivered, cancelled, returned, refunded, and failed.
- Never show payment success before a trusted provider result/webhook is verified. Store provider event IDs and make webhook processing idempotent.
- Ensure the 25% advance / 75% balance-on-delivery language is consistent across product detail, cart, checkout, order confirmation, policies, and admin.
- Test cancellation, return, refund, partial fulfillment, out-of-stock after checkout, and failed notification scenarios.
- Add customer-safe order lookup with rate limiting, privacy-preserving errors, and no enumeration of other orders.
- Keep customer PII out of ordinary logs and diagnostic exports.

## 7. Admin, operations, and integrations

- Finish authenticated verification of Live Health, database cluster, backup status, Activity Log, catalog management, order management, user/session expiry, and logout.
- Make health checks truthful: distinguish liveness, readiness, dependency outage, degraded cache/storage, and stale telemetry. Reconcile Render’s configured health path with the active API route family.
- Complete controlled additive database schema repair only after backup, target inventory, dry run, explicit time-limited flag, per-target verification, and disabling the flag. Record results; never silently repair destructive changes.
- Configure and test Telegram order notifications with a non-customer test event, settings-backed destination, retries, idempotency, disabled/misconfigured state, and an admin test button. Until then, show `not_configured` rather than success.
- Verify local AI fallback and external AI/provider failure states with harmless authenticated prompts. Provider availability must not imply successful inference, free quota, or production quality.
- Treat Facebook/Instagram import as unverified until permissions, source identity, progress/stopped states, idempotency, rate limits, error recovery, and redirect safety are proven with a permitted test source.
- Add role-based access control, audit logs for sensitive admin mutations, CSRF/origin protection, session expiration, secure cookies, rate limits, and re-authentication for high-impact actions.
- Ensure admin tables support pagination, filtering, empty states, loading states, export/redaction controls, and mobile access without exposing secrets.

## 8. Performance, accessibility, SEO, and conversion

### Performance

- Measure real Core Web Vitals and route timings on desktop and mobile before optimizing. The audit identified a large 3D vendor chunk, main bundle, V2 studio chunk, and ONNX WASM asset.
- Lazy-load 3D, ONNX, AI/editor tools, and non-critical admin modules. Preload only above-the-fold assets.
- Optimize approved product/mockup images with responsive sizes, modern formats, correct dimensions, caching, and first-party storage.
- Avoid blocking the storefront on optional AI, analytics, notifications, or 3D initialization.
- Add bundle budgets and CI failure thresholds for route-specific JS, CSS, image weight, and long tasks.

### Accessibility

- Complete keyboard-only navigation, visible focus, semantic headings, labels, error association, dialog focus trapping, escape behavior, contrast, reduced motion, screen-reader announcements, and touch target checks.
- Ensure canvas/editor actions have accessible equivalents and do not rely only on color or drag interaction.
- Test checkout, filters, product variants, cart, FAQ, policies, and admin with automated and manual audits.

### SEO and conversion

- Provide unique title, description, canonical, Open Graph/Twitter metadata, JSON-LD, breadcrumbs, product availability/price markup, sitemap, robots, and 404 behavior for every indexable route.
- Prevent duplicate URLs from query/filter state or add appropriate canonical/noindex rules.
- Add trustworthy reviews, delivery/return/size guidance, social proof, support contact, and clear custom-order expectations without inventing claims.
- Track funnel events without leaking PII: product view, variant selection, design start, upload success/failure, add-to-cart, checkout start, validation failure, order success/failure, and support click.
- Verify analytics and Facebook Pixel claims in the privacy policy against the actual implementation and consent behavior.

## 9. Security and resilience

- Run secret scanning against the working tree and Git history; rotate any previously exposed credentials through providers, not in code.
- Audit authentication, authorization, CSRF, origin validation, CORS, SSRF/open redirects, file uploads, SVG/HTML injection, SQL queries, path traversal, webhook signatures, and rate limits.
- Add dependency and license scanning, lockfile integrity, security headers, CSP review, and safe error serialization.
- Test dropped DB connections, Redis outage, R2 outage, slow AI provider, provider timeout, malformed payload, duplicate request, stale session, and partial deploy scenarios.
- Use bounded exponential backoff and circuit breakers where appropriate, with truthful degraded states and operator alerts.
- Keep backups, restore drills, migration checks, retention rules, and recovery objectives documented and tested.

## 10. CI/CD and release checklist

Before every release, Claude must:

1. Confirm branch, commit SHA, working tree, and changed production source paths.
2. Build shared declarations/libraries before API typecheck/build.
3. Run lint, typecheck, unit, integration, focused browser, security, asset/manifest, and route-contract checks.
4. Run the product/mockup validation and ensure no stale matrix or checksum contradiction is introduced.
5. Build storefront and API from a clean checkout.
6. Deploy preview and verify homepage, catalog, product detail, studio, bottle front/back, cart, checkout validation, admin boundary, health endpoints, and error states.
7. Verify Pages and Render deployment identifiers and compatible API/frontend contracts.
8. Run live smoke tests without creating a real order unless the controlled test policy explicitly allows it.
9. Capture redacted evidence in `docs/` with timestamp and commit SHA.
10. Monitor logs and Live Health after deploy, then document rollback instructions.

Recommended additions: a single reproducible release orchestrator that runs source audit, asset validation, build, tests, preview checks, release manifest generation, and evidence packaging. Do not add autonomous self-modifying or unsupervised production deployment behavior.

## 11. Priority order for Claude execution

### Now — release safety

- [ ] Correct and prove water-bottle front/back print areas; keep hold until owner approval.
- [ ] Verify the real production/custom domain and Pages/Render parity.
- [ ] Inspect redacted Activity Log and Render errors; fix reproducible failures.
- [ ] Confirm current `main` CI and active-app checks are green.
- [ ] Reconcile health endpoints and Render readiness configuration.

### Next — customer conversion

- [ ] Reconcile canonical product/category data and six-family availability.
- [ ] Fix first-party image storage and product-detail fallbacks.
- [ ] Complete studio transform/variant/persistence/export/cart tests.
- [ ] Complete safe order lifecycle and notification tests.
- [ ] Configure Telegram or keep its state explicitly disabled.
- [ ] Finish authenticated admin, backup, AI, and session verification.

### Then — premium quality

- [ ] Complete mockup provenance, Smart Object, semantic role, displacement/perspective, and browser/API parity gates.
- [ ] Complete mobile, accessibility, SEO, performance, analytics, and conversion audits.
- [ ] Add resilience, security, observability, backup/restore, and release automation improvements.

## 12. Definition of done for every task

A task is done only when all applicable items are true:

- [ ] Root cause and affected customer/admin flow are documented.
- [ ] The smallest safe code/data/config change is implemented in the production source of truth.
- [ ] Regression tests cover the failure and the normal path.
- [ ] Loading, empty, blocked, unavailable, retry, and success states are truthful and usable.
- [ ] Security/privacy implications are reviewed.
- [ ] Preview/live behavior is verified with the exact release identifiers.
- [ ] Logs and metrics are checked after deployment.
- [ ] Evidence is saved in `docs/` and stale claims are updated or marked superseded.
- [ ] Rollback or reversal steps are documented.
- [ ] No secrets or fabricated business data were added.

## 13. Final instruction to Claude

Work through this report systematically, but do not blindly implement every idea at once. Start with the P0 release blockers and create small, reviewable changes. When a step requires owner approval, provider credentials, DNS/network access, a real customer order, payment, or an external integration permission, stop at the safe boundary, document the exact required action and payload, and keep the UI truthful. The goal is a premium, dynamic, high-converting Trynext e-commerce experience backed by reliable evidence—not a site that only appears complete in local development.

## 2026-10-05 Acknowledgement from Claude
Consumed the five-command order. Command 1 (processed-image replacement parity) done locally with browser evidence on five families, no code change needed; details in AGENT_HANDOFF.md. Not deployed. Next: command 2 (product switching and variant identity). Blockers unchanged: N1, N3, N4, N8 need owner/device/provider evidence.

## 2026-10-05 Acknowledgement from Claude (commands 2-5)
Command 2 merged (PR 24, product switching shares one refit plan; finding: size is not restored after switching away and back). Command 3 part 1 merged (PR 25, promo claim made atomic, 12 order-creation tests; open decision: status transitions/restock). Command 4: repo side checked, live catalog needs your product export (N11). Command 5: 188 surfaces = 94 accepted + 94 candidate reconciled; bottle hold kept; Photoshop-level proof still not in the repo (N4). Details in AGENT_HANDOFF.md. Nothing deployed from here; live checks remain yours.


## 2026-10-08 Live Design Studio CSRF finding and fix

A safe live smoke test on `https://trynext.shop/design-studio` used a harmless 185-byte asymmetric PNG. The artwork rendered in the Studio, but Add to Cart stopped before checkout with `403 csrf_blocked`. Cloudflare Pages production metadata identifies project `trynext-shop-new` at production commit `11f8e5962fea89cd5d52fe00b0cd3cb598145685`; the deployed `DesignStudioV2` chunk showed the original-artwork `POST /api/storage/uploads/request-url` request sending only `Content-Type`. The API correctly requires `X-Requested-With: XMLHttpRequest`, while the fallback PUT path already sent it. The fix is prepared on `manus/fix-studio-upload-csrf-2026-10-08`: add the missing header and a source-contract regression test. Focused Studio regression tests passed 7/7, storage upload tests passed 7/7, and the storefront production build passed. The fix is not yet merged or deployed; repeat the live upload/Add to Cart smoke test only after the Pages deployment serves the new bundle. No checkout, order, payment, provider setting, database, or customer-data mutation was performed.
## 2026-10-08 Consolidated Claude execution order — pick up automatically

Claude should consume this section as the single current work order. Work one command at a time, keep every release gate fail-closed, and append exact evidence to `reports.md`, `claude/reports.md`, and `AGENT_HANDOFF.md` after each completed command.

### Command 0 — Finish the confirmed live Studio upload defect

1. Monitor PR #27 (`fix(studio): send CSRF header for original artwork upload`).
2. Confirm CI, active-app verification, and Cloudflare Pages checks are green.
3. Merge PR #27 automatically only when all checks are green and the change remains limited to the tested Studio header fix and report entries; do not force-push or bypass checks.
4. Wait for the production Pages deployment to serve the new bundle, then run one harmless live Design Studio test: upload a tiny PNG, confirm it renders, click Add to Cart, confirm the cart item appears, and stop before checkout. Remove the test cart item if the UI permits.
5. Record the production deployment commit, bundle evidence, upload result, cart result, and any exact error. Do not claim this command passed before the post-deployment live check.

### Command 1 — Complete Design Studio reliability evidence

1. Use local/stand-in storage for repeatable tests; use real storage only for the single post-deployment smoke test above.
2. Verify image upload failure, retry, original-asset cache, processed-image replacement, export PNG versus canvas, product switching, variant identity, draft restore, and cart payload preservation.
3. Cover T-shirt, long sleeve, hoodie, mug, and cap; cover front, back, sleeve, neck, and mug wrap where supported.
4. Add only small source-of-truth fixes with focused regression tests. Do not change bottle geometry or release status.
5. Run storefront tests, typecheck, build, and browser verification; report exact counts and uncovered areas.

### Command 2 — Real-device and live-site boundaries

1. Keep real-phone touch editing marked UNVERIFIED unless a permitted device result is supplied.
2. After every merged code change, verify the live custom domain and Pages deployment identifiers; do not infer live health from GitHub success.
3. Check the public health aliases, product/category/mockup reads, service-worker/bundle freshness, canonical host, and representative Studio route.
4. If the environment cannot verify a route, record the exact limitation instead of claiming success.

### Command 3 — Checkout and order safety, with no real transaction

1. Continue local/throwaway-DB verification only: idempotent order retry, duplicate-click protection, pricing, stock, promo redemption, allowed status values/transitions, cancellation/restock behavior, payment-state truthfulness, and notification failure states.
2. Do not create a real order, submit payment, send a customer notification, or change live order/customer data.
3. For any schema change such as persistent idempotency keys, prepare a reversible migration and dry-run report only; do not run it without explicit approval for that change.
4. Preserve the 25% COD advance language and settings-driven payment/contact configuration.
5. Record the unresolved N10 contact-notification choice truthfully: Activity Log is sufficient for now; Telegram/email remain unconfigured.

### Command 4 — Catalog and first-party image audit

1. Complete the read-only catalog audit only from a sanitized product export or authenticated read-only evidence.
2. Compare live six-family/70-product records against supported variants, images, prices, stock, and the 188-surface contract.
3. Do not import, delete, hide, rewrite, or repair live products or images without a dry run, reversible plan, and explicit approval for that exact change.
4. Keep water-bottle custom ordering blocked until its print-zone proof is reviewed and approved.

### Command 5 — Mockup release gate

1. Preserve the fail-closed state: 188 structural surfaces exist, 94 front/back surfaces are accepted in repository evidence, and 94 side-view/mug-wrap surfaces remain candidates unless a saved validator report is added.
2. Do not claim Photoshop/Photopea-level editability, photorealistic displacement, or full 188/188 release approval from historical operator statements alone.
3. Do not regenerate or promote checksum-bound bottle masters or activate templates until the required visual proof and owner approval are present.
4. Keep the customer compositor and order hold truthful; document any approximation as an approximation.

### Command 6 — Errors, health, and deployment evidence

1. Obtain or inspect only sanitized Admin Activity Log and Render error evidence; group by route, status, release, timestamp, correlation ID, and customer impact.
2. Never expose passwords, tokens, database URLs, presigned URLs, customer PII, payment data, or provider credentials.
3. Reconcile Cloudflare Pages, Render primary/standby roles, database, Redis, storage, scheduler, and backup status without changing provider settings.
4. Do not change Cloudflare/R2 CORS, DNS, Render environment variables, Neon, Upstash, or database schema unless separately authorized with a reversible plan.

### Required completion format

For every command, Claude must report: status (`done`, `blocked`, or `not applicable`); files/commit/PR; tests and exact counts; live or local evidence; deployment identifier if applicable; remaining limitation; and the next command. A passing local test is not a live-release claim. Keep templates inactive, bottle ordering blocked, candidate surfaces unpromoted, and production data untouched until their specific gates pass.


## 2026-10-08 Acknowledgement from Claude (Command 0)
PR 27 merged (`014bdce`): the artwork-upload request now sends the CSRF header, with a regression test; all four checks were green first (it needed a main-into-branch merge for report-file conflicts only). The live post-deploy check (upload, render, Add to Cart) is UNVERIFIED from my side: I cannot reach the live site. Please run it once the Pages deployment for `014bdce` is live, or tell me the deployment id. Moving to Command 1.

## 2026-10-08 Acknowledgement from Claude (Command 1)
Studio reliability: the existing 195 storefront tests already cover upload retry/cache, replacement parity, product switching, draft restore and faces. One real gap found and closed with a test: a Studio item's original-artwork metadata now has an API test proving it survives into the stored order (moved to the order's storage prefix on stand-in storage). Test-only change. Real-storage upload and real phones stay UNVERIFIED. Next: Command 2 (needs your live-site evidence).

## 2026-10-08 Acknowledgement from Claude (Commands 2-6)
Done: Command 0 code (PR 27 merged) and Command 1 (PR 29 merged, test-only). Blocked on you: (a) the live upload + Add to Cart check after `014bdce` deploys; this sandbox gets a 403 for the live domain, so live health, bundle, mockups and Studio route are UNVERIFIED; (b) the sanitized product export (Command 4); (c) sanitized Activity Log/Render evidence (Command 6); (d) a decision on order status transitions and restock-on-cancel (Command 3). Mockup gate unchanged: 94 accepted + 94 candidate, bottle hold kept. Nothing real was ordered, paid or mutated. Details in AGENT_HANDOFF.md.


## 2026-10-08 Live post-deployment Studio smoke test — blocked at Add to Cart

Status: blocked; upload/render passed, Add to Cart did not complete. The live custom domain `https://trynext.shop/design-studio` returned 200 and its production bundle contained the merged `X-Requested-With` header. A harmless 185-byte PNG was injected through the normal file-input change handler and appeared visibly as a new `live-upload-smoke` artwork layer on the T-shirt preview. The browser reached the normal upload request and API fallback upload path; signed URLs and credentials are not recorded. Add to Cart entered `Preparing…`, returned to `Add to Cart`, but the cart indicator stayed at `0 items` with no visible error, success toast, or retry message. No checkout, order, payment, or customer-data mutation occurred. This is not a pass: investigate the post-upload/render path before local cart insertion or the final completion state using local/stand-in storage, and add a regression test plus truthful user feedback for the failure path. Keep all other blockers unchanged.

## 2026-10-08 Owner directive — remaining work order for Claude

This is the current executable order. Work sequentially and append exact evidence to all three coordination files after each command. Keep production fail-closed: no real order, payment, customer notification, provider-setting change, database/schema change, product-data repair, mockup promotion, or ad-budget spend without the separately required approval.

### Command A — Design Studio Add to Cart blocker (highest priority)

Reproduce the live result in local/stand-in storage: upload a harmless tiny PNG, confirm the artwork layer and processed image, click Add to Cart, and trace the state transition from upload/render completion through cart insertion. Inspect browser console/network errors, async exceptions, stale state, missing asset URLs, product/variant identity, and cart-store dispatch. Add a focused regression test that fails before the fix and passes after it. Implement the smallest source-of-truth fix and truthful retry/error feedback. Do not weaken CSRF, upload validation, storage checks, or fail-closed order gates.

Run the relevant storefront/API tests, typecheck, and build. Prepare a small PR; do not merge or deploy until checks are green and the scope is reported. After deployment, repeat exactly one harmless live smoke test on the canonical domain, stop before checkout, and record whether the cart shows one item. If live verification is unavailable, report it as blocked rather than claiming success.

### Command B — Verify and close the documentation PR

Monitor PR #31. Merge only after checks are green and only as a documentation-only change; do not force-push or bypass checks. Preserve the live result: CSRF/header fix is live, upload/render passed, but Add to Cart remained at 0 items. Update the reports with the merge commit and check results.

### Command C — Mockup release gate

Keep templates inactive, bottle custom ordering blocked, and candidate surfaces unpromoted. Do not claim 188/188 release approval, Photoshop/Photopea-level editability, or photorealistic displacement from historical statements. The repository evidence remains 94 accepted plus 94 candidate surfaces until a saved validator report proves the remainder. Do not alter PSD masters or manifests without a reproducible failure and a reviewed, reversible plan.

### Command D — Read-only evidence blockers

Request or inspect only sanitized evidence for the live six-family/70-product catalog, Admin Activity Log, Render status/errors, Pages deployment identifiers, health aliases, service-worker freshness, and real-device touch behavior. Never record credentials, tokens, database URLs, presigned URLs, PII, payment data, or customer content. Do not change Cloudflare/R2, DNS, Render variables, Neon, Upstash, backups, or schema.

### Command E — Checkout safety

Continue local/throwaway-DB tests only. Cover duplicate-click/idempotent retry, pricing, stock, promo redemption, payment-state truthfulness, notification failures, and allowed status transitions. Do not create a real order or payment. Keep persistent idempotency schema work as a dry-run design only. The owner decision still required is: allowed order-status transitions and whether cancellation restores stock.

### Command F — Meta campaign status

Treat the requested ৳600 / four-day women 18–44 Bangladesh campaign as unverified in this repository. Do not spend budget, activate ads, change targeting, or alter the Braintrack.LLC account from this work order. Only record a campaign as complete after sanitized evidence identifies the exact ad account, campaign/ad-set/ad status, budget, schedule, audience, and activation state.

### Required report for every command

Report `done`, `blocked`, or `not applicable`; files/commit/PR; exact tests and counts; local versus live evidence; deployment identifier; remaining limitation; and next command. Claude must acknowledge this directive in `claude/reports.md` before beginning Command A.
## 2026-10-08 Acknowledgement from Claude (live Add to Cart blocker)
Read your smoke-test result. Likely cause found in the code: the server mockup render request (`/api/mockup/render`, the second step of Add to Cart) did not send `X-Requested-With`, so the API returned 403 `csrf_blocked` to cookie-carrying visitors, the same class as PR 27; the failure toast shows briefly, which is easy to miss. Fixed that request and the two other Studio POSTs that lacked the header, with a test that guards every Studio mutating request. I could not reproduce it live (the sandbox cannot reach the domain), so this is UNVERIFIED until you re-run upload + Add to Cart on the new bundle.

## 2026-10-08 Acknowledgement from Claude (owner directive: remaining work order, Commands A-F)
Directive received and read in full; starting Command A now. Two facts you should know first:
1. Your live smoke test (07:10 UTC) ran BEFORE my fix PR 32 (`74c51ef`, merged 08:14 UTC) and probably before its Pages deployment. PR 32 adds the missing `X-Requested-With` header to the second request in the Add to Cart chain (`/api/mockup/render`), which the API's CSRF check rejects with 403 for cookie-carrying visitors; the failure showed only as a short toast, matching "returned to idle, 0 items, no visible error". So Command A may already be fixed in code; it is UNVERIFIED live. I will still reproduce it locally and add the persistent error feedback you asked for.
2. Command B: PR 31 is docs-only but shows merge conflicts (main moved); I will bring main into its branch with a merge commit (no force-push) and merge it only when checks are green.
Commands C-F: unchanged and fail-closed. Meta campaign (৳600) is not touched by me.

## 2026-10-08 Command A report (Add to Cart blocker)
Status: fixed in code, tested locally; live result UNVERIFIED. Local reproduction (signed-in customer cookie, stand-in storage): upload 200, then `/api/mockup/render` 403 csrf_blocked, cart 0, same as your live test. The header fix was merged in PR 32 (`74c51ef`) after your test ran; with it, render 200 and the cart holds 1 item. This PR adds the feedback you asked for: any Add to Cart failure now leaves a persistent "Your design was not added to the cart" alert with the reason and a Try again button, instead of only a short toast. Tests: storefront 34 files / 200 pass, typecheck clean, build passes, mutation check on the new test. Please re-run one harmless upload + Add to Cart on the live site once the Pages bundle with PR 32 and this PR is serving (stop before checkout). Next: Command B.

## 2026-10-08 Command B report (PR 31)
Done. PR 31 (docs-only) merged as `9d60d7d` after all four checks passed (Pages, security-scan, typecheck/test/build, build-and-check) on head `bb02308`; its report-file conflicts were resolved by merging main into the branch (no force-push). The live result is kept as you wrote it: upload/render passed, Add to Cart stayed at 0 at that time; that test pre-dates the render-request fix (PR 32). Next: PR 33 (persistent cart-error alert), then your live re-test.

## 2026-10-09 Manus task execution report

The consolidated `claude/MANUS_AI_TODO_TASKS.md` was executed as far as this environment and authorization permit. Public critical-flow verification passed **30/30** against `https://trynext.shop`. The live Design Studio loaded, but Add to Cart remains blocked at original-artwork upload: the direct storage path could not be reached and the API fallback returned **502**. The new persistent user-facing failure alert is working and reports the exact safe reason without exposing secrets. Sanitized browser performance evidence showed `/api/storage/uploads/request-url`, a redacted upload path, and `/api/storage/upload-via-api/<id>`. No checkout, order, payment, customer notification, or live data mutation occurred.

`https://trynext.shop` and `https://www.trynext.shop` returned identical HTTP 200 homepage content. The public health/readiness, product, category, mockup, and service-worker URL checks returned HTTP 200; `trynext.pages.dev` did not resolve from this environment, and the service-worker URL returned SPA HTML rather than a separate worker script. The exact Pages deployment ID for current main was not independently available, so deployment parity remains unverified.

Real-phone touch editing, sanitized product export, authenticated Activity Log/Render evidence, and the saved 94-surface validator report remain blocked. The owner decisions recorded are: bottle `not yet`; Activity Log is sufficient for contact messages; duplicate-order schema work is design/dry-run only. Order transitions/restock-on-cancel and per-product artwork-size restoration remain unanswered. Templates remain inactive, candidate mockup surfaces remain unpromoted, bottle ordering remains blocked, and Meta Ads remain untouched.

## 2026-10-09 Owner decisions — remaining work resolved where safe

At the owner’s direction to decide with common sense, the remaining behavior decisions are now explicit for Claude. Use conservative forward-only order transitions: `pending -> processing|cancelled`, `processing -> ongoing|shipped|cancelled`, `ongoing -> shipped|cancelled`, and `shipped -> delivered`; no transitions out of `delivered` or `cancelled`. Cancellation is allowed only before shipping. Restore reserved stock on a successful pre-shipped cancellation exactly once with an audit record; do this only in local/throwaway tests first and never mutate live data without a separately reviewed migration/release. Prepare, but do not execute, the reversible persistent `idempotency_key` migration and dry run. For product switching, remember and restore each product’s pre-switch artwork size while preserving fit-to-zone safety, face behavior, undo/redo, and variant identity. Keep the bottle decision `not yet`, keep Activity Log as the sufficient contact-message destination, and leave Telegram/email unconfigured.

The current highest-priority engineering blocker is the live API fallback upload 502. Claude must reproduce direct-upload failure/API-side write success and API-side write failure locally, inspect the storage PutObject path and sanitized error classification, add regression tests, and prepare the smallest safe code PR if the cause is in code. If the evidence points to R2 credentials/permissions/provider configuration, report it without changing provider settings. T2 public checks are complete at 30/30, but T3-T6 remain evidence-blocked. Mockup promotion, bottle ordering, real orders/payments, provider changes, and Meta Ads remain fail-closed.

## 2026-10-09 T1 live upload 502 — Claude report (code fix, local only; live UNVERIFIED)
- Finding: the presigned R2 upload URL was signed with `x-amz-checksum-crc32=AAAAAA==` (checksum of an EMPTY body) plus `x-amz-sdk-checksum-algorithm=CRC32`, a default of the current AWS SDK. A browser PUT of a real file does not match that checksum, so a bucket can refuse it; that fits the live "browser could not reach storage" step. Reproduced locally by generating the URL with fake credentials.
- Fix (small): both S3/R2 clients now use `requestChecksumCalculation/responseChecksumValidation: WHEN_REQUIRED`. Validation, size caps, magic-byte checks, grant signing, CSRF and fail-closed cart behaviour are unchanged. The through-the-API 502 now logs a sanitized failure class (error name, code, HTTP status; no message, key or URL) so Render logs can name the real cause.
- Test: `src/lib/objectStorage.r2.test.ts` (fails before: URL carries the checksum params; passes after). Also run: storage.upload.test.ts (direct-fail/API-success and API-write-failure 502 with no leak, already present), api-server typecheck, full api-server vitest (181 passed), `node ./build.mjs`.
- Limits: the real 502 from `/api/storage/upload-via-api` is a storage write error; the checksum fix explains the direct failure, but the API-write failure may also be credentials/permissions/bucket settings (not changed, not visible from here). Needs one sanitized Render log line (`storageFailure`) after deploy. No live test run; sandbox cannot reach the live site.
- Next: PR, green checks, merge, then one harmless live upload + Add to Cart (stop before checkout). Then T7 (order transitions + stock restore, local only) and T9 (restore artwork size on product switch), T8 migration dry run only.

### T1 follow-up: PR 36 merged
- Merged (not yet confirmed deployed or live-tested): squash `8eec152` after all 4 checks green on `41133be`. Next for the owner/operator: confirm the Pages/Render deploy for `8eec152`, then one harmless live upload + Add to Cart (stop before checkout). If it still fails, send the sanitized `storageFailure` log line.

## 2026-10-09 T7 order transitions + stock restore, and a variant checkout fix — Claude report (local/throwaway only; not merged or deployed)
- T7 (owner decision): forward-only moves `pending->processing|cancelled`, `processing->ongoing|shipped|cancelled`, `ongoing->shipped|cancelled`, `shipped->delivered`; nothing out of `delivered`/`cancelled`. Anything else answers 400 `invalid_status_transition` with the allowed next statuses. Setting the status an order already has is a harmless no-op (no notification, no stock change).
- Cancellation before shipping restores reserved stock (plain stock, one variant, each custom-hamper product; studio lines ignored) inside the same locked transaction as the status change, so it happens exactly once; the Activity Log row for the order carries `stockRestored` (restored and skipped lines). No schema change.
- The admin order screen now shows the server reason instead of a bare "Update failed".
- Extra finding, fixed with one cast: checkout for a product VARIANT was refused as out of stock even with stock available, because an untyped parameter after the JSON `->` operator is read as a text key and finds nothing in a JSON array. Found by running the real SQL on a throwaway local Postgres; the mocked tests could not see it. Whether live variant products exist is unknown to me; if they do, such orders were being refused.
- Tests: orderStatus transitions, orders.status (every refused move, forward path, restore once, double cancel, 404), orderStock, variantStockSql source guard; throwaway-Postgres script (12 checks incl. two simultaneous cancels restore once, variant checkout 201 then cancel restores). api-server typecheck, 207 tests, build, storefront typecheck all pass.
- For the owner to check: the admin labels read "Shipped to Department" then "On the Way (Ongoing)", but the agreed table allows `ongoing->shipped` and not `shipped->ongoing`. Ask the operator whether those two labels are in the intended order.
- Not done: no live data touched; live behaviour UNVERIFIED. Next: PR + green checks + merge, then T9 (restore artwork size on product switch), T8 migration dry-run design.

### T7 follow-up: PR 38 merged
- Merged (not yet confirmed deployed or live-tested): squash `8960620` after all 4 checks green on `fb5f937`. Release scope: API order-status route (forward-only moves, stock restored once on cancel, Activity Log `stockRestored`), variant stock SQL fix in order creation, admin screen shows the server reason. No schema change, no live data touched.
- Owner question still open: admin labels order ("Shipped to Department" then "On the Way (Ongoing)") versus the agreed table (`ongoing->shipped`, not `shipped->ongoing`).

## 2026-10-09 T9 restore artwork size after switching products — Claude report (local only; not merged or deployed)
- Behaviour: the Studio now remembers each layer's size/position/rotation when it leaves a product and gives it back exactly when the customer returns to that product (also through chains such as tee -> mug -> cap -> tee), including after undo steps.
- Safety kept: it is only reused when the layer is unchanged since the last switch and the print zone has the same size as before; otherwise the existing fit-to-zone refit runs, so artwork cannot overflow. A customer edit or an undo always wins. New layers use the normal refit. Face behaviour, undo/redo history and variant identity (linked store product reset) are unchanged; the memory is not saved in drafts or undo history.
- Files: `pages/studio/productSwitch.ts`, `hooks/useDesignStore.ts`, `DesignStudioV2.tsx`, `toolbar/ProductSwitcher.tsx`; tests in `productSwitch.test.ts` (7 new, mutation-checked) and `useDesignStore.test.ts` (2 new, through the real store incl. undo).
- Checks: storefront typecheck, 209 tests, build. Not checked: visual overflow in a real browser or phone for T-shirt/hoodie/mug/cap (logic-level only), so treat the look as UNVERIFIED until someone switches products on the live Studio.

## 2026-10-09 T8 persistent duplicate-order protection — Claude report (design + dry run only; nothing executed live)
- Delivered as documents only: `claude/T8_IDEMPOTENCY_MIGRATION_PLAN.md`, `claude/t8/up.sql`, `claude/t8/down.sql`, `claude/t8/collision-report.sql`. No schema file, no app code and no live database was changed.
- Dry run on a throwaway local Postgres: up, re-run no-op, duplicate key refused (23505), NULL keys unaffected, down restores the original shape with all orders kept.
- Found: the backup mirror stops (fail-closed) if the primary has a column the backup lacks, so the migration must go to the backup database first, then the primary; the plan states this order and a rollback.
- Needs owner approval for this exact change before anything runs; the application change is described but not written.

## 2026-10-09 Claude acknowledgement of the T7/T1 owner note (PR 40 branch `manus/remaining-safe-work-2026-10-09`) — status
- Read and understood. T1 stays UNVERIFIED/FAILED on live after PR 36. Two points: (a) the browser says direct storage cannot be reached AND the API's own bucket write returns 502, which points at the storage account itself (write permission of the token, bucket name/endpoint, or credentials) rather than the request, but I cannot see those from here and will not guess; (b) `storageFailure` is logged on Render, but the operator cannot read Render logs, so the useful evidence is the reason code PR 37 (another Claude session, draft) puts in the 502 body and the Studio alert. I did not merge or touch PR 37 as asked; if you want the next live test to name the cause in the browser, that PR is the shortest route and only needs your go-ahead.
- Correction to your note: T9 is not pending, it is merged (PR 39, `db10856`). T8: my plan (`claude/T8_IDEMPOTENCY_MIGRATION_PLAN.md`, merged in PR 41) now also records that `repairTargetSchemas` may already have added a plain `orders.idempotency_key` on backups, so run the collision check before building the unique index.
- PR 40 is your branch and is behind main; I have not changed it. Its report entries will conflict with newer appends; say so if you want me to merge main into it.
