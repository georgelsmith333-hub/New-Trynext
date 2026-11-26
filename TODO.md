# Production truth audit and hardening — 2026-11-10

## Confirmed live evidence

- [x] GitHub `main` is the Render production branch for `https://github.com/georgelsmith333-hub/New-Trynext`; audited SHA `78c80370ff3cf2a973824db0b0d6365928ce895e`; the checkout was clean and matched `origin/main` before changes.
- [x] Read-only production checks completed for storefront, public product API, sitemap, robots, blog index/article, category pages, Design Studio, cart, checkout entry, and an unknown route. No order, payment, payment evidence, customer record, inventory, or merchant setting was changed.
- [x] Current public catalog evidence supersedes the historical category baseline: 24 products were returned across Mugs (5), Water Bottles (5), Caps (5), Hoodies (4), and Long Sleeves (5), with positive stock in the public response at audit time.
- [x] Current public settings evidence confirmed ৳100 shipping, free shipping at ৳1,500, and COD enabled; merchant destinations and other secrets were not printed or recorded.
- [x] Confirmed live SEO defects recorded: `/design-studio` served homepage metadata to Googlebot; `/not-a-real-route` served the homepage shell with HTTP 200; blog index and articles exposed homepage `og:url`. The live sitemap parsed as valid XML with 120 URL entries; an earlier grep-based duplicate-quote signal was a text-extraction artifact, not malformed XML.

## Completed in this hardening pass

- [x] Added an explicit public route manifest at `artifacts/trynex-storefront/public/manus-routes.json`.
- [x] Added Pages middleware route classification and a real noindex 404 for unknown app-like paths, preventing the catch-all homepage rewrite from creating soft 404s.
- [x] Added truthful noindex crawler metadata for the Design Studio editor route.
- [x] Hardened canonical, description, Open Graph, and Twitter metadata replacement and added regression coverage.
- [x] Focused and full storefront validation passed: 39 test files / 249 tests, storefront typecheck, repository typecheck, production build, manifest validation, and diff check.

## Release gate and remaining verification

- [ ] Commit and push only the scoped routing/SEO files after review; rebase safely onto the latest `origin/main` immediately before push.
- [ ] Wait for GitHub CI and active-app verification for the exact release SHA, then repeat normal-user and Googlebot live checks for category pages, blog articles, Design Studio, missing routes, sitemap, and robots.
- [ ] Compare the live sitemap URL set against the intended public route set and inspect image URL quality before declaring sitemap content fully clean.
- [ ] Continue the open Design Studio, checkout, RBAC, mockup publication, automation delivery, backup, and provider-rotation outcomes below.

# Design Studio recovery checklist

## Completed in this repository change

- [x] AI generation and reference-edit requests receive a bounded 45-second primary gateway budget instead of the ordinary 3.5-second timeout.
- [x] Approved product surfaces use one authoritative live compositor; the flat SVG is not painted underneath an active compositor.
- [x] A single tap/click selects uploaded artwork and shows compact neutral controls rather than oversized orange circles.
- [x] Clicking outside the canvas clears the contextual selection controls.
- [x] Double-click/double-tap still opens the existing image-edit workflow, with explicit Edit and Crop entry points.
- [x] All six Studio product categories honor their corresponding admin-configured color settings, including frontend types and defaults.
- [x] Regression tests, TypeScript validation, and the production build pass locally.

## Still requires verification outside this repository

- [ ] Test single-click, double-click, crop/extend, drag, resize, rotate, and outside-tap behavior on a real phone and on the deployed preview.
- [ ] Verify the AI provider/API credentials and provider quota in the authorized production environment; no provider settings were changed here.
- [ ] Verify the live database catalog, mockup asset coverage, and admin settings after deployment; no migration or production data write was performed here.
- [ ] Owner approval is still required before merging, deploying, or changing Cloudflare, Render, Neon, GitHub, Photopea, or production settings.

## Professional resilience follow-up

