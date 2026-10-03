# Trynext Lifestyle — Claude Handoff and Full-Project Checklist

**Prepared:** 2026-10-04  
**Purpose:** A self-contained starting point for Claude or another agent taking
over this project. This document records the latest known checkpoint, safe next
steps, project-wide acceptance areas, and how to distinguish real open work from
stale tracker entries.

## Read these first

- [ ] Read `CLAUDE.md`; it is the automatic Claude Code entry point.
- [ ] Read `AGENTS.md` for the project's operating, safety, and handoff rules.
- [ ] Read `AGENT_HANDOFF.md` from the beginning through its newest dated
  checkpoint. Its newest entry is the primary source for the latest work.
- [ ] Read `replit.md` only for architecture/history; do not assume its
  Replit-specific workflow instructions apply in a GitHub clone.
- [ ] Read this file for the current consolidated work list.
- [ ] Inspect the current source, tests, branch, and workflow state before acting.
- [ ] Treat the user's latest request as higher priority than older plans.
- [ ] Before editing, report the current checkpoint, proposed scope, preserved
  behavior, verification plan, and any work that must wait for approval.

Do not assume private chat history will be available. Do not claim an item is
current or verified until the repository or a current service check supports it.

## Authority and stale-document rules

When project notes conflict, use this order:

1. The user's latest explicit instruction.
2. Current code, tests, and current environment evidence.
3. The newest dated section of `AGENT_HANDOFF.md`.
4. `AGENTS.md` and `replit.md` for durable rules and architecture.
5. Tracker files and older handoff prompts, after verifying their claims.

`PROJECT_REBUILD_TRACKER/` was last updated in July 2026 and contains unchecked
items that later work says were implemented. Use it as a topic inventory, not as
proof that every box is still open. Reconcile it against current code and the
newest handoff before changing statuses or starting broad work.

`docs/trynext-agent-handoff-prompt.md` is a historical Smart Mockup prompt. Its
claims about Smart v4/v7 and a Smart v8 target are superseded by the later
accepted Smart v10.3 release recorded in `AGENT_HANDOFF.md`. Do not use that
prompt as the current project plan.

## Current checkpoint — 2026-10-04

### Known complete locally

- [x] The approved safe public catalog API-cache changes are implemented and
  covered by local tests. The cache is limited to safe public catalog GETs;
  cookie-bearing, authenticated, searching, unknown-query/header, and unsafe
  responses bypass storage.
- [x] The duplicate Workbox `offline.html` precache issue is fixed. The
  generated service worker has one offline-shell precache entry; its other
  reference is the runtime offline fallback.
- [x] The order-success celebration respects reduced-motion preferences.
- [x] Invoice PDF generation has a test that reads the generated PDF and checks
  its signature and non-trivial output.
- [x] Mobile shop-filter drawer work is present in the isolated design-system
  preview and was visually checked at 402×874. Integration into the shipped
  mobile app has not been established by the handoff; verify before calling it
  complete.
- [x] Local storefront tests, targeted cache/invoice tests, storefront
  typecheck/build, mockup-sandbox typecheck/build, and `git diff --check` passed
  per the latest handoff.
- [x] The Smart v10.3 runtime was previously promoted and verified. Preserve its
  accepted status and all water-bottle release gates.
- [x] COD and the 25% advance-deposit rules remain in place. Do not create an
  order or payment just to verify the code.

### Latest known live state (read-only audit)

- Cloudflare Pages served `trynext.shop` and `www.trynext.shop`; its latest
  reported successful production deployment was `main` at
  `80dbab30692b9e5f202cf9a01594b6abb7981c78` (2026-10-01).
- That deployed `main` does not contain the invoice download and order-success
  feature set recorded on `fix/waterbottle-white-identity`.
- The handoff identifies the feature branch at `a19dbdc5d`. Confirm remote refs
  and ancestry again before using them; these are the last recorded values, not
  a substitute for a fresh fetch.
- Live API product requests previously returned edge-cache `MISS` and
  `CF-Cache-Status: DYNAMIC` on repeated requests. The code fix is locally
  verified, but live Cloudflare cache-hit behavior remains unverified because
  the changes have not been deployed.
- Render/Neon account-level usage and backup-retention details were unavailable
  during the audit. No provider setting was changed.

### Checkout state observed while preparing this file

- Branch: `fix/waterbottle-white-identity`, tracking `github/main`.
- `git status --short --branch` most recently showed the branch 12 commits ahead
  and no visible
  modified or untracked paths at that time.
- The configured `github` remote URL observed in this checkout points to
  `georgelsmith333-hub/New-Trynext`, while the historical handoff prompt names
  `georgelsmith333-hub/trynext-lifestyle`. Both repositories are visible to the
  connected GitHub account and have push permission. The owner must select the
  destination before publishing.
