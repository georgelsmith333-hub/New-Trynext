# Trynext Lifestyle — Agent Handoff

This is the durable, shareable context for the Trynext Lifestyle project. Read it
after `AGENTS.md` and before planning or editing. Keep it updated after meaningful
work. Never put secret values in this file.

For a consolidated Claude handoff, including the latest checkpoint, immediate
open work, project-wide audit checklist, and stale-tracker warnings, also read
`CLAUDE_HANDOFF_CHECKLIST.md`. The newest dated section in this file remains the
primary checkpoint; the checklist does not authorize production changes.

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

---

## 2026-09-26 Photopea renderer integration checkpoint

Status: in progress — Photopea engine implemented; real export remains blocked by
the headless environment's Cloudflare challenge

Last completed: Added a genuine Photopea renderer behind the existing
`MockupRenderer` seam. It launches the available Chromium executable through the
DevTools protocol, loads a configurable Photopea URL, sends the modified PSD as
an ArrayBuffer, waits for Photopea's `done` message, executes
`app.activeDocument.saveToOE("png")`, receives the exported image ArrayBuffer,
and writes the PNG without touching its pixels. `PSD_RENDERER=photopea`,
`patchy`, or `auto` selects the engine; auto prefers Photopea when Chromium is
present. Fixed the compiled API helper-script path for both renderer scripts.

The source inventory is complete for the active staged release: 188 PSD/PSB
masters, 200 source PNGs, 188 previews, 188 proof previews, and the public
1,128-role runtime matrix. The structural master audit, staging checksum
matrix, runtime-role validator, API tests, and full workspace typecheck all
pass.

Stopped at: A real Chromium invocation reached the Photopea URL but received
only the Cloudflare challenge and therefore never emitted `done`; no exported
PNG was accepted. This is an external access blocker, not a PSD parse,
Smart Object replacement, or renderer-cleanup failure.

Files/areas changed:
  - `artifacts/api-server/scripts/render-photopea.js`
  - `artifacts/api-server/src/lib/mockupRenderer.ts`
  - `replit.md`
  - `.agents/memory/photopea-smart-object-renderer.md`
  - `.agents/memory/MEMORY.md`
  - this handoff

Remaining work: Run the Photopea renderer once from an environment that can
pass the Photopea/Cloudflare challenge, confirm the modified export differs
from the untouched baseline, and only then validate/activate templates. No
customer-facing renderer replacement or candidate activation is permitted
before that evidence exists.

Blocker: Photopea is reachable from this headless Chromium only as a
Cloudflare challenge in the current environment. Patchy remains rejected
because its export was byte-for-byte identical after Smart Object replacement.

Next safe action: Set `PSD_RENDERER=photopea` and a reachable
`PHOTOPEA_URL`/Chromium path in an approved worker environment, run the admin
template test-render on one cap master, and require tests 4–9 — especially the
changed-vs-baseline export check — before scaling beyond the representative
surface.

Verification: Photopea helper syntax check passed; API typecheck and bundle
build passed; API tests passed 11 files/38 tests; full workspace typecheck
passed; the 188-master audit passed; the 188-surface staging checksum matrix
passed; the public runtime validator passed 188 surfaces/1,128 roles; API
liveness/readiness returned 200 after restart. The real Photopea attempt
failed closed with `Photopea did not return an export before the timeout`;
no runtime assets or template activation state changed.

---

## 2026-09-28 Browser validator selector fix

Status: fixed and running in the local preview; Smart Mockup templates remain
fail-closed.

Last completed: Fixed the Browser Photopea validator catalog normalization in
`artifacts/api-server/src/routes/smartMockupRender.ts`. The staging manifest
does not persist `surfaceKey`, so the API now derives the canonical
`family/color/view` key before returning catalog rows. The frontend select in
`artifacts/trynex-storefront/src/pages/admin/SmartMockupBrowserValidator.tsx`
is controlled directly by that normalized key. This fixes the issue where
`cap / black / back` could be clicked but would immediately disappear because
every option had an undefined value.

Verification: API typecheck passed; storefront typecheck passed; API tests
passed 11 files/38 tests; storefront tests passed 19 files/69 tests; API and
storefront builds passed; both preview workflows restarted successfully and
reported their ports as ready.

Remaining work: Use the authenticated browser Photopea session to prove one
modified export differs from its untouched baseline, then continue the
representative-family and 188-surface validation. Do not activate templates or
replace the customer compositor before that evidence exists.

Next safe action: Open the local Replit preview at `/admin/mockups`, sign in
normally, and confirm the normalized selector now retains `cap / black / back`
before running the browser Photopea export proof.

---

## 2026-09-28 Mobile artwork upload fix

Status: fixed and live in the local preview.

Observed issue: On Android, the validator showed the selected PNG filename but
then displayed `Could not read the artwork file.` The API logs confirmed that
admin login and the browser catalog both succeeded, so this was a client-side
file-reader failure rather than an authentication or selector problem.

Last completed: Replaced the validator's FileReader-based data URL conversion
with `File.arrayBuffer()` and bounded chunked base64 conversion in
`artifacts/trynex-storefront/src/pages/admin/SmartMockupBrowserValidator.tsx`.
The client now preserves PNG/JPG/JPEG/WebP MIME types and reports explicit
unsupported or empty-file errors.

Verification: Storefront typecheck passed; storefront tests passed 19
files/69 tests; storefront build passed; the storefront workflow restarted
successfully. API remained healthy and the authenticated catalog request
returned HTTP 200.

Remaining work: The real Photopea changed-vs-baseline export proof is still
required before any Smart Mockup activation. No templates or customer
compositor behavior were changed.

---

## 2026-09-28 GitHub publication checkpoint

Status: reviewed validator source published to GitHub `main`; Smart Mockup
activation remains blocked pending real Photopea evidence.

Published commit: `efdf2c2d6e42229130a65e64c7f4c773c2391866` in
`georgelsmith333-hub/New-Trynext`. The GitHub integration verified the branch
ref and confirmed the published catalog normalization, mobile artwork reader,
and Photopea renderer files.

The publication intentionally included functional source and project
documentation only. Local screenshots, pasted evidence files, and the
upload-only test artwork were not copied into the GitHub release commit.

Remaining work: A successful code build, selector response, or PSD byte
replacement is not evidence that all 188 Smart Objects render. The next
release gate is still one real Photopea modified-vs-untouched PNG comparison,
followed by representative-family checks and the full 188-surface run. Until
those exports differ and are visually reviewed, do not claim all 188 work,
activate templates, or replace the customer compositor.

---

## Current continuation — browser payload gateway timeout (2026-09-27)

Status: ready for review — the confirmed production gateway failure is fixed in
the local source and committed, but the Pages deployment still needs to publish
the change.

Last completed: Compared the attached blocker report with the live route and
source. The POST `/api/admin/smart-mockups/browser-payload` request was routed
as a primary write and could be aborted by the shared 3.5-second edge timeout.
Added a route-specific 30-second primary budget for that endpoint only, in both
Cloudflare gateway copies, with regression coverage. Ordinary API writes keep
the 3.5-second timeout.

Stopped at: The focused gateway test, storefront typecheck, API typecheck, local
API/storefront restart, and unauthenticated production probes are complete.
Production POST reaches the primary and returns the expected 401 without admin
credentials; no authenticated PSD pair was requested or accepted.

Files/areas changed: `functions/gateway-config.ts`,
`functions/api/[[path]].ts`, `artifacts/trynex-storefront/functions/gateway-config.ts`,
`artifacts/trynex-storefront/functions/api/[[path]].ts`, and
`artifacts/trynex-storefront/functions/api/gateway.test.ts`.

Remaining work: Publish the reviewed commit to GitHub/Pages, then use an
authenticated browser session to confirm the endpoint returns both PSD payloads
and run the changed-vs-untouched Photopea export proof. Keep all templates
inactive until that proof differs and is visually reviewed.

Blocker: The current headless environment still cannot complete the Photopea
Cloudflare challenge. This checkpoint does not claim Smart Object rendering or
188-surface readiness.

Next safe action: After Pages deploys, run the existing authenticated browser
validator on `cap/black/back`; inspect response timing and require modified and
baseline PNG hashes before any activation.

Verification: Local PSD inspection plus Smart Object replacement measured
126–208ms on the reported cap master. Gateway tests passed 14/14; storefront
and API typechecks passed; local liveness/products probes returned 200; local
and production unauthenticated browser-payload POST probes returned 401.

---

## 2026-09-27 Photopea Smart Object refresh fix

Status: in progress — the next source fix is implemented and locally verified;
the authenticated production retry is still required.

Last completed: Reviewed the new live evidence for `cap/black/back`. The API
returned both PSDs, Photopea opened and exported both 1024×1024 PNGs, and the
modified and baseline SHA-256 values were identical
(`9d83297530b244eb2c921b94682b8ac39cb725d6dcd95e3894d76af98b7e9889`).
The artwork was not visible, so the surface correctly remained unapproved.

Root cause addressed: The server-side `ag-psd` replacement changes the linked
Smart Object bytes, but the browser validator opened the parent PSD and
exported immediately. Photopea can retain the parent's cached Smart Object
composite until the placed layer is explicitly opened, saved, and closed.

Files/areas changed: `artifacts/api-server/src/routes/smartMockupRender.ts`
now returns the exact selected Smart Object layer name. The browser validator
now runs Photopea's documented `placedLayerEditContents` → save → close flow
for the modified PSD, waits for an explicit completion marker, and then
exports the parent. The untouched baseline still exports without mutation.
The script builder and its focused test are in
`artifacts/trynex-storefront/src/pages/admin/photopeaSmartObject.ts` and
`photopeaSmartObject.test.ts`.

Remaining work: Publish this source fix and rerun the authenticated browser
validator on `cap/black/back`. Require a changed modified-vs-baseline hash and
visual artwork evidence before any template activation or broader matrix run.

Blocker: The local headless environment is still blocked by Photopea's
Cloudflare challenge, so this fix has not been claimed as a real compositor
success.

