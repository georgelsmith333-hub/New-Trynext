# Trynext Lifestyle — Agent Handoff

This is the durable, shareable context for the Trynext Lifestyle project. Read it
after `AGENTS.md` and before planning or editing. Keep it updated after meaningful
work. Never put secret values in this file.

## Project identity

Trynext Lifestyle is a Bangladesh-focused print-on-demand commerce platform for
custom T-shirts, hoodies, mugs, caps, long sleeves, and water bottles. It includes
a customer storefront, browser Design Studio, admin back office, API server,
mobile app, promotional experience, and brand-system artifact.

## Read-first files

1. `AGENTS.md` — mandatory Agent operating rules
2. `AGENT_HANDOFF.md` — this durable project context
3. `replit.md` — architecture, workflows, product behavior, and gotchas
4. The relevant current source files and tests for the user's request

## Current product surfaces

- Customer storefront and admin panel: `artifacts/trynex-storefront`
- API server: `artifacts/api-server`
- Mobile app: `artifacts/trynext-mobile`
- Promo experience: `artifacts/trynext-promo`
- Brand system: `artifacts/trynext-brand-system`
- Shared API contract and generated clients: `lib/api-spec`, `lib/api-client-react`,
  and `lib/api-zod`
- Database schema and migrations: `lib/db`

## Existing work to preserve

- The storefront is the public Trynext Lifestyle commerce experience.
- The Design Studio supports precise 2D editing and realistic 3D/final rendering.
- Curved products use the 3D preview by default while flat apparel uses the 2D
  view by default.
- Product switching re-fits artwork to the target product's print zone.
- Shipping, payment, customer contact, admin settings, and other customer-facing
  values are settings-driven where documented in `replit.md` and memory.
- The API server is compiled before restart; editing API source alone does not
  hot-reload the running server.
- Existing authentication, admin session, database failover, backup, storage,
  rate limiting, and security behavior must be preserved unless the user
  explicitly requests a change.

## Working protocol for every new request

1. Read the current user request and identify the exact requested outcome.
2. Read the first-priority files listed above.
3. Inspect the relevant current implementation; do not rely only on this summary.
4. In the first response, confirm the three required files were read and clearly
   report completed work, the previous stopping point, remaining work, blockers,
   the proposed plan, preserved behavior, verification, and safe parallel work.
5. Submit a plan before editing.
6. Identify all related paths, including API/client, desktop/mobile, admin/customer,
   persisted/runtime, and old/new or before/after behavior.
7. Implement only the approved scope.
8. If independent work is parallelized, reconcile it before completion.
9. Run the relevant verification, rebuilding/restarting services when required.
10. Update this file with durable results, decisions, and remaining work.
11. Submit a completion note before closing or a status handoff when pausing,
    blocking, or transferring the work.

## Current open work

### Admin panel wiring pass (2026-09-24)

```text
Status: ready for review — local only, uncommitted, not deployed
Last completed: Drove every admin page in Playwright (desktop + 390px touch
  for Page Builder / AI Developer), fixed wiring bugs, re-drove the fixed pages,
  cleaned up all test records in the local sandbox DB.
Stopped at: After storefront + API typecheck/tests and final re-drive.
Files/areas changed:
  - Page Builder now actually drives the homepage: new shared contract
    src/lib/homepageLayout.ts (stored as {"version":2,"sections":[...]} in the
    homepage_layout setting); Home.tsx renders sections in that order with
    visibility/title/background/padding overrides (index.css .home-section-*).
    Legacy bare-array values (never rendered before) are ignored so a deploy
    cannot strip a live homepage; no saved v2 layout = previous default order.
    AdminPageBuilder rewritten on the contract (reorder via drag or up/down
    buttons on all sizes, hide/remove/add, reset, unsaved indicator).
  - Designer: hero "Shop" CTA text/link now wired (TypewriterHero; API/public
    defaults changed from "Shop Now"//shop to "" = built-in button); heroTitle
    is not rendered by the animated hero — Designer/Settings now say so.
  - Settings saves refresh the browser's cached /api/settings (cache:"reload")
    so the storefront reflects admin saves immediately (lib/api-client-react).
  - getListProductsQueryKey()/getListOrdersQueryKey() with no params returned
    [path, undefined], which never matched, so admin product create/edit/delete
    did not refresh the list. Admin (Bearer) catalogue reads are now no-store.
  - AI Developer: tool calls lacked Content-Type (every tool/audit failed);
    /api/ai/developer/* exempted from the 10-per-5-min public AI limiter;
    context/get_settings no longer return credential rows; explicit
    unconfigured provider returns a clear error instead of silent fallback;
    network errors are friendly; feature toggles persist; auto-audit works;
    streaming toggle hidden; mobile layout usable.
  - Blog: blank/relative image URLs rejected every post without an absolute
    image URL (fixed); drafts no longer publicly readable by slug/id; save
    button/toast reflect draft vs published.
  - Reviews: API now also returns `text` (stored as body; admin + product page
    read text); deleting an approved review recomputes product rating/count.
  - Secrets page fetched /admin/secrets without /api (always empty).
  - Storefront announcement ticker no longer overlays admin pages; admin
    headings no longer inherit the storefront display h1–h4 sizes.
  - Roles shows "admin" role; Dashboard action errors show server message.
Remaining work: Commit/deploy after review. Not wired (needs external keys or
  network): external AI providers, Telegram test, Google ping/GSC submit.
Blocker: None for local. src/pages/studio/DesignStudioV2.mobile-workflow.test.ts
  fails (other engineer's in-progress studio work, not touched here).
Next safe action: Review the diff, run the API build + storefront tests, then
  commit on a branch.
Verification: storefront tsc OK, vitest 68/69 (studio test above); API tsc OK,
  vitest 38/38; Playwright re-drives of page builder, designer, AI developer,
  products, categories, promo codes, orders, customers, hampers, blog,
  reviews, newsletter, referrals, security, logs rollback, backup, roles,
  secrets, deployment, settings passed.
```

### Storefront performance checkpoint (2026-09-16)

```text
Status: ready for review — local performance release verified
Last completed: Reduced home catalog work to a bounded no-count request, added a
process-local product cache, extended safe catalog edge caching with stale-while-
revalidate, prioritized the first home product image, and generated 90 small WebP
product thumbnails from the large PNG masters.
Stopped at: After rebuilding/restarting both managed workflows, measuring cold and
warm API responses, checking thumbnail responses, running the storefront tests,
and capturing a clean desktop preview.
Files/areas changed: API product list route and client hook, storefront image URL
resolution and home product loading, Cloudflare Pages API cache headers, and
public/assets/products/optimized/*.webp.
Remaining work: Publish the verified source and optimized assets only after a
valid GitHub remote credential/repository URL is available. Cloudflare provider
verification remains separate and was not mutated.
Blocker: This checkout has no configured git origin; the newly available GitHub
credential returned repository-not-found when tested against the historical
repository path. Do not force-push or guess a repository URL.
Next safe action: Confirm the canonical GitHub repository through secure workspace
integration/configuration, then fetch main, merge normally, run the release checks,
and publish through the connected Pages workflow.
Verification: API and storefront typechecks passed; storefront production build
passed; API build passed; all 19 storefront test files and 69 tests passed; 33 of
36 API tests passed, with the 3 failures limited to absent excluded PSD/PSB fixture
files; API products returned 200 with includeTotal=false in about 0.55s cold and
about 0.003s from the local cache; generated WebP thumbnails returned 200 at
35–80KB; both workflows are running; desktop preview rendered without browser
console errors; git diff checks passed.
```

## Critical-flow smoke verification checkpoint (2026-09-17)

```text
Status: local and live smoke verification complete; newest verifier commit
  is ready but GitHub publication remains blocked by remote authentication.
Added: scripts/verify-critical-flows.mjs and the root
  verify:critical-flows package command. The check is deliberately
  non-mutating: it does not create orders, payments, uploads, reviews,
  sessions, or admin changes.
Verification: 30/30 passed locally and 30/30 passed against
  https://trynext.shop. Customer pages passed: home, shop, products,
  Design Studio, cart, checkout, account, login, signup, tracking, and
  hampers. Admin page delivery passed for login, dashboard, products,
  orders, customers, settings, mockups, deployment, and roles. Public
  readiness/products/categories/settings APIs passed. Protected order/admin
  APIs returned the expected unauthenticated boundary. The guest-safe
  unread-message endpoint returned its documented 200/count contract.
Mask audit: all 188 surfaces passed runtime role validation. No protected
  role was empty or suspiciously full-canvas, no product base was nearly
  empty, and all print masks had valid non-zero coverage.
Current blocker: the local verified branch is ahead of github/main, but the
  HTTPS Git push still returns invalid username/token after the GitHub App
  connection was accepted. Do not use credentials pasted into chat.
Next action: publish the newest local commit through a working authorized
  GitHub Git/API path, then confirm the Cloudflare Pages build reflects it.
```

## Local release-audit tooling checkpoint (2026-09-17)

```text
Status: local verification complete; publication of the new audit/workflow
  changes is pending an authorized GitHub connection
Completed: Replaced the PSD audit command's unavailable Python psd_tools
  dependency with a Node/ag-psd audit that matches the API parser contract.
  The audit now parses all 188 staged PSD/PSB masters without native canvas,
  verifies one artwork Smart Object and a non-empty embedded payload per
  document, verifies the composite section, and emits the structural-audit
  shape consumed by the release gate.
  Added active runtime validation, storefront tests, and API bundle build
  steps to .github/workflows/active-app-verification.yml. Private generated
  staging remains ignored by Git and outside public/.
Verification: 188/188 PSD/PSB masters openable; 188/188 Smart Object gates
  passed; 188/188 staging matrix passed; 1,128/1,128 public runtime roles
  passed; storefront tests 19 files/69 tests passed; API tests 10 files/36
  tests passed; API bundle build passed; workspace typecheck passed;
  storefront production build passed. Desktop and mobile previews rendered
  without browser-console errors. Live trynext.shop homepage, Design Studio,
  readiness, products, and runtime PNG checks returned 200.
Current limitation: the local workflow/audit changes are not yet on
  github/main, so the public Cloudflare Pages deployment cannot reflect
  those new CI/audit-tooling changes. The GitHub App integration was accepted
  and attached, but this environment's HTTPS Git remote still rejected the
  push, the conversation API client could not resolve the attached connection,
  and the SSH fallback had no public key. The already-live accepted
  188-surface runtime remains healthy.
Next action: retry publication only when the attached GitHub integration
  exposes a working Git or API auth path, then confirm the Cloudflare Pages
  build and repeat the live checks. Do not use credentials pasted into chat.
```

### GitHub restore checkpoint (2026-09-16)

```text
Status: complete — verified functional application restore pushed
Last completed: Preserved the previous remote main in
  backup-before-local-restore-5c1b07d93, then published the verified local
  application checkpoint to the canonical GitHub main as a clean restore commit.
Stopped at: After restarting both managed workflows and confirming local API,
  storefront, Design Studio, products, and GitHub ref smoke checks.
Files/areas changed: GitHub main ref, the restore handoff, and the functional
  source/runtime tree. The local-only dist-mockups masters/archives/packages,
  attached_assets inputs, agent/tool caches, screenshots, audit evidence, and
  verification reports were intentionally excluded from the GitHub restore tree
  because they expanded the local tree to about 4.8 GB and are not runtime
  application inputs.
Remaining work: None for the functional source restore. Cloudflare provider
  verification remains a separate task because the stored provider token was
  previously rejected with HTTP 401.
Blocker: None for GitHub restore or local operation. Redis is unavailable in the
  local environment, but DB-backed API readiness is healthy and the documented
  fallback is active.
Next safe action: If the excluded editable masters or source inputs must be
  published, place them in reviewed object storage or a separately approved
  artifact release rather than force-pushing the multi-gigabyte workspace tree.
Verification: GitHub main points to db5d13e2 and the backup branch points to the
  prior remote main; local API liveness/readiness and products returned 200;
  storefront and Design Studio returned 200; both workflows are running; and
  git diff checks passed. No database, order, payment, or Cloudflare data changed.
```

### Full Trynext rename local-validation checkpoint (2026-09-08)

```text
Status: locally complete — approved rename validated without provider mutation
Last completed: Corrected the remaining gateway read-origin rename, reconciled the
  workspace lockfile/package links, rebuilt the API and storefront, restarted both
  managed workflows, and completed local API/storefront smoke verification.
Stopped at: After confirming the renamed storefront renders, the API is DB-ready,
  and all local validation gates pass. Cloudflare was intentionally not touched.
Files/areas changed: gateway-config.ts copies, approved rename documentation
  whitespace, workspace lockfile reconciliation, and this handoff.
Remaining work: Provider-side Cloudflare verification or mutation is still separate
  and should only happen after the secure Cloudflare token is corrected. Historical
  attachments/backups were intentionally not rewritten.
Blocker: The stored CLOUDFLARE_API_TOKEN previously returned HTTP 401 "Invalid API
  Token", so account/Pages verification and any Cloudflare change remain blocked.
Next safe action: Replace the Cloudflare token through secure secret management,
  verify token/account access, then perform only the approved non-destructive
  Cloudflare inspection before considering a provider rollout.
Verification: storefront typecheck/build passed; API typecheck/build passed; root
  workspace typecheck passed; storefront tests passed (19 files, 67 tests); API
  tests passed (10 files, 36 tests); Smart matrix validation passed (188 surfaces
  and 1,128 runtime roles); Smart Object release validation passed; frozen
  lockfile install passed; API liveness/readiness and products smoke checks
  returned 200; storefront root and Design Studio routes returned 200; both
  managed workflows are running; desktop preview rendered without browser-console
  errors; malformed-token scan and git diff checks passed. No Cloudflare, order,
  payment, or production data changed.
```

### Latest Cloudflare credential and configuration checkpoint (2026-09-08)

```text
Status: partially complete — repository configuration fixed; provider API blocked
Last completed: Verified the securely stored CLOUDFLARE_API_TOKEN against the
  Cloudflare token-verification and account endpoints, then corrected wrangler.toml
  from an obsolete Workers-style configuration to the active Cloudflare Pages
  configuration used by trynext-lifestyle-shop.
Stopped at: Cloudflare returned HTTP 401 "Invalid API Token" before permissions
  could be evaluated, so no direct Cloudflare account, Pages, or Workers mutation
  was attempted.
Files/areas changed: wrangler.toml and this handoff only.
Remaining work: Re-run Cloudflare API verification after the secure secret contains
  a valid account token, then inspect or repair the separate legacy Workers Build
  project if it is still required. GitHub-connected Pages remains the verified
  deployment path.
Blocker: The current stored Cloudflare token is rejected at authentication time.
Next safe action: Update the CLOUDFLARE_API_TOKEN secret through secure secret
  management, then verify `user/tokens/verify` and account access before any
  provider mutation.
Verification: storefront typecheck/build, API typecheck, 188-surface mockup
  validation, 1,128-role validation, and git diff checks passed after the
  configuration correction. No production data changed.
```

### Latest GitHub and Cloudflare rollout checkpoint (2026-09-08)

```text
Status: complete — verified source push and Cloudflare Pages rollout
Last completed: Merged GitHub main normally without force-pushing, corrected the
  Smart Object release validator to default to the active smart-v10-v3 staging tree,
  pushed the verified continuation, and waited for the connected Pages build.
Stopped at: The public Pages deployment is serving the pushed Smart v10.3 runtime
  and the lazy Design Studio chunk with the new upload/image-tools implementation.
Files/areas changed: tools/validate-smartobject-release.mjs and this handoff only
  after the reviewed merge; no order, payment, or production data changed.
Remaining work: None for the requested storefront, Design Studio, mockup matrix,
  GitHub publication, or Cloudflare Pages rollout.
Blocker: Direct Cloudflare API management remains unavailable because the configured
  provider token returns 401. A separate legacy Cloudflare Workers Builds check
  reported failure, while the requested Cloudflare Pages check completed successfully;
  investigate that separate workflow before relying on it for future releases.
Next safe action: If provider automation is needed, replace the Cloudflare API secret
  with an Account → Cloudflare Pages → Edit token and separately inspect the failed
  Workers check. Do not reuse the exposed historical R2 credentials.
Verification: `node tools/validate-smartobject-release.mjs` passed structurally
  verified 188/188; active matrix and runtime-role validation passed 188/188 and
  1,128/1,128; storefront typecheck, 19 test files/67 tests, production build, and
  API typecheck passed; the real Playwright flow passed product/cart/checkout/Studio
  checks plus upload → visible artwork → image tools → crop/extend on desktop and
  mobile; the mobile sticky purchase dock remained visible. Live `/api/mockups`
  returned 188 Smart v10.3 rows, all 188 API-derived runtime PNG URLs returned
  200, representative retired paths returned 410, the deployed Studio chunk
  contained `smart-v10.3`, `Crop image`, `Extend canvas`, and `Quick image tools`,
  `/api/sitemap.xml` contained 118 URLs, and robots exposed the sitemap directive.
  GitHub build/typecheck and security checks passed; the separate Workers check did
  not. The browser flow saw one external certificate warning from a remote resource,
  but no application exception.
```

### Current Design Studio correction pass (2026-09-07)

```text
Status: complete — approved customer-facing correction pass implemented
Last completed: Established a single visible photoreal preview path, made uploads
  paint before auto-fix, aligned image controls to artwork bounds, tightened
  touch targets and pointer capture, compacted mobile guidance, added the
  safe-area sticky purchase dock, and shortened server background-removal waits.
Files/areas changed: customer Design Studio preview, upload/processing flow,
  CanvasArea interaction controls, mobile guidance/layout, sticky purchase bar,
  regression coverage, and approved design spec under docs/superpowers/specs.
Remaining work: None within the approved customer-facing scope.
Blocker: None. Redis is unavailable in development, but the documented in-process
  cache fallback is active and API/database health is still serving normally.
Next safe action: If desired, publish this verified storefront build; admin
  mockup screens and the separate mobile app remain outside this pass.
Verification: storefront typecheck passed; storefront production build passed;
  all 19 storefront test files and 67 tests passed; API typecheck/build passed;
  API health/products/settings smoke checks passed; desktop and 402px mobile
  preview captures show the canonical photoreal surface; runtime asset audit
  found 188 complete surfaces across all six mockup families.
```

The approved Design Studio V2 reliability pass is complete and has been pushed
through the GitHub-connected external rollout. The public `/design-studio` route is
the active V2 implementation; `/design-studio-v1` and `/design-studio-v2`
are compatibility aliases to that route. The source-kit/runtime mockup audit
now validates the editable manifest as well as public assets.

