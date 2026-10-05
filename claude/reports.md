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
