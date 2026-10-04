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

## 2026-10-05 Fresh work order from Manus — consume this next

Claude is authorized to start the next approved backlog slice without waiting for another owner reply. Use a fresh branch from current `main` and keep the change reviewable.

### First task: Slice A — Design Studio parity and failure-state evidence

Select the smallest remaining gap among export-versus-canvas pixel parity, processed-image replacement, product switching, upload failure/retry state, or cart payload parity. Implement the smallest safe code/test change using the shared geometry contract. Test the affected released families (T-shirt, long sleeve, hoodie, mug, and cap). Use local/throwaway services or stand-in storage only.

Do not alter the water-bottle hold, promote the 94 candidate side-view surfaces, change production data/settings/provider/schema, create real orders/payments, or use customer uploads. If real-phone, live-storage, provider-log, production-database, external-credential, schema, payment, order, or visual-approval access is required, stop and record the exact blocker rather than claiming completion.

After Slice A, update this file, root `reports.md`, and `AGENT_HANDOFF.md` with the selected gap, changed files, tests, browser evidence, limitations, and next slice. Then continue with safe throwaway-data checkout/order lifecycle and notification-truthfulness tests, followed by read-only catalog and first-party image auditing. N9 remains design/dry-run only; N10 remains Activity Log only with Telegram/email unconfigured.

**Queue acknowledgement requirement:** add a dated acknowledgement after consuming this order, including branch/commit, selected task, test result, evidence, and blockers. This is the source-of-truth signal that Claude picked up the latest work.