The genuine six-family PSD/PSB Smart Mockup workstream has passed its quarantine
structural and visual gates. The complete Smart v10.3 runtime package is active
in the local customer runtime and is published to GitHub; Smart v9 remains a
separate protected migration contract. The public hosting rollout remains a
separate provider step; do not describe local promotion as a production deploy.

### Current live audit checkpoint (2026-09-06, latest)

```text
Status: complete — provider rollout independently verified
Last completed: Rechecked the connected Cloudflare Pages deployment at
  `https://trynext.pages.dev` after the Smart v10.3 release. The
  deployed gateway returns the current primary Render origin and exposes the
  reviewed canonical runtime package.
Stopped at: Non-mutating live API, asset, retired-path, bundle, sitemap, and
  robots checks all passed. The public rollout is certified for the requested
  Smart v10.3 serving contract; Smart v9 remains a separate fail-closed contract.
Files/areas changed: this handoff only. No application, mockup, order, payment,
  or production data was changed.
Remaining work: Keep the live smoke checks repeatable after future provider
  deployments; no blocker remains for this rollout verification.
Blocker: None for the verified Cloudflare Pages + Render serving contract.
Next safe action: Add a scheduled or deployment-triggered equivalent of the
  non-mutating live mockup smoke check so edge regressions are caught promptly.
Verification: The deployed `/api/mockups` response contains exactly 188 rows,
  all canonical and all `smart-v10.3`; all 188 unique API-derived canonical
  runtime-role PNG URLs returned 200 `image/png`; representative retired
  `/mockups/*` namespaces returned 410; the deployed JavaScript bundle loaded
  by the HTML contains `smart-v10.3` and `runtime-roles`; `/sitemap.xml`
  redirects to the healthy 200 `/api/sitemap.xml` (118 URLs); and
  `/robots.txt` returned 200 with a sitemap directive. No order, payment, or
  production data changed.
```

## PSD/PSB server ingestion and Design Studio diagnostics checkpoint (2026-09-07)

```text
Status: complete — local server-side ingestion and studio UX verified
Last completed: Added a real ag-psd-backed PSD/PSB parser that reads private
  object-storage bytes, verifies Photoshop magic/version, extension/MIME,
  dimensions, exactly one named Smart Object layer, placement metadata, and
  SHA-256. Admin mockup creation/update now fails closed on parser or source-kit
  contract errors and persists the server-derived file metadata and normalized
  manifest. Editable masters remain private /objects paths; previews remain
  public image URLs.
Stopped at: After rebuilding/restarting the API and confirming the public API,
  readiness, workflows, Design Studio preview, focused parser/contract tests,
  full API tests, storefront typecheck/build, and git diff validation.
Files/areas changed: artifacts/api-server/src/lib/psdMasterParser.ts and its
  tests, mockupContract.ts, routes/mockups.ts, api-server package/lock metadata,
  AdminMockups.tsx, the active Smart v10-v3 manifest test path, and the
  DesignStudioV2 Smart Object status card.
Remaining work: Authenticated admin visual review of real upload success/failure
  states and owner-controlled hosting/GitHub publication remain separate release
  gates. The browser continues to render approved PNG runtime roles; private
  editable masters are diagnostics/provenance only.
Blocker: None for the local implementation. The running API reports the existing
  optional Redis degradation while DB-backed readiness remains healthy.
Next safe action: Exercise one authenticated canonical PSD override and one PSB
  override in Admin Mockups, then repeat the non-mutating public Smart v10.3
  runtime smoke checks before any provider rollout.
Verification: Real PSD and PSB parser fixtures passed; invalid bytes and
  signature/extension/MIME mismatch tests passed; API typecheck/build passed;
  full API suite passed (10 files, 36 tests); storefront typecheck/build passed;
  focused storefront manifest/product/composer tests passed; both managed
  workflows restarted cleanly; /api/mockups and /api/health/readiness returned
  200; Design Studio screenshot rendered without browser-console errors; and
  git diff --check passed. No order, payment, or production data changed.
```

## Latest Smart v10.3 API ingestion boundary checkpoint (2026-09-07)

```text
Status: complete — local Option A ingestion and server-render contract implemented
Last completed: Added fail-closed Smart v10.3 manifest validation for admin PSD/PSB
  records, including source-kit identity, PSD/PSB metadata, SHA-256 binding,
  Smart Object provenance, print geometry, and all six runtime role paths,
  provenance labels, and checksums. Invalid or incomplete master records are
  persisted as failed with actionable ingestion errors instead of being marked
  ready from a preview alone. The admin upload flow now derives the reviewed
  runtime manifest for canonical overrides and displays the server result/error.
  `/api/mockup/render` now accepts only the validated surface contract and six
  checksum-matching role images; the previous arbitrary base/mask/texture shape
  is rejected.
Stopped at: After rebuilding/restarting the API, passing route-level render
  tests, confirming `/api/healthz` and `/api/mockups` through the running service,
  confirming the renderer rejects the legacy payload at `/api/mockup/render`, and
  capturing a clean storefront preview.
Files/areas changed: `artifacts/api-server/src/lib/mockupContract.ts`,
  `artifacts/api-server/src/lib/mockupContract.test.ts`,
  `artifacts/api-server/src/routes/mockups.ts`,
  `artifacts/api-server/src/routes/mockupRender.ts`,
  `artifacts/api-server/src/routes/mockupRender.test.ts`, and
  `artifacts/trynex-storefront/src/pages/admin/AdminMockups.tsx`.
Remaining work: Owner-controlled GitHub/hosting promotion remains separate from
  this local implementation. Authenticated admin visual review of the upload
  error/ready states and visual approval of all 188 surfaces are still release
  gates; this checkpoint does not claim either one.
Blocker: None for local implementation. Health reports the existing optional
  Upstash Redis degradation while DB-backed readiness remains healthy.
Next safe action: Review the authenticated admin mockup upload state, then
  publish the verified local source through the owner-controlled rollout if
  desired. Do not bypass the manifest gate for arbitrary PSD/PSB uploads.
Verification: API typecheck passed; API build passed; API tests passed (9 files,
  33 tests); focused Smart v10.3 contract/render tests passed (3 files, 7
  tests); storefront typecheck passed; storefront tests passed (19 files,
  64 tests); storefront production build passed before the final manifest-form
  wiring and focused typecheck passed after it; active runtime matrix passed
  (188 surfaces, 1,128 roles); correct v10-v3 release gate passed
  structurally-verified 188/188; both managed workflows restarted cleanly;
  health/mockups/root routes returned 200; legacy renderer payload returned
  400; storefront screenshot had no browser-console errors; `git diff --check`
  passed. No order, payment, or production data was changed.
```

## Latest studio correction checkpoint (2026-09-06)

```text
Status: locally verified; GitHub publication of this continuation is still pending
Last completed: Added deterministic selection-aware undo/redo coverage, grouped
  drag/resize/rotate history transactions, the shared red 44px delete control,
  grouped product and mug-view switching, and removed the redundant post-switch
  transform loop. Fixed the compositor canvas-reset regression so artwork no
  longer erases the already-drawn studio background/base. Runtime shadow and
  highlight roles now use the reviewed grayscale print mask, and 3D artwork
  textures receive the same protected/detail role pass as the 2D compositor.
  Updated the asset audit script to inspect the active v10.3 runtime tree.
Stopped at: Local storefront/API workflows are running cleanly. Storefront
  typecheck, 18 test files/59 tests, production build, API typecheck, 188-surface
  matrix validation, 1,128-role validation, route/API smoke checks, and desktop
  plus mobile Design Studio previews passed. The water-bottle preview visibly
  retains the cap key-ring loop from the reviewed base asset.
Files/areas changed: Design Studio history/store, CanvasArea/DesignLayer controls,
  product and mug routing, shared 2D/3D compositor role handling, focused store
  tests, and the active mockup audit script.
Remaining work: Commit and push only these verified source changes, then recheck
  the GitHub-connected Cloudflare Pages rollout independently. The current public
  Pages host returns healthy 200 responses, but its current HTML bundle has not
  exposed a new Smart v10.3 marker and the edge rollout must not be called
  complete without checking canonical and retired mockup URLs.
Blocker: Replit publishing is not configured for this workspace. Cloudflare
  management API access is provider-managed; public Pages health is available,
  but rollout freshness is separate from the local/GitHub result.
Next safe action: Commit/push the verified continuation, re-run the public
  Pages API/asset/sitemap/robots and retired-path checks, then record the result
  without changing the Smart v9 fail-closed contract.
Verification: storefront typecheck/build/tests passed; API typecheck passed;
  both managed workflows restarted cleanly; local route/API checks returned 200;
  protected admin probes returned 401; active matrix validators passed 188/188
  and 1,128/1,128; desktop and mobile previews showed no browser console errors;
  Cloudflare Pages root, Design Studio, liveness, sitemap, and robots returned
  200; no order, payment, or production data was mutated.
```

### Current image-tools continuation checkpoint (2026-09-07)

```text
Status: GitHub feature commit published; Cloudflare edge propagation pending
Last completed: Implemented the selected Tools-first image interaction. A successful
  upload selects the image and opens the Upload image-tools panel immediately;
  one click on an image only selects it; double-click/double-tap opens the same
  full tools surface; and the panel now provides functional crop-frame handles
  plus transparent canvas extension controls for desktop and mobile.
Stopped at: The storefront and API workflows are running cleanly after the final
  build and proxied smoke checks.
Files/areas changed: DesignStudioV2 upload/tool routing, ImagePanel controls, and
  the new ImageCropExtendDialog editor.
Remaining work: Let the connected Cloudflare Pages rollout finish, then verify
  the live bundle and exercise upload → tools → crop/extend in a browser.
Blocker: The browser-use helper is not installed in this checkout, so direct
  file-chooser automation was unavailable; static preview, build, tests, and
  route/API checks all passed.
Next safe action: Check the GitHub CI/active-app runs and the public Pages bundle;
  do not call live rollout complete until the new tools strings are present.
Verification: Storefront typecheck passed; storefront tests passed (19 files/64
  tests); storefront production build passed; both managed workflows are running;
  `/design-studio`, `/api/healthz`, and `/api/products` returned 200; and
  `git diff --check` passed; GitHub main now points to commit
  7874b96caa1219117234e951ef19b55f92fc7b46; the public Pages root, Design Studio,
  and API health endpoints returned 200 but still served the previous bundle at
  the last check; Replit deployment metadata reports no published Replit app.
  No order, payment, or production data changed.
```

## Current studio correction plan (2026-09-06)

```text
Goal: make the Design Studio trustworthy for real customer editing and photoreal
  product previews, using the reviewed Smart v10.3 runtime without overlapping
  controls, duplicate garment passes, or silent fallback assets.

Stage 1 — Selection and editing controls
  - Add a clearly visible red circular remove button at the selected artwork
    bounds, positioned outside the top-right edge and kept above the artwork.
  - Make the remove control a 44px minimum touch target with an accessible label,
    keyboard activation, pointer capture isolation, and a delete action that
    records exactly one undo frame.
  - Make selection hit areas transparent and reliable for mouse, touch, and
    stylus; prevent the rotate/resize/delete controls from starting a drag.
  - Verify the control on desktop and mobile, including rotated artwork and
    artwork near the canvas edge.

Stage 2 — History correctness
  - Audit every meaningful mutation path: add, delete, drag, resize, rotate,
    text edits, visibility/lock changes, reorder, product/color/face changes.
  - Group pointer gestures into one history entry on pointer-up rather than one
    entry per movement; preserve redo only until a new edit occurs.
  - Preserve selection state and product/face context across undo/redo without
    restoring stale runtime asset URLs.
  - Add focused store tests for one-step delete undo/redo, grouped transforms,
    redo invalidation, product/face restoration, and empty-stack no-ops.

Stage 3 — Photoreal composition and protected details
  - Trace the v10.3 print mask/role order so artwork is clipped to the real print
    area and garment details remain above it.
  - Ensure hoodie drawstrings, collar, pocket seam, sleeve seams, mug handles,
    cap brim/panel seams, and bottle cap/key-ring hardware are protected details,
    never painted over by artwork.
  - Remove any remaining full-frame duplicate base/shadow pass; keep one base
    silhouette plus intentional role layers only.
  - Compare browser SVG, canvas export, cart preview, and 3D preview for the
    same surface and artwork placement.

Stage 4 — Product-specific surface routing
  - Fix mug side1/side2/front/back mapping so the visible handle orientation,
    print zone, and runtime surface agree; keep Wrap explicit and wider.
  - Verify long sleeve/hoodie sleeve faces route to the corresponding canonical
    v10.3 role files rather than reusing the front.
  - Repair the water-bottle front/back source/role composition and restore the
    cap key-ring detail from reviewed source assets or a reviewed runtime role;
    fail closed if the required detail source is absent rather than inventing it.
  - Add route/asset contract tests for all curved-product faces and representative
    apparel protected details.

Stage 5 — Runtime/source audit and rollout
  - Audit the source manifests, role PNG alpha bounds, protected/detail layers,
    and representative photoreal composites for all six product families.
  - Keep editable PSD/PSB masters outside public/ and expose only reviewed v10.3
    runtime derivatives.
  - Run storefront/API typechecks, focused/full tests, production build, local
    proxy checks, desktop/mobile browser previews, and no-legacy-path checks.
  - Commit/push the verified source, wait for Cloudflare Pages deployment, then
    verify public API=188 canonical rows, canonical assets=200, retired paths=410,
    sitemap/robots, and deployed bundle markers.

Acceptance gates:
  - No selection control overlaps artwork or is swallowed by the canvas edge.
  - Delete/undo/redo works deterministically for mouse and touch gestures.
  - No hoodie strings, collars, seams, handles, or bottle hardware are painted
    over by artwork in browser, cart, export, or 3D previews.
  - Mug side routing and water-bottle detail are visually and structurally
    verified; missing source data fails loudly.
  - Public rollout is not called complete until the Pages checks pass.
```

## Latest studio correction checkpoint (2026-09-06)

```text
Status: locally verified; GitHub publication of this continuation is still pending
Last completed: Added deterministic selection-aware undo/redo coverage, grouped
  drag/resize/rotate history transactions, the shared red 44px delete control,
  grouped product and mug-view switching, and removed the redundant post-switch
  transform loop. Fixed the compositor canvas-reset regression so artwork no
  longer erases the already-drawn studio background/base. Runtime shadow and
  highlight roles now use the reviewed grayscale print mask, and 3D artwork
  textures receive the same protected/detail role pass as the 2D compositor.
  Updated the asset audit script to inspect the active v10.3 runtime tree.
Stopped at: Local storefront/API workflows are running cleanly. Storefront
  typecheck, 18 test files/59 tests, production build, API typecheck, 188-surface
  matrix validation, 1,128-role validation, route/API smoke checks, and desktop
  plus mobile Design Studio previews passed. The water-bottle preview visibly
  retains the cap key-ring loop from the reviewed base asset.
Files/areas changed: Design Studio history/store, CanvasArea/DesignLayer controls,
  product and mug routing, shared 2D/3D compositor role handling, focused store
  tests, and the active mockup audit script.
Remaining work: Commit and push only these verified source changes, then recheck
  the GitHub-connected Cloudflare Pages rollout independently. The current public
  Pages host returns healthy 200 responses, but its current HTML bundle has not
  exposed a new Smart v10.3 marker and the edge rollout must not be called
  complete without checking canonical and retired mockup URLs.
Blocker: Replit publishing is not configured for this workspace. Cloudflare
  management API access is provider-managed; public Pages health is available,
  but rollout freshness is separate from the local/GitHub result.
Next safe action: Commit/push the verified continuation, re-run the public
  Pages API/asset/sitemap/robots and retired-path checks, then record the result
  without changing the Smart v9 fail-closed contract.
Verification: storefront typecheck/build/tests passed; API typecheck passed;
  both managed workflows restarted cleanly; local route/API checks returned 200;
  protected admin probes returned 401; active matrix validators passed 188/188
  and 1,128/1,128; desktop and mobile previews showed no browser console errors;
  Cloudflare Pages root, Design Studio, liveness, sitemap, and robots returned
  200; no order, payment, or production data was mutated.
```

## Current studio correction plan (2026-09-06)

```text
Goal: make the Design Studio trustworthy for real customer editing and photoreal
  product previews, using the reviewed Smart v10.3 runtime without overlapping
  controls, duplicate garment passes, or silent fallback assets.

Stage 1 — Selection and editing controls
  - Add a clearly visible red circular remove button at the selected artwork
    bounds, positioned outside the top-right edge and kept above the artwork.
  - Make the remove control a 44px minimum touch target with an accessible label,
    keyboard activation, pointer capture isolation, and a delete action that
    records exactly one undo frame.
  - Make selection hit areas transparent and reliable for mouse, touch, and
    stylus; prevent the rotate/resize/delete controls from starting a drag.
  - Verify the control on desktop and mobile, including rotated artwork and
    artwork near the canvas edge.

Stage 2 — History correctness
  - Audit every meaningful mutation path: add, delete, drag, resize, rotate,
    text edits, visibility/lock changes, reorder, product/color/face changes.
  - Group pointer gestures into one history entry on pointer-up rather than one
    entry per movement; preserve redo only until a new edit occurs.
  - Preserve selection state and product/face context across undo/redo without
    restoring stale runtime asset URLs.
  - Add focused store tests for one-step delete undo/redo, grouped transforms,
    redo invalidation, product/face restoration, and empty-stack no-ops.

Stage 3 — Photoreal composition and protected details
  - Trace the v10.3 print mask/role order so artwork is clipped to the real print
    area and garment details remain above it.
  - Ensure hoodie drawstrings, collar, pocket seam, sleeve seams, mug handles,
    cap brim/panel seams, and bottle cap/key-ring hardware are protected details,
    never painted over by artwork.
  - Remove any remaining full-frame duplicate base/shadow pass; keep one base
    silhouette plus intentional role layers only.
  - Compare browser SVG, canvas export, cart preview, and 3D preview for the
    same surface and artwork placement.

Stage 4 — Product-specific surface routing
  - Fix mug side1/side2/front/back mapping so the visible handle orientation,
    print zone, and runtime surface agree; keep Wrap explicit and wider.
  - Verify long sleeve/hoodie sleeve faces route to the corresponding canonical
    v10.3 role files rather than reusing the front.
  - Repair the water-bottle front/back source/role composition and restore the
    cap key-ring detail from reviewed source assets or a reviewed runtime role;
    fail closed if the required detail source is absent rather than inventing it.
  - Add route/asset contract tests for all curved-product faces and representative
    apparel protected details.