- [x] Product API uses a bounded professional default of 24 items per page, while explicit requests remain capped and return pagination metadata.
- [x] Database candidate selection follows configured authority order; independent database row counts no longer select the production write target.
- [x] Admin Database Cluster copy distinguishes health/schema probes from safe transactional promotion and warns that independent Neon databases are not replicas.
- [x] Add `docs/RESILIENCE_ARCHITECTURE.md` with the current Cloudflare → Render → Neon request flow, admin boundary, database roles, and quota policy.
- [ ] Privately confirm the live Render database target is the approved `trynex-main-backup` / `main` source; do not paste the connection string into chat.
- [ ] Identify and verify a genuinely synchronized transactional standby before enabling any write failover.
- [ ] Configure Neon/Render quota alerts at 80% warning and 90% critical; repository code alone cannot obtain provider quota metrics.
- [ ] If a second Render service is introduced, prove it as a stateless read-only origin before adding it to Cloudflare read routing.
- [ ] Revoke and rotate the four Neon API keys previously exposed in chat history.

## Studio correction pass

- [x] Tapping or pressing outside the selected artwork's actual rotated frame clears the overlay even when the transparent Konva hitbox extends farther.
- [x] A delayed tap after an outside long press cannot immediately reselect the artwork and restore the controls.
- [x] Contextual Crop opens the crop dialog directly on mobile by keeping the ImagePanel mounted; Edit remains the separate full image-tools entry point.
- [x] Touch swipes on artwork no longer start Konva artwork dragging; native vertical page scrolling remains available, while mouse/pen dragging remains supported.
- [x] Horizontal Studio control strips explicitly use touch-pan behavior, and crop preview handles use a touch-safe editing surface with 44px hit targets.
- [ ] Verify the final gesture timing, crop handles, apply/cancel behavior, and Edit/Crop transitions on a real phone after deployment.

## Checkout and mockup reliability follow-up

- [ ] A Design Studio item that reaches the cart retains its Studio marker, product identity, selected options, preview, print-ready original artwork references, and quantity when the checkout payload is serialized.
- [ ] Studio items are accepted by the order route without being rejected as missing catalog products, while ordinary catalog items still receive product and stock validation.
- [ ] A Studio order can be retried safely with the same checkout idempotency key and cannot create a duplicate order or show a false success state.
- [ ] Checkout surfaces an immediate, actionable error for invalid artwork, unavailable mockup surfaces, storage failures, or transient API failures instead of silently leaving the customer in a broken route.
- [ ] The customer-facing mockup path remains the approved compositor/runtime-role pipeline and is described honestly; a true browser-side PSD Smart Object is not claimed unless Photopea/provider setup is completed.
- [ ] Facebook Login/Signup remains visible with an explicit setup state; Meta authorization and App ID/secret entry remain owner-controlled and are never committed to source.
- [ ] Real order placement and payment submission remain unperformed during repository validation.

## SEO category expansion — personalized mugs and custom drinkware

- [x] Verify the live catalog before creating SEO pages: 12 Mugs and 10 Water Bottles are present in production; all verified items are customizable and in stock; effective price ranges are recorded in `docs/SEO_CATEGORY_PHASES.md`.
- [x] Verify the live public commerce settings before writing page copy: ৳100 shipping, ৳1,500 free-shipping threshold, COD enabled, and current configured payment-method state recorded without exposing merchant numbers.
- [ ] Confirm live mug and water-bottle image/mockup rendering on mobile and validate the Design Studio add-to-cart path without submitting payment.
- [ ] Resolve the difference between catalog prices and Studio-configured custom-order prices before publishing price claims.
- [x] Build and validate the personalized mug category page with real products, crawler-visible copy, truthful Bangladesh payment/shipping rules, internal links, and structured data. Live Googlebot verification passed for `/custom-mugs-bangladesh`.
- [x] Build and validate the custom drinkware category page using only real orderable drinkware; do not advertise tumblers or bulk ordering until verified. Live Googlebot verification passed for `/custom-drinkware-bangladesh`.
- [ ] Publish the first supporting mug/drinkware editorial pages and connect them to the category pages and product pages.
- [ ] Verify raw HTML, metadata, canonical URLs, JSON-LD, sitemap, robots, mobile layout, product CTA, cart, Design Studio entry, and checkout navigation before release.
- [ ] Publish the verified category expansion and recheck production responses, CI, and active-app verification.
- [ ] Submit the new URLs for indexing through the verified Google Search Console property when URL inspection is available.
- [ ] Re-measure Google Search Console and Peec AI visibility after data has accumulated; do not claim ranking or citation gains from publication alone.