- The local branch differs from its tracking ref by 13 commits and 81 paths;
  27 paths are under `attached_assets/`, including pasted chat records and
  customer-provided screenshots. Do not publish that history wholesale. Keep
  those files local and build a clean, reviewed handoff branch from the
  selected repository's current default branch.
- The owner selected `georgelsmith333-hub/New-Trynext`; its current `main` tip
  was verified through GitHub as `80dbab30692b9e5f202cf9a01594b6abb7981c78`.
- Workflow status at handoff preparation: all configured workflows were stopped.
  Start only the workflow needed for a requested local verification.

These are dated observations. Recheck them at the start of the next session.

### Owner's requested development-home transition

- [x] Owner requested that GitHub plus Claude Code become the development home
  and that the handoff documents be prepared.
- [x] Owner selected `georgelsmith333-hub/New-Trynext` and explicitly requested
  a live push after safety checks.
- [x] Compared both repository trees. The only old-repository code path absent
  from the newer repo is an older Studio V2 3D viewer; the newer Studio does not
  import it. All other old-only paths are screenshots, so no old code/assets
  need to be copied.
- [ ] Create a clean branch from that repository's verified default-branch tip;
  transfer only reviewed source, required public assets, and handoff docs.
- [ ] Run release checks, review the final diff, then publish to the live-enabled
  branch. Do not publish if a required check fails.
- [ ] Verify the resulting commit, workflow results, and live site through
  GitHub and read-only production checks.
- [ ] After the owner confirms the GitHub handoff works, stop using Replit as
  the development home. Keep deployment or provider changes separate.

## Immediate remaining work

### A. Browser/device verification for invoices

- [ ] Verify that the customer-facing invoice download actually triggers a
  browser download from the Checkout success flow.
- [ ] Verify the invoice download from Track Order.
- [ ] Check a desktop browser and a mobile browser/device-size flow; verify the
  filename, valid PDF contents, and that customer/order values are correct.
- [ ] Use a safe test fixture or mocked order response. Do not create a real
  customer order or submit a payment without explicit owner approval.
- [ ] Record limitations if an authenticated customer session is unavailable.

### B. Verify the mobile shop-filter integration

- [ ] Inspect the current Expo app route and determine whether the filter drawer
  shown in the design-system preview is integrated into the actual mobile app.
- [ ] If integrated, verify open/close, selected-filter count, keyboard/screen
  reader labels, Escape/back handling, safe-area spacing, scroll locking, and
  touch target at narrow and tall viewports.
- [ ] If not integrated, report it as follow-up work; do not treat the preview
  as a shipped app feature or integrate it without including it in the approved
  scope.

### C. Verify live cache behavior after an approved release only

- [ ] Keep the local cache safety tests passing: cookie/auth bypass, search and
  unknown query bypass, unsafe header/status bypass, and cache-key isolation.
- [ ] After the explicitly requested live push, send the same safe public
  catalog request twice to the actual production domain and record response status,
  cache headers, origin routing, and whether the second request is a hit.
- [ ] Verify authenticated and user-specific requests remain uncached.
- [ ] Do not edit Cloudflare settings to mask a code-level miss without evidence.

### D. Decide the release boundary

- [x] Review the source delta against `New-Trynext/main`; prepare a clean transfer
  from the verified target tree rather than replaying the local commit history.
- [x] Exclude all 27 `attached_assets/` paths and Replit-local `.agents/memory`
  notes from the candidate. The reviewed candidate contains 54 files, with no
  high-confidence credential patterns detected.
- [x] Use `georgelsmith333-hub/New-Trynext` as selected by the owner. Its
  verified `main` tip was `80dbab30692b9e5f202cf9a01594b6abb7981c78`.
- [ ] Preserve the Smart v10.3 accepted runtime and all existing mockup
  approval/provenance gates.
- [ ] The owner explicitly requested a live push to `New-Trynext`; this
  authorizes a reviewed production push only after all required release checks
  pass. It does not authorize pushing local history wholesale.
- [x] Exclude pasted conversation files and customer screenshots from the
  transfer branch. Never include secrets or credentials.
- [ ] Do not change provider settings, production data, or database schema under
  this push authorization.

### E. Reconcile the older repository

- [x] Compare the trees of `New-Trynext` and `trynext-lifestyle`.
- [x] Confirmed the older repo's only code-only path missing from the newer repo
  is its Studio V2 3D viewer. The current newer Studio does not import it, so do
  not copy the stale viewer or old screenshots.
- [ ] Keep the newer repo's current Studio and Smart v10.3 runtime. Copy nothing
  from the older repository unless a current dependency or regression proves it
  necessary.

### F. Make API validation checks database-independent

- [x] Reproduced the GitHub API-check failure without database environment
  variables: a pure validation test imported the full API route.