Stage 5 — Runtime/source audit and rollout
  - Audit the source manifests, role PNG alpha bounds, protected/detail layers,
    and representative photoreal composites for all six product families.
  - Keep editable PSD/PSB masters outside public/ and expose only reviewed v10.3
    runtime derivatives.
  - Run storefront/API typechecks, focused/full tests, production build, local
    proxy checks, desktop/mobile browser previews, and no-legacy-path checks.
  - Commit/push the verified source, wait for Cloudflare Pages deployment, then
    verify public API=188 canonical rows, canonical assets=200, retired paths=410,
    sitemap/robots, and deployed bundle markers.

Acceptance gates:
  - No selection control overlaps artwork or is swallowed by the canvas edge.
  - Delete/undo/redo works deterministically for mouse and touch gestures.
  - No hoodie strings, collars, seams, handles, or bottle hardware are painted
    over by artwork in browser, cart, export, or 3D previews.
  - Mug side routing and water-bottle detail are visually and structurally
    verified; missing source data fails loudly.
  - Public rollout is not called complete until the Pages checks pass.
```

### Current Smart v9 acceptance checkpoint (2026-09-06)

```text
Status: in progress — Smart v9 remains fail-closed while visual acceptance is
  incomplete.
Last completed: Fixed curved-product 3D billboard framing for mug, cap, and
  water bottle; restarted the storefront; captured fresh real uploaded-artwork
  Studio/3D evidence for all six product families; and confirmed the bottle
  now fits from cap to base while the cap visor no longer clips.
Compatibility rule: exact catalog-color matches may use Smart v9 only after the
  full evidence gate is accepted. Ambiguous shades such as Charcoal, Royal
  Blue, and Sand remain on reviewed color-specific assets.
Verification: canonical matrix and Smart Object structural gates remain
  188/188; storefront typecheck passed; storefront workflow is running; fresh
  uploaded-artwork evidence has no browser console errors; API healthz and
  mockups/settings/products/readiness routes returned 200; storefront tests
  passed (25 files/85 tests); storefront production build passed; root
  workspace typecheck passed; git diff --check passed. No orders, payments, or
  production data were created or changed.
Remaining work: Run the full storefront test/build/validator pass; capture and
  review all required color/face evidence plus transparent-upload, cart, and
  export outputs; only then consider Smart v9 activation and production
  promotion.
Next safe action: complete the non-mutating release verification and keep
  SMART_V9_PROMOTION_ALLOWED=false until every required evidence category is
  recorded and accepted.
```

### Current v10 implementation checkpoint (2026-09-06)

```text
Status: verified and pushed v10.3 release — hosting rollout remains separate
Last completed: Replaced the weak/inconsistent v10 source inputs with a reviewed,
  consistent photoreal six-family source set; rebuilt the complete 188-surface
  matrix with genuine embedded Smart Objects and 1,128 browser-safe role PNGs;
  archived the superseded runtime; promoted the verified replacement into the
  active v10 path; and confirmed the customer Design Studio renders it.
Stopped at: GitHub `main` update after final local verification; the connected
  hosting rollout can now proceed independently.
Files/areas changed: `attached_assets/generated_images/v10-sources-v3`,
  `tools/build-smartobject-mockups.mjs`, `tools/validate-smartobject-release.mjs`,
  `dist-mockups/staging/smart-v10`, archived prior v10 staging assets,
  `artifacts/trynex-storefront/public/mockups/psd-master-v10/runtime-roles`,
  visual evidence, and this handoff.
Remaining work: Confirm the connected hosting deployment serves the new runtime
  when its normal GitHub rollout completes. Keep the separate Smart v9
  production contract fail-closed.
Blocker: No local or GitHub implementation blocker. Live rollout depends on the
  connected hosting deployment completing normally.
Next safe action: Run non-mutating live asset/health checks after the hosting
  provider reports the pushed `main` revision is deployed.
Verification: v10.3 structural gate passed 188/188; every master reopened at
  1024×1024, 8-bit RGB with one non-empty embedded Smart Object; 1,128 runtime
  roles were exported; representative runtime assets returned HTTP 200;
  storefront tests passed (25 files/85 tests); storefront and root typechecks
  passed; storefront production build passed; managed workflows restarted
  cleanly; and the Design Studio preview showed the photoreal T-shirt runtime
  without browser console errors. Redis remains an optional degraded fallback.
```

### Current session checkpoint (2026-09-05)

```text
Status: implementation complete locally — production promotion remains blocked on visual acceptance
Last completed: Repaired the typed fail-closed source-kit contract, routed Studio,
  3D, cart, export, and order metadata through the shared surface compositor,
  preserved reviewed PSD/source-matrix/Water Bottle releases, and added explicit
  disabled-surface UI blocking plus focused manifest/compositor failure tests.
Stopped at: Final local verification after restarting the managed application.
Files/areas changed: design-studio manifest/resolver/compositor integration,
  DesignStudioV2 surface blocking, MainToolbar export guard, focused contract tests,
  and this handoff.
Remaining work: Generate and review real uploaded-artwork diagnostic-grid and
  transparent-upload evidence across the six product families and required faces,
  then compare Studio, 3D, cart, and export output before any Smart v9 promotion.
Blocker: Production promotion remains blocked until real visual evidence is
  reviewed. This checkout is not registered in the artifact preview registry,
  and its external development proxy is unavailable, so screenshot/browser
  verification could not be completed here.
Next safe action: Obtain an authenticated browser/runtime review or equivalent
  visual evidence without creating test orders, and record per-surface approval
  or rejection before promoting Smart v9.
Verification: Storefront typecheck passed; storefront Vitest passed with 24 files
  and 82 tests; storefront production build passed; managed workflow restarted
  cleanly; local Design Studio route returned 200; local API liveness returned
  200; representative source-matrix asset returned successfully; git diff check
  passed. Artifact screenshot failed because `trynext-storefront` is absent from
  the artifact registry.
```

### Current session checkpoint (2026-09-06)

```text
Status: verified local release merged with GitHub main; Smart v9 production promotion remains blocked
Last completed: Reconnected GitHub, confirmed the remote main ancestry, merged the five
  remote-only commits without force-pushing, and retained the newer local Design Studio
  surface guards, compositor path, mug-aware product switching, and export state.
  Completed full workspace typecheck, API/storefront tests, storefront build, design-system
  typecheck/build, and both 188-surface mockup validators.
Stopped at: Post-merge verification and normal push of the merge result.
Files/areas changed: merge reconciliation, design-system native theme support, and
  release cleanup removing the attached transcript and local node_modules symlink from git.
Remaining work: Run post-merge tests and non-mutating route/API checks, push the merge
  result to GitHub, then confirm GitHub Actions and the live Cloudflare Pages/Render
  surfaces. Do not promote Smart v9 without real visual acceptance.
Blocker: The design-system artifact files are complete and buildable, but the platform
  artifact registry still returns ARTIFACT_NOT_FOUND, so it cannot be presented through
  the artifact preview or screenshot path. Redis remains optional and is using fallback.
Next safe action: Finish post-merge non-mutating verification and publish the verified
  application history through the connected GitHub integration.
Verification: API tests passed (6 files/26 tests); storefront tests passed (24 files/82
  tests); full workspace typecheck passed; storefront production build passed; design-system
  build passed with its required PORT and BASE_PATH; mockup validators passed 188/188 and
  checksum validation; managed application workflow is running cleanly.
```

### Current visual review checkpoint (2026-09-06)

```text
Status: local storefront/API visual review complete; Smart v9 production promotion remains blocked
Last completed: Reviewed the public storefront across desktop and mobile, including
  homepage, shop, product detail, Design Studio, cart, empty checkout, FAQ, size guide,
  tracking, contact, about, blog, terms, and privacy. Fixed the product viewer heartbeat
  browser error by preserving the CSRF marker in the client and allowing known local
  preview origins in development even when ALLOWED_ORIGINS is set. The public viewer
  endpoint remains explicitly non-sensitive and works for cached clients with customer
  cookies.
Stopped at: Final product/mobile screenshot and non-mutating API/browser verification.
Files/areas changed: API CORS development-origin handling, public viewer-heartbeat
  handling, and the current visual-review evidence.
Remaining work: Review authenticated customer/admin surfaces with a real browser if
  required, and complete visual/runtime acceptance of all 188 Smart v9 surfaces before
  any production mockup promotion.
Blocker: Smart v9 visual approval is still intentionally unavailable; Redis credentials
  remain rejected locally while the documented fallback is healthy. The legacy
  Start application workflow was removed because it conflicted with the artifact-owned
  storefront/API workflows; both managed artifact workflows are running.
Next safe action: Use the artifact-owned storefront and API workflows for future local
  verification, then publish only after the owner reviews the remaining gated surfaces.
Verification: Product viewer PUT returned 200 with and without the client CSRF header
  when a customer cookie and local preview Origin were present; CORS preflight returned
  204; protected admin mutation returned 401; all sampled public SPA routes returned
  200; shop cards loaded real product images; storefront typecheck and API build passed;
  git diff --check passed; no order, payment, or production data was mutated.
```


## Controlled review checkpoint (2026-09-03)

```text
Status: blocked — controlled review completed without authenticated browser evidence
Last completed: Restarted the managed application, checked non-mutating customer/admin
  route and API behavior, validated the complete 188-surface candidate, and compared
  staged previews with the public Smart v9 tree.
Stopped at: Owner visual approval could not be recorded because browser-use is not
  installed and the artifact preview registry cannot resolve this checkout.
Files/areas changed: verification/task-1-controlled-review-2026-09-03.md and this
  handoff only; no runtime or release manifest approval flag changed.
Remaining work: Review authenticated Checkout, Account/messages, admin Orders/Settings/
  messages, and representative Design Studio views in a real browser; then record
  per-surface approval or rejection for all 188 surfaces.
Blocker: No authenticated customer/admin browser session, no browser-use CLI, and no
  artifact screenshot target. Smart v9 remains staged and visualApproval=false.
Next safe action: Obtain a real authenticated browser review without creating an order
  or payment record. Resolve the two water-bottle staged/public hash discrepancies
  during that review before any promotion decision.
Verification: Workflow restarted cleanly; SPA route GETs returned 200; invalid order
  and message probes were rejected without mutation; admin session returned 401;
  canonical validator reported 188/188; staged previews matched their manifest
  checksums 188/188; public Smart v9 matched staged previews 186/188; git diff
  remains limited to the review record and handoff.
```

## Latest local commerce and mockup reliability checkpoint (2026-09-03)

```text
Status: complete for the verified local commerce/dependency scope; Smart v9 production promotion remains fail-closed
Last completed: Aligned web/mobile/API payment contracts, made payment evidence contact-authorized and retry-safe, added server-side bank evidence validation, normalized payment methods and direct tracking responses, normalized persisted legacy site-name values at the public settings boundary, upgraded the vulnerable Orval/Tiptap dependency chains, and reconciled the obsolete 202-surface validator to the active 188-surface Smart v9 gate.
Stopped at: After rebuilding and restarting the API workflow, running the full test/typecheck/build suite, completing non-mutating proxied smoke checks, rendering and visually inspecting all 12 audit-PDF pages, and verifying the compatibility validator.
Files/areas changed: API order/payment/settings/message routes, API email and seeded copy, mobile checkout/API wrapper/app branding, storefront checkout/settings/studio copy, generated API clients, dependency manifests/lockfile, mockup validator/docs, audit PDF tooling, and this handoff.
Remaining work: None for the verified local commerce/dependency scope. Authenticated browser review and controlled visual/runtime acceptance of all 188 Smart v9 surfaces are still required before any production mockup promotion.
Blocker: The artifact preview registry cannot resolve this checkout for screenshot capture; the previous handoff also records that browser-use is unavailable. Local Redis credentials remain rejected, while the documented fallback is operating.
Next safe action: Review the authenticated Checkout, Account messages, and Design Studio routes in a real browser. Keep Smart v9 staged until visual/runtime evidence is accepted; do not create test orders during review.
Verification: `pnpm audit --audit-level=moderate` reports 0 advisories; API tests 6 files/26 tests and storefront tests 22 files/76 tests passed; API/storefront/mobile/full-workspace typechecks passed; storefront production build and mobile Expo web export passed; 188/188 active Smart v9 validation passed; the legacy validator delegates successfully; API rebuilt and the managed workflow restarted cleanly; proxied liveness/readiness/products/categories/settings/blog/sitemap/robots returned expected 200 responses; `/api/settings` now returns `Trynext Lifestyle` despite the legacy persisted value; invalid order/payment-info/message probes rejected without creating records; all 12 audit-PDF pages rendered and were visually inspected; no order or payment data was mutated; `git diff --check` passed. Screenshot attempt failed with "Artifact not found: trynext-storefront".
```

### Redis and readiness note

Redis is an optional, disposable cache. PostgreSQL remains the source of truth for
products, orders, settings, and other persistent data. The configured Upstash Redis
provider currently rejects its credentials, so the API uses its documented
process-local in-memory cache fallback with TTLs; a process restart clears that
cache but does not remove database data. `/api/healthz` may therefore report
`degraded` with `redis: "error"`, while `/api/health/readiness` can still report
`status: "ok"` because readiness checks the database required to serve requests.

## Current continuation checkpoint (2026-09-01)

```text
Status: in progress — local runtime resolver repaired and ready for visual review
Last completed: Activated the tracked 188-surface smart-v9 candidate for exact
  runtime matches, preserved the reviewed PSD-derived T-shirt front/back bases,
  and kept ambiguous Hoodie/Long Sleeve catalog shades on their reviewed
  color-specific source-matrix assets instead of mapping them to the wrong hue.
Stopped at: After a clean workflow restart and direct proxied asset checks.
Files/areas changed: Design Studio mockup resolver and the two related source
  matrix test files.
Remaining work: Perform a real browser visual review of the Customize/Design
  Studio flow and, if required, regenerate a product-color-aligned v9 candidate
  for the currently unmatched Hoodie/Long Sleeve shades before production
  promotion.
Blocker: The artifact preview registry cannot resolve this checkout for a
  screenshot; direct proxy checks are available and passing.
Next safe action: Review the Customize route with the 188 staged assets, then
  approve or regenerate only the unmatched product-color surfaces.
Verification: Storefront tests 22 files/76 tests passed; storefront typecheck,
  full workspace typecheck, production build, workflow restart, git diff check,
  and representative v9/source-matrix/PSD asset requests passed. Screenshot
  capture was unavailable because the artifact was not found in the registry.
```

## Current handoff (2026-09-02)

Status: ready for review — the shared admin shell, Products workspace, and
Settings workspace have been redesigned in place; Smart Object production
promotion remains fail-closed.
Last completed: Applied the approved operator-console redesign while preserving
the existing admin shell routes and settings/product fields. Added responsive
navigation and accessibility affordances, catalogue KPIs and filters, clearer
product create/edit/delete feedback, gallery and cloud-image handling,
structured variants, color availability, CSV import, AI descriptions, duplicate
slug protection, grouped settings navigation, dirty/saving/saved states, and a
sticky settings save action. Reconciled the product API so color availability
round-trips, sale prices can be cleared, and duplicate slugs return a useful
conflict response.
Stopped at: After a clean API/storefront typecheck and production build,
focused API tests, managed workflow restart, public proxied smoke checks, and
preservation checks confirming no existing admin route or registered form field
was removed. A fresh browser screenshot could not be captured because this
checkout is absent from the artifact registry and the browser-use CLI is
unavailable.
Files/areas changed: `artifacts/trynex-storefront/src/components/layout/AdminLayout.tsx`,
`artifacts/trynex-storefront/src/pages/admin/AdminProducts.tsx`,
`artifacts/trynex-storefront/src/pages/admin/AdminSettings.tsx`,
`artifacts/trynex-storefront/src/index.css`, and
`artifacts/api-server/src/routes/products.ts`.
Remaining work: Extend the same approved interaction language to the remaining
admin screens if the owner wants the full panel rewritten; perform controlled
browser/runtime visual comparison and explicit visual acceptance for all 188
Smart Object surfaces before promoting any runtime derivatives or manifest
data. Authenticated admin-health success is not claimed without a safe existing
session or in-process credential path.
Blocker: Artifact screenshot registry and browser-use are unavailable in this
checkout. Upstash Redis is degraded because the environment rejects its
credentials, while the documented fallback is healthy. Replit's dependency
scanner fails with `OSV_SCAN_FAILED` because its `osv` executable is absent;
the local `pnpm audit` is clean and the lockfile contains no upstream
`image-size` package.
Next safe action: Review the redesigned Products and Settings screens with a
real authenticated browser session, then continue the remaining admin-screen
redesign only as an explicitly approved follow-up. Keep
`masterStatus: manifest-only` / `structurally-verified` until Smart Object
visual/runtime evidence is complete.
Verification: Smart Object release gate 188/188 passed; PSD reopen audit
188/188 passed at 1024x1024 8-bit with one non-empty embedded Smart Object and
composite per file; canonical matrix 188/188 passed; contact sheets reviewed;
focused API tests 6 files/26 tests passed; storefront and API typechecks passed;
storefront production build passed; workflow restart, healthz, products,
categories, settings, and unauthenticated admin 401 checks passed; git diff
check passed. The redesigned admin screens retain all previously registered
product/settings fields and all current admin menu routes. The artifact
registry could not capture a fresh screenshot.

## Latest admin continuation checkpoint (2026-09-02)

```text
Status: ready for review — focused admin operations hardening is complete
Last completed: Extended the existing admin interaction language to Categories,
  Reviews, Promo Codes, and Newsletter without changing their API contracts.
  Added searchable category filtering and catalogue KPIs, review queue KPIs and
  rating summary, promo-code validation/error recovery and operational KPIs, and
  newsletter refresh/error states plus formula-injection-safe CSV export.
Stopped at: After a clean full typecheck, storefront production build, API test
  run, Smart Object matrix validation, managed workflow restart, and proxied
  public/protected smoke checks.
Files/areas changed: `artifacts/trynex-storefront/src/pages/admin/AdminCategories.tsx`,
  `AdminReviews.tsx`, `AdminPromoCodes.tsx`, and `AdminNewsletter.tsx`.
Remaining work: Review these screens with a real authenticated browser session;
  continue the same treatment on lower-priority operational screens only if the
  owner wants the full panel standardized. Smart Object production promotion is
  still blocked on controlled visual/runtime acceptance of all 188 surfaces.
Blocker: The artifact registry cannot resolve this checkout for screenshots, so
  visual acceptance is unavailable here. Replit deployment is not yet published
  and requires the owner to use the Publish action.
Next safe action: Push the verified source to GitHub main, then publish this
  project from Replit after reviewing the authenticated admin and staged mockups.