Next safe action: Deploy the updated API and storefront, run the same uploaded
artwork through the validator, and inspect the browser console/status if the
refresh marker is not received. Keep all templates inactive on any failure.

Verification: Storefront tests passed 20 files/72 tests; API tests passed
11 files/38 tests; both typechecks passed; API bundle build passed; the local
cap master resolved the expected layer name and ID, and linked-art replacement
changed the PSD SHA-256 from `22f3c0bf…` to `bfb9afb3…`.

---

## 2026-09-27 Production readiness continuation

Status: ready for review — the merged API/gateway and storefront validator
assets are live; Smart Mockup activation remains blocked on authenticated
Photopea evidence.

Last completed: Reconciled the reported `65cf5f5` merge with GitHub `main`.
Commit `65cf5f5904dc4553ab155bdd00e6b7c2d50b11a8` contains the `a6c2044`
validator fix, and GitHub `main` advanced to
`89fe820bfa5f5414281963a16b26a7a098c40df1`, which includes both. GitHub's
Cloudflare Pages check passed for that revision.

Verification: The live root and `/admin/mockups` returned HTTP 200. Live
`/api/health/liveness` and `/api/health/readiness` returned HTTP 200. An
unauthenticated POST to
`/api/admin/smart-mockups/browser-payload` returned the expected HTTP 401 in
under one second. The live root bundle and lazy-loaded
`AdminMockups-CsveVTho.js` bundle matched the fresh local production build by
SHA-256; the admin chunk contains the
`placedLayerEditContents` refresh marker and `browser-payload` route.
Local API and storefront workflows restarted successfully; API connected to
the healthy database candidate and completed migrations with no errors.

Stopped at: The authenticated browser validator has not been run from this
session, so there is still no accepted modified-vs-untouched PNG pair or
visual proof for `cap / black / back`.

Files/areas changed: No product/runtime source was changed during this
readiness check. The storefront production bundle was rebuilt locally for
comparison. This handoff entry records the live evidence.

Remaining work: Sign in through the existing admin browser session, run the
validator once for `cap / black / back` with asymmetric artwork, record both
PNG dimensions and SHA-256 values, and require visible realistic artwork plus
`changed composite: PASS`. Then repeat representative flat and curved checks
and the documented 188-surface matrix.

Blocker: This environment has no authenticated admin browser session and the
headless Photopea path has previously been blocked by Photopea's Cloudflare
challenge. Do not weaken authentication, activate templates, or replace the
customer compositor to work around this.

Next safe action: Use the normal authenticated admin session at
`https://trynext.shop/admin/mockups` and complete the documented Photopea
proof. Keep every Smart Mockup template inactive until the modified export
differs from the untouched baseline and the artwork is visually reviewed.

---

## 2026-09-27 GitHub publication and preview verification

Status: published and locally verified; Smart Mockup activation remains blocked
on authenticated Photopea evidence.

Last completed: Reconciled the local branch with GitHub `main` without a force
push, published the handoff/runbook updates and the latest attached preview
troubleshooting notes, rebuilt the API and storefront, restarted both managed
workflows, and verified the local and production preview boundaries.

Verification: Local root and `/admin/mockups` returned HTTP 200; local
liveness/readiness returned HTTP 200; production root and `/admin/mockups`
returned HTTP 200; production liveness returned HTTP 200; unauthenticated
browser-payload requests returned the expected HTTP 401. API tests passed
12 files/39 tests, storefront tests passed 20 files/72 tests, API and
storefront typechecks passed, shared library typecheck passed, and both
production builds passed. The local screenshot rendered the storefront with
no browser console errors. GitHub `main` was published at
`627f8a8ae5a6da761c9f5f97b1ae1ff3f3d421dc`; CI and active app verification
were still in progress at the time of this entry.

Remaining work: Complete the authenticated `cap / black / back` browser
validator run, record the modified and untouched PNG hashes, and require
visible artwork plus `changed composite: PASS` before activating any Smart
Mockup template or replacing the customer compositor.

Blocker: This session has no authenticated admin browser session, and the
headless Photopea path has previously been blocked by Photopea's Cloudflare
challenge. Do not weaken authentication or activate templates to work around
this.

Next safe action: Open the normal authenticated admin session at
`https://trynext.shop/admin/mockups`, run the validator once with asymmetric
artwork, and review both output images and hashes.

---

## Server-side Smart Object raster refresh fix (2026-09-27)

Status: implemented on top of current main and locally verified; production deployment still pending.

The browser validator previously replaced only linkedFiles.data, leaving the placed layer raster and stale document composite unchanged. The server now decodes artwork to the placed layer's native dimensions, updates the placed-layer raster, and reserializes the PSD so Photopea receives changed source and changed layer/composite data. This complements the current main browser-side placedLayerEditContents refresh flow.

Verification: API 39/39 tests, workspace typecheck, storefront 69/69 tests, storefront build, API build, and PSD audit 188/188 passed. No templates were activated. The generic mockups:validate-matrix command still references the stale smart-v10 manifest path and is unrelated.

---

## 2026-09-28 Smart Mockup renderer publication and verification

Status: ready for review — the current Smart Mockup source fixes are published and
locally verified; authenticated Photopea visual approval remains intentionally
pending.

Last completed: Reauthorized the GitHub connection, reconciled against the live
remote `main`, and published the current renderer/browser-validator changes as
`85990e8f`. Published the follow-up validator test correction as
`35eb68e1`. The pasted chat transcript was not added to the release.

Files/areas changed: server-side Photopea output conversion and validation
persistence, Smart Object placed-layer replacement/refresh handling, browser
Photopea refresh and export handling, and the focused renderer/validator tests.

Verification: API tests passed 42/42; storefront tests passed 72/72; workspace
typecheck passed; API and storefront production builds passed; the PSD audit
found 188/188 openable masters with one Smart Object each; the Smart Object
release gate passed as `structurally-verified` for all 188 surfaces. Local
liveness, readiness, and products probes returned 200. Protected browser-catalog
and browser-payload probes returned the expected 401 without admin credentials.
The storefront preview rendered without browser console errors.

Stopped at: No authenticated admin browser session is available here, and the
headless Photopea path has previously been blocked by Photopea's Cloudflare
challenge. Therefore there is still no accepted modified-vs-untouched PNG pair
or visual proof for `cap / black / back`.

Remaining work: Run the existing authenticated browser validator with asymmetric
artwork, require different modified and baseline PNG hashes plus visible artwork,
then repeat representative flat/curved checks before any template activation.

Blocker: Authenticated Photopea visual proof is unavailable in this session.
Do not weaken authentication, activate templates, or replace the customer
compositor to work around it.

Next safe action: Open the normal authenticated admin session at
`https://trynext.shop/admin/mockups`, run `cap / black / back`, and review the
two exported images and their hashes.

---

## 2026-09-28 Photopea browser bridge continuation

Status: blocked — the validator hardening is published and locally verified;
authenticated Photopea visual approval remains required.

Last completed: Reconciled the current checkout with GitHub `main`, hardened the
browser validator to accept Photopea live-messaging responses by documented
origin rather than a fragile `event.source` identity, and published the reviewed
three-file source change to GitHub `main` as `a596fbe8`. The pasted transcript and
attached screenshots were not added to the release.

Stopped at: Local services were restarted successfully, but this session still
does not have an authenticated admin browser session for the final Photopea
visual proof.

Files/areas changed:
`artifacts/trynex-storefront/src/pages/admin/SmartMockupBrowserValidator.tsx`,
`artifacts/trynex-storefront/src/pages/admin/photopeaSmartObject.ts`, and
`artifacts/trynex-storefront/src/pages/admin/photopeaSmartObject.test.ts`.

Remaining work: Run `cap / black / back` with asymmetric artwork in the normal
authenticated admin browser, record modified and untouched PNG dimensions and
SHA-256 values, require visible artwork plus a changed composite, then repeat
representative flat and curved surfaces and the documented 188-surface review.
Do not activate any Smart Mockup template before those gates pass.

Blocker: No authenticated Photopea browser session is available in this
session. Headless Photopea has previously been blocked by its Cloudflare
challenge. Do not weaken authentication, bypass the changed-composite gate, or
replace the customer compositor.

Next safe action: Open `https://trynext.shop/admin/mockups` in the normal
authenticated admin session, run the existing browser validator, and review both
exports and their hashes.

Verification: Storefront tests passed 20 files/72 tests; storefront typecheck
and production build passed; API typecheck passed; local root and
`/admin/mockups` returned 200; liveness, readiness, and products returned 200;
the protected browser-payload probe returned the expected 401; both managed
workflows restarted cleanly; and the storefront screenshot rendered without
browser-console errors. The structural 188/188 and Smart Object gates remain
verified from the prior checkpoint. No authenticated visual-composite proof was
claimed.
---

## 2026-09-29 Photopea baseline isolation fix

Status: deployed and locally verified — the browser validator now isolates the
untouched baseline render in a fresh Photopea iframe; authenticated visual
approval remains required.

Last completed: Reviewed the authenticated `cap / black / back` result from
Manus. The modified export visibly contained the asymmetric artwork, but its
SHA-256 matched the untouched baseline exactly, so the Smart Mockup activation
gate correctly failed closed. The likely contamination point was reuse of the
same Photopea session for both modified and baseline exports. Updated the
browser validator to render the baseline in an isolated hidden Photopea
session, remove it after completion, and report the exact Photopea phase and
message on timeout or export failure. The modified preview remains in the
visible session. Published only the three validator/Photopea bridge source
files to GitHub `main`; attached screenshots and transcripts were excluded.

Stopped at: The isolated-browser fix is deployed and present in the live lazy
admin chunk, but has not yet been rerun in the authenticated admin browser.

Files/areas changed:
`artifacts/trynex-storefront/src/pages/admin/SmartMockupBrowserValidator.tsx`,
`artifacts/trynex-storefront/src/pages/admin/photopeaSmartObject.ts`, and its
focused test. The attached continuation transcripts and screenshots remain
untracked and were not added to the release.

Remaining work: Rerun `cap / black / back` with asymmetric artwork. Require
visible artwork plus different modified and untouched PNG SHA-256 values.
Then repeat representative flat and curved surfaces and the documented
188-surface review before any Smart Mockup activation.

