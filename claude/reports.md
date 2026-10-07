# Owner answers for Claude — 2026-10-05

These answers are provided by the Manus operator on the owner's behalf using the current repository and verified session evidence. Do not treat an unverified item as approval.

1. **Water bottle print area:** `not yet`. Keep the measured zones in code, keep the customer-order hold active, and do not regenerate or promote checksum-bound bottle masters until a visual proof is reviewed.

2. **94 candidate side-view surfaces:** `c` — leave them as candidates for now. Do not mark them accepted from the operator-reported 188/188 result without a saved validator report or a later explicit acceptance.

3. **Backlog priority:**
   1. Design Studio reliability and transform/variant/persistence/export/cart verification
   2. Checkout and orders, including safe lifecycle and notification behavior
   3. Catalog data and first-party image correctness

4. **Permission to merge:** `ask me each time`. Claude may prepare small PRs and merge only after the applicable checks are green and the release scope is clearly reported. This answer does not grant blanket permission for future production merges.

5. **Permission for data repairs:** `yes, only with a dry run and my OK each time`. Code-only changes are preferred. Do not change live product data, settings, provider configuration, database schema, orders, payments, or customer data without a reversible plan and explicit approval for that specific change.

6. **Real errors:** No redacted seven-day Activity Log and Render log bundle was available in this session. Do not infer “no errors seen.” Continue to treat root-cause log review as blocked until sanitized evidence or authenticated provider access is available.

7. **Live site access:** A read-only live verification was already captured from the authenticated browser session: the production critical-flow check was reported as 30/30 passed, health/products/categories/mockups returned HTTP 200, and the three public hostnames served matching HTML/bundle content. Treat this as recorded evidence for that checkpoint, not as permission to perform mutations or as a substitute for any new live check required by a code change.

8. **What is for sale today:** The authenticated admin dashboard reported 70 total products. The canonical families are T-shirt, long sleeve, hoodie, mug, cap, and water bottle. Keep the water-bottle custom-order hold active; do not hide or remove other products without a current catalog audit and approval.

9. **Rules to keep:** Confirmed. Keep COD advance at 25%, and keep payment/contact destinations settings-driven in Admin. Do not write the actual numbers into GitHub, reports, logs, or chat.

10. **Services in use:** Redis cache is configured and healthy in the recorded admin health snapshot. WhatsApp support/contact is present. Telegram is explicitly `not_configured`. AI provider, email/SMS notification delivery, and courier integration are not sufficiently evidenced here; keep their states truthful and do not claim successful delivery.

11. **Old branch:** `no` for now. Do not delete `claude/nice-carson-nxjq7q` automatically; it is historical and already merged. Use fresh branches from `main` for new work.

12. **Hourly checker:** `keep` until Claude confirms it has consumed these answers and the next work item is recorded. Do not create duplicate timers or autonomous production deployment behavior.

## Execution boundary

Start with the first approved backlog item as a small, reviewable code change with focused tests. Preserve the bottle hold and candidate surface status. Stop at owner approval, provider access, live mutation, payment, order creation, or any destructive operation. Update `reports.md` and `AGENT_HANDOFF.md` with exact evidence after each completed item.

## 2026-10-05 Acknowledgement from Claude
Consumed the five-command order. Command 1 (processed-image replacement parity) done locally with browser evidence on five families, no code change needed; details in AGENT_HANDOFF.md. Not deployed. Next: command 2 (product switching and variant identity). Blockers unchanged: N1, N3, N4, N8 need owner/device/provider evidence.

## 2026-10-05 Acknowledgement from Claude (commands 2-5)
Command 2 merged (PR 24, product switching shares one refit plan; finding: size is not restored after switching away and back). Command 3 part 1 merged (PR 25, promo claim made atomic, 12 order-creation tests; open decision: status transitions/restock). Command 4: repo side checked, live catalog needs your product export (N11). Command 5: 188 surfaces = 94 accepted + 94 candidate reconciled; bottle hold kept; Photoshop-level proof still not in the repo (N4). Details in AGENT_HANDOFF.md. Nothing deployed from here; live checks remain yours.


## 2026-10-08 Live Design Studio CSRF finding and fix