## Approved 2026-11-10 code-only continuation — category guides and editorial pages

- [ ] Keep `/custom-mugs-bangladesh` and `/custom-drinkware-bangladesh` as authoritative, useful, crawler-visible buying experiences rather than thin product grids. Each page must expose its H1, Bangladesh-specific introduction and direct answer, genuine available products with current catalog prices and accurate image alt text, clear product and Design Studio links, useful customization/order steps, locally relevant gift uses, current delivery/payment language without unsupported fixed time or price claims, visible FAQs, internal links and unique title/description/canonical/Open Graph/Twitter metadata.
- [ ] The mug page must help shoppers choose and prepare a photo, explain product-specific personalization and order review without promising controls or previews that a selected item does not show, and link to the current mug catalog, Design Studio, shipping information and related guides.
- [ ] The drinkware page must use only currently verified, orderable customizable mugs and water bottles; provide crawlable links and a comparison/use-case guide for those real product groups; do not advertise tumblers, unsupported specifications, or automatic bulk/corporate ordering. Any larger business request is only an inquiry until Trynext confirms availability, quantity, price and lead time.
- [ ] Add source-managed static guides at `/blog/how-to-design-a-custom-photo-mug`, `/blog/custom-mug-gift-ideas-for-couples`, and `/blog/custom-drinkware-gifts-in-bangladesh`. Each guide must be useful and original, link to the relevant category in its opening paragraphs, include related live product/catalog, Design Studio and shipping/policy links, and show all FAQ answers visibly when `FAQPage` JSON-LD is emitted.
- [ ] The active root Cloudflare Pages handlers and React routes must expose matching crawlable category/article content, unique metadata/canonicals and accurate CollectionPage/ItemList/BreadcrumbList or BlogPosting/FAQPage structured data. Update `/manus-routes.json`, the blog index and the sitemap (one canonical URL per source-managed guide); the sitemap must still return core/static URLs if catalog or CMS database reads fail, while including dynamic URLs whenever those reads work. Preserve existing API-backed CMS articles and admin editing; source-managed guides must not require or write blog database records.
- [ ] Preserve existing product, cart, Design Studio, checkout, COD/25%-advance and payment behavior. The owner subsequently requested a live push: use an isolated preview first, pass CI and verify it, then publish through the existing `main` → Cloudflare Pages/Render integration. Do not create a real order, submit a payment, mutate production data/settings, or restore/repoint a production database branch without the owner selecting the exact source. Keep live/mobile/release verification open until performed against the approved environment.


## Approved 2026-11-18 code-only free-tier database polling fix

- [x] Database candidate selection must retain configured authority order, probe sequentially, stop at the first candidate with the transactional `products` + `orders` schema, and avoid table row-count scans or probing lower-priority databases once a higher-priority target succeeds.
- [x] Remove the 60-second deep database-chain re-probe while the primary is healthy. Preserve recovery without retrying or replaying the failed customer query: trigger a separate bounded recovery probe on connection-level errors, back off after failures, and limit failback probes to higher-priority candidates while a standby is active.
- [x] Remove scheduled keep-alive database pings as a default recurring task; retain an explicit manual health-ping action only and explain its compute impact in the admin UI. Automation configuration polling must be cached long enough not to generate minute-level database reads; explicit admin refresh/save remains immediate.
- [x] Change Database Cluster dashboard polling so it does not automatically probe all configured database endpoints every 30 seconds. Retain an explicit manual refresh, a useful cached result, and visible notice that probing may wake free-tier computes.
- [x] Preserve opt-in scheduled business automations, backups, usage-monitoring semantics, single-authority/write safety, schema checks, and existing admin access controls. Add regression coverage for sequential/limited recovery policy and manual-only keep-alive.
- [x] Run focused tests, API build/typecheck, relevant storefront typecheck/tests, workspace checks as feasible, and `git diff --check`. Do not merge or deploy until production backend health is restored and separately authorized.


## 2026-11-20 event-driven mockup queue free-tier hardening