Blocker: This session cannot perform the authenticated Photopea browser run.
Headless Photopea has previously been blocked by its Cloudflare challenge.
The live deployment is not blocked: build marker `20260928183646` and the
lazy `AdminMockups` chunk contain the isolation and diagnostic markers.
Do not weaken authentication, bypass the changed-composite gate, or replace
the customer compositor.

Next safe action: Open `https://trynext.shop/admin/mockups` in the normal
authenticated admin session and rerun the validator on `cap / black / back`
with asymmetric artwork. Keep all templates inactive until visible artwork and
different modified/untouched PNG SHA-256 values are both recorded.

Verification: Storefront tests passed 20 files/72 tests (72/72); API tests
passed locally 14 files/42 tests; storefront and API typechecks passed;
storefront and API production builds passed; local root, `/admin/mockups`,
liveness, readiness, and products probes returned 200; the protected
browser-payload probe returned the expected 401; the local storefront workflow
restarted cleanly; the live root returned 200 with the updated build marker;
and the live lazy admin chunk contained the fresh baseline-session,
phase-specific timeout, and Smart Object refresh markers. The final
authenticated visual-composite proof remains intentionally unclaimed.

---

## 2026-09-29 Photopea readiness handshake fix

Status: published and live — local verification complete; authenticated visual
composite proof remains required.

Last completed: Fixed the browser Photopea bridge so iframe load and Photopea's
initial `done` readiness message may arrive in either order, but the PSD is sent
only once both have occurred. The initialization `done` is no longer treated as
PSD-opened; the next `done` after the PSD transfer is the document-open
transition. Smart Object refresh and PNG export remain ordered behind that
transition. Added regression coverage for both readiness orders and the
ready-versus-open distinction. Published the verified validator source and test
through the connected GitHub account; Cloudflare Pages served the new build.

Stopped at: The live bundle is verified, but this session cannot perform the
authenticated browser validation with asymmetric artwork.

Files/areas changed:
`artifacts/trynex-storefront/src/pages/admin/SmartMockupBrowserValidator.tsx`,
`artifacts/trynex-storefront/src/pages/admin/photopeaSmartObject.test.ts`.

Remaining work: Open `https://trynext.shop/admin/mockups` in the normal
authenticated admin session and run `cap / black / back` with asymmetric
artwork. Require visible artwork and different modified/untouched PNG SHA-256
values before activating any template. Then repeat representative flat and
curved surfaces and the documented 188-surface review.

Blocker: No authenticated Photopea browser session is available to this Agent;
headless Photopea has previously been blocked by its Cloudflare challenge.
GitHub CI and active-app verification were still in progress at the last poll.

Next safe action: Use the authenticated admin browser validator on
`cap / black / back`; keep all templates inactive until the changed-composite
gate passes.

Verification: Focused Photopea tests passed 3/3; full storefront tests passed
20 files/74 tests; storefront typecheck passed; full workspace typecheck
passed; storefront production build passed; local storefront and API workflows
restarted cleanly; the local admin route returned the expected unauthenticated
401 boundary; the live root returned HTTP 200 with build marker
`20260928190800`; and the live `AdminMockups` chunk contains the new readiness,
PSD-open, refresh-marker, and phase-specific timeout strings.

---

## 2026-09-29 Authenticated Photopea representative validation

Status: representative browser validation passed; full activation review remains
pending.

Last completed: The authenticated admin-browser report for the live site
confirmed the readiness-gated validator passed all three representative
surfaces: `cap / black / back`, `tshirt / white / front`, and
`mug / white / front`. Each reported visible asymmetric artwork and different
modified versus untouched PNG SHA-256 values. No PSD-open timeout or
received-message error was reported, and no template was activated.

Evidence:
- `cap / black / back`: modified
  `06a2a11316380a8d4823858d5166428dcb2030f2ccd1992d7108f879445d40de`;
  baseline `9d83297530b244eb2c921b94682b8ac39cb725d6dcd95e3894d76af98b7e9889`.
- `tshirt / white / front`: modified
  `a21a3be1ba9074d6965189e650c9302efc551d6edd9eeccd60199580687b0976`;
  baseline `6841336b11f556ee77e6cc20cdd8f68937f77ad697367d86f8c92094362777f0`.
- `mug / white / front`: modified
  `2e18abfd824ef45181433a2ff7eedd9896bddc871580f7c3db600704444213d7`;
  baseline `5621e8e72e20c85fee0e94a5dbf3e535644b44a916ea5d858ee19aa5c5c852c0`.

Stopped at: The report's two screenshot paths point to the separate browser
environment and are not present in this workspace, so the recorded visual
result is attributed to the authenticated browser report rather than
independently re-opened here.

Remaining work: Repeat the documented full 188-surface review before activating
any Smart Mockup template.

CI note: GitHub `CI` passed for the published source commit. The separate
`Active app verification` workflow failed only at its `Run API tests` step;
its GitHub job-log endpoint returned `Forbidden` and the check published no
diagnostic summary. The same local API suite passes 14 files/42 tests, so do
not claim the active workflow failure is a Photopea regression or invent its
root cause without a rerun/log.

---

## 2026-09-29 Full mockup release gate status

Status: structurally ready for all 188 surfaces; not visually approved for
blanket activation.

Completed directly in the workspace:
- Smart Object release gate: passed, `188/188`, structurally verified.
- Canonical matrix: passed, `188/188`, all checksum records match.
- Runtime role matrix: passed, `188/188` surfaces and `1,128` runtime roles.
- Editable masters remain outside public runtime paths.
- Live representative browser evidence already passes for cap, tshirt, and mug.

The authoritative manifests remain fail-closed by design:
`release-manifest.status=structurally-verified`,
`release-manifest.visualApproval=false`, and runtime roles remain
`status=candidate`. Do not pass `--approve-visual`, activate templates, or
promote all surfaces from structural checks alone.

Remaining work: An authenticated browser operator must run the full documented
188-surface Photopea review with visible artwork and changed-composite proof on
every surface. Keep any failed or ambiguous surface inactive.

---

## 2026-09-29 Photopea timeout recovery

Status: recovery fix verified locally; publish before resuming the browser
review.

Reported state: the external review reached `47/188`, with `46` passes and one
failure at `longsleeve / black / back`. The failure was `Runner timeout or
missing terminal state`; the next surface was not executed because the browser
validator button remained unavailable. No results were carried forward and no
templates were activated.

Diagnosis: local preparation of the reported PSD pair completes in about one
second, so the failure is in the browser/Photopea session rather than a slow
server-side PSD payload.

Fix: the browser validator now retries each modified or baseline Photopea
render once after resetting the editor frame, reports the retry phase, and
always returns to a terminal error state after the final failure. The action
button exposes `Retry browser validation` after an error instead of remaining
locked in a non-terminal state. The changed-composite and authentication gates
remain fail-closed.

Verification: focused Photopea tests passed `3/3`; full storefront tests passed
`20 files / 74 tests`; storefront typecheck passed; production build passed; and
the storefront workflow restarted cleanly.

Next safe action: publish this recovery fix, then resume at
`longsleeve / black / back`. Record the existing 46 passes as prior evidence,
rerun the failed surface, and continue through the remaining 141 surfaces.
Do not activate templates until all 188 surfaces have explicit visual proof.

---

## 2026-09-29 Photopea timeout recovery publication

Status: published and locally verified; the authenticated 188-surface visual
review remains pending.

Last completed: Fetched the newer GitHub `main`, merged it without rewriting
history, preserved the readiness handshake, baseline isolation, and timeout
retry behavior, reran the storefront checks, and published the reconciled
history to GitHub `main`. The attached continuation transcript remains
untracked and was not published.

Stopped at: The source fix is live in the repository and local services are
healthy. The browser review must resume at `longsleeve / black / back`, using
the prior 46 recorded passes as evidence and requiring a fresh pass for the
failed surface before continuing.

Files/areas changed:
`artifacts/trynex-storefront/src/pages/admin/SmartMockupBrowserValidator.tsx`,
`AGENT_HANDOFF.md`, and
`.agents/memory/photopea-smart-object-renderer.md`.

Remaining work: Use the normal authenticated admin browser to rerun
`longsleeve / black / back`, continue the remaining documented surfaces, and
keep every template inactive until all 188 surfaces have visible artwork and
different modified/untouched PNG SHA-256 values.

Blocker: This Agent session has no authenticated Photopea browser session.
Headless Photopea remains blocked by its Cloudflare challenge. Do not weaken
authentication, bypass the changed-composite gate, or replace the customer
compositor.

Next safe action: Open `https://trynext.shop/admin/mockups` in the normal
authenticated admin session, rerun the failed surface, then continue the
full review from that checkpoint.

Verification: Photopea focused tests passed `3/3`; storefront tests passed
`20 files / 74 tests`; storefront typecheck and production build passed; API
typecheck and build passed; local storefront and API workflows restarted
cleanly; local storefront/admin and API liveness/readiness/products routes
returned 200; and GitHub `main` matches the reconciled local merge commit.

---

## 2026-09-29 Authenticated Photopea visual release gate

Status: complete — authenticated visual gate passed; templates remain inactive

Last completed: The authenticated browser runner completed the remaining
Smart Mockup review and retried the previously unresolved
`hoodie / burgundy / back` surface in a fresh Photopea session. The operator
reported valid modified and untouched 1024×1024 PNG exports, visible
asymmetric artwork, a changed composite, and different SHA-256 values.

Stopped at: All 188 canonical surfaces have reported successful visual
validation. No template approval, promotion, or activation action was used.

Files/areas changed: `AGENT_HANDOFF.md` only. The proof log and screenshot
remain in the external authenticated runner environment and were not available
as local workspace files for independent inspection in this session.

Remaining work: None for the authenticated 188-surface visual review. Any
future template activation or production promotion is a separate explicit
release action and must preserve the fail-closed approval gate.

Blocker: None for the reported visual gate. This Agent session did not own the
authenticated browser session, so the aggregate result is recorded as
operator-reported evidence rather than locally re-executed evidence.

