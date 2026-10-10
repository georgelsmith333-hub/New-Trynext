# Manus worksheet — what is still open (2026-10-10 04:05 UTC)

Read this one file. Everything Manus already delivered (S1–S3 public checks, product export) is accepted and merged; nothing there needs redoing. Only the rows below are left. For each row, copy the **Result block** into `claude/reports.md` under `## Manus report — R<n>` and push it (docs-only PR from a `manus/...` branch, or straight to `main`). Do one row at a time and push each one when done.

Rules: no secrets, no signed URLs or tokens, no real order or payment, no customer data, no changes to provider settings or live data. Stop before checkout submit. Remove any test cart item afterwards. Write `UNVERIFIED` for anything you did not actually see, and `BLOCKED: <reason>` if you cannot do a row.

## Rows Manus can do (public browser, no admin login)

### R1 — Capture the failing upload request (most important)
Why: the live Studio upload returns a 502 with no message or reason code, so it did not come from the current storage code. Claude needs to know who produced that 502.
Steps: open `https://trynext.shop/design-studio`, choose a T-shirt, upload one 64x64 PNG, click Add to Cart. In the browser network tab, find the failing request whose path contains `upload-via-api` (and the earlier `uploads/request-url`). Do not copy the URL query string or any token.
Result block:
- Time (UTC):
- `request-url` call: status / content-type
- `upload-via-api` call: status / `content-type` / `server` header / `cf-ray` header / `via` header
- First 200 characters of the response body (redact anything that looks like a key or token):
- Is the body JSON or HTML?

### R2 — Photopea validator report
Why: the 94 side-view and mug-wrap surfaces stay `candidate` until a saved report exists.
Steps: if a saved validator report exists in your files, put it at `claude/evidence/photopea-validator-report.*` (hash list is fine). If none exists, write `BLOCKED: no report exists`.
Result block: file name / date / how many surfaces it covers.

### R3 — Phone check of the Design Studio (latest mobile change)
Why: `56fc92e` changed mobile canvas sizing and scrolling. Needs a real phone or a device emulator at about 390x844.
Steps: open the live Design Studio on the phone, upload the 64x64 PNG, confirm the preview fits and scrolls into view, drag, pinch to resize, rotate, switch to the back, scroll the page vertically with the Select tool active, tap Add to Cart (do not check out).
Result block: device or emulator / browser / what worked / what broke (with a short description of each break).

### R4 — Delivery-area picker at checkout (read-only)
Why: Claude changed checkout so the picked area is saved as the order's city. The picker was never seen live.
Steps: add one ordinary in-stock product (not a Studio design) to the cart, open checkout, fill nothing sensitive, look at the delivery fields, then empty the cart. Do NOT submit.
Result block: levels offered (division > district > area?) / is the area step required (try to proceed without it, do not submit) / any layout problem.

## Rows that need dashboard access (Manus only if it has it; otherwise the owner does them)

### R5 — Render primary service
Result block: deployed commit / Node version / started cleanly (yes/no) / auto-deploys `main` (yes/no). Deployed commit should be `7c284f5` or newer; if older, trigger a normal deploy of `main` and note it.

### R6 — Sanitized logs around the upload test
Result block: Render log lines for 01:10–01:16 UTC on 2026-10-10 and for any new upload attempt, with keys, tokens and URLs redacted. Include any `storageFailure` fields (name, code, httpStatus only). Write `no lines found` only if you actually looked.

### R7 — Admin Activity Log, last 7 days
Result block: errors grouped by route / status / release / time / customer impact. Sanitized fields only.

## Owner-only decisions (Manus: relay them if the owner gives them to you; do not guess)
- Water-bottle print area: `approve`, `change`, `not yet` (current answer: `not yet`).
- The 10 products with third-party images (ids 1–9 and 20): replace with first-party images, hide, or keep. See `claude/evidence/catalog-audit-2026-10-10.md`.
- Contact messages stay in the Admin Activity Log unless the owner names Telegram or email.
- Whether to prepare (not run) the order-idempotency migration in `claude/T8_IDEMPOTENCY_MIGRATION_PLAN.md`.

## What Claude does when each row lands
| Row | Claude's follow-up |
| --- | --- |
| R1 HTML body or Render/Cloudflare `server` header | Confirms the 502 comes from Render or the edge, not the storage code; points the owner at the Render logs and instance health. |
| R1 JSON body with `[reason]` | Names the storage cause (access, credentials, bucket, unreachable) for the owner's R2 settings. |
| R2 report | Updates the mockup release gate; stays fail-closed unless every check holds. |
| R3 breaks | Writes a failing test first, then a small fix PR. |
| R4 problem | Same: test first, then a small fix. |
| R5 older commit or Node below 20 | Tells the owner exactly what to redeploy or upgrade. |
| R6 / R7 | Reads the sanitized fields and fixes any code cause with a test. |