- [x] Replace the worker's unconditional 3-second database interval with one startup drain and event-driven drains after durable enqueue/completion; schedule bounded one-shot exponential retries after claim-query failures, without recurring idle polling.
- [x] Preserve the database-backed durable queue without schema migration; defer failed-job retries with bounded 30-second-to-5-minute timers, exclude deferred jobs from immediate claims, and respect the configured maximum total attempt count.
- [x] Add regression coverage for idle behavior, the durable enqueue wake-up, transient claim-query retry/backoff, retry-delay bounds, and the maximum-attempt boundary; focused worker tests pass (5/5), full API tests pass (39 files / 266 tests), API typecheck/build, repository typecheck, and diff check pass locally.
- [x] Document that event notifications and retry delays are process-local; the current Render production service is configured for one instance. Any horizontal scaling or restart-durable retry schedule needs a separate cross-process design that does not reintroduce frequent idle queries.
- [ ] Keep production release blocked until the original database source is available and data-verified; this code change is for review only and has not been merged or deployed.
- [ ] If API horizontal scaling or restart-durable retry timing is introduced, add cross-process wake-ups / durable retry scheduling without restoring frequent database polling.

## 2026-11-26 comprehensive remediation continuation

- [x] First remediation batch committed as `52ea33a`: authoritative shipping/payment semantics, card-on-delivery wording, mobile retry key/fallback, sitemap route coverage, admin terminal error states, gateway/config parity guard, retired-host correction, Studio curvature consistency, and safe staging-object cleanup with regression coverage.
- [x] Second remediation batch committed as `48b2c39`: authenticated catalog cache privacy, explicit public cache headers, product-cache invalidation after category mutations and committed stock decrements, shared focus trapping/restoration for custom Studio/admin dialogs, and a release-gated durable idempotency implementation.
- [x] Focused storage regression suite passed: 2 files / 16 tests; cache/order/category suite passed: 3 files / 28 tests; existing idempotency and order tests passed: 2 files / 25 tests.
- [x] API and storefront typechecks passed; API production bundle passed; mockup matrix passed with 188 expected surfaces and 1,128 runtime roles; deployment-source parity guard passed; `git diff --check` passed.
- [x] Durable idempotency migration `lib/db/migrations/008_add_order_idempotency_keys.sql` and `DURABLE_ORDER_IDEMPOTENCY=true` code path are staged in source but not activated against production. The current default remains the existing memory guard until the migration is applied and a controlled release is approved.
- [ ] Re-run the full repository test/build matrix after the second batch in a clean CI-like install environment; local ARM64 verification required a temporary optional Rollup package installation that was removed from manifests.
- [ ] Push the two commits through the authorized GitHub path, wait for CI and active-app verification, merge only after review, and let the exact Render service auto-deploy from merged `main`.
- [ ] After deployment, verify exact SHA, both production hosts, health/readiness aliases, sitemap/robots/routes, 70-product pagination, Studio assets, checkout/payment descriptions, storage reachability, and the reversible empty-cart smoke test without submitting an order/payment.
- [ ] Apply migration 008 only through a separate controlled release gate after confirming the approved production database target and rollback procedure; then enable `DURABLE_ORDER_IDEMPOTENCY=true` and verify replay/concurrency behavior non-mutating where possible.
- [ ] Continue measured P2 optimization: responsive WebP/AVIF derivatives, byte-aware/path-scoped service-worker image caching, explicit Studio ONNX/WASM resource handling, and deferred decorative/third-party work only after measurement.

## 2026-11-26 live production verification

- [x] PR #107 merged as `8433f68dd2b5d96f58c84acaa6128f69f3758c75`; exact Render service `srv-da9pl91f2nfc7388d150` deployed that SHA live in `dep-dc49lk0ae00c73demn6g`.
- [x] Both production hosts passed GET-only liveness/readiness/readyz, categories, sitemap, robots, public settings, and deterministic pagination checks. Catalog result: six categories, 70 products, page counts 24/24/22, 70 distinct, zero duplicates.
- [x] Live public settings confirmed ৳100 shipping, ৳1,500 free-shipping threshold, COD enabled, and card-on-delivery wording. Representative six-family Design Studio runtime PNGs returned 200.
- [x] Browser-local cart smoke test completed reversibly: one item added and removed; final cart showed empty. No checkout, order, or payment submission occurred.
- [ ] Resolve the explicit storage blocker: both hosts report `GET /api/health/storage` with `backend=r2`, `reachable=false`, `error=storage_unavailable`. Privately verify the exact Render R2 credentials, bucket name, account endpoint, and bucket permissions; do not paste values into chat or weaken the health probe.
- [ ] After R2 repair, repeat health/storage and safe upload/private-object reachability checks before calling the full-stack release fully ready. Durable idempotency migration 008 remains unapplied and disabled.