- [x] Isolated the pure validator and confirmed all API tests pass without any
  database URL configured.

## Project-wide completion inventory

This inventory is an **audit checklist**, not a claim that each item is broken.
For every line, inspect current implementation and tests, then record one of:
`VERIFIED`, `PARTIAL`, `BLOCKED`, `NOT APPLICABLE`, or `UNVERIFIED`. Fix only
confirmed gaps in an approved scope.

### Customer storefront and commerce

- [ ] Home, shop, category, product details, cart, checkout, account, login,
  signup, tracking, hampers, reviews, and help pages load and navigate.
- [ ] Product options, price, availability, inventory, images, SEO, filters,
  sorting, and pagination use authoritative current data.
- [ ] Cart and checkout preserve artwork/customization, customer notes, product
  options, shipping, and order totals from UI through API and admin.
- [ ] Payment choices and payment numbers are settings-driven and fail safely
  when unconfigured; no placeholder destination is shown as usable.
- [ ] COD deposit behavior remains 25% wherever the deposit applies.
- [ ] Order success, invoice generation/download, refunds, courier/tracking
  details, and outstanding-balance display are correct.
- [ ] Auth boundaries, validation/error messages, loading/empty/offline states,
  and responsive layouts are verified without making real purchases.
- [ ] Public contact/WhatsApp links read their configured values rather than
  embedding a phone number in UI code.

### Design Studio and Smart Mockups

- [ ] Preserve the accepted Smart v10.3 runtime; do not reactivate legacy
  Smart v4/v7 assets or mass-activate database templates.
- [ ] Confirm the canonical six families: T-shirt, long sleeve, hoodie, mug,
  cap, and white sublimation water bottle.
- [ ] Validate the current canonical 188-surface contract from source code;
  do not infer colors or surfaces from old documents.
- [ ] Keep editable PSD/PSB masters outside `public/`. Runtime assets must have
  verified provenance/checksums and pass their release gates.
- [ ] No fake Smart Object, missing-face fallback, unreviewed asset, or
  non-canonical/tinted water-bottle variant may be promoted.
- [ ] Preserve in-browser immediate artwork preview, undo/redo, product-switch
  refit, original-upload metadata, print-area selection, and cart snapshots.
- [ ] Verify apparel faces, mug controls, cap front/back, bottle front/back,
  color resolution, print-zone alignment, current preview/export, and cart flow.
- [ ] Check the current Studio route before claiming curved products have a
  customer-facing 3D viewer. The old repository's viewer is not imported by the
  newer Studio and is outside this transfer unless separately approved.
- [ ] Any future Smart Mockup release requires the full documented structural,
  visual, functional, and browser gates before resolver promotion.

### Admin and API

- [ ] Verify admin authentication/session, role and permission checks, and
  protected API boundaries. Do not add local password/JWT authentication.
- [ ] Verify admin CRUD and status flows for products, categories, orders,
  customers, reviews, blog, promos, hampers, referrals, newsletter, and settings.
- [ ] Check AI/admin assistant data access and provider failure states. Never
  return secret values in admin tool context, APIs, logs, or this handoff.
- [ ] Verify admin-design assets are visible in order details when provided.
- [ ] Verify settings, secrets-management restrictions, rate limits, CSRF/CORS,
  input validation, output safety, and error responses against current code.
- [ ] Verify system health, deployment, activity logs, DB cluster, and backup
  admin screens match the actual API response shapes.
- [ ] Do not reintroduce the duplicate system-health routes described in
  `replit.md`.

### Mobile app

- [ ] Verify product browsing, product detail, cart, checkout, account, and
  Design Studio against the same current API and business settings as web.
- [ ] Verify custom-design source and `studioDesign`/`originalAssets` metadata
  survive mobile cart and checkout.
- [ ] Verify shipping thresholds/costs, payment numbers, and WhatsApp/contact
  details come from settings where documented.
- [ ] Check loading/error/empty states, inline checkout validation, touch
  targets, back navigation, responsive layout, and image/file upload handling.
- [ ] Verify that mobile shop filters are actually integrated before marking
  their preview work complete.

### Data, security, reliability, and operations

- [ ] Check DB schema/migrations against the current schema source; never run a
  destructive migration or convert databases without explicit authorization.
- [ ] Verify FK/check constraints, indexes, orphan handling, transaction
  boundaries, and migration history before changing schema.
- [ ] Preserve the fail-closed backup-sync behavior: source/target checks,
  schema mismatch failure, and no blind target truncation/auto-healing.
- [ ] Confirm database primary/failover routing and backup state from current
  health/admin evidence; do not infer a successful backup from a schedule label.
- [ ] Verify API readiness/liveness and Redis/storage behavior. Redis may fall
  back to in-process caching as documented; don't report it as a DB failure.