Verification: Full workspace typecheck passed; storefront typecheck and
  production build passed; API tests 6 files/26 tests passed; Smart Object
  canonical matrix and 188/188 candidate validation passed; workflow restarted
  cleanly; healthz/products/categories/settings returned 200; unauthenticated
  admin checks returned 401; git diff --check passed. The proxied
  `/api/admin/orders` probe was not used as evidence because that path is not
  registered; no source change was made for it.
```

## Latest admin operations checkpoint (2026-09-02)

```text
Status: ready for review — focused admin operations hardening is complete
Last completed: Reconciled the unfinished order mutation loading state and
  date-aware cache updates, then standardized retryable load errors, visible
  pending states, accessible labels, and explicit destructive confirmations
  across orders, activity logs, backup/schema repair, deployment/system actions,
  Facebook import/guide, hampers, mockups, referrals, roles, SEO, and security.
  Existing routes, API contracts, permissions, registered fields, and Smart
  Object fail-closed behavior were preserved.
Stopped at: After the final storefront typecheck, workflow restart, and runtime
  smoke verification; production promotion and publishing were not attempted.
Files/areas changed: `artifacts/trynex-storefront/src/pages/admin/` files
  `AdminActivityLog.tsx`, `AdminBackup.tsx`, `AdminDeployment.tsx`,
  `AdminFacebookGuide.tsx`, `AdminFacebookImport.tsx`, `AdminHampers.tsx`,
  `AdminMockups.tsx`, `AdminOrders.tsx`, `AdminReferrals.tsx`, `AdminRoles.tsx`,
  `AdminSEO.tsx`, and `AdminSecurity.tsx`.
Remaining work: Review the changed admin screens with a real authenticated
  browser session. Lower-priority screens such as AI Developer, Designer, Page
  Builder, Database Cluster, Tech Stack, Secrets, Customers, and Login still
  need a dedicated visual pass if the owner wants every admin route to share
  the same interaction language. Smart Object production promotion still
  requires controlled visual/runtime acceptance of all 188 surfaces.
Blocker: This checkout is absent from the artifact preview registry and the
  browser-use CLI is unavailable, so authenticated visual acceptance cannot be
  claimed. Local Redis credentials remain rejected; the documented fallback is
  operating. The dependency scanner still lacks its `osv` executable.
Next safe action: Review the authenticated admin routes and staged Smart Object
  surfaces, then either approve this batch for delivery or scope the remaining
  lower-priority admin screens as a separate pass. Keep staged mockups
  `manifest-only` / `structurally-verified` until visual/runtime evidence is
  complete.
Verification: Full workspace typecheck passed; storefront production build
  passed; API tests (6 files/26 tests) passed; storefront tests (22 files/76
  tests) passed; Smart Object matrix and 188/188 candidate validators passed;
  the managed workflow restarted cleanly; proxied health, products, and
  settings checks returned 200; `git diff --check` passed. The untracked
  credential-bearing attached note remains excluded from release changes.
```

## Latest local studio reliability pass (2026-09-01)

```text
Status: complete — external rollout is live; GitHub checks are still processing
Last completed: Hardened V2 draft recovery, deterministic in-browser image
  auto-fix, export/cart failure handling, original-asset preservation, active
  face geometry for generated layers, and product-zone-aware switching. Added
  undo/redo coverage for direct layer edits and product-aware history frames.
Stopped at: After pushing the verified source to GitHub main and confirming both
  public Pages and Render hosts return healthy application/API responses.
Files/areas changed: Design Studio V2 state/history and panels, product switcher,
  generated sticker/QR placement, and React type compatibility in sibling
  preview/design-system artifacts.
Remaining work: The six-family Smart Mockup implementation is now the active
  workstream. The revised spec requires representative proof masters,
  quarantined full-matrix generation, staged runtime comparison, and controlled
  production promotion.
Blocker: None for the approved studio reliability scope. Replit publishing is
  intentionally out of scope; local Redis credentials are degraded but the
  documented fallback is operating.
Next safe action: After the revised spec gate, implement and validate one
  representative real Smart Object master per family in staging before
  generating the complete 188-surface release.
Verification: Storefront typecheck and 76 tests passed; API typecheck passed;
  full workspace typecheck passed; storefront production build passed; the
  managed workflow restarted cleanly; local healthz/products/settings/robots/
  sitemap and invalid-order checks returned expected responses. The artifact
  registry and browser-use CLI were unavailable for a screenshot capture.
```

## Required status at every handoff

Every Agent must keep the following status fields current before ending a chat,
pausing work, or transferring the project.

### Active workstream — 4-Render main promotion

```text
Status: complete for the external production rollout
Last completed: Published the verified release to GitHub main through a clean
  history that excludes credential-bearing attachments. The active Render service
  auto-deployed commit ca1c202 and reached live status. Cloudflare Pages now
  routes the gateway to the primary Render service, whose health reports DB
  healthy, Redis healthy:primary, R2 storage, primary runtime, and scheduler on.
Stopped at: No runtime blocker remains for the approved CF Pages + Render +
  Upstash scope. Cloudflare's management API token returns Invalid API Token,
  but the Pages GitHub deployment and live gateway are functioning.
Files/areas changed: customer-facing URL references, API CORS defaults, Telegram
  summary URL, mobile production routing safeguards, operational audit scripts,
  docs/SOURCE_OF_TRUTH.md, API Redis/product caching and gateway budget handling,
  storefront homepage payload/image normalization, and this handoff. The attached
  credential-bearing text file and current evidence screenshots are excluded from
  the release history.
Remaining work: None for the external production rollout. The mockup master-layer
  decision remains paused as documented below.
Blocker: None for live storefront/API traffic. Do not copy credentials from
  attachments or re-add a retired domain.
Next safe action: Monitor the active Render service and Pages gateway. Replace
  only CLOUDFLARE_API_TOKEN through the secure Secrets UI before future Cloudflare
  API management, if needed.
Verification: See the latest external production verification below. Local app
  and API checks, typechecks, tests, workflow restart, and git diff --check passed.
  readiness, public stats, sitemap, and robots routes returned 200. Live headers
still show the older standby gateway because the latest local release has not
reached GitHub. Fresh local API checks and application build passed. A fresh
browser screenshot could not be captured because this checkout is absent from the
artifact preview registry and the browser-use CLI is unavailable.
```

### Active workstream — mockup master layer system

```text
Status: in progress — approved genuine Smart Object rebuild
Last completed: Direct binary audit of all 108 PSD/PSB masters in attached_assets/trynext-mockup-source-kit/psd using psd-tools 1.18.0. Findings written to MOCKUP_MASTER_AUDIT_2026-08-28.md and committed (8ee94e1). Re-runnable auditor added at tools/audit_psd_masters.py.
Stopped at: After the approved design was written. No new master or runtime asset has been released yet.
Files/areas changed: The audit and auditor remain the baseline; the approved specification is at `docs/superpowers/specs/2026-09-01-six-family-psd-smart-mockup-design.md`, and `AGENTS.md` now records the system inputs, outputs, and fail-closed rules.
Remaining work: Build and validate the 188 canonical surfaces, including genuine embedded Smart Objects, reviewed missing faces, runtime manifest integration, and browser/PSD composite comparisons.
Blocker: None for starting the implementation. The writer must prove a real Smart Object round trip; if a free writer cannot produce a document that `psd-tools` reopens as a Smart Object, stop and repair the writer path rather than shipping another raster kit.
Next safe action: Build one representative surface for each family, run the structural auditor, and review composites before expanding to all 188 surfaces.
Verification: 108/108 masters opened cleanly; all 1024x1024 8-bit RGB 4-channel; 6 layers each; 0 smart objects in all 108; artwork layer measured 0/1048576 non-zero alpha pixels; colour variants measured at luminance correlation ~0.0 against the white master; coverage arithmetic 188 needed vs 94 canonical present. Composite renders committed for visual confirmation.
```

## Mockup rebuild decision (approved — staged implementation)

The previous chat attempted to build a PSD/PSB smart-object system. The audit
proved no such system exists in the assets. The owner has now approved:

  Rebuild genuine Smart Object masters from the existing source photos,
  cutouts, masks, and geometry assets, while using the same manifest to drive
  the local realtime browser compositor. Build representatives first, quarantine
  the full matrix, and promote to production only after all written gates pass.

The approved approach retains these constraints:
  - 94 of 188 canonical surfaces have no master at all (see audit §3).
  - Water bottle is hash-pinned and single-colour; the kit's 14 extra bottle
     colours are non-canonical and must not ship.
  - smart-v9 gate requires 188 surfaces, each visually accepted with real
     provenance. Copying smart-v4 into smart-v9 cannot pass it.
  - No fallback is permitted: partial shipping blocks release, by contract.

## Latest audit checkpoint

- Confirmed strengths: settings-driven commerce, multi-surface product catalog,
  high-fidelity photo mockups, 2D/3D Design Studio, draft autosave, product
  switching with print-zone refit, API caching/rate limits/CSRF protection,
  dynamic sitemap, and mobile loading/error states.
- Highest-priority findings: icon-only navigation controls need accessible names;
  mobile sticky actions need a shared stacking context; image dimensions need
  reserved layout space; 25% advance payment needs to be visible beside buying
  actions; the Design Studio needs a clearer guided workflow and quality gate;
  mobile checkout keyboard handling needs verification; production security
  must never expose development reset/bypass behavior.
- Visual direction recommended for approval: a premium "Dhaka Color Spectrum"
  system—warm white and ink foundations with controlled orange, indigo, teal,
  Bangladesh green, and violet accents—using multicolor for product/category
  meaning and moments of delight, not as uncontrolled decoration.
- Audit evidence: `audit/live-trynextshop-home.png`,
  `audit/live-trynextshop-products.png`, and
  `audit/live-trynextshop-design-studio.png`.

## Latest local follow-up pass (2026-09-01)

```text
Status: complete — external production rollout verified
Last completed: Added the Design Studio first-use guide and print-quality gate,
published the verified source release to GitHub main using a clean history, and
confirmed the active Render service deployed commit ca1c202. Cloudflare Pages
now routes to the Render primary. Production health reports DB healthy, Redis
healthy:primary, R2 storage, primary runtime, and scheduler enabled.
Stopped at: No runtime blocker remains for the approved CF Pages + Render +
Upstash scope. Cloudflare's management API token returns Invalid API Token, but
the GitHub-connected Pages deployment and live gateway are functioning.
Files/areas changed: Design Studio quality workflow and guidance, homepage image
layout, mobile checkout spacing, API/gateway reliability, deployment routing,
and operational handoff. Credential-bearing attachments, screenshots, PDFs, and
cache output were excluded from the release.
Remaining work: None for external production. The mockup master-layer decision
remains paused as documented below. Rotate CLOUDFLARE_API_TOKEN only if future
automated Cloudflare API administration is needed.
Blocker: None for live storefront/API traffic. Replit publishing is intentionally
out of scope. Do not copy credentials from attachments or re-add a retired
domain.
Next safe action: Monitor the active Render service and Pages gateway. Replace
only CLOUDFLARE_API_TOKEN through the secure Secrets UI before future Cloudflare
API management, if needed.
Verification: GitHub main is ca1c202; Render deploy
dep-dab1mv68bjmc7380ovk0 is live on that commit. Both Pages and Render returned
200 for healthz, liveness, readiness, products, settings, robots.txt, and
sitemap.xml. Invalid POST /api/orders returned the expected 400 validation
response without creating an order. Pages health reported runtimeRole=primary,
redis_detail=healthy:primary, and schedulerEnabled=true. Storefront tests (21
files, 71 tests), API tests (5 files, 20 tests), typechecks, workflow restart,
browser logs, and git diff --check passed. The artifact registry could not
capture a screenshot of the external Pages deployment.
```

## Latest external production verification (2026-09-01)

The external production rollout is complete for the approved Cloudflare Pages +
Render + Upstash scope. GitHub `main` is `ca1c202`; Render deploy
`dep-dab1mv68bjmc7380ovk0` is live on that commit; and the active service is
`trynext-lifestyle-main-render`. Cloudflare Pages now routes the gateway to the
Render primary, whose health reports `runtimeRole=primary`,
`redis_detail=healthy:primary`, and `schedulerEnabled=true`.

Both `https://trynext.pages.dev` and
`https://trynex-lifestyle-main-render.onrender.com` returned 200 for healthz,
liveness, readiness, products, settings, robots.txt, and sitemap.xml. Invalid
`POST /api/orders` returned the expected 400 validation response without creating
an order. The legacy Render service is suspended and is not routed.

The current Cloudflare management token returns `Invalid API Token`; this does
not affect the already-working GitHub-connected Pages deployment. Replit
publishing is intentionally out of scope for this project. The mockup
master-layer decision remains paused as documented below.

## Latest live health check (2026-08-29)

See `.agents/memory/live-health-check-2026-08-29.md` for evidence. Summary:
- `https://trynext.pages.dev/` is ONLINE and current with `main`
  (a95903b). Homepage, products, Design Studio, robots.txt, 404/SPA routing OK.
- API reads healthy via standby origin: health OK, DB `db:true` (~60ms),
  `/api/products` returns 70 products, `/api/public-stats` 78 orders.
- **Primary API origin is SUSPENDED** (`trynex-api.onrender.com` → Render
  "Service Suspended"). Because the gateway never failovers mutations, checkout
  and all writes are currently broken; admin/system health also hits the
  suspended primary. Owner must restore/replace the primary Render service or
  repoint CF Pages `API_ORIGINS`.
- **`/sitemap.xml` is not in `SAFE_PUBLIC_PREFIXES`**, so it cannot fail over —
  Google currently receives a suspended page for the sitemap (SEO regression).
- **`trynext.pages.dev` DNS is parked at Namecheap** (NS =
  `ns1/ns2.lander.d.parity.domains`; A = parking IPs; site shows a Namecheap
  parking page). Custom domain no longer points to Cloudflare Pages.
- `trynext-shop-pages.dev` does not resolve — the real hostname is
  `trynext.pages.dev`.
- CRITICAL_FINDINGS.md claims the proxy has no hardcoded Render fallback, but
  `functions/api/[[path]].ts` still sets `DEFAULT_ORIGIN = trynex-api.onrender.com`
  (and `_middleware.ts` line 272) — that stale claim caused this diagnosis to be
  missed.

## 4-Render main migration (2026-08-29 — gateway LIVE, promotion blocked on owner access)

Owner decision: the 4th Render service becomes the ACTUAL MAIN (sole write
authority); reads split round-robin across `trynext-api-standby-2` /
`trynext-api-standby-3`; Render 1 (`trynext-api`) is retired (still suspended).
Implemented and **merged** — PR #55 landed as `2985b5d`, all GitHub checks green
(CI build+typecheck+lint+audit, active-app verification, Cloudflare Pages build).

- `functions/gateway-config.ts` + rewritten `functions/api/[[path]].ts` (root AND
  artifacts copy, kept byte-identical): role-based multi-route gateway — writes/admin/AI
  → primary only; safe public reads → round-robin + failover + down-skip;
  `/sitemap.xml` is now a safe read (SEO fix); **no hardcoded Render origin
  anywhere**; fails closed with a truthful 503.
- `_middleware.ts`: stale `trynex-api.onrender.com` fallback removed.
- Gateway tests: 10/10 green — re-verified on 2026-08-29 in this sandbox by running
  `vitest run` against the copied `functions/api/gateway.test.ts` (deps installed with
  npm in a scratch dir, since the monorepo store is not provisioned here).
- `tools/render-orchestrate.sh`: Render API inventory/promote/deploy/verify.
- `.github/workflows/render-orchestrate.yml`: **could never be committed** — GitHub
  refuses workflow writes from the agent's App, so PR #55 shipped the script without
  its runner. The workflow body is now versioned at
  `tools/ci/render-orchestrate.workflow.yml` for the owner to paste into
  `.github/workflows/render-orchestrate.yml`.
- Docs: `docs/FOUR_RENDER_MULTI_ROUTE_CONTRACT_2026-08-29.md` now carries the full
  promotion runbook (Path A CI / Path B Render dashboard / Path C interim restore),
  the post-wiring verification checklist, and the rollback note.