A safe live smoke test on `https://trynext.shop/design-studio` uploaded a harmless 185-byte asymmetric PNG and rendered it in the Studio, but Add to Cart stopped before checkout with `403 csrf_blocked`. Cloudflare Pages production metadata identifies `trynext-shop-new` at production commit `11f8e5962fea89cd5d52fe00b0cd3cb598145685`; the deployed Design Studio chunk sent only `Content-Type` on `POST /api/storage/uploads/request-url`. The API correctly requires `X-Requested-With: XMLHttpRequest`, while the fallback PUT already had it. The fix is prepared on `manus/fix-studio-upload-csrf-2026-10-08`: add the missing header and a source-contract regression test. Focused Studio tests passed 7/7, storage upload tests passed 7/7, and the storefront production build passed. The fix is not yet merged or deployed; repeat the live smoke test after deployment. No checkout, order, payment, provider setting, database, or customer-data mutation was performed.
## 2026-10-08 Consolidated Claude execution order — pick up automatically

Treat this as the single current work order. Work sequentially, keep all gates fail-closed, and append exact evidence to `reports.md`, `claude/reports.md`, and `AGENT_HANDOFF.md` after each command.

### Command 0 — Finish PR #27 and verify live Studio upload

Monitor PR #27 for green CI, active-app verification, and Cloudflare Pages checks. Merge only after all checks are green and the scope remains the tested `X-Requested-With: XMLHttpRequest` header fix; do not force-push or bypass checks. After deployment, run one harmless live Design Studio test with a tiny PNG, confirm it renders, click Add to Cart, confirm the cart item appears, stop before checkout, and remove the test item if possible. Record deployment commit, bundle evidence, upload result, cart result, and any exact error. Do not call it passed before the live post-deployment check.

### Command 1 — Studio reliability evidence

Use local/stand-in storage for repeatable tests and verify upload failure/retry, original-asset cache, processed-image replacement, export-versus-canvas parity, product switching, variant identity, draft restore, and cart payload preservation across T-shirt, long sleeve, hoodie, mug, and cap. Cover supported front/back/sleeve/neck/wrap faces. Add only focused source-of-truth fixes with regression tests; keep bottle geometry and release status unchanged. Report exact test counts and uncovered areas.

### Command 2 — Device and live verification

Keep real-phone touch editing UNVERIFIED without a permitted device result. After each merged code change, verify the live custom domain and Pages deployment identifiers, health aliases, product/category/mockup reads, service-worker/bundle freshness, canonical host, and Studio route. If a route cannot be verified, record the exact limitation rather than claiming success.

### Command 3 — Checkout and order safety without real transactions

Continue only local/throwaway-DB checks for idempotent retry, duplicate clicks, pricing, stock, promo redemption, status validation/transitions, cancellation/restock, payment-state truthfulness, and notification failures. Do not create an order, submit payment, send customer notifications, or change live order/customer data. For persistent idempotency schema work, prepare a reversible migration and dry run only. Preserve 25% COD advance language and settings-driven payment/contact configuration. Activity Log remains sufficient for contact messages; Telegram/email stay unconfigured.

### Command 4 — Read-only catalog/image audit

Use only a sanitized product export or authenticated read-only evidence to compare the live six-family/70-product catalog with supported variants, image sources, prices, stock, and the 188-surface contract. Do not import, delete, hide, or repair live data without a dry run, reversible plan, and explicit approval. Keep water-bottle custom ordering blocked until print-zone proof is reviewed and approved.

### Command 5 — Mockup release gate

Keep fail-closed status: 188 structural surfaces exist, repository evidence accepts 94 front/back surfaces, and 94 side-view/mug-wrap surfaces remain candidates without a saved validator report. Do not claim Photoshop/Photopea-level editability, photorealistic displacement, or full 188/188 approval from historical operator statements alone. Do not regenerate/promote bottle masters or activate templates until visual proof and approval exist. Treat approximations as approximations.

### Command 6 — Sanitized error/health/deployment evidence

Inspect only sanitized Activity Log and Render evidence; group by route, status, release, timestamp, correlation ID, and customer impact. Never expose credentials, database URLs, presigned URLs, PII, or payment data. Reconcile Pages, Render roles, database, Redis, storage, scheduler, and backup status read-only. Do not change R2 CORS, DNS, Render variables, Neon, Upstash, or schema without separate reversible authorization.

For each command report: `done`, `blocked`, or `not applicable`; files/commit/PR; exact tests; local/live evidence; deployment identifier; remaining limitation; and next command. A local pass is not a live-release claim. Keep templates inactive, bottle ordering blocked, candidate surfaces unpromoted, and production data untouched until each specific gate passes.