## 2026-11-26 provider and SEO continuation

- [x] Read-only Render verification reconfirmed the approved service `trynex-lifestyle-main-render` (`srv-da9pl91f2nfc7388d150`) in `Azim's workspace` (`tea-d5uiuknfte5s73c3b0f0`), on free tier, branch `main`, auto-deploy enabled; the older `trynex-lifestyle` service is suspended and was not touched.
- [x] Read-only Cloudflare verification found the authenticated owner account `060a0f28c7f62affa5ac09be3b1dd1a9`, R2 bucket `trynex` (APAC, Standard), enabled managed domain, and existing upload/mockup objects. The bucket exists; no Cloudflare setting was changed.
- [x] Confirmed the live R2 blocker is still backend `HeadBucket` failure (`reachable:false`, `storage_unavailable`) rather than proof that the bucket is absent. Render's four R2 values remain owner/provider configuration items; no secret was read, printed, or changed.
- [x] Read-only Cloudflare Pages inventory confirmed the active project is `trynext-shop-new`, custom domains `trynext.shop`/`www.trynext.shop`, GitHub source `New-Trynext`, production deployment at commit `24dc178e9aedfb8b3948e997c8af3a554d792b4f`.
- [x] Read-only Google evidence recorded: Search Console owner property `sc-domain:trynext.shop`; submitted sitemap last downloaded 2026-11-23 with 101 web URLs and 69 image URLs submitted, 0 indexed in the returned sitemap report; last 30-day page data showed 2 clicks/152 impressions for the home page, 36 impressions for `/blog`, 51 for one behind-the-scenes article, and 8 for `/product/zip-up-hoodie`. GA4 property `533850165` returned 128 sessions, 94 active users, 110 engaged sessions, and 3 key events for the previous 28-day range; Organic Search contributed 40 sessions and all 3 key events.
- [x] Found and fixed a release-path defect: route-aware SEO middleware existed only at `artifacts/trynex-storefront/functions/_middleware.ts`, while the active Cloudflare Pages project builds from repository-root `functions/`. Added the identical middleware at `functions/_middleware.ts` so unknown routes can return a real noindex 404, `/design-studio` can return truthful noindex metadata, and bot product/blog/keyword rendering reaches the actual Pages runtime.
- [x] Focused SEO middleware/guide tests passed 13/13; storefront typecheck passed; gateway/config parity and `git diff --check` passed.
- [ ] Build/test full production artifact in a clean CI-like environment; this sandbox currently lacks ARM64 optional native binaries for Rollup, Lightning CSS, and Tailwind Oxide, so the local Vite build was environment-blocked after the source/typecheck/tests passed. Do not add those temporary packages to tracked manifests.
- [ ] Commit/push the root middleware through the authorized GitHub path, wait for Pages CI/active-app checks, then recheck raw normal-user and Googlebot responses for `/design-studio`, unknown routes, product/blog detail routes, sitemap, and robots.
- [ ] Owner/provider action required for R2: in the exact Render service, privately confirm `R2_ACCOUNT_ID` is the Cloudflare account ID, `R2_BUCKET` is `trynex`, and the access key/secret belong to an R2 API token with bucket-scoped Object Read/Write permission. Do not paste values into chat. After any smallest approved correction, redeploy and repeat storage health plus safe upload/private-object checks.


## 2026-11-26 R2 repair completed

- [x] In the owner-connected Cloudflare browser, confirmed the `trynex` bucket, account ID, APAC/Standard location, 24 existing objects, managed public-domain state, and current CORS policy without changing bucket data or access settings.
- [x] Created the approved dedicated R2 Account API token `Trynext Production R2 Recovery`, restricted to bucket `trynex` with Object Read & Write. Cloudflare's shortest practical form option was selected: 30-day TTL, active through 2026-12-26. No token secret or access key was recorded in files or chat.
- [x] Updated only the exact Render production service `srv-da9pl91f2nfc7388d150` in workspace `tea-d5uiuknfte5s73c3b0f0` with the four R2 variables; existing environment variables were merged/preserved. Render deployment `dep-dc4a7rei0phs739jlt1g` became live.
- [x] GET-only live verification passed on both `https://trynext.shop` and `https://trynex-lifestyle-main-render.onrender.com`: readiness remained `status:ok`, `db:true`, `catalog:true`; storage health now reports `backend:r2`, `reachable:true`, `error:null`.
- [ ] Before 2026-12-26, rotate/renew the scoped R2 credential through an approved controlled operation; do not let the short-lived production credential expire unexpectedly.