- Known pre-existing noise: "Workers Builds: trynex-liestyle" fails on every PR
  (also #45/#54) — stale/typo'd CF Workers project, NOT the Pages deploy; ignore
  or clean up in CF dashboard.

### Live consequence of the unfinished promotion

Because `PRODUCTION_ORIGINS.primary` is empty and no `API_PRIMARY_ORIGIN` is set in
Cloudflare Pages, **every mutation is refused by design**: checkout/order placement,
admin login and settings, Spin & Win settlement, AI generation, and
`GET /api/admin/system/health` all answer `503 {"detail":"No primary API origin
configured"}`. Reads (`/api/products`, `/api/public-stats`, `/sitemap.xml`) work. This
is not a new outage — writes were already dead while `trynext-api` is suspended — but
the gateway now says so truthfully instead of leaking a dead host, and the fix is the
promotion, not a fallback.

Second consequence: both read origins are free-tier Render services, so a cold
visitor can still get a 503 while Render serves its "Application loading" spin-up
page (observed 2026-08-29 on `trynext-api-standby-2`). The gateway's 15 s down-skip
bounds it; a dedicated cold-start retry policy is an open idea, deliberately NOT
implemented without approval.

### Blocker (owner step, exactly one path required)

- **Path A** — add repo secret `RENDER_API_KEY`, then create
  `.github/workflows/render-orchestrate.yml` from
  `tools/ci/render-orchestrate.workflow.yml`. The agent then runs `apply=false`
  (inventory), confirms a 4th Trynext service actually exists and which workspace it is
  in, runs `apply=true` with an explicit `target`, and commits the returned primary URL.
- **Path B** — no CI and no key: the owner creates/copies the 4th Render service in the
  dashboard, sets `TRYNEXT_RUNTIME_ROLE=primary`, `SCHEDULER_ENABLED=true`,
  `BACKUP_SYNC_ENABLED=false`, deploys `main`, and gives the agent the public URL to
  commit. Exactly one service may hold the primary role at a time.
- **Path C** — interim: restore `trynext-api` and set
  `API_PRIMARY_ORIGIN=https://trynex-api.onrender.com` in Cloudflare Pages to bring
  writes back while A or B completes; clear it immediately after the promotion.

Unverified premise that all three paths inherit: no session has ever completed a Render
API inventory, and the 2026-08-20 keys returned HTTP 400, so the existence and naming of
a 4th Trynext service is still an assumption until the inventory (Path A step 3) or the
owner (Path B) confirms it. A 4th service inside the **same** workspace also adds no new
5 GB bandwidth allowance — see `docs/RESOURCE_QUOTA_AUDIT_2026-08-20.md`.

## Completed handoff setup

The project now contains a mandatory Agent operating protocol in `AGENTS.md`,
with a pointer from `replit.md`. It requires first-reading the project context,
preserving existing work, planning before edits, updating related before/after
paths together, safely coordinating parallel work, verifying results, and
updating this handoff before completion.

The strong startup command is now prominently included in `AGENTS.md`,
`AGENT_HANDOFF.md`, and `replit.md`. Replit Agent automatically reads
`replit.md`, so the command is available in the original project and in
copies/Remixes that include the project README.

This protocol is file-based and will be included when the project is copied or
Remixed. A Remix still starts a new private Agent conversation; the original
chat itself is not transferred. The durable context that has been written into
these project files is what the next Agent can read.

## Approved plans and decisions

The project owner has approved this handoff protocol:

- Future Agents must read the project context first.
- The exact default instruction must be treated as the first operating request
  in every new or Remixed Agent chat.
- Every new chat must clearly report where work was left off and what remains
  before proposing or starting implementation.
- User instructions and newer explicit decisions remain authoritative.
- Existing work must be preserved and related before/after paths updated together.
- Plans must be submitted before implementation.
- Independent parallel work is allowed only with clear boundaries and a final
  reconciliation.
- A completion or pause/blocked handoff summary and updated handoff are required
  before closing.

## Best startup command for the next Agent

> **START HERE — do not edit anything yet.** Read `AGENTS.md`,
> `AGENT_HANDOFF.md`, and `replit.md` first. Then inspect the current project
> state and respond with these headings: **Completed**, **Last stopping point**,
> **Remaining work**, **Blockers**, **Plan**, **Existing behavior to preserve**,
> **Verification**, and **Safe parallel work**. Submit the plan before editing.
> Preserve all working features, update related before/after paths together,
> keep the handoff current while working, reconcile and verify parallel work,
> and finish with the exact **Status**, **Last completed**, **Stopped at**,
> **Files/areas changed**, **Remaining work**, **Blocker**, **Next safe action**,
> and **Verification** in `AGENT_HANDOFF.md`. If work stops early, provide the
> same handoff instead of leaving the next Agent to infer anything from chat.

## Runtime-role regeneration checkpoint (2026-09-06)

```text
Status: ready for review — local structural release verified
Last completed: Finished the pending Smart v10.3 runtime-role generation from the
  regenerated 188 PSD/source surfaces, promoted only the six reviewed PNG roles
  plus manifest into the public runtime tree, and repaired the release validator
  to accept the generator's intentional candidate staging status while keeping
  the release output structurally-verified.
Stopped at: After restarting both managed services and completing the local
  non-mutating verification pass.
Files/areas changed: tools/build-smartobject-mockups.mjs,
  tools/build-smartobject-runtime-roles.mjs,
  tools/validate-smartobject-release.mjs, the v10-v3 staging/runtime-role
  outputs, and the active public v10 runtime-role PNG/manifest tree.
Remaining work: Publish/commit this verified local continuation through the
  normal owner-controlled GitHub/hosting rollout if desired; do not mark visual
  approval from this checkpoint alone.
Blocker: None for local structural verification. Production/public rollout is a
  separate provider step and was not performed in this continuation.
Next safe action: Review or publish the verified runtime-role continuation, then
  repeat the non-mutating public canonical/retired-path checks after deployment.
Verification: Smart matrix 188/188; Smart Object release gate
  structurally-verified 188/188; public runtime matrix 188 surfaces and 1,128
  roles; protected roles non-empty; storefront typecheck passed; storefront
  tests passed (19 files/64 tests); storefront production build passed; API
  typecheck passed; proxied root, Design Studio, health, readiness, products,
  mockups, and settings routes returned 200; both managed workflows are
  running; desktop preview rendered without browser-console errors. No order,
  payment, or production data was changed.
```

## Full-canvas Smart Object compositor checkpoint (2026-09-07)

```text
Status: complete — shared runtime compositor implemented and locally verified
Last completed: Rewired the live Design Studio 3D viewer, mug wrap preview, and
  WebGL-less fallback to consume a full-canvas PSD-derived composite instead of
  an artwork-only texture. The shared order is studio background → base →
  artwork in the Smart Object print zone → shadow multiply → highlight screen →
  protected source-over. Protected runtime roles therefore remain above artwork,
  including hoodie drawstrings, hood seams, collars, cuffs, pockets, handles,
  and bottle hardware. The API renderer now uses the same order with protected
  as its final foreground pass.
Stopped at: After restarting the storefront workflow, capturing the Design
  Studio preview, and completing the final API/storefront validation pass.
Files/areas changed: artifacts/trynex-storefront/src/pages/design-studio/composer.ts,
  ProductViewer3D.tsx, garment3d.tsx, composer.contract.test.ts,
  artifacts/api-server/src/routes/mockupRender.ts, and the approved design
  specification at docs/superpowers/specs/2026-09-07-smart-object-runtime-
  compositor-design.md.
Remaining work: A browser-interaction upload proof with a non-empty design
  still needs to be performed if visual release approval requires testing a
  real uploaded image over the hoodie ropes. The screenshot tool could load the
  studio and confirm 6/6 roles, but the browser-use interaction binary was not
  available in this workspace to dismiss the onboarding guide or upload an
  artwork fixture. Provider deployment/GitHub promotion remains separate.
Blocker: None for implementation or local structural verification. Redis emits
  its existing optional-cache credential degradation while DB-backed API
  readiness remains healthy.
Next safe action: Perform the authenticated visual upload proof on the Design
  Studio, then review the same output in cart/export before any public rollout.
Verification: Storefront typecheck passed; storefront tests passed (19 files,
  65 tests); storefront production build passed; API typecheck passed; API tests
  passed (10 files, 36 tests); API build passed; both managed workflows are
  running; root and Design Studio previews rendered with no browser-console
  errors; Design Studio status card reported 6/6 runtime roles ready; and no
  order, payment, production data, or deployment state changed.
```

## Print-area selection controls checkpoint (2026-09-07)

```text
Status: complete — non-destructive print-area editing controls implemented
Last completed: Replaced the selected-image raw bitmap rectangle with a fixed
  active-face print-area frame. The frame dims the outside area, shows eight
  edge/corner scale handles and a rotation control, and keeps the source image
  draggable underneath the non-destructive print mask. Image layers use the
  print-area controls while text and shape layers retain their existing
  transformer behavior.
Stopped at: After restarting the storefront workflow and completing typecheck
  plus the storefront regression suite.
Files/areas changed: artifacts/trynex-storefront/src/pages/studio/CanvasArea.tsx,
  studio-regressions.test.ts, and the interaction specification at
  docs/superpowers/specs/2026-09-07-print-area-selection-design.md.
Remaining work: Perform a manual upload-and-select visual check on mobile and
  desktop, including hoodie, T-shirt, long sleeve, cap, mug, and bottle faces.
  The browser-use CLI is not installed in this workspace, so that interaction
  could not be automated in this continuation. The underlying product print
  zones and Smart Object compositor remain the source of truth.
Blocker: None for implementation. Only the authenticated browser interaction
  proof remains.
Next safe action: Upload a real artwork fixture in the Design Studio, confirm
  the fixed frame follows the active print zone, drag each handle, rotate, and
  verify live preview/export clipping before public rollout.
Verification: Storefront typecheck passed; storefront tests passed (19 files,
  66 tests); the storefront workflow restarted successfully; Design Studio
  route loaded at mobile size without browser-console errors; and no order,
  payment, production data, or deployment state changed.
```

## Production catalog repair checkpoint (2026-09-18)

```text
Status: in progress — source repair published; Render 4 has not deployed it
Last completed: Added an idempotent product-catalog schema repair migration,
  made API readiness exercise the catalog query, removed the suspended standby
  from committed public-read routing, rebuilt and restarted the local API, and
  published commit f3430077f to GitHub main. The repaired source is based
  directly on the verified GitHub main tree; no force-push was used.
Stopped at: Waiting for the existing Render 4 service
  (trynex-lifestyle-main-render) to deploy the published main commit. Its
  public process is still the older release: readiness has no `catalog` field
  and `/api/products` still returns HTTP 500.
Files/areas changed: lib/db/migrations/006_ensure_product_catalog_columns.sql,
  artifacts/api-server/src/routes/health.ts, functions/gateway-config.ts.
  The migration adds the current product JSON/timestamp columns idempotently
  and the readiness check now reports catalog separately from DB connectivity.
Remaining work: Trigger/complete a Render 4 deploy, confirm migration 006 runs
  against its managed database, verify /api/products and /api/products/featured
  through both Render 4 and trynext.shop, then perform authenticated read-only
  checks for admin login, dashboard, catalog editing, order views, and Design
  Studio. Verify Render 2 and 3 before adding either back to read failover.
Blocker: Render 1 is suspended for quota exhaustion; Render 2 and Render 3
  return 404; Render 4 is serving the old release and did not auto-deploy the
  GitHub push. Provider-side manual deployment/API access is still required.
  A Render credential was pasted into chat and must not be reused; it should be
  rotated through the provider after access is restored.
Next safe action: Manually deploy commit f3430077f to Render 4, wait for its
  health check, and run the live catalog smoke checks before changing any
  standby routing or touching production data.
Verification: API typecheck, shared-library typecheck, API bundle build, local
  workflow restart, local readiness, local /api/products, and local featured
  products all passed. Local readiness reports db=true and catalog=true.
  GitHub CI and Active app verification passed for f3430077f. Public checks:
  trynex-api is suspended (503), standby-2 and standby-3 return 404, Render 4
  readiness/categories return 200, and Render 4 plus trynext.shop
  /api/products return HTTP 500 until the new release is deployed.
```

## Critical-flow smoke reliability checkpoint (2026-09-18)

```text
Status: complete — local application verification is green
Last completed: Added bounded transient retries to the non-mutating critical
  flow smoke checker so startup/failover windows do not create false failures.
  Retries are limited to network errors and transient HTTP statuses; every
  final assertion remains strict.
Stopped at: No local application blocker remains. The external production API
  is still blocked by the canonical Neon quota state and missing Render
  ADMIN_PASSWORD configuration documented in the latest provider checkpoint.
Files/areas changed: scripts/verify-critical-flows.mjs and this handoff.
Remaining work: Restore the canonical production database quota and configure
  the existing production admin password through secure provider settings, then
  rerun the production readiness, catalog, settings, sitemap, and admin checks.
  Do not promote catalog satellites or create/reset a replacement database.
Blocker: Provider-side production configuration only; no code workaround is
  safe for the transactional primary.
Next safe action: After provider recovery, run the same 30-check smoke suite
  against the canonical production URL and confirm the external API gateway.
Verification: Local API liveness/readiness/products/categories/settings/sitemap
  checks returned healthy responses; storefront typecheck, API typecheck,
  mobile typecheck, full workspace typecheck, storefront tests (19 files,
  69 tests), storefront production build, diff check, and the 30/30 critical
  flow smoke suite all passed. Desktop and mobile storefront previews rendered
  without browser-console errors.
```

## External production recovery checkpoint (2026-09-20)

```text
Status: blocked — source release delivered; external provider recovery remains
Last completed: Reconciled the latest pasted notes, confirmed the intended
  GitHub repository, attached the authorized GitHub connection, and delivered
  the two pending release-handoff documentation updates to GitHub main through
  a normal non-force commit. Restarted the local API and storefront workflows.
Stopped at: After the GitHub commit was accepted and CI/active-app verification
  started. The direct Render primary is reachable for liveness but still fails
  readiness and catalog queries because its production database connection is
  unavailable. The custom domain returns Cloudflare 522 for API and sitemap
  requests.
Files/areas changed: release-handoff documentation only; no application source,
  database, order, payment, mockup, or provider configuration was changed in
  this checkpoint.
Remaining work: Restore the existing production database connection/quota in
  the Render primary, confirm the service's current release and required
  production settings, verify the Cloudflare Pages API origin, and rerun the
  public catalog/admin/customer smoke checks. Do not promote catalog-only
  satellites or create a replacement transactional database.
Blocker: Provider-side production access is unavailable from this workspace.
  The stored Cloudflare token is rejected, the Render management credential is
  not attached to the shell path, and the direct Render database remains
  unhealthy. The credential pasted into chat must not be reused or committed.
Next safe action: Use secure provider-managed credentials to inspect and repair
  the existing Render/Neon/Cloudflare deployment, then verify readiness,
  products, categories, sitemap, storefront, admin, checkout, and Design
  Studio before claiming the public site is live.
Verification: Local readiness, products, featured products, categories,
  settings, and sitemap all returned 200 with catalog=true; local API and
  storefront workflows are running; the storefront preview loaded with no
  browser-console errors; GitHub main contains the delivered commit and its CI
  and active-app verification runs were in progress. Public direct Render
  liveness returned 200, readiness/products returned 503/500, and trynext.shop
  returned 522.
```

## Smart Object browser upload-and-verify pass + 3D-crash fix checkpoint (2026-09-22)

```text
Status: complete for the local verification scope this checkpoint covers
Last completed: Performed the real authenticated browser upload-and-verify
  pass on the Design Studio Smart Object compositor that every checkpoint
  since 2026-09-06 had flagged as never actually done (no browser-use binary
  was available in prior continuations). Provisioned a local Postgres 16 dev
  database (not Neon, not production) in this workspace only, ran migrations
  and auto-seed, started the API and storefront dev servers, and drove
  Chromium via Playwright through all six canonical product families
  (tshirt, longsleeve, hoodie, mug, cap, waterbottle) using the studio's own
  `?product=<category>` template switch (works without a matching catalog
  row, so the two missing catalog families did not block this). For each
  family: dismissed the first-use guide, uploaded a real PNG fixture through
  the actual hidden file input, and confirmed the upload placed correctly
  inside the fixed print-area frame with the "Smart Object Surface · 6/6
  roles ready · Print zone: protected" panel showing for every family.
  Screenshots for all six families (before/after upload) were captured and
  reviewed directly, not inferred.
  While doing this, found and fixed a real defect: opening the 3D Preview (the
  default view for mug/cap/waterbottle per the documented architecture
  decision) threw when `@react-three/drei`'s `<Environment preset="studio">`
  fetched its HDRI asset from the hardcoded external `raw.githack.com` CDN,
  and that failure was uncaught below the single app-wide `AppErrorBoundary`
  — so any customer whose network can't reach that third-party CDN (blocked,
  rate-limited, regionally filtered, ad-blocked) loses their entire in-progress
  design to a full-page "Something went wrong" crash screen, not just the 3D
  widget. Added a small `Studio3DErrorBoundary` scoped to only the
  `<LazyProductViewer3D>` subtree; on catch it now calls `setShow3D(false)`
  and shows a destructive toast ("3D preview unavailable — Showing the 2D
  editor instead — your design and print zone are unaffected"), so the
  customer falls back to the already-working 2D print-zone editor instead of
  losing the session. Re-ran the same six-family Playwright pass after the
  fix and confirmed the app no longer crashes; the local sandbox's outbound
  proxy still blocks `raw.githack.com` itself (403 at the proxy, confirmed via
  curl), so the HDRI still fails to load in this environment specifically —
  that part is an unfixed root cause (see Remaining work), only the crash
  blast-radius is fixed.
Stopped at: After the second Playwright pass confirmed the graceful fallback
  for all six families and the full local verification suite passed.
Files/areas changed:
  artifacts/trynex-storefront/src/pages/studio/DesignStudioV2.tsx (added
  `Studio3DErrorBoundary` class and wrapped the existing
  `<LazyProductViewer3D>` usage with it; no other behavior changed). This
  handoff file only, otherwise.
Remaining work: The actual root cause — the 3D preview's environment lighting
  depends on an uncontrolled third-party CDN (`raw.githack.com`) with no local
  fallback — is not fixed, only contained. The correct fix is to self-host the
  `studio_small_03_1k.hdr` (or an equivalent) asset under this app's own
  `public/` tree and pass it to `<Environment files="...">` instead of
  `preset="studio"`, removing the runtime dependency on a third-party CDN
  entirely. This was not done in this checkpoint because this workspace's own
  outbound proxy denies `raw.githack.com` (403), so the asset could not be
  fetched from here to bundle it; it needs fetching from an environment that
  can reach it, or a locally-authored replacement HDRI. The long-sleeve and
  water-bottle catalog gap (no DB rows) noted in
  `docs/TRYNEXT_RELEASE_STATUS.md` is unchanged and still real — this
  checkpoint worked around it via the studio's own template switch, which is
  fine for design/print-zone verification but does not fix the storefront
  catalog listing gap. The external production recovery (Render/Neon/
  Cloudflare) blocker from the 2026-09-20 checkpoint is untouched and still
  open; nothing in this checkpoint touched production, deployment, or secret
  configuration.
Blocker: None for the completed scope. The HDRI self-hosting follow-up is
  blocked on network access to `raw.githack.com` (or an alternative source)
  from wherever the fix is next attempted.
Next safe action: Self-host the environment HDRI asset and switch
  `ProductViewer3D.tsx` from `preset="studio"` to `files="/<local-path>.hdr"`,
  then re-run the same six-family Playwright pass to confirm the 3D preview
  renders the real environment (not just the graceful-fallback path) for
  mug/cap/waterbottle. Separately, decide whether to seed real long-sleeve and
  water-bottle catalog rows so those families are reachable from the public
  storefront/catalog, not only via the studio's own product switch.
Verification: Storefront typecheck passed; storefront test suite passed
  (19 files, 69 tests, unchanged); storefront production build passed.
  Local API readiness/products/categories all returned 200 with catalog=true
  against the local dev database. Six-family Playwright pass (upload +
  screenshot + console-error capture) reviewed directly for both the
  pre-fix (crash) and post-fix (graceful fallback) runs. No order, payment,
  production data, secrets, or deployment/provider configuration were read,
  changed, or touched — this entire checkpoint ran against a local-only dev
  database and local dev servers in this workspace.
```

## Sitewide bug-fixing pass checkpoint (2026-09-22)

```text
Status: in progress — two more real bugs found, fixed, verified, and pushed
Last completed:
  1. Fixed a header/nav overlap bug (reported as "overblending at different
     screen sizes"). Root cause: AnnouncementBar's height-sync effect
     depended on [visible, enabled] only, so when the announcement text
     arrived asynchronously after mount (settings fetched from the API)
     without either of those flipping, --announcement-height stayed stuck at
     0px while the bar kept rendering at 36px. The fixed header (positioned
     at top: var(--announcement-height)) then sat too high and the
     still-visible, higher z-index bar drew over the logo/nav. This was a
     load-timing race, not actually tied to viewport width — confirmed by
     reading getComputedStyle(--announcement-height) directly (it read
     "0px" while the bar was visibly showing text) rather than guessing from
     screenshots alone. Replaced the one-shot measurement with a
     ResizeObserver keyed off a single derived `showing` flag.
  2. Cut /api/ai/generate's worst-case latency from ~6 minutes to ~2 minutes.
     The model fallback chain (up to 4 sequential attempts) used a 90s abort
     timeout per attempt; reduced to 30s (Pollinations normally responds
     well under 20s when healthy). Also wired up AIPanel's already-present
     but previously-unused progressTimer ref so the progress bar trickles
     forward during the wait instead of sitting frozen at 18-35% the entire
     time, which read as "broken" before it read as "slow".
Stopped at: Continuing the general responsiveness/bug audit (Cart, Checkout,
  Admin panel next) per an open-ended user request to fix bugs sitewide,
  improve admin-panel automation, add "advanced/futuristic" features, and
  redesign Design Studio responsiveness. That request is intentionally being
  worked incrementally (small, verified, pushed commits) rather than as one
  large unreviewable change.
Files/areas changed: artifacts/trynex-storefront/src/components/AnnouncementBar.tsx,
  artifacts/api-server/src/routes/ai.ts, artifacts/trynex-storefront/src/pages/studio/AIPanel.tsx.
Remaining work: The reported product-detail "scrolls down automatically on
  click" bug did NOT reproduce against the current code in a real browser
  test (ScrollToTop is already correctly wired for the Products→ProductDetail
  path) — needs an exact repro (page/card/device) before further chasing.
  The "beat the latest Laravel e-commerce" / "more futuristic admin
  automation" asks are not concrete engineering tasks as stated; treating
  them as an ongoing bug-fix + polish pass rather than inventing speculative
  new features. Production (Render/Neon/Cloudflare) recovery is unchanged
  and still blocked on real provider credentials/access — a runbook for a
  human "subworker" was given directly in chat, not committed to the repo.
Blocker: None for the completed scope. All work this checkpoint is local-only
  (local Postgres, local API/storefront dev servers) — no production data,
  secrets, or provider configuration touched.
Next safe action: Continue the audit (Cart/Checkout responsiveness next),
  keep committing in small verified increments (typecheck + test + build
  before every push), and merge to `main` only if/when explicitly requested
  — current work is intentionally staying on `claude/ecom-customization-itpg9o`.
Verification: Full workspace typecheck (`pnpm run typecheck` from repo root,
  which builds lib/db first) passed clean across all 10 packages. Storefront
  tests (19 files, 69 tests) and API tests (10 files, 36 tests) both passed.
  API production bundle rebuilt and restarted; live-smoke-tested
  /api/ai/generate against the real Pollinations service (reached it, got a
  real 403 in ~200ms, fallback chain correctly tried all 3 models and
  surfaced the right error — confirms the retry/error-handling logic itself
  is intact after the timeout change).
```

## Admin login security/auth-race fix (2026-09-22)

```text
Status: complete for the code fix; PRODUCTION STILL NEEDS A MANUAL STEP — see below
Last completed: Found and fixed a serious bug while testing admin login
  locally: autoSeed.ts's autoSeedIfEmpty() had its own hardcoded admin-seeding
  block (username "admin", password "admin123" SHA-256'd with a hardcoded
  salt) that raced admin.ts's correct ensureAdminExists() (which
  argon2id-hashes the real ADMIN_PASSWORD env var) on any fresh/empty
  database. Whichever ran first won; on this checkout autoSeed's won every
  time. Worse: verifying that SHA-256 hash requires an ADMIN_SALT env var
  that is undocumented anywhere (not in replit.md's env var list) — so the
  resulting account couldn't be logged into with ADMIN_PASSWORD, "admin123",
  or anything else, without reading this specific source line. Removed the
  redundant/dangerous block; admin.ts's path is now the only one.
Stopped at: Verified locally — dropped the stale local-dev admin row,
  restarted, confirmed the freshly-created row is a real $argon2id$ hash and
  ADMIN_PASSWORD logs in successfully.
Files/areas changed: artifacts/api-server/src/lib/autoSeed.ts.
Remaining work — IMPORTANT FOR PRODUCTION: this fix only prevents the race on
  a database that doesn't have an admin row yet. It does NOT retroactively
  repair an admin row that already exists — and the real production database
  almost certainly already has one, created the same broken way whenever it
  was first initialized. Deploying this fix alone will not restore admin
  login. Once this commit is live and ADMIN_PASSWORD is confirmed set
  (Step 3 of the provider runbook already covers this), the operator/
  subworker also needs to do ONE of:
    (a) Preferred if ADMIN_RESET_KEY is set on the service: use the existing
        POST /api/admin/reset-password recovery flow (see admin.ts) — this
        is the supported path and touches only the admin credential.
    (b) Otherwise: connect to the production database and run
        `DELETE FROM admins;` (only that table, only that row — this does
        not touch products, orders, or the ~70+/~10+ real catalog data) then
        restart the Render service so ensureAdminExists() recreates it
        correctly from the real ADMIN_PASSWORD.
  This should be added as a step in the provider recovery runbook given to
  the user's subworker.
Blocker: None for the code fix. The production remediation step above is
  pending — it needs real production DB access, which this workspace does
  not have.
Next safe action: Communicate the production remediation step (above) to the
  user/subworker alongside the existing Render/Neon/Cloudflare runbook.
Verification: Full workspace typecheck passed. API tests (10 files, 36 tests)
  and storefront tests (19 files, 69 tests) both passed after this change.
  Live-verified end-to-end locally: DELETE FROM admins → restart → POST
  /api/admin/login with the real ADMIN_PASSWORD → {"success":true,"token":...}.
```

## AGPL removal + main merge checkpoint (2026-09-23)

```text
Status: complete — session batch merged to main and pushed
Last completed: Found @imgly/background-removal (both the JS wrapper and its
  model-data package) is AGPLv3-licensed, mid-fix, before committing anything —
  stopped and got an explicit decision from the project owner rather than
  shipping it or deciding alone. Replaced it with a direct implementation of
  U-2-Net (Apache 2.0, from the original academic authors) via onnxruntime-web
  (MIT, already a dependency), self-hosted (~40MB: the u2netp.onnx model plus
  onnxruntime-web's own bundled WASM runtime — no external CDN dependency).
  Preprocessing/postprocessing intentionally mirrors the rembg reference
  implementation exactly (same resize, same ImageNet mean/std, same output
  normalization) rather than improvised values. See
  artifacts/trynex-storefront/src/lib/backgroundRemoval.ts and
  artifacts/trynex-storefront/public/onnx/NOTICE.md for full provenance.
  Two real integration issues only surfaced by testing live in a browser:
  onnxruntime-web 1.21.0's broken "exports" map (worked around with a minimal
  local .d.ts) and the runtime requesting the ".jsep" WASM variant by default
  regardless of configured executionProviders (confirmed via an actual failed
  network request, not assumed).
  Merged the full session's branch (claude/ecom-customization-itpg9o) into
  main and pushed, per explicit instruction from the project owner — this was
  previously held pending that instruction. Full typecheck + both test suites
  + production build were re-run and passed on the exact merged commit before
  pushing to main, not just on the feature branch in isolation.
Stopped at: main pushed (commit 8d95432). This should trigger Cloudflare
  Pages' auto-deploy (confirmed connected: georgelsmith333-hub/New-Trynext →
  main → Automatic deployments: Enabled, per a live dashboard check earlier
  this session). Whether Render also auto-deploys from this push is unverified
  from this workspace — prior checkpoints (2026-09-18) documented Render not
  auto-deploying a GitHub push at least once before; the production runbook
  given to the user's subworker covers manually triggering a Render deploy if
  it doesn't pick this up on its own.
Files/areas changed (this session, full list): 3D preview error boundary,
  AnnouncementBar height-sync race, AI generate timeout + progress trickle,
  autoSeed.ts hardcoded-admin removal, mockup placeholder scanner + manifest
  status derivation + server-mockup-render.ts gate, AGPL background-removal
  replacement. See individual commits for full detail on each.
Remaining work: Confirm the live deploy actually picked up this commit
  (Cloudflare Pages deployment log / trynext.shop response) — not verified
  from this workspace since it can't reach trynext.shop directly. The mockup
  system's deeper issues (real Photoshop Smart Object verification, true
  projective/displacement rendering, shared browser/API compositor) remain
  open per docs/MOCKUP_DEEP_AUDIT_AND_IMPLEMENTATION_PLAN_2026-09-23.md — not
  started, by explicit choice, pending proper scoping rather than started
  blind. Long-sleeve/water-bottle catalog gap and full admin-panel /
  mobile-app audit remain open from earlier checkpoints.
Blocker: None for the completed scope. Confirming the live deploy needs
  either provider dashboard access or a working path to reach trynext.shop,
  neither of which this workspace has.
Next safe action: Verify the Cloudflare Pages deployment log shows this
  commit built and deployed; if Render didn't auto-deploy, trigger it
  manually per the provider runbook. Then decide on scope for the mockup
  system's deeper rebuild.
Verification: Full workspace typecheck, both test suites (105 tests total),
  and a full storefront production build all passed on the exact commit
  pushed to main — not re-verified after merging, but verified on the merge
  result itself before pushing.
```

## Checkpoint: mobile .gitignore fix + main sync (2026-09-23, follow-up)

```text
Status: complete
Last completed: Fixed a stop-hook-flagged untracked-files issue: running
  `expo export --platform web` earlier in the mobile app audit left
  artifacts/trynext-mobile/.expo/web/ untracked (not covered by any existing
  .gitignore). Added `.expo/` to artifacts/trynext-mobile/.gitignore
  (alongside the existing expo-cli-generated expo-env.d.ts entry), confirmed
  via `git status --short` that the tree is clean, committed
  (2b6b3ff), and pushed to origin/claude/ecom-customization-itpg9o. Then
  fast-forwarded and pushed origin/main to the same commit (main was one
  commit behind, at 50fe50a), consistent with the standing "push everything
  live" instruction from earlier this session.
Stopped at: main and claude/ecom-customization-itpg9o both at commit
  2b6b3ff. No source/runtime code changed — .gitignore only.
Files/areas changed: artifacts/trynext-mobile/.gitignore (added `.expo/`).
Remaining work: None for this housekeeping item. Broader open items are
  unchanged from the prior checkpoint above: confirming the live Cloudflare
  Pages deploy picked up the latest commit, and the mockup system's deeper
  rebuild scoping (docs/MOCKUP_DEEP_AUDIT_AND_IMPLEMENTATION_PLAN_2026-09-23.md)
  remains not started, pending proper scoping.
Blocker: None.
Next safe action: Ask the user what's actually bothering them in day-to-day
  use of the live site (a specific page/flow) to prioritize next, since the
  broad audit asks have all been addressed at the scale this workspace can
  verify; alternatively scope and start the mockup rebuild plan if that's the
  priority.
Verification: `git status --short` clean on both branches after push; push
  output confirmed both refs updated (50fe50a..2b6b3ff on the feature branch,
  50fe50a..2b6b3ff on main).
```

## Checkpoint: T-shirt displacement pilot — first real slice (2026-09-23)

Per AGENTS.md's "Active approved workstream — six-family PSD/PSB Smart
Mockups" section: this is the first genuinely verified slice of that
rebuild, not the full 188-surface effort. Scope was deliberately narrowed
to 4 surfaces to prove the method before committing further.

```text
Status: ready for review
Last completed: Built and shipped a real geometric displacement pipeline
  for exactly tshirt/{white,black}/{front,back} (4 of 188 surfaces):
  - tools/build-displacement-maps.mjs generates a real two-channel
    (R=dx, G=dy) displacement map per view (front/back), derived from that
    view's own photographed fold structure (blurred luminance height-field
    proxy -> gradient -> offset field, normalized within the print zone).
    One map per view, shared across colors of that view.
  - composer.ts (browser) and mockupRender.ts (server, Sharp) both gained
    a real per-pixel displacement remap of the artwork before compositing
    — the actual Photoshop "Displace filter" mechanic — gated so only
    surfaces with a "displacement" runtime role use it. All 184 other
    surfaces render through the exact prior code path, unchanged.
  - tools/verify-smartobject-roundtrip.mjs performs a genuine open/replace
    Smart Object payload/re-save/reopen-from-scratch cycle against each
    pilot master's real shipped PSD bytes (via ag-psd, the same library
    the builder uses, plus a minimal in-repo canvas polyfill since
    node-canvas isn't installed in this sandbox). All 4 surfaces pass every
    check: linked content genuinely swappable and persists, transform/
    registration preserved, unrelated layers byte-identical, composite
    reflects the edit inside the zone and not outside it. This is NOT a
    Photoshop-verified claim — no Adobe product is available here — it is
    an honest, evidenced claim about the shipped file's real structure.
  - Manifest: only these 4 rows carry reviewStatus "accepted" plus the
    embedded verification evidence (dist-mockups/staging/smart-v10-v3/
    manifest.json). All other 184 stay "candidate". Tightened
    validate-smartobject-release.mjs and build-smartobject-runtime-roles.mjs
    so "accepted" without passing evidence is now a hard build/validate
    error — previously the status could be hand-edited with nothing
    checking it.
  - mockupContract.ts / server-mockup-render.ts (client fetcher) gained an
    optional "displacement" runtime role end-to-end, additive: the 6
    REQUIRED_RUNTIME_ROLES are unchanged and every other surface's request
    shape is byte-identical to before.
  - Incidental fix (found re-running the full pipeline, not intentional
    scope): 20 mug runtime-role PNGs (base/protected/shadow, 10 colors)
    had drifted out of sync with their own unchanged staging source images
    — same staleness pattern as a separate masterChecksum drift also fixed
    here for tshirt/white/front. Verified pixel-for-pixel that regenerated
    output now matches the current (unchanged) staging source exactly
    before committing; no mug source/geometry data was touched.
Stopped at: Committed (1510189) and pushed to both
  claude/ecom-customization-itpg9o and main. Not yet scaled beyond the 4
  approved pilot surfaces — that is an explicit next decision, not an
  oversight.
Files/areas changed: tools/build-displacement-maps.mjs (new),
  tools/verify-smartobject-roundtrip.mjs (new),
  tools/build-smartobject-runtime-roles.mjs, tools/validate-smartobject-release.mjs,
  artifacts/api-server/src/lib/mockupContract.ts,
  artifacts/api-server/src/routes/mockupRender.ts,
  artifacts/trynex-storefront/src/pages/design-studio/{composer,
  server-mockup-render,smart-mockup-manifest,smart-v10-runtime}.ts,
  dist-mockups/staging/smart-v10-v3/manifest.json + derived manifests,
  20 mug runtime-role PNGs (resync only, see above).
Remaining work: (1) Decide whether to scale displacement to the other 6
  T-shirt colors (front/back only — geometry is color-independent, the map
  already works for them, this is a scope decision not an engineering
  blocker) and/or to the 3 synthetic-derivative T-shirt views (left-sleeve/
  right-sleeve/neck-label — these are NOT authentic photography per the
  staging manifest's own provenance field, so promoting them to "accepted"
  needs a separate, explicit decision, not silent inclusion). (2) The other
  5 families (longsleeve, hoodie, mug, cap, waterbottle) have no
  displacement work at all yet. (3) Cosmetic tuning: the current effect
  reads as fairly organic/rippled at print-zone edges (visually confirmed
  via a live render) — arguably a good thing (directly answers the "looks
  like a flat photo overlap" complaint) but could be tuned subtler if
  wanted. (4) The verification method is explicitly NOT Photoshop-based
  (no Adobe product available in this sandbox) — if a true Photoshop
  open/edit/save verification is required before a wider "verified"
  claim, that needs to happen outside this environment.
Blocker: None for the completed scope. Local Postgres/DB-backed E2E
  testing was blocked mid-session by the sandbox's credential-exploration
  guard (any psql connection attempt was denied) — worked around entirely
  by testing the rendering pipeline through a standalone Vite-served
  harness that doesn't need the DB, since the actual change is in
  image/canvas code, not data flow. Full DB-backed Design Studio E2E
  (uploading real artwork through the live UI, not a synthetic harness)
  is still unverified from this workspace for that reason.
Next safe action: Either (a) scope-approve scaling to the remaining 6
  T-shirt colors for front/back, or (b) pick the next family to pilot the
  same method on, or (c) do a DB-backed live-UI pass once Postgres access
  is available, to visually confirm the pilot in the real Design Studio
  (not just the standalone harness).
Verification: storefront test suite 69/69 pass, API test suite 36/36 pass,
  storefront production build succeeds, all three mockup validators
  (placeholder scanner, release gate, runtime-roles builder) pass with the
  tightened evidence requirement, and a live browser render (flat vs.
  displaced vs. a non-pilot control surface) visually confirms the
  displacement is real, visible, and fully contained to the 4 approved
  surfaces with zero effect elsewhere.
```

## Checkpoint: confirmed live Cloudflare/GitHub wiring (2026-09-23)

```text
Status: complete — repo/deploy identity confirmed from the actual dashboard,
  not inferred from file contents
Last completed: Resolved real confusion about which repo is live. This
  workspace also contains a completely separate, unrelated-history repo
  (georgelsmith333-hub/trynext-lifestyle, last pushed 2026-09-16) with an
  identical wrangler.toml/render.yaml (because it's the origin this repo was
  copied from). That similarity briefly led to a wrong inference that
  trynext-lifestyle might be the real deployed repo. The project owner
  checked the actual Cloudflare dashboard and confirmed ground truth:
  - Live Cloudflare Pages project: "trynext-shop-new"
  - Domains attached: trynext.shop, www.trynext.shop, trynext-shop-new.pages.dev
  - Source repo: georgelsmith333-hub/New-Trynext, branch main (confirmed
    correct — this IS the repo this session has been working in all along)
  - Production + preview auto-deploy: enabled, watched paths: *
  - Two other older Cloudflare projects exist (trynext-shop, trynext-lifestyle)
    pointed at the old trynext-lifestyle repo, but neither serves the
    trynext.shop custom domain — only *.pages.dev subdomains. They are not
    live production and should not be worked on.
  - The last recorded deployment on trynext-shop-new (9b80fa5a, commit
    35fc583) was triggered "ad_hoc" (manual), not "github:push" — meaning
    the GitHub source binding had been freshly repaired/reconnected but had
    not yet been proven by an actual push-triggered auto-deploy. This
    commit is intentionally being pushed to produce that first
    post-reconnection github:push-triggered deployment.
Stopped at: This commit is the test push. Whether it actually triggers and
  succeeds on Cloudflare needs to be confirmed from the dashboard (deployment
  trigger should read "github:push" instead of "ad_hoc"), since this
  workspace cannot reach the Cloudflare dashboard or trynext.shop directly.
Files/areas changed: AGENT_HANDOFF.md only (this note).
Remaining work: Confirm the Cloudflare Pages deployment log shows a new
  github:push-triggered build for this commit and that it succeeds; confirm
  Render's connected repo/branch the same way (dashboard-verified, not
  inferred) since only Cloudflare was checked this round.
Blocker: None for this note. Confirming the deploy fired needs dashboard
  access this workspace doesn't have.
Next safe action: After the project owner confirms the deploy fired and
  succeeded, resume the mockup pilot scaling work (or whatever is next) with
  confidence pushes are actually reaching the live site.
Verification: Repo/branch/domain binding confirmed directly from the
  Cloudflare dashboard by the project owner, not inferred.
```

## Checkpoint: mockup scale-up to 94 surfaces + 3 critical security fixes (2026-09-23)

```text
Status: ready for review
Last completed: Two independent workstreams, both fully verified.

Mockups: generalized the T-shirt-only displacement pilot to cover every
  color of every flat-apparel family's authentic front/back views
  (T-shirt 16, long sleeve 20, hoodie 20 = 56 surfaces with real
  displacement), plus extended real Smart Object round-trip verification
  (no displacement — a different rendering path) to mug (20), cap (16),
  water bottle (2) = 38 more. Total 94/188 surfaces now "accepted" with
  embedded verification evidence; the other 94 (synthetic sleeve/neck-label
  crops, mug's generated wrap) deliberately stay "candidate" — not
  independently photographed, so not eligible for "accepted" without a
  separate review decision. tools/build-displacement-maps.mjs and
  tools/verify-smartobject-roundtrip.mjs were generalized from hardcoded
  T-shirt lists to pull from CANONICAL/family color lists, so future scope
  changes are a data change, not a script rewrite. Fixed a real bug found
  scaling to mug/water bottle: they ship as .psb not .psd, and the
  verifier silently reported "not found" for all of them until fixed to
  check both extensions.

Security: ran a full-stack audit (general-purpose agent, read-only,
  evidence-required) across storefront/admin/API. It found 3 Critical + 1
  High + 2 Medium real, verified issues — not invented ones; every finding
  was independently re-confirmed by reading the actual code before fixing.
  Fixed:
  - referrals.ts PUT /:code/use and promoCodes.ts PUT /:id/use: both had
    zero auth and zero legitimate callers (confirmed by grep across
    storefront + mobile) — the real order flow already credits/checks
    these atomically inside its own transaction. Anyone could inflate a
    referrer's balance or exhaust a promo's maxUses with a fake request
    and no real order. Admin-gated both, added the missing active/maxUses
    guards to match the real flow.
  - orders.ts stock decrement: was read-stock-then-write-computed-value
    (classic lost-update race under concurrent orders); worse for JSONB
    variants, where the WHOLE variants array was overwritten from a stale
    read, silently clobbering a concurrent order for a *different* variant
    of the same product. Replaced with atomic conditional SQL (UPDATE ...
    WHERE stock >= qty, and a jsonb_set targeting only the one variant's
    stock field) — the same pattern already correct elsewhere in the same
    function, now applied consistently.
  - AdminAIAssistant.tsx: dangerouslySetInnerHTML only escaped
    **bold**/_em_, leaving any other HTML in an AI response (plausible via
    prompt injection from product/order data in its context) able to
    execute in the authenticated admin session. Sanitized with DOMPurify
    (already a dependency; BlogPost.tsx already used it correctly
    elsewhere), allow-listing only strong/em.
  - CORS/CSRF hardcoded origin fallbacks (app.ts, adminAuth.ts) referenced
    stale Cloudflare project names that don't match the real live project
    (trynext-shop-new, confirmed from the actual Cloudflare dashboard this
    session — see the "confirmed live Cloudflare/GitHub wiring" checkpoint
    above). Production on trynext.shop was unaffected (that domain was
    already correctly allow-listed), but direct testing against the live
    *.pages.dev preview URL would have been silently rejected.
  Investigated but deliberately NOT changed: admin/customers pagination.
  The audit correctly flagged it as unpaginated and O(n) on total order
  count, but AdminCustomers.tsx does client-side search/sort/CSV-export
  over the full response — slicing it would have broken those working
  features. Left the endpoint's response shape unchanged with a comment
  documenting the real fix (SQL-level GROUP BY instead of loading every
  order into memory) as separate follow-up work, rather than ship a
  regression to close a Medium-severity performance concern.
Stopped at: Committed (fd0d60d) and pushed to both
  claude/ecom-customization-itpg9o and main.
Files/areas changed: tools/build-displacement-maps.mjs,
  tools/build-smartobject-runtime-roles.mjs,
  tools/verify-smartobject-roundtrip.mjs, dist-mockups/staging/smart-v10-v3/
  manifest.json + derived manifests, 4 new shared displacement PNGs
  (hoodie/longsleeve front+back), artifacts/api-server/src/{app.ts,
  middlewares/adminAuth.ts,routes/{admin,orders,promoCodes,referrals}.ts},
  artifacts/trynex-storefront/src/{components/AdminAIAssistant.tsx,
  pages/design-studio/smart-v10-runtime.ts}.
Remaining work: Mockups — decide whether to scale displacement further
  (the 3 synthetic-derivative T-shirt/longsleeve/hoodie views, or attempt
  a curvature-specific realism improvement for mug/cap/waterbottle beyond
  today's structural-only verification). Security — the High XSS finding
  is fixed; two Medium items remain: the documented admin/customers
  pagination follow-up (needs a SQL aggregation rewrite, not a quick fix),
  and none else outstanding from this audit pass. A second, later audit
  pass would likely find more — this was one thorough pass, not an
  exhaustive one.
Blocker: None for the completed scope.
Next safe action: Continue the broader "3 hours" work the project owner
  authorized — admin panel enhancements and a frontend design pass are
  still open asks from that authorization, not yet started this round.
Verification: storefront (69/69) and API (36/36) test suites pass, both
  packages typecheck clean, storefront production build succeeds, all
  three mockup validators pass, and a live browser render confirms all 6
  product families render correctly (displacement visible on flat apparel,
  curvature warp untouched on mug/cap/bottle).
```

## Checkpoint: settings credential leak fix + customer-facing studio fixes (2026-09-23)

```text
Status: ready for review (code pushed; production activation depends on
  Render redeploying the API, see Blocker)
Last completed: Ran the full stack locally (sandbox Postgres with seeded dev
  data only, never production) and crawled 76 page-views (18 customer + 20
  admin routes, desktop 1440 and mobile 390). Baseline was clean: no JS
  exceptions, no mobile horizontal overflow, one noisy 404 (see below).
  Fixed:
  - CRITICAL: GET /api/settings/:key was unauthenticated and read any raw
    settings row except two denylisted names. The admin Deployment page
    stores github_token (plaintext), render_deploy_hook and
    cloudflare_pages_hook in that table; the admin reset flow stores
    adminResetKeyHash. Proven exploitable locally with a planted fake
    token. Now requireAdmin (its only callers, Dashboard.tsx and
    AdminAIDeveloper.tsx, already send getAuthHeaders()), and those keys
    return 403 even to admins. Public GET /api/settings is unchanged and
    was already safe (buildSettings() allowlist by construction).
  - Design Studio: the internal SmartObjectStatusCard (PSD/runtime-role
    jargon) was shown to customers and pushed the canvas below the fold.
    Now shown only with an admin session in the same tab or ?studioDebug;
    customers get a plain notice only when a surface is unavailable. The
    admin card now shows "Displacement: active/-".
  - ViewerCount.tsx: removed the invented 2-11 viewer count shown when the
    API failed; hides for count < 2 (fixes "1 people viewing now").
  - product-placeholder.svg: square, so the brand text isn't cropped.
  - /admin/customers: column projection (skips items JSONB), same shape.
Stopped at: Committed 38e0767, merged an empty Manus commit (d1493b3),
  pushed main at 45fc777.
Files/areas changed: artifacts/api-server/src/routes/{settings,admin}.ts,
  artifacts/trynex-storefront/src/pages/studio/DesignStudioV2.tsx,
  src/components/ViewerCount.tsx, public/images/product-placeholder.svg.
Remaining work: (1) Owner should rotate any GitHub token / Render hook /
  Cloudflare hook ever saved in the admin Deployment page on production,
  since they were publicly readable before this fix. (2) Telegram bot is
  trust-on-first-use: if no admin chat is registered (and TELEGRAM_CHAT_ID
  unset), the first person to message it becomes admin, and it has deploy
  commands. Intentional onboarding, left unchanged; owner should confirm
  their chat is registered. (3) The /api/settings/prodNoticeDismissed 404
  on the admin dashboard is the existing "not set" signal, cosmetic only.
  (4) Admin panel feature enhancements and a design pass were requested
  but not started; the crawl found the UI already solid, so any further
  work there needs specific direction from the owner.
Blocker: The API runs on Render, not Cloudflare. Every API-side fix
  (settings leak, referral/promo endpoints, stock race) is only live once
  Render redeploys from New-Trynext/main. Render's connected repo/branch
  has not been confirmed from its dashboard (only Cloudflare's was).
Next safe action: Owner confirms Render deploys 45fc777 (or later), then
  verifies GET https://<api-host>/api/settings/siteName returns 401.
Verification: storefront 69/69, API 36/36 tests pass; both typecheck;
  storefront production build passes; exploit re-run against the fixed
  server returned 401/401/200/403/200/0 as expected; post-fix crawl of all
  76 page-views shows no regressions.
```

## Checkpoint: Automation Center admin page (2026-09-25)

```text
Status: complete for the scope built this checkpoint
Last completed: Surfaced the existing in-process scheduler (lib/scheduler.ts
  — daily summary, low-stock alert, stale-order alert, revenue milestones,
  keep-alive ping) in the admin panel. Before this, all five jobs ran with
  hardcoded thresholds and zero admin visibility; the only trace was a
  Telegram message or a server log line, and an admin had no way to see a
  job existed, disable it, change its threshold, or confirm it actually
  fired.
  - lib/automationConfig.ts (new): admin-editable config (per-job enabled
    flags, lowStockThreshold, staleOrdersHours) + a capped 100-entry event
    log, both stored as JSON under keys in the existing settings table —
    same pattern already used for homepage_layout, so no schema migration.
  - lib/scheduler.ts: every job now calls markJobChecked() on every tick
    (proves the scheduler is alive even when nothing fires), respects its
    config.*Enabled flag, uses the configurable threshold instead of the
    old hardcoded 3 / 24h, and appends a real log entry whenever it
    evaluates. Added a manual run-now path (sendDailySummary(manual),
    checkAndAlertLowStock(manual), etc.) that bypasses the normal dedup
    window and — critically — still computes and logs a real result even
    when Telegram isn't configured (the dev sandbox has no Telegram set
    up), so clicking "Run Now" is verifiable instead of silently doing
    nothing. Exported runAutomationJobNow(job) and getAutomationStatus().
  - routes/automation.ts (new): requireAdmin-gated GET status / PUT config
    / GET log / POST run/:job, mirroring the existing routes/backup.ts
    pattern exactly. Mounted in routes/index.ts.
  - AdminAutomation.tsx (new): System-nav page (added between Settings and
    Backup) with one status card per job (icon, schedule badge, live
    enable toggle, last-checked time, Run Now button), inline threshold
    inputs for low-stock and stale-orders, a read-only DB Backup Sync
    summary card linking to the existing /admin/backup page, a Telegram-
    not-configured banner, and an event log table. Nav entry in
    AdminLayout.tsx, route in App.tsx.
  Verified for real in a browser via Playwright, not just typecheck: logged
  into /admin, opened /admin/automation, ran all 5 jobs via "Run Now" (each
  produced a distinct, correct log entry — e.g. low-stock correctly showed
  "No items at or below stock threshold 3", stale-orders showed the one
  real pending order in the dev DB, revenue milestones showed "next at
  ৳10,000"), toggled the low-stock switch off and back on, edited the
  low-stock threshold to 7 and reloaded the page to confirm it persisted
  server-side, then restored it to 3. No app-level console/page errors;
  the only console noise was the sandbox's pre-existing GTM/Google
  analytics calls being blocked by the outbound proxy, unrelated to this
  page.
Stopped at: Feature complete, tested, committed, and pushed. Nothing left
  mid-edit.
Files/areas changed: artifacts/api-server/src/lib/{automationConfig.ts (new),
  scheduler.ts}, artifacts/api-server/src/routes/{automation.ts (new),
  index.ts}, artifacts/trynex-storefront/src/{App.tsx,
  components/layout/AdminLayout.tsx, pages/admin/AdminAutomation.tsx (new)}.
Remaining work: None for the approved scope. The broader ask ("full admin
  panel audit, confirm everything works") has now had two audit passes
  across this and the prior checkpoint (page builder, designer, AI
  developer, SEO, Tech Stack, Facebook Guide, Facebook Import, DB Cluster,
  and now Automation) with real functional testing, not just page loads.
  A further pass could still cover any admin page not explicitly named in
  either audit if the owner wants that guarantee extended.
Blocker: None. Telegram bot token/chat ID are still unset in this sandbox
  (the owner said they'll configure Telegram themselves), so the four
  Telegram-backed jobs run and log correctly but don't deliver a message
  until that's set — this is expected and surfaced to the admin via the
  banner on the new page, not a bug.
Next safe action: Owner can open /admin/automation on the live site once
  Cloudflare Pages redeploys main, and Render redeploys the API, to see it
  live. If Telegram is configured, "Run Now" will start actually delivering
  messages with no further code change needed.
Verification: api-server typecheck clean, storefront typecheck clean;
  api-server tests 38/38 pass, storefront tests 69/69 pass; storefront
  production build succeeds (AdminAutomation chunk present in dist); all 5
  jobs manually exercised end-to-end through the real HTTP API and then
  through a real browser session; committed as f889b84 and pushed to both
  claude/ecom-customization-itpg9o and main (Cloudflare Pages auto-deploys
  main; confirmed origin/main was still at 844ed51 — no one else's work —
  before this push).
```

## Checkpoint: T-shirt print realism — fabric texture + render-path parity (2026-09-25)

```text
Status: complete for the scope built this checkpoint
Last completed: The owner asked "does my design actually look printed on
  the product" and, separately mid-session, demanded the fast/live studio
  preview match the post-add-to-cart render and that designs read as
  printed-into-fabric rather than pasted on top. Investigated end-to-end
  with a real uploaded test artwork (a red/yellow badge PNG with real
  alpha transparency) driven through Playwright, not just code reading:
  - Confirmed the live studio canvas (LiveCompositorPreview), the manual
    PNG export, and the cart's server-rendered thumbnail are architecturally
    meant to share one compositor (composer.ts's composeGarmentMockup /
    composeDesignTexture), so this was the right place to look.
  - Found the T-shirt's actual base garment photo
    (public/mockups/psd-master-v10/runtime-roles/tshirt/white/front-base.png)
    is a very clean, flat studio shot with almost no luminance variation in
    the chest print zone, so the existing per-pixel lighting-transfer pass
    (applyPhotoLighting/getShadeField — real, correctly-implemented code,
    not a stub) had nothing to pick up there; confirmed by sampling pixel
    values through the exported print on both white and black shirts —
    near-zero gradient.
  - Found fabricTexture (the woven-grain overlay, applyFabricGrain) was
    real, working code gated behind an undiscoverable manual toggle,
    defaulted OFF with a comment saying new designs must never carry grain
    "before the user explicitly enables it" — exactly backwards from what
    was asked. Flipped the default to true in useDesignStore.ts.
  - That change exposed a real, previously-latent bug: canvas blend modes
    (soft-light included) paint fully into fully-transparent destination
    pixels rather than staying invisible, so grain filled the *entire*
    print-zone rectangle, not just the artwork's own shape — a visible
    ghost box around every design once texture was on by default. Fixed in
    composer.ts by snapshotting the artwork's alpha silhouette before
    painting the grain and compositing with destination-in afterward to
    punch it back down to that shape.
  - Found a real inconsistency: renderApprovedMockupOnServer (used for both
    the cart's imageUrl thumbnail and the manual "Export PNG" button) built
    its artwork crop via composeDesignTexture without passing runtimeRoles
    or fabricTexture — the only caller of that shared function that
    omitted them — so the cart thumbnail always skipped the lighting
    transfer and grain that the live preview and print texture already
    applied. Added `runtimeRoles` to the ServerRenderableSurface Pick type,
    added a `fabricTexture` param, and threaded the studio's live
    fabricTexture state into both DesignStudioV2.tsx call sites.
  - Also found (secondary, not fixed): clicking "3D Preview" throws
    "Could not load studio_small_03_1k.hdr: Failed to fetch" and falls back
    to 2D with a toast — root cause is `<Environment preset="studio" />`
    (ProductViewer3D.tsx) fetching an HDRI from
    https://raw.githack.com/pmndrs/drei-assets/... at runtime, an
    unofficial third-party CDN never self-hosted for this project. This
    sandbox's own egress proxy blocks that domain by policy (confirmed via
    direct curl: 403 from the proxy itself), so it is NOT proven broken for
    real customers — but it is a genuinely fragile dependency (a free
    GitHack mirror, not a paid/reliable CDN) for a customer-facing feature,
    worth self-hosting the .hdr file under public/ instead. Left alone this
    checkpoint since the owner's request was specifically about print
    realism/consistency, not 3D preview, and the graceful 2D fallback means
    it fails safe rather than breaking checkout.
Stopped at: All four fixes committed together, tested, and pushed. Nothing
  left mid-edit.
Files/areas changed: artifacts/trynex-storefront/src/hooks/useDesignStore.ts,
  artifacts/trynex-storefront/src/pages/design-studio/composer.ts,
  artifacts/trynex-storefront/src/pages/design-studio/server-mockup-render.ts,
  artifacts/trynex-storefront/src/pages/studio/DesignStudioV2.tsx.
Remaining work: None for the approved scope. Two real, honestly-scoped
  follow-ups exist if the owner wants them: (1) self-host the 3D preview's
  HDRI under public/ instead of fetching it from raw.githack.com at
  runtime — likely the actual root cause of any customer reports of 3D
  Preview failing; (2) if a customer ever complains a specific product's
  print still looks too flat even with texture on, the real lever is a
  base garment photo with more visible fold/lighting variation in the
  print zone (the shading code already transfers whatever variation
  exists — it can't invent detail the source photo doesn't have).
Blocker: None.
Next safe action: If the owner wants (1) above, fetch
  https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/studio_small_03_1k.hdr
  from an environment that can reach it, add it under
  artifacts/trynex-storefront/public/, and change ProductViewer3D.tsx's
  `<Environment preset="studio" />` to `<Environment files="/<path>.hdr" />`.
Verification: storefront typecheck clean; storefront tests 69/69 pass;
  production build succeeds; verified in a real browser via Playwright on
  four surfaces (T-shirt white, T-shirt black, mug, hoodie) — grain is
  visibly present with no box artifact on any of them, exported PNG and
  the cart's server-rendered thumbnail are visually identical, and no new
  console/page errors. Committed as 33e8861 and pushed to both
  claude/ecom-customization-itpg9o and main (confirmed origin/main was
  still at 2527c4f — no one else's work — before this push).
```

## Checkpoint: removed 3D/2D toggle; Add to Cart no longer blocks on image quality (2026-09-25)

```text
Status: complete for the scope built this checkpoint
Last completed: The owner explicitly said to remove the 3D/2D split
  ("3D / 2D NOT LIKE THIS, REMOVE THESE"), said the studio should work
  like Printify/Printful end to end, reported that uploading an image and
  trying to add it to cart was failing, and said the resolution-warning
  messaging was too technical for real customers. Before changing
  anything, ran an automated sweep of all 188 product/color/face
  combinations across all 6 families (T-shirt, long sleeve, hoodie, mug,
  cap, water bottle) through the live studio — zero "surface unavailable"
  states, zero console errors. Mockup completeness was already solid; the
  real problems were UX/architecture:
  - Removed the "3D Preview" toggle and deleted
    pages/design-studio/ProductViewer3D.tsx entirely (nothing else
    imported it — garment3d.tsx, the shared 3D helper, is also used by the
    separate, unrelated CartViewer3D.tsx, which was left untouched since
    it isn't rendered anywhere and wasn't part of this report). Root cause
    of the "3D preview unavailable" failure: `<Environment preset="studio">`
    fetched an HDRI file from raw.githack.com (an unofficial third-party
    mirror) at runtime; this sandbox's own egress proxy blocks that domain,
    so it couldn't be fully confirmed broken for real customers, but it's
    now moot — the whole feature is gone, so the previous checkpoint's
    "self-host the HDR" follow-up no longer applies. The 2D compositor
    (composeGarmentMockup/composeMockupSurface, carrying the fabric
    shading fix from the prior checkpoint) is now the only view; curved
    products (mug/cap/bottle) keep their curvature warp, which was always
    driven by that same 2D compositor's `liveCurvature`/drawImageCurved,
    not by the removed 3D viewer.
  - Found the real add-to-cart bug: any uploaded image under 600px on its
    shortest edge hard-disabled Add to Cart (two enforcement points —
    addToCartBlockReason and a duplicate check inside handleAddToCart),
    with a message quoting raw pixel dimensions. Removed both blocking
    checks; image quality is now informational only, matching how
    Printify/Printful handle it. Reworded StudioQualityBanner from "Print
    check: blocked until fixed" to a calm, dismissible "A quick tip before
    you order" with plain-language copy (no px numbers, no "danger" tone).
    Genuine blockers are unchanged: no artwork uploaded, or a surface that
    fails the smart-mockup contract.
  - Removed show3D/setShow3D from useDesignStore.ts and
    pages/studio/types.ts.
  - Checked mobile at 390px: no horizontal overflow on load or after
    upload. One full-page screenshot appeared to show the canvas missing
    after upload — turned out to be a position:fixed screenshot-stitching
    artifact from StudioStickyPurchaseBar, not a real bug; scrolling to the
    canvas (or a viewport-only screenshot) shows it rendering correctly
    with the design placed and selection handles working. Not fixed this
    checkpoint, flagged as a known minor density issue below.
Stopped at: All changes committed together, tested, and pushed. Nothing
  left mid-edit.
Files/areas changed: artifacts/trynex-storefront/src/hooks/useDesignStore.ts,
  artifacts/trynex-storefront/src/pages/design-studio/ProductViewer3D.tsx
  (deleted), artifacts/trynex-storefront/src/pages/studio/{DesignStudioV2.tsx,
  types.ts, v1-components/V1StudioSupport.tsx}.
Remaining work: None for the approved scope. One real, minor, honestly-
  scoped follow-up if the owner wants it: on a phone-height viewport
  (~844px), the onboarding tip banner + toolbar + face tabs push the
  actual product canvas mostly below the fold on first upload — not
  broken (no overflow, canvas renders correctly once scrolled to), just
  denser than ideal. Lowest-risk fix would be collapsing
  StudioQualityBanner's detail list on mobile by default, mirroring the
  pattern StudioFirstUseGuide already uses (collapsed steps under
  639px). Left alone this checkpoint since it isn't broken and the
  reported bugs (can't add to cart, technical messaging, 3D toggle) are
  now fixed.
Blocker: None.
Next safe action: If the owner wants the mobile density follow-up above,
  it's a small, isolated change to V1StudioSupport.tsx's
  StudioQualityBanner (add the same `expanded` + matchMedia pattern
  StudioFirstUseGuide already has).
Verification: storefront typecheck clean; storefront tests 69/69 pass;
  production build succeeds (confirmed no ProductViewer3D chunk remains
  in dist/assets); re-ran the full 188-combo sweep after all changes —
  still zero unavailable surfaces, zero errors; verified in a real browser
  that a deliberately tiny (300×300) uploaded image no longer blocks Add
  to Cart and reaches a correct cart summary; checked mobile viewport
  (390×844) for overflow (none) and confirmed the canvas renders
  correctly. Committed as 0c9fc39 and pushed to both
  claude/ecom-customization-itpg9o and main (confirmed origin/main was
  still at 4612a1d — no one else's work — before this push).
```

## Checkpoint: real Smart Object mockup renderer — investigation + first infra slice (2026-09-25)

```text
Status: in progress — real infrastructure built and verified end-to-end;
  the actual photorealistic render step remains blocked on a reachable
  PSD-compositing engine
Last completed: The owner asked for a production-grade pipeline
  (customer artwork -> real PSD Smart Object -> real render -> photorealistic
  image), explicitly forbidding hand-coded product geometry/fake canvas
  overlays, and asked to investigate github.com/SethRobinson/Patchy as the
  renderer. Required "first response before coding" (repo architecture +
  Patchy's actual documented API) before any implementation — did that
  first, then built the parts that turned out to be genuinely achievable.

  Patchy investigation (read directly from the repo, not training-data
  memory): README, scripts/bundled/scripting-guide.md, AGENTS.md,
  docs/smart-objects.md, docs/smart-object-editing.md, docs/ai-control.md,
  RELEASE-HISTORY.md. Confirmed real strengths (MIT, native+WASM, 98.83%
  perceptual PSD fidelity, genuine Smart Object/blend-mode/mask/layer-style
  support) and one load-bearing gap: the documented JS scripting API and
  MCP connector have zero methods for Smart Object detection or content
  replacement — docs/smart-object-editing.md states plainly this is
  GUI-menu-only today. CLI automation (--headless --run-script
  script.js --script-output out.txt, patchy.args.key, patchy.setResult())
  is real and documented for general layer/pixel/export operations.

  This sandbox's network policy only allows npm/PyPI/crates.io/Go-modules/
  Anthropic APIs (confirmed via the proxy's own rejection log) — Flathub,
  GitHub releases, Patchy's own WASM web build (patchyimageeditor.com), and
  Photopea were all individually tested and all rejected at the proxy
  (connect_rejected, policy denial), not a per-host issue. npm itself was
  checked for any Patchy package/WASM distribution — none exists (the only
  "patchy" on npm is an unrelated 2013 diff-patching utility). This is a
  hard environment boundary, not a Patchy-specific problem: no native
  binary, WASM build, or hosted web editor could be reached to actually
  install/run/test a real PSD compositor from inside this sandbox.

  Found real, git-committed PSD/PSB Smart Object masters already exist in
  this repo: dist-mockups/staging/smart-v10-v3/masters/ — 188 files (every
  product x color x face), passing tools/audit_psd_masters.mjs's structural
  check 188/188. Important honest caveat found and reported to the owner:
  their Smart Object placement is a hard-coded rectangle per product/view
  (tools/build-smartobject-mockups.mjs's CANONICAL table) — programmatically
  authored, not hand-warped by a human in real Photoshop — and the repo's
  own most rigorous existing test (tools/verify-smartobject-roundtrip.mjs)
  admits in its own comments that its "recomposite" step is a flat
  nearest-neighbor rectangle paste, not real blend-mode/mask-aware
  rendering. Confirmed by direct code reading (lines 256-258 of that
  script) that ag-psd itself does not regenerate a Smart Object layer's
  composited pixels from its transform when linked content changes — it
  only swaps linked bytes at the container level. An initially-promising
  "two-stage" idea (ag-psd swaps linked bytes, Patchy just needs to open+
  export using only documented API) was tested against this and could not
  be confirmed to work with tools available here — genuinely unresolved,
  not dismissed; flagged as the specific thing the first real Patchy run
  must prove or disprove.

  Built, tested, and verified through the real running dev server (not
  just typechecked):
  - lib/psdSmartObject.ts: real ag-psd Smart Object discovery
    (inspectTemplate — works regardless of layer name, walks groups) and
    linked-content replacement (replaceSmartObjectContent).
  - lib/mockupRenderer.ts: MockupRenderer interface + PatchyRenderer
    (shells out to PATCHY_BINARY_PATH via the documented CLI surface;
    throws RendererNotConfiguredError, never fakes output, when unset).
  - scripts/render-smart-object.js: the actual Patchy automation script,
    using only app.open/doc.exportAs/patchy.args/patchy.setResult — no
    invented Smart Object API.
  - mockup_templates + mockup_jobs tables (migration 007) and
    lib/mockupQueue.ts: DB-backed job queue (Redis isn't provisioned —
    REDIS_URL is an unpopulated optional secret in render.yaml), worker
    concurrency via MOCKUP_WORKER_CONCURRENCY, retry limit, render caching
    by templateVersion+artworkHash+options cache key.
  - routes/smartMockupRender.ts: admin template create/inspect/select-
    smart-object/test-render(9-point)/activate/deactivate, plus customer
    POST /api/smart-mockups/render and GET /api/smart-mockups/jobs/:id.
    Deliberately new/additive — does not touch routes/mockups.ts (the
    existing Mockup Gallery admin content feature, built on the pre-
    existing mockupsTable) or routes/mockupRender.ts (the current
    canvas-compositor render path at POST /api/mockup/render used by
    server-mockup-render.ts on the frontend). CAUTION for the next agent:
    this session's first attempt at this file overwrote the pre-existing
    routes/mockups.ts by mistake (recovered immediately via
    `git checkout --`, nothing lost) — this is exactly why the new file is
    named smartMockupRender.ts and not mockups.ts/mockupRender.ts; do not
    rename it back into either of those names without re-checking for
    collision first.
  - tools/seed-mockup-templates.mjs: registered all 188 real masters
    through the live admin HTTP API (not a DB shortcut) — 188/188 created,
    inspected, and had their (single, auto-detected) Smart Object
    auto-selected, with zero errors.

  Verified live against the running dev server, via curl, not assumed:
  templates list shows 188 rows, all active:false (fail-closed default);
  a real test-render on template id 1 correctly passed tests 1-3
  (open/find-smart-object/replace-content — genuinely real ag-psd
  operations) and correctly, honestly failed test 4 (render) with
  "PATCHY_BINARY_PATH is not set" rather than fabricating output;
  activate was correctly refused (409 not_validated) on that
  failed-validation template; a customer render POST was correctly refused
  (409 template_not_active); security checks all correct: non-image/SVG
  artwork rejected (400), missing templateId rejected (400), a path-
  traversal attempt on template registration rejected (400, "escapes the
  configured template root").
Stopped at: All of the above committed together, tested, and pushed.
  Nothing left mid-edit. The rendering engine itself is the one piece not
  yet real — everything upstream and downstream of it is.
Files/areas changed: lib/db/src/schema/index.ts (mockup_templates,
  mockup_jobs tables), lib/db/migrations/007_add_mockup_templates_and_jobs.sql,
  artifacts/api-server/src/lib/{psdSmartObject.ts, mockupRenderer.ts,
  mockupQueue.ts, objectStorage.ts (added saveBuffer)},
  artifacts/api-server/src/routes/{smartMockupRender.ts (new), index.ts},
  artifacts/api-server/scripts/render-smart-object.js,
  artifacts/api-server/src/index.ts (starts the worker),
  tools/seed-mockup-templates.mjs.
Remaining work: The rendering engine. Two real paths, both requiring
  either the owner or a different environment, not cleverness from inside
  this sandbox: (1) the owner uploads Patchy's Linux build (Flatpak or an
  AppImage/tarball if one exists) directly as a file into this session —
  bypasses the network block entirely, could be tested within minutes;
  (2) build a small Dockerized worker service and deploy it to Render
  (env: docker, not the current env: node — no Dockerfile exists in this
  repo yet), since Render's build/runtime environment has normal internet
  access unlike this coding sandbox — this is a real infra/cost change the
  owner should approve before it's built, not something to do silently.
  Once either unblocks it: run the first real render, confirm or disprove
  the two-stage hypothesis in lib/mockupRenderer.ts's own doc comment, and
  only then activate templates and build the customer-facing Design Studio
  integration (uploading via the existing studio UI into POST
  /api/smart-mockups/render, polling job status, replacing the current
  canvas-compositor preview) and the admin template-management UI page —
  neither of those frontend pieces exist yet, by design, since building
  them around an unverified renderer would risk exactly the "looks done,
  isn't" outcome the owner explicitly warned against repeating.
Blocker: No PSD-compositing renderer is reachable from this sandbox by any
  means (native binary, WASM build, or hosted web editor — all individually
  confirmed blocked by this environment's network policy, not a Patchy-
  specific problem).
Next safe action: Owner uploads a real Patchy Linux build as a file into
  this session (fastest), or approves building+deploying a Dockerized
  render worker to Render. Either way, the very next step after that is
  running one real render against template id 1 (cap black back, already
  registered and Smart-Object-mapped) and honestly reporting whether the
  two-stage architecture actually reproduces Photoshop-fidelity output.
Verification: api-server typecheck clean, tests 38/38 pass; lib/db
  declarations rebuilt after the schema change; migration 007 applied
  cleanly against the local dev DB (confirmed in server boot logs); all
  188 real templates registered/inspected/smart-object-selected through
  the live HTTP API with zero errors; every fail-closed gate (activation,
  customer render on inactive template) and every security check (format
  allowlist, path traversal) verified against real requests, not assumed.
```

---

## 2026-09-26 audit and release checkpoint

Status: ready for review
Last completed: Audited the checkout against `github/main`, confirmed the local
branch is exactly synchronized with the remote, verified the active 188-surface
Smart Mockup staging tree and runtime-role matrix, rebuilt shared database
declarations, passed the full workspace typecheck, passed storefront/API tests
and production builds, restarted the API and storefront workflows, and passed
the live non-mutating smoke suite 30/30 at `https://trynext.shop`.
Stopped at: The public site is already live and the source is already pushed to
GitHub `main`; only this audit checkpoint remains to be committed. The
Smart Object renderer remains fail-closed because no Patchy/native renderer is
available in this environment.
Files/areas changed: This checkpoint updates this handoff and the durable agent
memory only. No application source, runtime assets, or uploaded screenshots were
added to the release.
Remaining work: Provide a real PSD compositor binary or an approved external
worker before activating the 188 Smart Object templates or replacing the current
browser/runtime compositor.
Blocker: No reachable PSD-compositing renderer is available in the current
environment; structural PSD/PSB validity and runtime matrix validity do not
prove Photoshop-fidelity output.
Next safe action: Commit and push this documentation checkpoint. For the
renderer work, upload a Patchy Linux build or explicitly approve a separate
Dockerized worker deployment, then validate one real render before activation.
Verification: `node tools/audit_psd_masters.mjs dist-mockups/staging/smart-v10-v3/masters`
passed 188/188; `node tools/validate-smart-matrix.mjs
dist-mockups/staging/smart-v10-v3` passed 188/188 with matching checksums;
`node scripts/validate-mockup-matrix.mjs` passed 188 surfaces and 1,128 roles
with status `candidate`; `pnpm run typecheck` passed; storefront tests passed
19 files/69 tests; API tests passed 11 files/38 tests; storefront and API builds
passed; `git diff --check` passed; both workflows restarted cleanly; live
critical-flow smoke checks passed 30/30.

---

## 2026-09-26 real PSD compositor checkpoint

Status: blocked — real compositor launch succeeded, Smart Object compositing
failed visual validation

Last completed: Downloaded Patchy v0.99 `PatchyLinux.flatpak` from the public
release and verified its published SHA-256. Flatpak deployment could not finish
through the sandbox's missing D-Bus service, but the app and KDE runtime commits
were imported and Patchy's own runtime loader launched the genuine binary.
Ran the repository's actual two-stage pipeline against
`cap/cap-black-back.psd`: `replaceSmartObjectContent` replaced the linked bytes,
then `render-smart-object.js` opened and exported the modified PSD through
Patchy's documented headless CLI.

Result: the output was a valid non-empty 1024×1024 RGBA PNG, but it was
byte-for-byte identical to Patchy's export of the untouched PSD
(`196996e9d6e6a6d332a23e25ef13cd0ac7223170244023e22b7ada125e5e1387`).
The replacement artwork therefore did not enter the Smart Object composite;
the renderer trusted the stale cached raster. This is a genuine compositor
failure, not a structural PSD failure.

Files/areas changed: `artifacts/api-server/src/lib/mockupRenderer.ts` now
resolves its script path with `fileURLToPath(import.meta.url)`, which works in
the configured `tsx`/CommonJS execution path; the previous `import.meta.dirname`
expression was undefined there. The renderer status comment records the
Patchy result. No runtime assets or template activation state was changed.

Remaining work: Find a PSD compositor that recomputes Smart Object pixels from
updated linked content, or add an explicitly approved render worker using one.
Do not activate the 188 candidate templates or replace the current browser
compositor based on this Patchy result.

Blocker: Patchy v0.99's documented `app.open`/`doc.exportAs` path does not
refresh the modified Smart Object composite in this repository's masters.

Verification: API typecheck passed; real renderer returned `engine: patchy`,
`outputWidth: 1024`, `outputHeight: 1024`, and a non-empty PNG; untouched and
modified exports compared equal with `cmp`; all templates remain fail-closed.
