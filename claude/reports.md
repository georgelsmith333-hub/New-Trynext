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


## Owner decisions for Claude N5–N7 — 2026-10-05

### N5 — Artwork on a side the opened product does not have
**Decision: (a) keep the artwork and show a clear warning.** Preserve the artwork in the draft, do not silently move or delete it, and make the warning customer-readable when artwork exists on an unavailable/non-rendered side. Add focused tests for restoration and cart/export behavior. Do not change bottle behavior under this decision.

### N6 — Merge permission
**Decision: (a) Claude may merge code PRs automatically once all required checks are green and the release scope is clearly reported.** This authorization is limited to small, reviewable, tested changes within the approved backlog. It does not authorize production data/settings/provider/schema/order/payment changes, force-pushes, or bypassing any fail-closed gate. Keep the existing bottle, candidate-surface, live-site, storage, and evidence boundaries.

### N7 — Production upload PUT rejected
**Decision: (c) Claude is authorized to build the through-the-API upload path.** Do not change Cloudflare/R2 settings or credentials as part of this work. Keep the existing direct-upload path available only if it remains safe, but make the fallback explicit and truthful. Enforce file type/size limits, authentication/authorization, origin/CSRF protection, bounded request size, safe storage keys, content validation, timeout/error handling, and no secret or presigned-URL leakage. Add focused tests and a local/stand-in storage verification; stop before any real customer order or payment. Record bandwidth/size trade-offs and preserve the existing upload metadata and cart contract.