Next safe action: Keep all templates inactive until the owner explicitly
authorizes promotion. If promotion is requested, inspect the stored proof
record, run the structural/runtime release checks, then perform only the
approved activation path.

Verification: Operator reported `188/188` live visual passes, zero timeout or
message failures, zero hash-equality failures, zero unresolved surfaces, and
successful retry evidence for `hoodie / burgundy / back`. No Meta Ads campaign
was changed or launched.

---

## 2026-09-29 Smart Mockup runtime promotion

Status: complete — promoted, verified, and published to GitHub

Last completed: Applied the explicit owner-authorized Smart Mockup promotion,
recreated the complete four-commit history through the authorized GitHub
connection, and verified that GitHub `main` reaches the same local head.
The v10.3 release manifest now reports `status:verified`,
`visualApproval:true`, and 188 surfaces. The staging source-master manifest
remains `candidate` by design, while both staging and public runtime-role
manifests report `status:accepted` for the reviewed 188-surface runtime.

Stopped at: Publication completed without activating legacy database template
rows or changing customer/order/payment behavior.

Files/areas changed:
`dist-mockups/staging/smart-v10-v3/release-manifest.json`,
`dist-mockups/staging/smart-v10-v3/runtime-roles/manifest.json`,
`artifacts/trynex-storefront/public/mockups/psd-master-v10/runtime-roles/manifest.json`,
`tools/validate-smartobject-release.mjs`, and the capability verifier.

Remaining work: None for the approved promotion scope. No further Smart Mockup
visual review is required for the reported 188/188 authenticated gate.

Blocker: None for GitHub publication. The authenticated proof record remains
in the external runner environment and was not independently re-executed here.

Next safe action: Keep the accepted v10.3 runtime-role package active. Do not
mass-activate legacy database template rows; the canonical customer resolver
uses the accepted runtime-role package.

Verification: Structural release validator passed 188/188 before and after
approval; approval remained intact across a no-flag structural recheck;
capability verification passed 22/22; runtime matrix passed 188 surfaces and
1,128 roles with `status:accepted`; API typecheck and 14 files/42 tests
passed; storefront typecheck, 20 files/74 tests, and production build passed;
both workflows restarted cleanly; local `/`, `/design-studio`,
`/api/health/liveness`, `/api/health/readiness`, and `/api/mockups` returned
200; the API returned 188 rows; the public runtime manifest returned accepted
with 188 surfaces; the final Design Studio screenshot had no browser console
errors; and GitHub `main` was verified at
`58e81e39d7f90c7a34829ce1704f4ff83b5319c4`.

---

## 2026-10-03 Order success, invoices, and Rocket checkout

Status: implementation and local verification complete; clean feature-branch
publication complete. No production deployment was performed.

Last completed: Aligned Rocket wallet support across web checkout, mobile
checkout, and API order/payment-evidence validation. Order invoices now map
Rocket, keep submitted money separate from verified payments, handle refunded
orders without showing an outstanding balance, recognize Dhaka district
variants, and include courier tracking details when available. Mobile success
invoices now use the saved order response for customer, item, and amount data.
The Design Studio control is visibly labeled “Change product”.

Verification: Storefront, API, and mobile typechecks passed; all 84 storefront
tests and 42 API tests passed; storefront production build and mobile web
export completed; API production build completed; web/API/mobile workflows
started; Design Studio preview showed the updated control. No real customer
orders were created. The public settings response contains the `rocketNumber`
field, but the current development database has no configured value, so Rocket
is correctly hidden there until an admin number is saved.

Publication: `fix/waterbottle-white-identity` contains the reviewed functional
source changes based on the verified `main` tip. Pasted notes and screenshot
evidence under `attached_assets` were excluded. `main` was not changed.

The local Replit branch was intentionally left unchanged and still has its
earlier four-commit history. Do not push that local history over the clean
GitHub branch. All 17 tracked pasted-note and screenshot paths were excluded
from the published tree.

Remaining work: None for this verified release. In another Replit remix, fetch
and select `fix/waterbottle-white-identity` before continuing; `main` does not
contain these release changes. If the changes should become the default for
future remixes, ask before merging the feature branch into `main`. Preserve the
water-bottle fail-closed approval gates. Production deployment remains separate
and was not requested.

## 2026-10-03 Cloudflare Pages Smart Mockup production audit

Status: complete for read-only production serving verification. No production
data, Cloudflare configuration, GitHub ref, or deployment was changed.

Last completed: Checked the actual custom domain `https://trynext.shop`, not a
local preview. The storefront and `/design-studio` returned 200 through
Cloudflare; the non-mutating critical-flow smoke check passed 30/30. The live
Smart v10.3 runtime manifest returned `accepted` with 188 surfaces and 188
source masters. `/api/mockups` returned 188 ready/approved rows: 156 PSD and
32 PSB records, all marked `staging-only` for editable-master storage. The
public runtime contains six core roles for each surface plus displacement
roles on 56 surfaces. All 1,134 unique runtime-role PNG files were fetched;
every response was HTTP 200 `image/png` and every SHA-256 matched the manifest.

Live Chromium interactions loaded the T-shirt front/back and black variant,
then switched through long sleeve, hoodie, mug, cap, and water bottle; the
matching live runtime images loaded for each family. No artwork upload, cart,
checkout, order, payment, or application API mutation was performed (Cloudflare
RUM telemetry was observed). This verifies the live derivative/runtime path,
not a new artwork upload through to checkout or a fresh authenticated Photopea
visual-validation run. The browser receives runtime PNGs; editable PSD/PSB
masters remain outside public paths, as intended.

Separate production issue found: a fresh browser could not register
`/sw.js`. Workbox reports conflicting precache entries for `/offline.html`
(one revisioned and one unrevisioned); the live service-worker file itself
returns 200 JavaScript and parses, but fails during evaluation. The online
storefront and Design Studio interactions still work. Local `vite.config.ts`
includes `offline.html` in both the HTML precache glob and
`additionalManifestEntries`. This issue was not changed or deployed.

The current local checkout is `fix/waterbottle-white-identity`, six commits
ahead of `github/main`; those commits include attached notes/screenshots and
change the bottle path to a non-Smart-Object photo while removing it from the
customer Smart Mockup release. Production currently serves the accepted bottle
runtime. Do not push this local history or replace the live bottle runtime
without reconciling the clean published branch and the bottle approval decision.

Stopped at: Read-only production checks and assessment of the local
unpublished diff are complete. No Manus-specific action was present in the
attached note.

Files/areas changed: This handoff only; no application source was edited.

Remaining work: If requested, fix and locally verify the duplicate
`offline.html` precache registration before a separate Pages release. An
authenticated Photopea visual proof and artwork-upload-to-cart flow were not
performed in production.

Blocker: No authenticated admin/Photopea session was available. Production
uploads and commerce writes were intentionally avoided.

Next safe action: Keep the verified live runtime unchanged. Treat the PWA
precache collision and any Manus-specific work as separate, explicitly scoped
follow-ups; do not push the current local branch.

Verification: `https://trynext.shop` route/API/auth-boundary smoke 30/30;
manifest 188/188; 1,134/1,134 unique runtime files returned 200 and matched
their SHA-256 values; public Design Studio family/color/face interactions
passed. The separate service-worker registration failure is recorded above.

## 2026-10-04 Read-only production and order-success audit

Status: read-only audit complete; owner supplied current dashboard results.
No application or provider changes made.

Cloudflare Pages: `trynext-shop-new` serves `trynext.shop` and
`www.trynext.shop`. Its latest successful production deploy is `main` at
`80dbab30692b9e5f202cf9a01594b6abb7981c78`, from 2026-10-01 01:20 UTC.
`API_PRIMARY_ORIGIN`, `API_READ_ORIGINS`, and legacy `API_ORIGINS` are unset.

Render: the current workspace has active Free service
`trynex-lifestyle-main-render`, deployed at `80dbab3…`, and a
`trynex-lifestyle` service suspended by its user. The requested `trynex-api`,
standby-2, and standby-3 names are not present in the current inventory.
Thirty-day telemetry includes an hourly peak near 163.99 MB; the monthly total
and workspace quota remain unknown because the billing page redirected to
login. The live service's Free plan differs from the committed `render.yaml`
Starter plan; trust the dashboard for current service state, not the manifest.

Database and backups: the admin DB Cluster page reports Neon Main online and
active, 1/1 healthy, approximately 467 ms probe latency. All fallback, analytics,
secondary, products, and Replit candidates are unconfigured. Public readiness
also passed, measuring 58 ms for its simpler query. The backup page reports a
closed circuit, zero failures, and no last-run timestamp. Its generic 30-minute
mirror description does not show that a mirror ran; API health says
`backupSyncEnabled=false`. Neon provider-level usage/retention and any separate
backup service are still unverified.

Live routing/cache: public health reports database/catalog and Redis healthy,
`runtimeRole=primary`, scheduler enabled, backup sync disabled, and `storage=r2`.
Safe reads and writes route to the same primary. Two identical product requests
both returned `X-Trynext-Edge-Cache: MISS` and `CF-Cache-Status: DYNAMIC`, and
both reached Render. This is an unresolved code-level cache/egress issue; do not
assume the configured safe-read cache is reducing origin traffic.

Checkout diagnosis: the successful Pages and Render builds use `main` commit
`80dbab306`, which lacks the customer invoice button and success celebration.
The clean remote `fix/waterbottle-white-identity` branch (`a19dbdc5`) contains
the previously verified work from `83868e91`. The feature branch has not been
deployed. Its celebration respects reduced-motion settings and lasts only a
few seconds. No production order was created.

Release safety: the local checkout is not a safe push target. It is seven
commits ahead of `github/main`, differs from the clean feature branch in
handoff/evidence files, and has two untracked user attachments. Do not push it.
Review/reconcile the clean feature branch against live `main` and preserve the
water-bottle approval gates before any merge or deployment.

Separate known issue: Workbox's duplicate `offline.html` precache entry breaks
fresh service-worker registration. It was not fixed in this audit.

