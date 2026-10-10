# Manus tasks by Replit — everything remaining, in one file

Written by Claude on 2026-10-10 (04:20 UTC) for Manus and the Replit/owner side. This file is the single list. Details for each item live in the files named beside it. Claude reads this file and every report that comes back.

## How to report back
1. For each task below, add a section to `claude/reports.md` titled exactly `## Manus report — <task id>` (for example `## Manus report — R1`).
2. Evidence files go in `claude/evidence/`.
3. Push each task as soon as it is done (a `manus/...` branch with a docs-only PR, or straight to `main`). Do not wait to batch.
4. Write `UNVERIFIED` for anything you did not actually see and `BLOCKED: <reason>` for anything you cannot do.
5. When you have verified something, say `VERIFIED` and name what you checked. Claude picks up each report at the next check and acts on it (code fixes go test first, as small PRs, merged only when all checks are green).

## Safety rules (always)
No secrets, tokens, signed URLs or database URLs anywhere. No real order or payment. No customer data. No change to provider settings (R2, DNS, Render variables, Neon, Upstash), live data or the schema. Stop before checkout submit and remove any test cart item. The water-bottle custom-order hold stays on. The 94 candidate mockup surfaces stay `candidate`. No Meta ads change.

## Current state (what is already done, do not redo)
- On `main`: price filter, storage failure reason codes, order status rules and stock restore, artwork size restore, image and precache reduction, area saved as `shippingCity`, mobile Studio preview fit (`56fc92e`).
- Verified live by Manus: price filter counts, image sizes, health (database, Redis, R2 all OK), `/sw.js` is the real service worker, 70-product export.
- Open blocker: the live Design Studio upload fails with a 502 that has no message and no `[reason]`. The current storage code always sends both, so the 502 did not come from it. A separate Claude session reproduced the upload locally through the real gateway and it worked. Most likely cause: the Render primary is on an older build, or Render or the edge answered with its own 502.

## A. Tasks Manus can do from a public browser

| Id | Task | Result to report |
| --- | --- | --- |
| R1 | **Failing upload request (most important).** On `https://trynext.shop/design-studio` upload one 64x64 PNG on a T-shirt and click Add to Cart. In the network tab find the failing `upload-via-api` request and the earlier `uploads/request-url`. Copy no URL query and no token. | For each call: status, `content-type`, `server`, `cf-ray`, `via` headers; first 200 characters of the body (redacted); is the body JSON or HTML? |
| R2 | **Photopea validator report** for the 94 side-view and mug-wrap surfaces, saved as `claude/evidence/photopea-validator-report.*`. | File name, date, number of surfaces covered, or `BLOCKED: no report exists`. |
| R3 | **Phone check of the Design Studio** (real phone, or an emulator at about 390x844). Upload the PNG, check the preview fits and scrolls into view, drag, pinch, rotate, switch to the back, scroll the page with the Select tool, tap Add to Cart (do not check out). This covers the mobile change in `56fc92e`. | Device, browser, what worked, what broke. |
| R4 | **Delivery-area picker.** Add one ordinary in-stock product (not a Studio design) to the cart, open checkout, look at the delivery fields, try to continue without the area, then empty the cart. Do not submit. | Levels offered (division > district > area), is the area required, any layout problem. |

## B. Tasks that need dashboard or admin access (Manus if it has access, otherwise the owner)

| Id | Task | Result to report |
| --- | --- | --- |
| R5 | **Render primary service.** | Deployed commit (should be `7c284f5` or newer), Node version (must be 20 or newer), started cleanly yes/no, whether Render auto-deploys `main`. If older, trigger a normal deploy of `main` and say so. |
| R6 | **Sanitized logs around the upload test**, 01:10–01:16 UTC on 2026-10-10 and any new attempt. | Redacted log lines, including any `storageFailure` fields (name, code, httpStatus only), or `no lines found` only if you really looked. |
| R7 | **Admin Activity Log, last 7 days.** | Errors grouped by route, status, release, time and customer impact; sanitized fields only. |

## C. Decisions only the owner can make (Manus or Replit: relay them if given, do not guess)

| Id | Decision | Current answer |
| --- | --- | --- |
| D1 | Water-bottle print area: `approve`, `change`, `not yet`, or `send proof`. | `not yet` (hold stays on). |
| D2 | The 10 products with third-party images (ids 1–9 and 20, see `claude/evidence/catalog-audit-2026-10-10.md`): replace with first-party images, hide, or keep. Ids 1–9 look like demo products. | Open. |
| D3 | Contact messages: stay in the Admin Activity Log, or add Telegram or email (name the provider only, no keys). | Stay in the Activity Log. |
| D4 | Prepare (not run) the order-idempotency migration in `claude/T8_IDEMPOTENCY_MIGRATION_PLAN.md`? | Open. |
| D5 | Back-fill `shippingCity` on old orders? Nothing is changed without separate approval. | Open. |
| D6 | Close the stale open PRs #13, #15, #20, #21, #23 and #40 (all superseded, none mergeable). | Open. |
| D7 | Revoke or rotate the GitHub token that was pasted earlier and flagged as compromised. | Owner action in GitHub settings. |

## D. What Claude does when each item lands
| Item | Claude's follow-up |
| --- | --- |
| R1 body is HTML, or `server` is Render or Cloudflare | Confirms the 502 comes from Render or the edge, not the storage code; points at the Render logs and instance health. No code change. |
| R1 body is JSON with `[reason]` | Names the storage cause (access, credentials, bucket, unreachable) for the owner's R2 settings. |
| R2 report | Updates the mockup release gate; stays fail-closed unless every check holds. |
| R3 or R4 problem | Writes a failing test first, then a small fix PR. |
| R5 older commit or Node below 20 | Tells the owner exactly what to redeploy or upgrade. |
| R6 or R7 lines | Reads the sanitized fields and fixes any code cause with a test. |
| D1–D6 answers | Applied only inside the safety rules above; anything touching live data, schema or provider settings waits for a separate explicit approval. |

## E. Related files
`claude/MANUS_REMAINING_WORKSHEET.md` (same rows, fill-in blocks), `claude/MANUS_MASTER_NOTES.md`, `claude/MANUS_SCHEDULED_TASKS.md`, `claude/evidence/` (S1–S3 results, product export, catalog audit), `AGENT_HANDOFF.md` and `CLAUDE_HANDOFF_CHECKLIST.md` (state of record).
