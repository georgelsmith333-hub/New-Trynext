# Trynext Lifestyle — Production Resilience Architecture

**Status:** repository architecture hardening and operational documentation
**Date:** 2026-10-30
**Brand/domain:** Trynext Lifestyle / `https://trynext.shop`

## Executive decision

Trynext must have one explicitly authoritative transactional database and one or more verified standby copies. Independent Neon databases are not replicas merely because they have the same tables or a similar product count. The application must never choose a write target by comparing row counts, and it must never claim that an automatic database migration has occurred when only a connection probe ran.

The safe operating model is:

1. Cloudflare Pages serves the storefront and gateway.
2. The gateway routes all mutations, authentication, checkout, admin actions, and AI requests to the primary API origin.
3. Public anonymous catalog reads may use a verified read origin only after that origin passes direct health, schema, and catalog checks.
4. Render runs the Node/Express API. The API uses a configured candidate order for database connection, not inferred authority from row counts.
5. Neon `trynex-main-backup` / `main` was the database selected during the October recovery and is the production database reported by the recovery work. The exact live Render environment variable value must still be confirmed privately in Render; this document does not copy connection strings.
6. A secondary Neon project or branch is a standby only if it is explicitly synchronized, schema-compatible, transactionally current, and approved for promotion. The verified standby created during this recovery is Neon project `trynex-main-backup`, branch `trynext-transactional-standby` (`br-mute-sky-au9gjdy`), using logical subscription `trynext_standby_subscription`; it is not routed for production traffic or automatic promotion.

## Request flow

### Storefront reads

The browser requests relative `/api/*` paths. Cloudflare Pages functions apply the gateway policy. Safe anonymous reads include products, categories, mockups, public stats, blog, settings, testimonials, and health endpoints. The product API returns a bounded page with `products`, `page`, `limit`, and—unless `includeTotal=false`—`total` and `totalPages`.

The API default page size is now 24. Storefront pages can request another bounded size for their layout, and the backend caps requests at 100. The full 69-product catalog is therefore available through pagination or an explicit bounded request; it is not forced into every initial page load.

### Writes and protected operations

Checkout, order creation, payment-proof uploads, customer authentication, admin mutations, backup actions, scheduler actions, and AI operations remain primary-only. They must not be retried against another origin unless the operation is explicitly idempotent and the promotion has been approved. A gateway timeout is not proof that an order failed; the client-side idempotency protections must remain in place.

### AI requests

AI generation and reference editing use a bounded 45-second gateway budget. This prevents ordinary requests from being cut off at the short default timeout while still preventing an unbounded provider hang. Provider credentials and quotas remain environment/provider concerns and are not stored in the browser.

## Database roles

### Primary transactional database

The primary holds the authoritative catalog, orders, customers, admin records, settings, sessions, mockups, and operational tables. All production writes must target it. The current recovery record identifies `trynex-main-backup` / `main` as the selected production source, with 69 products and the restored transactional dataset.

### Secondary/standby database

A secondary must be treated as one of these, never as a vague “backup”:

- **Transactional standby:** continuously or frequently synchronized, schema-compatible, and safe for promotion after a freshness check.
- **Read replica:** safe only for explicitly permitted reads; never for order, payment, customer, admin, or settings writes.
- **Catalog snapshot:** useful for recovery and comparison; not safe for live traffic or transactional failover.
- **Archive/export:** not a runtime database.

The current source code probes `products` and `orders` (and records `mockups` telemetry), but schema presence alone does not prove data freshness. The candidate selection code now respects configured priority instead of allowing a larger row count to select an independent database. The logical subscriber was verified at setup with 69 products, 73 orders, and 40 customers, and its `received_lsn` matched `latest_end_lsn` at the verification point.

## Quota and failure handling

A database provider quota is not the same thing as a normal application error. A professional system needs three separate controls:

1. **Detection:** health and quota monitoring records connection failures, PostgreSQL error classes such as `53000`, latency, and provider usage. The existing admin health/cluster surfaces are useful for this.
2. **Read protection:** safe public reads may fail over only to a verified read origin/database. Stale catalog data must be labelled or rejected according to the business requirement.
3. **Transactional promotion:** switching orders/admin writes requires an approved synchronized standby and a promotion record. It must not be triggered by a row-count comparison or by “the next configured URL” alone.

Automatic “migration when usage reaches 80–90%” cannot be safely implemented solely inside the Node process. It requires provider quota metrics, a durable synchronization job, a freshness watermark, promotion fencing, secret management, and a rollback procedure. The application can alert and fail closed; it cannot invent a correct replica from an arbitrary Neon database at runtime. Neon’s documented project quotas are hard suspension limits, not warning thresholds, so 80%/90% warning and critical notifications still need a separate monitor and an owner-approved alert destination.

The owner should configure provider monitoring at 80% warning and 90% critical, but the actual promotion policy should be:

- **80%:** alert, verify sync lag, and prepare capacity.
- **90%:** alert urgently, stop risky nonessential jobs, and verify the standby.
- **Provider failure:** promote only a known-current standby; otherwise keep transactional writes unavailable rather than writing to a stale fork.

## Render routing

The repository has role-aware gateway configuration:

- `primary`: sole authority for writes, admin, auth, checkout, AI, scheduler, and backup work.
- `reads`: optional stateless read origin, only after it is directly verified and configured.
- retired/unverified Render services must not be placed into production routing merely because they exist.

Running multiple Render services against independent databases does not create high availability. Multiple API processes are safe only when they share the same authoritative transactional database and use stateless/request-safe behavior. Scheduler and backup jobs must run in one designated primary role, not on every replica.

## Admin panel

The admin panel already has a protected session boundary, TOTP support, session revocation, activity logging, live health, database-cluster status, backup controls, automation status, product/order/customer/settings tools, mockup validation, and AI developer actions.

A separate admin frontend can improve frontend deploy isolation, but it cannot make database-backed admin actions work while the transactional database is unavailable. The correct separation is:

- separate admin route and authentication boundary now;
- optionally a separate Cloudflare Pages project for the admin UI later;
- the same primary API and database for transactional admin operations;
- a small read-only emergency status page that uses health endpoints without customer data;
- no “emergency admin writes” to a stale catalog or analytics database.

Creating a second Render API for admin without a shared authoritative database would increase risk, not improve recovery.

## Current verified production snapshot

- Domain: `trynext.shop`
- Storefront response: HTTP 200
- Branding title: `Trynext Lifestyle | Premium Custom Apparel Bangladesh`
- Readiness: `status=ok`, `db=true`, `catalog=true`, runtime role `primary`
- Public catalog: 69 products, 7 categories
- API default catalog page: 24 products; explicit requests remain bounded and paginated
- Release containing Studio interaction fixes: merged to `main` at `4095236`
- CI, build, typecheck/tests, Cloudflare Pages, and security scan: passed for that release

## Owner/provider actions still required

These are not safely inferable from repository code and must be verified in the private provider consoles:

1. Confirm Render's live API service and the private database target are the intended `trynex-main-backup` / `main` source.
2. Keep the logical subscriber healthy and define the promotion/fencing runbook; it remains a standby, not an automatic failover target.
3. Configure 80% warning and 90% critical usage notifications through a separate monitor; Neon’s hard quota setting must not be used as the warning mechanism because hitting it suspends compute.
4. If a second Render service is desired, configure it as a stateless read-only service first and prove direct health/catalog parity before routing reads to it.
5. Rotate all Neon API keys that were pasted into chat history.
6. Keep real-phone Studio touch verification as a separate acceptance check; repository tests cannot prove touch behavior.

No customer data, order data, payment data, provider settings, database migrations, or secret values are included in this document.