Stopped at: current Render workspace quota/monthly total and Neon provider-level
usage/backup retention remain unknown. No production order/payment/admin write,
provider setting, application source, commit, push, or deployment was changed.

Next safe action: wait for direction on whether to review the clean checkout
release branch, fix the code-level cache/PWA issues first, or pause for provider
usage details. Never request or share provider tokens, passwords, or database
URLs.

Verification: production storefront, products, sitemap, liveness, readiness,
healthz, and repeat safe-read cache behavior were checked read-only. The owner
provided Cloudflare, Render, and DB/backup status summaries. No app build/test
was rerun because application source was not changed.

## Approved follow-up work — 2026-10-04

Status: owner asked to complete both the invoice-branch review and the cache/PWA
work. This authorizes local review and code fixes, not a production release.

Order of work:
1. Compare clean remote `fix/waterbottle-white-identity` (`a19dbdc5`) with the
   deployed `main` commit (`80dbab306`); identify the precise release scope and
   preserve all water-bottle approval gates.
2. Diagnose and fix safe-read API cache misses without caching cookie-bearing,
   authenticated, searching, or otherwise user-specific responses. Verify an
   identical public catalog request can produce a cache hit and still routes
   correctly.
3. Fix duplicate `offline.html` precaching; verify a fresh service-worker
   install/evaluation with exactly one offline-shell entry.
4. Run relevant storefront tests/build and inspect the final diff. Keep changes
   local; do not merge, push, deploy, submit an order, or change provider
   configuration without separate approval.

Owner evidence still needed for infrastructure conclusions: current Render
workspace monthly outbound total/quota and Neon provider usage/backup-retention
status. Cloudflare's API-origin overrides are unset, so no override change is
currently indicated. Ask the owner for the remaining non-secret readings if
they become necessary; never request credentials.

## 2026-10-04 Local verification of approved follow-up work

Status: local implementation and verification complete; no production release.
This section supersedes the earlier checkout-count snapshot: the current
workspace is 10 commits ahead of `github/main`, and six untracked screenshot
attachments remain untouched.

Why the order-success and invoice work remained pending: the clean remote
`github/fix/waterbottle-white-identity` branch at `a19dbdc5d` contains the
reduced-motion-aware `OrderSuccessCelebration`, invoice PDF generator, and
customer download buttons in Checkout and Track Order. Deployed
`github/main` remains at `80dbab306` and does not contain that feature set.
The handoff's pending status was therefore a release/integration boundary, not
evidence that the feature code had not been written. The feature branch was not
merged to `main` or deployed.

Local checks and changes:
- Celebration source uses `useReducedMotion()` and renders no confetti when
  reduced motion is requested; its particles finish in about 2.8–3.7 seconds.
  No order was submitted to verify this against production.
- The invoice test calls the real PDF generator in a temporary working
  directory, reads the generated file, verifies the `%PDF` signature and
  non-trivial size, then removes it. This verifies Node-side PDF generation and
  safe naming; a browser/device download event has not been verified.
- Mobile shop filters now have a labelled 44px trigger, active-filter count,
  right-side accessible drawer, focus/escape handling, safe-area spacing, and
  scroll locking. Current and improved states are available in the isolated
  design-system preview; both were visually checked at 402×874.
- The Pages API cache only stores safe public catalog GETs. Cookies,
  authorization, search/unknown query parameters, unknown `x-` headers, and
  unsafe response headers/statuses bypass storage. Local cache and invoice
  tests passed; this is not a live Cloudflare cache-hit measurement.
- Workbox excludes `offline.html` from the glob and adds it explicitly once.
  The generated service worker has one `/offline.html` precache manifest entry;
  its second occurrence is the runtime offline fallback.

Verification: storefront suite passed (23 files, 96 tests); targeted cache and
invoice tests passed (19 tests); storefront typecheck and production build
passed; mockup sandbox typecheck/build passed; `git diff --check` passed.

Safety: COD/25% advance and payment/order safeguards remain in place; no order
or payment was created, no mockup approval gate was bypassed, and Cloudflare,
Render, and Neon settings were not changed. The API Server workflow was not
started. Six untracked customer-provided screenshots remain unstaged.

Next safe action: ask before reconciling or pushing this checkout to GitHub
`main`; doing so may trigger production deployment. Until then, keep all changes
local and do not merge, push, deploy, or change provider configuration.

## 2026-10-04 Consolidated Claude handoff checklist

Status: documentation complete; no application source or provider configuration
changed.

Last completed: Reviewed `AGENTS.md`, `AGENT_HANDOFF.md`, `replit.md`,
`docs/trynext-agent-handoff-prompt.md`, and the project rebuild tracker. Added
`CLAUDE_HANDOFF_CHECKLIST.md` as a self-contained transfer document covering the
latest verified state, immediate remaining work, project-wide audit areas,
release limits, and stale-document handling. Marked the older Smart Mockup
prompt as historical in the new checklist; it must not be treated as the active
release plan.

Stopped at: The approved cache/PWA and invoice source work is locally verified.
Production reconciliation, push, merge, deployment, and provider changes remain
outside the approved scope. Invoice browser/device download behavior and live
Cloudflare cache-hit behavior have not been verified.

Files/areas changed:
- `CLAUDE_HANDOFF_CHECKLIST.md`
- `AGENT_HANDOFF.md`
- `docs/trynext-agent-handoff-prompt.md`

Remaining work: Use the checklist to verify invoice browser downloads and
determine whether mobile shop-filter preview work is integrated into the app.
Resolve the configured remote versus historical canonical repository mismatch
before any GitHub write. Obtain separate approval before release actions.

Blocker: No blocker for this documentation work. Release actions require
separate owner approval; current production cache behavior requires an approved
deployment to verify.

Next safe action: Start the next coding session by reading
`CLAUDE_HANDOFF_CHECKLIST.md` and the newest `AGENT_HANDOFF.md` section, then
continue with local, non-mutating invoice and mobile integration verification.

Verification: Cross-checked the latest 2026-10-04 handoff section against the
current Git branch/status output. The configured remote discrepancy and the
historical untracked-attachment note are explicitly flagged for rechecking.
No application tests were rerun because application code was not changed.

## 2026-10-04 Claude Code and GitHub development-home handoff

Status: handoff files prepared; GitHub publication is pending repository
selection. No application code, provider configuration, or production data was
changed.

Last completed: Added root `CLAUDE.md` as Claude Code's automatic project entry
point. Updated `CLAUDE_HANDOFF_CHECKLIST.md` with the owner's GitHub/Claude Code
transition request and the publication boundary. Updated this handoff and
`replit.md` to distinguish future GitHub development from Replit-specific
environment notes.

Stopped at: The owner asked to push the project to GitHub and continue full-stack
development there. The connected GitHub account can access both
`georgelsmith333-hub/New-Trynext` (the configured remote, recently active) and
`georgelsmith333-hub/trynext-lifestyle` (the repository named in the older
prompt). The destination has not yet been selected.

Files/areas changed:
- `CLAUDE.md`
- `CLAUDE_HANDOFF_CHECKLIST.md`
- `AGENT_HANDOFF.md`
- `replit.md`

Remaining work:
- Owner selects the destination repository.
- Prepare a clean, reviewed non-default branch from that repository's current
  default-branch tip and publish it; do not push the existing local history
  wholesale.
- Verify the handoff branch and files through GitHub.
- Keep pasted chat records, customer screenshots, credentials, and unrelated
  attachments out of the transfer.
- Do not merge to `main`, deploy, or change provider settings without separate
  approval.

Blocker: Destination repository is ambiguous. The current local branch is 12
commits ahead of its tracking ref and its 79-path delta includes 27
`attached_assets/` files (pasted chat records and screenshots); publishing that
history wholesale would expose unrelated user-provided material. A clean
reviewed transfer branch is required.

Next safe action: Ask the owner to choose `New-Trynext` or
`trynext-lifestyle`; then compare against the selected repository's current
default branch and prepare a filtered, non-default handoff branch.

Verification: Confirmed the current branch, upstream, configured remote, ahead
count, and changed-path inventory without changing refs. The connected GitHub
account reports access to both candidate repositories. `CLAUDE.md` and the
checklist are linked together. No push or deployment was performed.

## 2026-10-04 — Destination confirmed and pre-release checks

Status: A clean candidate branch is on GitHub. The production `main` branch is
unchanged; pull-request checks and the live merge are still pending.

Last completed: The owner selected `georgelsmith333-hub/New-Trynext` and
explicitly authorized a live push if safety checks pass. GitHub's `main` was
verified at `80dbab30692b9e5f202cf9a01594b6abb7981c78`. Tree comparison found no
required source or public assets to copy from `trynext-lifestyle`; its only
old-only code file is an unused Studio V2 3D viewer. Do not copy it.

Verification completed locally:
- API tests pass with database environment variables unset: 14 files, 42 tests.
- Storefront tests pass: 23 files, 96 tests.
- Workspace typecheck and the full workspace production build pass.
- Mobile typecheck passes.
- Smart mockup matrix accepts all 188 surfaces and 1,128 runtime roles.
- `git diff --check` passes.
- GitHub's current root CI passed. Its Active App Verification had failed on the
  previous `main` because a pure validation test imported a database-dependent
  API route. The validator is now isolated in a database-independent module;
  verify the fix in pull-request CI before merging.

Stopped at: `claude-handoff-2026-10-04` was created directly from the verified
`New-Trynext/main` tip `80dbab30692b9e5f202cf9a01594b6abb7981c78` and has since
been advanced by handoff-only commits. Re-read the branch ref to get its current
tip before continuing. The branch contains only the reviewed 54-file candidate;
all 27 `attached_assets/` paths, local commit history, and Replit-only
`.agents/memory` notes were excluded. PR #2 is open with the verified base and
head and exactly 54 changed files; the GitHub PR file list contains no excluded
paths. Required checks and the live merge are pending.

Files/areas changed: Checkout/invoice/payment and mobile order-flow work from the
local branch, product/catalog and edge-cache changes, Smart Mockup validation
test isolation, and the Claude Code handoff documents. The release tree contains
81 changed paths relative to the last verified local tracking ref; 27 attachment
paths are excluded.