- [ ] Verify environment validation and configured deployment origins. Never
  copy, print, or commit secret values or database URLs.
- [ ] Check CI/CD, uptime monitoring, error reporting, deployment rollback,
  and provider usage status. Mark integrations unverified if access is absent.
- [ ] Investigate the reported Render monthly outbound usage/quota and Neon
  provider usage/backup retention only if those readings are provided through
  a secure, authorized account view; never ask for credentials in chat.

### Product-wide quality gates

- [ ] Responsive review at representative mobile, tablet, and desktop sizes.
- [ ] Keyboard, focus, labels, accessible contrast, reduced motion, and dialog
  behavior checked for changed user-facing flows.
- [ ] No fatal console/runtime errors in the verified routes.
- [ ] Typecheck, focused tests, relevant full tests, and production build pass.
- [ ] API source changes are rebuilt with the documented API build command and
  the API workflow is restarted before runtime checks.
- [ ] Critical-flow smoke checks are used only when non-mutating; avoid real
  orders, payments, uploads, customer records, or admin mutations.
- [ ] `git diff --check` passes and no unrelated files or customer attachments
  are staged.

## Historical tracker reconciliation

Before using the July tracker as an active backlog:

- [ ] Compare `PROJECT_REBUILD_TRACKER/All Tasks Left To Do/PHASES_CHECKLIST.md`
  with current code, current tests, and this handoff.
- [ ] Reconcile `CURRENT_AUDIT.md`, `PHASE_2_SECURITY_FIXES.md`,
  `PHASE_8_DATABASE_SCHEMA.md`, and both Phase 14 notes. These files contain
  older status values and may contradict later completion evidence.
- [ ] Mark only evidence-supported work done. Convert old, broad items into
  specific tests or findings; remove duplicates and obsolete instructions.
- [ ] Do not claim “no TODOs/placeholders anywhere” by running only a text
  search; inspect matches and classify them before reporting.
- [ ] Keep `CRITICAL_FINDINGS.md` current so confirmed fixed findings are not
  reintroduced as new work.
- [ ] Preserve the historical files or update them with a clear superseded
  status; do not silently delete useful audit history.

## Project map and useful commands

- Storefront and admin: `artifacts/trynex-storefront`
- API server: `artifacts/api-server`
- Mobile app: `artifacts/trynext-mobile`
- Promo experience: `artifacts/trynext-promo`
- Design system: `artifacts/trynext-lifestyle-design-system`
- Isolated component preview: `artifacts/mockup-sandbox`
- DB schema: `lib/db/src/schema/index.ts`
- OpenAPI spec and generated clients: `lib/api-spec`, `lib/api-client-react`,
  `lib/api-zod`

Useful checks, subject to the relevant package scripts:

```bash
pnpm run typecheck
pnpm run verify:critical-flows
pnpm --filter @workspace/trynext-storefront run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/trynext-mobile run typecheck
```

- Inspect package scripts before assuming a test command or build target.
- Do not run the root build as a shortcut if it requires workflow-provided
  `PORT`/`BASE_PATH`; follow `replit.md` and the artifact workflow setup.
- After editing API TypeScript, run `node ./build.mjs` from
  `artifacts/api-server`, then restart its managed workflow before runtime
  verification.
- Use the existing managed workflows only. Do not create duplicate services.
- Keep verification local and read-only unless the owner explicitly approves
  a production action.

## Safety and release rules

- Never read out, print, paste, commit, or put secrets in logs, prompts, docs,
  screenshots, or shell output. Refer to secret names only when needed.
- Never stage or publish user-provided attachments unless they are explicitly
  part of the approved release.
- Never push, merge, deploy, mutate Cloudflare/Render/Neon settings, submit an
  order, or create a payment without separate explicit authorization.
- The owner's explicit authorization in this handoff covers only the reviewed
  live push to `New-Trynext`, contingent on all required release checks passing.
- Do not force-push or guess a repository URL. Fetch and reconcile against the
  verified canonical remote before any approved publication.
- Preserve working storefront, authentication, payments, storage, admin,
  runtime mockups, database failover, and backup behavior.
- Do not perform broad rewrites just to satisfy the old generic phase checklist.
- Stop and report exact evidence if a task is blocked; do not make placeholder
  behavior look complete.

## Required handoff when pausing or finishing

Update `AGENT_HANDOFF.md` and any tracker file whose status changed. State:

- [ ] Status
- [ ] Last completed
- [ ] Stopped at
- [ ] Files/areas changed
- [ ] Remaining work
- [ ] Blocker
- [ ] Next safe action
- [ ] Verification

In the final response, state what changed, what was preserved, what was
verified, and what still needs approval or evidence. A successful local build
does not mean production was changed or verified.