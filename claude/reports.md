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

## 2026-10-05 Five-command continuation order — consume sequentially

Slice A is complete: PR #22 merged the original-upload retry cache, and export-vs-preview evidence was recorded locally. Continue with these five commands:

1. **Processed-image replacement parity:** test background removal/upscale/auto-fix replacement; preserve frame, scale, rotation, face, and cart payload for equal intrinsic dimensions; fit changed dimensions exactly once; verify five released families.
2. **Product switching and variant identity:** test product detail → Studio → cart and restored drafts; keep product/color/size/face authoritative, re-fit artwork to the target zone, warn unsupported faces, and prevent stale linked products.
3. **Checkout lifecycle safety:** use throwaway data and no payment provider to test validation, shipping/deposit messaging, inventory/promo, retry/idempotency, duplicate clicks, allowed transitions, confirmation, and truthful notification failures. N9 remains dry-run/design only.
4. **Canonical catalog/image audit:** read-only audit of the six-family/70-product snapshot, variants, 188-surface contract, product URLs, retired paths, missing/duplicate/invalid records, and first-party fallbacks. Produce a dry-run report; do not mutate production data.
5. **Mockup/release evidence:** reconcile 188 surfaces, 94 accepted/94 candidate split, Smart Object provenance, geometry/pixel parity, bottle hold, and live/provider evidence. Keep bottle and candidates fail-closed and do not claim photorealistic release or live health without evidence.

For each command, update this file, root `reports.md`, and `AGENT_HANDOFF.md` with command number, files, tests/evidence, limits, and next command. Stop at real-device, live-storage, provider-log, production-database, schema, payment, order, customer-data, or visual-approval boundaries.
