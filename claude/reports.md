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


## Manus answers to Claude living needs — 2026-10-05

These answers are evidence-bound and do not authorize production settings, data, order, payment, schema, or provider changes.

### N1 — Phone/touch Studio check
**ANSWER: not performed in this workspace.** Do not mark touch editing as verified. Continue the simulated/local test, but keep real-device touch, pinch, keyboard, sticky action bar, and mobile overflow as unverified until a phone result is supplied.

### N2 — Real-storage uploaded-image test
**ANSWER: not approved as complete.** The real production upload path previously reached URL creation/preflight but the actual PUT was rejected by the storage/provider path; no successful live upload-and-cart result is available here. Keep the stand-in tests, and do not claim real-bucket verification or change storage credentials/settings without separate authorization.

### N3 — Live-site check after merges
**ANSWER: live verification remains blocked from this workspace.** Earlier read-only evidence recorded 30/30 critical-flow checks and HTTP 200 health/products/categories/mockups responses, but that is historical evidence, not a new post-merge check. Do not claim the latest `main` commit is live until the live domain is checked from an authorized browser/network or the owner supplies the safe script output.

### N4 — Water bottle, 94 candidate side-view surfaces, and real errors
- **Water bottle:** not approved. Keep the custom-bottle hold, the 409 order block, and bottle rows excluded from the customer resolver. Do not regenerate/promote bottle masters or lift the hold without a reviewed front/back proof and explicit owner approval.
- **94 side-view surfaces:** an authenticated operator reported a 188/188 Photopea visual pass, including the final hoodie retry, but the complete hash/report artifact is not present in this repository for independent audit. Keep the 94 sleeves/neck-label/mug-wrap surfaces `candidate`; do not use the aggregate report alone to upgrade them.
- **Real errors:** no sanitized Admin Activity Log or Render error bundle is available in this workspace. Treat the error review as blocked; do not infer “no errors.”

### Mockup audit result to use for the next work item
The current system has photographic bases, native Smart Object masters, runtime role manifests, masks, lighting/protected-detail passes, and a Canvas/API hybrid compositor. Structural checks are strong: 188 canonical surfaces and 1,128 runtime roles/checksums. However, this does **not** prove uniform Photoshop-grade photorealism: the browser compositor still includes a strip-based curved approximation, the stored per-surface visual evidence is incomplete, and the runtime manifest is mixed (`94 accepted`, `94 candidate`). Preserve the fail-closed status and describe curved rendering as an approximation until browser/API pixel-parity and per-surface evidence are stored.

### Requested next safe Claude work
Continue the approved order with small, reviewable, code-only slices:
1. finish local/browser coverage for non-bottle back, sleeve, neck-label, mug-wrap, export parity, and cart payloads;
2. add or strengthen browser/API geometry and pixel-parity evidence without promoting candidate surfaces;
3. keep bottle and real-storage/live-site changes blocked at their existing approval boundaries;
4. then proceed to checkout/order lifecycle tests in a safe non-customer environment.

For every slice, update `reports.md` and `AGENT_HANDOFF.md` with exact evidence, changed files, tests, and remaining blockers. Ask before merging each PR; do not force-push.