- Wait for the pull-request checks, including Active App Verification, on the
  final PR head.
- Merge only if all required pull-request checks pass.
- After the live update, verify the storefront, API health, catalog cache
  behavior, sitemap, and accepted Smart Mockup runtime on `trynext.shop`.
- Do not create a test order, payment, or production-data mutation.
- Browser/device invoice-download checks remain safe follow-up verification; do
  not create a real order to perform them.

Blocker: No local blocker. Pull-request checks and production health are still
pending.

Next safe action: Monitor PR #2's checks. Recheck the base branch and verify all
required checks are green immediately before merging.

Verification: `pnpm run typecheck`, `pnpm run build`, `pnpm run validate:mockups`,
the API and storefront tests, `git diff --check`, and 30/30 read-only live
critical-flow checks all passed. The candidate path scan found no
high-confidence credential patterns. No provider settings, database data,
orders, or payments were changed.

## 2026-10-04 Claude Code session — post-merge reconciliation and invoice verification

This section supersedes the "Destination confirmed and pre-release checks"
section above, which still describes PR #2 as open. Times are UTC; the repo's
"2026-10-04" dates are Dhaka local time (UTC+6).

```text
Status: in progress — verification pass complete for checklist items A and B;
  item C blocked by the session's network policy. Docs-only change; no
  application source was edited. Not merged to main, not deployed.
Last completed:
  - Fetched GitHub. origin/main is 2549742 ("Reviewed Trynext release and Claude
    Code handoff (#2)"). PR #2 was MERGED by the owner on 2026-10-03 22:22 UTC.
    CI and Active app verification both succeeded on that commit. The previous
    main (80dbab3) had failed Active app verification; the database-independent
    validator fix resolved it.
  - Remote branch review: claude/ecom-customization-itpg9o and
    manus/photopea-browser-validator are fully contained in main;
    claude-handoff-2026-10-04 has a tree identical to main (pre-squash PR
    branch); fix/waterbottle-white-identity (2 commits from 2026-10-03) is older
    than main and differs by 24 files where main has the newer work. Nothing was
    merged from any of them. The remote copy of claude/nice-carson-nxjq7q did
    not exist at fetch time.
  - Baseline on 2549742: pnpm install --frozen-lockfile OK; pnpm run typecheck
    passes for all packages; storefront tests 23 files / 96 tests pass; API
    tests with DATABASE_URL* unset 14 files / 42 tests pass.
  - Item A (invoice downloads): verified in headless Chromium against the local
    Vite dev server with every /api call served from fixtures (fake customer
    data, non-localhost requests aborted, any unmocked write aborted and
    recorded — none occurred). A real browser download event fired for Track
    Order (desktop 1280x800 and phone 390x844) and for Checkout success (COD and
    bKash wallet paths, both viewports). Filename is
    Trynext-Invoice-<orderNumber>.pdf; each file is a valid 1-page A4 PDF
    (%PDF- header, %%EOF trailer, about 10.4-10.7 KB). pdftotext confirmed order
    number, customer name/phone/email/address, payment method, items, totals,
    the 25% advance (1,100 total -> 275 advance, 825 on delivery), settings-
    driven store name and contact block, and "Payment submitted — awaiting
    verification" without crediting unverified payment. Dates render in
    Asia/Dhaka by design. No page exceptions.
  - Item B (mobile shop filters): NOT integrated in the Expo app.
    artifacts/trynext-mobile/app/(tabs)/shop.tsx has only inline search,
    category chips, and sort pills. The drawer exists in the isolated
    artifacts/mockup-sandbox previews, and in the WEB storefront
    (artifacts/trynex-storefront/src/pages/Products.tsx): 44px labelled trigger
    with active count, aria-modal dialog, Escape handling, focus trap, body
    scroll lock, and safe-area padding. The web drawer was inspected in code
    only in this session, not exercised in a browser.
Stopped at: Item C — the live cache check could not run. The session's egress
  policy denied trynext.shop:443 (CONNECT 403, logged by the agent proxy).
Files/areas changed: AGENT_HANDOFF.md and CLAUDE_HANDOFF_CHECKLIST.md only.
Remaining work:
  - Item C: after trynext.shop is allowed for this environment (or from a
    machine with access), send the same anonymous public catalog request twice,
    for example /api/products?limit=4&includeTotal=false (both parameters are on
    the cache allowlist), and record X-Trynext-Edge-Cache,
    CF-Cache-Status, and whether the second request is a HIT. Also confirm the
    PR #2 deployment actually went live (Cloudflare was not visible from here).
  - Real-device or Safari invoice download is not verified; Chromium only.
  - Authenticated-customer Track Order and an unmocked backend were not tested.
  - Expo shop filter drawer is follow-up work and needs owner approval as scope.
  - Reconcile PROJECT_REBUILD_TRACKER against current code (not started).
  - Optional: browser-check the web Products.tsx filter drawer at narrow/tall
    viewports.
Blocker: Network policy denies trynext.shop for this session (item C only).
Next safe action: Allow trynext.shop under the environment's network settings and
  run the two-request cache check, or ask the owner for the headers.
Verification: Commands and results are as listed above. Test fixtures and
  scripts were kept outside the repository. The dev server was stopped. No
  production request was made, and no order, payment, provider setting, or
  database was touched.
Observations (not changed):
  - src/lib/psdSmartObject.test.ts in the API package takes about 3.3 s alone but
    up to about 5.6 s when other test files run in parallel, against Vitest's 5 s
    default; it timed out twice in this session. FIXED in the next section by a
    30 s per-test timeout (not a skip).
  - Mobile checkout summary reads "Order Summary (1 items)" (pluralization).
```

## 2026-10-04 Backend audit and first fixes (Claude Code session)

```text
Status: in progress — audit complete; first fixes verified locally and on PR #3
  (claude/nice-carson-nxjq7q). Not merged to main, not deployed.
Last completed:
  - Static routing audit of artifacts/api-server/src/routes: 222 literal
    router.<method>("path") registrations across 40 routers, mounted order
    checked: 0 duplicate method+path pairs and 0 static routes shadowed by an
    earlier parameterised route. Limit: routes registered with a variable path,
    a regex, or router.use(path, ...) were not scanned.
  - AI endpoints: every outbound provider fetch in routes/ai.ts and
    routes/aiExecute.ts had an abort timeout except one. FIXED: the Pollinations
    fallback in POST /api/ai/developer/chat (admin only) now has a 60 s connect
    timeout; before, a hung fallback held the request open until the gateway cut
    it. Public AI routes are rate limited by aiLimiter in app.ts.
  - Admin health (GET /api/admin/system/health) reported config, not health:
    * Redis showed "ok" whenever the env vars were set, even during a real
      Upstash outage (the check wrote to the in-process fallback cache, which
      never throws). FIXED: it now uses getRedisStatus(), as the public
      /healthz already did.
    * The DB ping had no timeout and its latency was never returned. FIXED:
      database and Redis probes now have a 5 s deadline and return latencyMs and
      a fixed, secret-safe detail ("timed out" / "unreachable") on failure.
      Response additions are additive; services.<name>.status is unchanged.
  - New test file src/routes/systemHealth.test.ts (9 tests). Mutation-checked:
    reintroducing the old Redis behaviour makes the outage test fail.
  - psdSmartObject.test.ts got a 30 s per-test timeout (see the note above).
Stopped at: Fixes verified locally; PR #3 CI pending on the new commit.
Files/areas changed: artifacts/api-server/src/routes/ai.ts,
  artifacts/api-server/src/routes/systemHealth.ts,
  artifacts/api-server/src/routes/systemHealth.test.ts (new),
  artifacts/api-server/src/lib/psdSmartObject.test.ts, and this file.
Remaining work:
  - storage, Telegram, and auth entries in the admin health response are still
    "ok" from configuration alone (storage is hard-coded "ok"); they are not
    live probes. Decide which are worth probing without cost or side effects.
  - Admin "live health" page (realtime health, request/error rate, latency,
    recent errors, live change feed) is designed but not built; it needs the
    owner's go-ahead on polling cadence and scope. Render Free plan limits
    mean small payloads and tab-visible polling only, no always-on streaming.
  - Real production errors cannot be seen from this session (network policy
    denies trynext.shop). Ask the owner for non-secret error text from the admin
    Activity Log, Render logs, or the browser console.
  - Live deployment and live cache behaviour remain unverified (see above).
Blocker: None for local work; production visibility is blocked by network policy.
Next safe action: Wait for PR #3 CI, owner review of the preview, and the
  owner's decision on release gating; then build the admin live-health page on a
  fresh branch from main after PR #3 merges.
Verification: API typecheck passes; API suite 15 files / 51 tests pass on two
  consecutive runs with DATABASE_URL* unset; node ./build.mjs succeeds; the new
  Redis-outage test fails against the old behaviour and passes with the fix.
  No production request, order, payment, or data change was made.
```

## 2026-10-04 Live Health page, crash and error fixes, mockup readiness (Claude Code session)

