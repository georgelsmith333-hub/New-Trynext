

## 2026-10-05 Consolidated unresolved-work queue for Claude

This section supersedes scattered next-action notes for execution order, but does not relax any release gate or authorize provider, database, payment, order, or customer-data mutations.

### Current completed baseline
`main` now includes the N5 unavailable-side warning, N7 through-the-API upload fallback, in-memory checkout idempotency/order-status validation, and contact-message persistence/truthful delivery status. CI and active-app verification for the merged PRs passed. These are code/local or stand-in-storage results; live deployment and real-bucket verification remain separate evidence requirements.

### Execute next, in this order

1. **Studio reliability and parity:** finish local/stand-in browser coverage for upload failure/success states, all non-bottle faces, export-versus-canvas pixel parity, cart payload parity, product switching, processed-image replacement, and simulated touch/accessibility behavior. Add focused regression tests and save redacted evidence. Do not promote candidate mockup surfaces.
2. **Checkout/order safety:** continue safe local/throwaway-database tests for payment-status truthfulness, notification truthfulness, inventory reservation, retry/idempotency behavior, order-state transitions, customer-safe lookup, and failure/recovery paths. Never create a real customer order or payment.
3. **Catalog and first-party assets:** audit the canonical six-family catalog and 188-surface matrix read-only; identify stale/duplicate/invalid records and fragile image URLs. Prepare dry-run reports and code-only fallback fixes first. Do not import, delete, or mutate production data without a separate reversible plan and explicit approval.
4. **Mockup evidence:** preserve the bottle hold and 94 candidate side-view status. Build proof/evidence tooling for browser/API geometry and pixel parity, native Smart Object editability, provenance, protected-detail order, and curved-product approximation labeling. Do not claim full Photoshop-grade photorealism from structural checks alone.
5. **P0 live/error evidence:** document the exact blocked steps for live-domain checks and sanitized Activity Log/Render inspection. If authenticated provider/browser access becomes available, capture redacted evidence only; otherwise continue local work and do not claim live health.

### N8 — real upload verification
Still blocked on an authorized live browser after the merged upload fallback is deployed. Required test: one small harmless image in live Studio, Add to Cart, confirm exact success/error, remove cart item, and stop before checkout. No secrets, URLs, or customer data in the report.

### N9 — persistent idempotency
**Safe authorization:** prepare a reversible migration design, schema diff, dry-run query/report, rollback plan, and tests for a durable `orders.idempotency_key` unique constraint. Do not apply the migration, alter production schema, or backfill live data. Treat the current in-memory guard as the production behavior until a separate explicit schema-execution approval exists.

### N10 — contact messages
**Decision:** Activity Log is sufficient for now. Keep Telegram/email unconfigured and truthful; do not add provider settings or notification credentials. Continue testing that contact messages are safely stored and that the UI does not claim delivery when no notifier succeeded.

### Owner/device-blocked needs
N1 real-phone touch editing, N3 post-merge live-site verification, N8 real upload, and N4 sanitized provider/error evidence require an authorized phone/browser/provider view or sanitized owner-supplied output. Claude may prepare all local tests, proof generators, reports, and code safeguards, but must stop at those boundaries and record the exact missing evidence.

### Merge and release rule
Claude may merge small, tested code PRs automatically after required checks pass and scope is reported, but this does not authorize production data/settings/provider/schema/order/payment changes, bottle release, candidate-surface promotion, force-pushes, or bypassing fail-closed gates. Every completed slice must update this report and `AGENT_HANDOFF.md` with commit, files, tests, evidence, and blockers.
