# Trynext Lifestyle — Claude Code Instructions

This repository contains the Trynext Lifestyle storefront, admin, API, mobile
app, and supporting design-system tools. The project owner has chosen GitHub and
Claude Code as the intended home for future full-stack development. The transfer
from the current Replit checkout is **not complete until a clean, reviewed
branch is pushed to the owner-confirmed GitHub repository and verified there**.

## Required context

Before making changes:

1. Read `AGENTS.md`.
2. Read the latest dated section of `AGENT_HANDOFF.md`.
3. Read `CLAUDE_HANDOFF_CHECKLIST.md`.
4. Read `replit.md` only for architecture and historical operational context.
   Its workflow instructions apply to Replit, not to a GitHub/Claude Code
   checkout.
5. Inspect `git status`, the configured remote, current branch, and current
   source. Never assume older handoff state still matches the checkout.

The user’s latest instruction overrides old plans. Report the confirmed state,
what remains, any blockers, the proposed scope, behavior to preserve, and
verification plan before editing. Keep `AGENT_HANDOFF.md` and this checklist
current after meaningful work.

## Current project-transfer boundary

- The intended next development environment is the owner-confirmed GitHub
  repository using Claude Code. Do not make further feature changes in Replit
  after the owner has verified the handoff there.
- Until that transfer is verified, do not assume GitHub is synchronized with
  this checkout or that a GitHub clone contains the latest local implementation.
- Older notes name `georgelsmith333-hub/trynext-lifestyle`; the configured
  remote and owner-confirmed destination are
  `georgelsmith333-hub/New-Trynext`.
- The owner has now selected `georgelsmith333-hub/New-Trynext` and explicitly
  requested a live push. Publish only after the required tests/builds pass and
  the release diff is reviewed. A push to `main` may trigger live deployment;
  do not publish if a safety or release gate fails.
- Do not force-push or rewrite the destination history. Use the current verified
  `main` tip and a normal fast-forward update after the release checks pass.
- Do not push the current local branch history wholesale. It is ahead of its
  tracking ref and includes customer-provided attachments and pasted chat
  records. Prepare a clean branch from the confirmed repository’s current
  default branch and transfer only reviewed project source, required assets,
  and handoff documentation. Keep chat records, screenshots, caches, credentials,
  and unrelated evidence out of the GitHub tree and history.
- Do not delete or rewrite the local source checkout while preparing the
  transfer. Preserve its rollback value until the GitHub branch and key files
  are verified.
- Do not copy Replit secrets into GitHub Actions, source files, Markdown, or
  chat. Configure required values separately in the destination host’s secure
  secrets manager when the owner is ready.

## Product and architecture

- Bangladesh-focused print-on-demand commerce: custom T-shirts, long sleeves,
  hoodies, mugs, caps, and white sublimation water bottles.
- Customer storefront and admin: `artifacts/trynex-storefront`.
- API: `artifacts/api-server` (Express, TypeScript, compiled bundle).
- Mobile: `artifacts/trynext-mobile` (Expo).
- Design system: `artifacts/trynext-lifestyle-design-system`.
- Isolated UI preview: `artifacts/mockup-sandbox`.
- Shared database schema: `lib/db/src/schema/index.ts`.
- API contract and generated clients: `lib/api-spec`, `lib/api-client-react`,
  and `lib/api-zod`.
- The recorded hosting architecture is Cloudflare Pages for the storefront,
  Cloudflare Pages Functions for the API proxy, Render for API hosting, Neon
  Postgres, Cloudflare R2, and optional Upstash Redis. Verify current external
  configuration from the confirmed repository/provider; do not infer that
  Replit environment variables or workflows transfer to GitHub.

## Behavior and safety that must remain intact

- Preserve customer authentication, admin sessions/roles, payment validation,
  the 25% COD advance-deposit policy, settings-driven customer contact/payment
  values, and order safeguards.
- Preserve mobile `studioDesign`/`originalAssets` metadata through cart and
  checkout.
- Preserve the accepted Smart v10.3 runtime and its full structural, visual,
  provenance, and functional gates. Never reactivate old Smart v4/v7 assets or
  mass-activate database mockup rows.
- The older `trynext-lifestyle` tree has one code file missing from the newer
  repo: an older Studio V2 3D viewer that the current Studio does not import.
  Do not copy it based on path presence alone; treat any 3D-preview restoration
  as a separate reviewed feature.
- Editable PSD/PSB masters stay outside public runtime assets. Do not promote an
  unreviewed surface, fallback face, raster masquerading as a Smart Object, or
  non-canonical water-bottle variant.
- Preserve database failover and fail-closed backup-sync behavior. Do not run
  destructive migrations, rewrite production data, or change provider settings
  without explicit approval.
- Do not create customer orders, submit payments, or mutate production data for
  testing.
- Never expose credentials, tokens, private user data, or pasted chat transcripts.

## Development and verification

Use the package manager and commands declared by the current checkout; inspect
package scripts before relying on any command.

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run verify:critical-flows
pnpm --filter @workspace/trynext-storefront run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/trynext-mobile run typecheck
```

- Run focused tests for each changed package, then the relevant wider test
  suite and build.
- After API TypeScript changes, build the API bundle with
  `node ./build.mjs` from `artifacts/api-server` before runtime verification.
- Review generated files, migration changes, lockfile changes, and the entire
  diff before committing.
- Run `git diff --check`. Confirm no secrets, screenshots, chat notes,
  unrelated attachments, or generated working data are included.
- Keep intermediate work on a feature branch. The owner has explicitly approved
  the live push for this handoff; do not extend that approval to unrelated
  provider settings, database migrations, or production data changes.

## Work to pick up

Start with the immediate items in `CLAUDE_HANDOFF_CHECKLIST.md`:

- Verify customer invoice downloads in safe browser/device test flows without
  creating a real order.
- Determine whether the mobile shop-filter preview is integrated into the Expo
  app; do not call a mockup a shipped feature.
- Verify live cache behavior only after an approved deployment.
- Reconcile the stale July project tracker against current code before treating
  its unchecked boxes as outstanding defects.
- Do not assume the older repo's standalone 3D viewer is required by the newer
  Studio; its route and import usage must be verified before future changes.
- Finish the reviewed GitHub handoff in `georgelsmith333-hub/New-Trynext`.
  The target is confirmed; the Replit-to-GitHub transfer is not yet verified.

## Handoff format

Before pausing or finishing, update `AGENT_HANDOFF.md` and
`CLAUDE_HANDOFF_CHECKLIST.md` with:

- Status
- Last completed
- Stopped at
- Files/areas changed
- Remaining work
- Blocker
- Next safe action
- Verification

State clearly whether work is local, committed, pushed, merged, or deployed.
These are separate states; never report one as another.