This continues the section above, whose pull request (#3) was merged to `main` as
`dd6f1e2` after CI passed. This work is on branch `claude/nice-carson-nxjq7q`,
restarted from that `main`, and is delivered by the pull request that carries
this section. At the time of writing it is pushed for review and **not merged and
not deployed**; GitHub, not this file, shows what happened afterwards.

```text
Status: ready for review — verified locally against a real API and database.
Last completed:
  1. Admin "Live Health" page (/admin/live-health, sidebar: System > Live Health).
     API: GET /api/admin/system/live (admin only, no-store, about 6 KB) returns
     real database and Redis probes (5 s deadline, measured latency, shared for
     5 s across tabs), process memory, event-loop lag, a rolling 60-minute
     traffic window (requests, 4xx, 5xx, p50/p95 from a fixed histogram),
     slowest and failing routes, redacted recent server errors, and a count-only
     backup summary. Counters live in memory (lib/requestMetrics.ts, bounded: 60
     buckets, 200 routes, 50 errors) and reset when the API restarts or sleeps;
     the page says so. Probes, uptime pings and the live endpoint itself are not
     counted. Page: refreshes every 10 s only while the tab is visible, Pause /
     Resume (Resume refreshes at once), overall verdict with plain-language
     findings (thresholds in src/lib/liveHealth.ts), traffic and p95 charts,
     routes tables, recent errors, and a live feed of admin changes from the
     existing activity log. When the API cannot reach its database the admin
     endpoint answers 500 (sessions are verified in the database), so the page
     reads the public /healthz to say "API running, database down" and keeps the
     last good numbers on screen marked Stale.
  2. API process crash fixed. When Postgres dropped an idle connection (restart,
     failover, Neon idle suspend) pg emitted an unhandled pool 'error' and Node
     killed the whole API. Reproduced by stopping a local Postgres; every pool in
     lib/db and the API now has an error listener (lib/db/src/index.ts, and
     api-server src/lib/poolGuard.ts for the backup-sync and cluster-probe
     pools). Re-run: the API stayed up, /healthz reported db "error", and it
     recovered by itself.
  3. Global error handler moved to src/lib/errorHandler.ts. Malformed JSON,
     oversized and wrongly encoded bodies now return 400 / 413 / 415 (they were
     HTTP 500 with a raw parser message and an error log); real server errors
     return a generic message in production (no SQL or internal text) and are
     recorded redacted for the Live Health page; a response that has already
     started is handed to Express so the connection closes instead of hanging.
  4. Duplicate category and blog slugs return 409 (they were 500); helper in
     src/lib/dbErrors.ts. Hampers and customer signup already did.
  5. Smart Mockups checked, nothing changed except one tooling default.
     validate:mockups: accepted, 188 surfaces, 1,128 runtime roles.
     mockups:validate-matrix now defaults to dist-mockups/staging/smart-v10-v3
     (it pointed at a folder that does not exist): 188/188, all checksums match.
     mockups:audit-psd: 188/188 masters open and contain real Smart Objects.
     Browser check of the Design Studio for all six families at 1440 and 390 px
     with a real artwork upload: only canonical /mockups/psd-master-v10/ files
     were requested, all 200, zero page or console errors, artwork composited on
     the real photographic mockups. The five released families (T-shirt, long
     sleeve, hoodie, mug, cap) are ready.
  6. Water bottle deliberately stays on hold. Server (routes/orders.ts, 409
     "mockup_not_approved") and Studio (Add to Cart and Export disabled with a
     notice) both block custom bottle orders; routes/mockups.ts keeps bottle
     rows out of the customer set. The proof previews in
     dist-mockups/staging/smart-v10-v3/proof-previews/waterbottle/white/ show the
     print-area box left of centre and overhanging the bottle's left edge on
     front and back, so the hold is correct, not stale.
  7. Old July tracker reconciled with evidence (see PROJECT_REBUILD_TRACKER/
     All Tasks Left To Do/CRITICAL_FINDINGS.md, "Reconciliation 2026-10-04"):
     most items verified fixed, several stale, backup-sync TRUNCATE recorded as
     "changed" (it is transactional with rollback, source-empty skip and schema
     check; do not alter without owner approval), a few still open.
  8. Whole-API sweep on the real local API: 144 requests over 72 parameter-free
     GET routes, anonymous and admin, gave no 5xx, no hangs, nothing over 2 s.
     AI endpoints: bad input is 400, an unreachable provider is a clean 502 in
     under half a second, admin developer chat falls back to the local agent.
     Customer and admin login verified. Routing audit unchanged (222 routes, 0
     duplicates, 0 shadowed).
Stopped at: Everything verified; pull request open for review.
Files/areas changed:
  - API: src/app.ts, src/lib/{requestMetrics,errorHandler,poolGuard,dbErrors}.ts
    (+ tests), src/routes/{systemHealth,categories,blog,dbCluster}.ts,
    src/lib/dbBackupSync.ts (pool guard only), lib/db/src/index.ts (pool guard).
  - Storefront: src/lib/liveHealth.ts (+ tests), src/pages/admin/AdminLiveHealth.tsx,
    App.tsx route, AdminLayout.tsx nav entry.
  - tools/validate-smart-matrix.mjs (default staging root), PROJECT_REBUILD_TRACKER/*
    (superseded banners, reconciliation), this file, CLAUDE_HANDOFF_CHECKLIST.md.
Remaining work:
  - Water bottle: correct the print-area geometry (PSB master and its runtime
    print-mask role, then regenerate the checksum-bound roles). Measured from
    the runtime base images (1024x1024, rows y=320..910): the manifest uses one
    zone x=335..611 (w 276) for both faces. Front body spans x=368..652
    (centre 510), so the zone is 37 px left of centre and overhangs the left
    edge by 33 px; back body spans x=379..644 (centre 511.5), 38.5 px off and
    44 px overhang. Proposed, centred and 84% of the body width, per face:
    front x=391..630 (w 239), back x=400..623 (w 223), both y=320, h=590.
    Proposal images were sent to the owner (red = current, green = proposed).
    This is a proposal only: nothing in the accepted runtime was changed.
    Regenerate the proof, get the owner's visual approval, and then continue:
    proof, get the owner's visual approval, and only then add "waterbottle" to
    CUSTOMER_RELEASED_CATEGORIES (routes/mockups.ts), remove the 409 gate in
    routes/orders.ts, and lift the Studio hold. Never promote it on a structural
    pass alone.
  - After deployment: open /admin/live-health on trynext.shop with an admin
    session and confirm it shows database and Redis latency; run the cache check
    from the earlier section. This session's network policy denies trynext.shop,
    so nothing here has been verified on the live site.
  - Storage, Telegram and auth entries in the admin health response are still
    configuration checks, not live probes.
  - Live Health figures are per process. If the API ever runs as more than one
    instance, each instance reports only its own traffic.
  - Not audited for 409 handling: other write routes with user-supplied unique
    values (for example promo codes and product slugs).
  - Real-device or Safari invoice download; an authenticated-customer session test.
Blocker: None for the code. Live verification needs trynext.shop allowed in the
  environment's network settings, or an owner with browser access.
Next safe action: Review and merge the pull request when CI is green, then do the
  post-deploy checks above. Rollback is a revert of the merge commit.
Verification: workspace typecheck passes; production build passes (exit 0); API
  suite 19 files / 109 tests and storefront suite 24 files / 125 tests pass with
  DATABASE_URL* unset; mockup gates as in item 5. Regression tests were
  mutation-checked (put the old behaviour back, the test fails). Real end-to-end:
  headless Chromium drove /admin/live-health against the real API on a throwaway
  local Postgres, 27/27 checks including a live change appearing without a
  reload, polling every 10 s, Pause stopping it, a real database outage shown as
  Critical with the reason and stale numbers, and automatic recovery. The
  throwaway database and local servers were removed afterwards. No production
  request, order, payment, provider setting or production data was touched.
How to repeat the local end-to-end setup (scripts are not in the repo):
  pg_ctlcluster 16 main start; create a throwaway role and database as the
  postgres user; run `pnpm --filter @workspace/db run push` with DATABASE_URL set
  to it (empty database only); build with `node ./build.mjs` in artifacts/api-server;
  start with NODE_ENV=development, PORT=8082 and throwaway values for DATABASE_URL,
  JWT_SECRET, ADMIN_JWT_SECRET (different), ADMIN_PASSWORD and ALLOWED_ORIGINS; start
  the storefront with `pnpm --filter @workspace/trynext-storefront run dev`, which
  proxies /api to port 8082; sign in via POST /api/admin/login. Never point any of
  this at a real database.
```

## 2026-10-04 Broken product images fix (Claude Code session)

- **Status:** local → committed → pushed on branch `claude/nice-carson-nxjq7q`; merge/deploy state is recorded by the PR, not here.
- **Root cause:** `functions/mockups/[[path]].ts` answers 410 for every `/mockups/` URL outside `psd-master-v10/runtime-roles/`. Old product rows, cached bundles, saved carts and several hard-coded paths (water bottle, Instagram hoodie, mobile Design tab) still pointed at retired files, so production showed broken images.
- **Last completed:**
  - `src/lib/legacy-mockup-url.ts`: maps any retired `/mockups/` URL to the approved Smart v10.3 photo of the same product, colour and face (placeholder if unknown). The bottle only ever maps to the one approved white photo.
  - `resolveImageUrl` and `getCustomerProductImage` repair retired URLs; raw `src` in Hampers, Account, Navbar, Cart, popups, lightbox, 404 now go through `resolveImageUrl`.
  - `src/lib/image-fallback.ts` (installed in `main.tsx`): a failed image retries once with the repaired URL, then the placeholder.
  - Mobile: `lib/mockup-url.ts` (copy of the mapping, kept equal by a storefront test) used by Design tab, cart, product screen.
- **Files/areas changed:** storefront `src/lib`, `components`, `pages`, `main.tsx`; mobile `lib/mockup-url.ts`, `app/(tabs)/design.tsx`, `app/cart.tsx`, `app/product/[id].tsx`. No API, database, provider or bottle-hold change.
- **Verification (local):** storefront 150 tests, API 114 tests, workspace typecheck, mobile typecheck, `git diff --check`; browser crawl on a local API + throwaway Postgres: 80 page loads (40 pages × 2 viewports), 0 broken images, homepage 31/31 approved photos load. `verify:critical-flows` could not run here (it targets the live domain; the sandbox proxy returns 403).
- **Remaining work:** live check of `trynext.shop` after deploy (network blocked here); work through the owner's `reports.md` backlog (not started; P0 first).
- **Blocker:** live domain not reachable from this sandbox.
- **Next safe action:** merge after green CI, then start `reports.md` P0 items in small PRs. Water-bottle hold stays until the owner visually approves.

## 2026-10-04 `reports.md` first pass (Claude Code session)

- **Status:** PR #6 (image fix) is merged to `main` as `075d139` (CI green: typecheck/test/build, build-and-check, security-scan, Cloudflare Pages preview). Deployment of that commit is not verified from this sandbox.
- **`reports.md` read in full.** P0 triage:
  - **P0-A bottle print zones:** needs a versioned proposal plus the owner's visual approval before any checksum-bound asset is regenerated. Measurements and proposed zones are already in the earlier bottle section. The customer hold (`409 mockup_not_approved`) stays. Not started.
  - **P0-B live verification:** blocked. The sandbox proxy returns 403 for `trynext.shop` and `*.pages.dev`, so `scripts/verify-critical-flows.mjs` (which targets the live host) cannot pass from here. Operator action: allow those hosts in the environment network settings, or run the script from a machine that can reach them.
  - Health alias reconciliation (checked in code): `render.yaml` `healthCheckPath` is `/api/health/readiness`; the API serves `/healthz`, `/health/liveness`, `/health/readiness` and `/readyz` (same handler), and `functions/gateway-config.ts` proxies `/healthz` and `/readyz`. No mismatch found.
  - **P0-C real errors:** needs the Admin Activity Log / Render log content from the owner (redacted). Not available here.
- **Remaining work:** catalog, Studio geometry, checkout, admin, performance and security sections of `reports.md` (sections 4 onward), each as a small reviewed PR. Next safe action: start section 5's transform double-scale invariant test (no data or provider impact).
- **Blocker:** items above that need owner approval, network access or real logs.

## 2026-10-04 P0 implementation and live verification checkpoint

Status: frontend implementation published and auto-deployed; read-only live verification passed.

Implemented in commit `bbe58d2`:
- Replaced the shared water-bottle front zone with the measured normalized proposal (`x=382, y=313, w=233, h=576`) and added an independently narrower back zone (`x=391, y=313, w=218, h=576`).
- Kept the canonical mockup contract aligned with those front/back zones.
- Added one shared image-transform convention: rendered dimensions use `natural dimensions × scale × relative axis`; composer, selection sizing, and processed-image replacement now use the same rule.
- Added regression coverage for bottle-zone dimensions/centering and same-size/different-size processed-image replacement invariants.

Verification:
- Storefront: 27 test files / 155 tests passed; typecheck passed; production build passed.
- Workspace typecheck passed, including API, storefront, mobile, scripts, and supporting artifacts.
- API: 20 test files / 114 tests passed.
- Smart mockup matrix: 188 expected surfaces / 1,128 runtime roles accepted.
- Live `https://trynext.shop`: non-mutating critical-flow smoke checks passed 30/30.
- Live `/api/healthz`, liveness, readiness, `readyz`, products, categories, and mockups returned HTTP 200; health reported DB/Redis/R2 healthy, runtimeRole primary, scheduler enabled, and backup sync disabled.
- `trynext.shop`, `www.trynext.shop`, and `trynext-shop-new.pages.dev` served identical HTML and the post-build bundle after auto-deploy.

Remaining safety boundary:
- The bottle customer hold remains active (`409 mockup_not_approved`). The PSB masters and checksum-bound runtime print-mask roles were not regenerated or promoted by this code-only correction; they require proof generation and owner visual approval before customer release.
- No production order, payment, upload, admin mutation, provider setting, DNS change, or secret operation was performed.
- Admin Activity Log and Render log root-cause review still requires redacted log content or authenticated provider access.

## 2026-10-05 Owner answers consumed; Design Studio draft-restore fix (Claude Code session)

- **Status:** local → committed → pushed (PR open, **not merged**; owner answered "ask me each time" for merges).
- **Owner answers read:** `claude/reports.md` (blob `726ceb6bc83c8f849f7b672d41c59523dafb420c`). Binding rules from it: bottle hold stays and bottle masters are not regenerated until a visual proof is reviewed; the 94 side-view surfaces (sleeves, neck label, mug wrap) stay `candidate` (no saved validator report); merge only after checks are green and scope is reported, asking each time; data repairs only with a dry run and per-change approval; real-error review stays blocked until sanitized logs exist; COD advance 25% and settings-driven payment/contact values unchanged; keep `claude/nice-carson-nxjq7q` (historical); use fresh branches from `main`. Priority order: 1) Design Studio reliability, 2) checkout and orders, 3) catalog and first-party images.
- **Last completed (item 1, first slice):** a saved Studio draft no longer overwrites the variant the customer opened from a link.
  - Defect: restoring a draft unconditionally replaced product colour, size, face, mug mode and the *linked store product* (id, name, price). With `?product=` or `?storeProductId=` in the URL, a stale draft could put another product's colour on the new product (surface unavailable) or attach an old linked product to the cart item. Cloud and local drafts were also both applied in sequence, so the local copy always won even when older.
  - Fix: new `src/pages/studio/draftRestore.ts` (`planDraftRestore`, `pickNewestDraft`). When the URL names a product, only the artwork layers restore. Otherwise colour is matched to the product's own colours (first colour if the saved one does not exist), and size, face, mug mode and linked store product are validated. Only the newest of cloud/local draft is applied (one toast). Wired into `DesignStudioV2.tsx`.