## 2026-11-27 checkout/payment remediation checkpoint

- [x] Prevent the empty-cart redirect from winning after an acknowledged order: checkout now records an explicit post-order flow guard before creation, keeps the acknowledged gateway/success path independent of live cart clearing, and releases the guard only when order creation fails.
- [x] Preserve wallet/bank cart state until payment evidence submission; COD and card-on-delivery still clear the cart only after their order is accepted.
- [x] Show payment details before final confirmation and again on the review step: configured bKash, Nagad, Rocket, and uPay receiver numbers; full-payment or 25%-advance amount; remaining delivery balance; bank name/account/branch/routing when configured; sender/reference guidance; card-on-delivery timing; and COD advance/balance wording.
- [x] Make gateway copy distinguish full payment from 25% advance and remove the irrelevant wallet sender-number field from bank-transfer gateway screens.
- [x] Extract backend payment-evidence note construction so retries replace prior evidence fields deterministically instead of appending duplicates; preserve contact authorization, payment-method matching, private proof-path validation, and payment-status behavior.
- [x] Add focused frontend regression assertions for post-order cart protection and review payment-detail completeness, plus backend tests for retry-safe wallet/bank evidence normalization.
- [x] Verification completed without a real order or payment: storefront typecheck passed; full storefront tests passed (40 files / 264 tests); API typecheck and production bundle passed; affected API order/idempotency tests passed (27/27); storefront production build passed after a temporary ARM64-only optional native binding install, with tracked manifests restored unchanged; `git diff --check` passed; live checkout-entry navigation with an empty cart redirected reversibly to the cart and no order/payment was submitted.
- [ ] Review the scoped diff, commit with the repository attribution rule, push through the authorized GitHub path, open a controlled PR, wait for CI/active-app/Pages checks, and merge only through normal review.
- [ ] After approved deployment, repeat GET-only health/readiness/storage/catalog checks and a reversible browser checkout-entry/payment-detail smoke test. Do not submit an order or payment. Durable idempotency migration 008 remains unapplied and disabled.

## 2026-11-27 PR #109 checkout checks complete

- [x] Pushed checkout/payment remediation commit `9fec08d8ba423c189cf8af932a01562830d71d7a` to the existing authorized PR #109 branch without force-pushing.
- [x] Refreshed checks passed on the exact commit: Cloudflare Pages, Active app verification, CI build-and-check, and CI security-scan (4 successful, 0 failing, 0 pending).
- [ ] Obtain the normal review/approval and merge through GitHub; do not merge from the sandbox or bypass the review gate.
- [ ] After merge/deployment, verify the exact Render SHA and both public hosts with GET-only health/readiness/storage/catalog/SEO checks plus a reversible browser checkout-entry/payment-detail smoke test. Do not submit an order or payment.


## 2026-11-27 Pages API routing blocker and correction

- [x] GET-only diagnosis confirmed the active Pages project `trynext-shop-new` is on production commit `9524d2dc4714a550b5e46543ce0dbc887aa5fc28`, but `/api/products`, `/api/settings`, `/api/categories`, and `/api/health/readiness` fell through to the SPA HTML on both the production and preview Pages URLs; the healthy Render origin returned JSON.
- [x] Root cause identified in the deployed source path: `artifacts/trynex-storefront/public/_redirects` had a global `/* /index.html 200` rewrite that intercepted `/api/*` before the Pages API Function. Removed only that wildcard and preserved the `/sitemap.xml` redirect.
- [ ] Publish this routing-only correction from a fresh branch based on merged `origin/main`; wait for Pages/CI checks, then verify JSON API responses and the live catalog before claiming custom-domain checkout verification.
- [x] No order, payment, payment proof, upload, inventory, customer, settings, database, or provider mutation occurred during diagnosis.
- [ ] Keep migration 008 unapplied and durable order idempotency disabled.