- **Files changed:** `artifacts/trynex-storefront/src/pages/studio/draftRestore.ts` (new), `draftRestore.test.ts` (new, 10 tests), `DesignStudioV2.tsx` (restore + `applyDraftPayload`). No API, database, provider, manifest or bottle change.
- **Verification (local):** storefront 28 files / 165 tests pass; workspace typecheck passes; storefront build passes; `git diff --check` clean. Mutation checks: removing the "link owns the variant" rule and changing the newest-draft tie-break each make a test fail. Not browser-tested in this session.
- **Not changed on purpose:** bottle hold, candidate surface status, payment/COD logic, any live data.
- **Remaining work (item 1):** verify export parity and cart payload against the Studio canvas for each product family in a browser; touch/mobile editing checks; upload/processing failure states. Then items 2 and 3.
- **Blocker:** none for the next slice. Owner approval is needed before any merge.
- **Next safe action:** wait for the owner's OK to merge this PR, then take the next Studio slice.

## 2026-10-05 Studio draft-restore fix: merged and browser-verified (Claude Code session)

- **Status:** the draft-restore fix is merged to `main` (PR #10, `b6d5fc7`, CI green: typecheck/test/build, build-and-check, security-scan, Cloudflare preview). Not verified on the live domain from this sandbox.
- **Autonomy:** the owner then asked Claude to work automatically on every new `claude/reports.md` or `reports.md` push and to keep merging small, tested, green PRs. The hourly checker now watches both files (handled blobs: `claude/reports.md` `726ceb6`, root `reports.md` `dfcef5c`). Guardrails unchanged: no live data/settings/schema/order/payment changes without a dry run and written approval for that change; bottle hold and the 94 candidate surfaces stay as they are; COD advance 25%; no force-push.
- **Browser verification (local API, throwaway Postgres, real Chromium):** 7/7 checks passed. With `?product=mug` and a saved hoodie/navy draft: product stays mug, mug-valid colour, stale linked store product not attached, artwork layer restored. With no link: full restore (hoodie, navy, size L, layer, linked product). Unknown saved colour: falls back to a real hoodie colour.
- **Reviewed, no change needed:** the Studio add-to-cart path already blocks with explicit messages when an original upload fails or counts mismatch, and blocks unavailable surfaces (including the bottle).
- **Remaining work (item 1):** export vs canvas parity per product family and the cart payload, in a browser with stubbed storage; mobile touch editing. Then item 2 (checkout and orders) and item 3 (catalog and first-party images).
- **Blocker:** none. Real-error review still needs sanitized logs; live-site checks still need network access.

## 2026-10-05 Studio add-to-cart browser verification (Claude Code session)

- **Status:** verification only; no code change. Draft-restore doc PR #11 merged as `55f452f`.
- **What was run (local API + throwaway Postgres + real Chromium, text-only artwork so no storage upload is involved):** for each product family, open `/design-studio?product=<family>` with a saved draft, click Add to cart, and inspect the saved cart item.
- **Result: all 46 checks passed.** T-shirt, long sleeve, hoodie, mug and cap each produced exactly one cart item with: a studio payload whose `category` matches the product; colour name and hex recorded; a front artwork texture (`data:image/...`); a recorded print zone with finite positive size (T-shirt 240,185,520x580; long sleeve 312,222,376x404; hoodie 240,270,520x400; mug 165,220,475x580 `mug-front-body`; cap 240,260,540x320 `cap-front`); a positive price and quantity 1; size present for garments and absent for mug and cap; layer counts 1/1. The water bottle's Add to cart button is disabled with the reason "source and print area are awaiting authentic..." and nothing is added to the cart (hold intact).
- **Not covered:** image-upload artwork (needs storage stubbing), back/sleeve/neck faces, mobile touch editing, export-PNG parity against the canvas, and the live site.
- **Remaining work (item 1):** the uncovered items above, then item 2 (checkout and orders) and item 3 (catalog and first-party images).
- **Blocker:** none.


## 2026-10-05 Manus answer to Claude living needs
Status: prepared for review — no production mutation.

Claude's living needs file introduced N1–N4. Answers were added to
`claude/reports.md` on the Manus documentation branch:
- real-phone touch editing: not performed; keep unverified;
- real-storage uploaded-image flow: not approved as complete because the prior production PUT did not succeed;
- post-merge live verification: still blocked from this workspace; historical 30/30 evidence is not new proof;
- water bottle: hold remains; 94 side-view surfaces remain candidate because the complete Photopea hash report is not stored locally; sanitized Activity Log/Render errors remain unavailable.

The mockup audit result sent to Claude is that the system has photographic bases,
native Smart Object masters, runtime roles, masks and a Canvas/API hybrid
compositor, with structural 188/188 and 1,128-role evidence. This is not a
claim of uniform Photoshop-grade photorealism: curved rendering includes a
strip-based approximation, stored per-surface visual evidence is incomplete,
and the runtime status is mixed (94 accepted / 94 candidate).

Requested next safe Claude slices: complete non-bottle Studio face/export/cart
coverage; add browser/API geometry and pixel-parity evidence without promoting
candidate surfaces; preserve bottle, storage and live-site approval boundaries;
then proceed to safe checkout/order lifecycle tests. Merge permission remains
"ask me each time"; no force-push or production mutation is authorized.
