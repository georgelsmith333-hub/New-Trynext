# Manus master notes — read this one file first (2026-10-10 00:15 UTC)

One file with everything Claude still needs from Manus. Claude's own work is done and
merged (`main`). Nothing else is waiting on Claude. Claude checks the repository every
5 minutes and picks up each report as it lands.

## How to hand results back
1. Append to `claude/reports.md` under `## Manus report — S1` (then `S2`, `S3`, `S4`).
2. Evidence files go in `claude/evidence/`. No secrets, no signed URLs, no customer data.
3. Push each slot as soon as it is done (a `manus/...` branch with a docs-only PR, or
   straight to `main`). Do not batch.
4. Write `UNVERIFIED` for anything you did not actually see. If a task cannot be done,
   say why in one line and move on.

## Safety rules (always)
No real order, no payment, no customer message, no change to live data or provider
settings (R2 CORS, DNS, Render variables, Neon, Upstash, schema). Stop before checkout in
every live test and remove any test cart item. Bottle hold stays on; the 94 candidate
surfaces stay candidates; Meta ads untouched.

## Do in this order

### S1 — deploy check and the one live upload test (highest priority)
- S1.1 Report the production Cloudflare Pages commit and the Render primary's deployed
  commit. Both should be `ef72f9e` or newer (code-wise `49fa6d6` or newer).
- S1.2 Render Node version (must be 20 or newer) and whether the service started cleanly.
- S1.3 Run `node scripts/verify-critical-flows.mjs` against `https://trynext.shop`; paste
  the pass/fail lines.
- S1.4 On `https://trynext.shop/design-studio`: pick a T-shirt, upload one tiny PNG
  (64x64), confirm it becomes a layer, click Add to Cart. Report whether the cart went to
  1. If an alert appears, copy the exact text including the bracketed reason, e.g.
  `[storage_access_denied]`, `[storage_credentials_rejected]`, `[storage_bucket_missing]`,
  `[storage_unreachable]` or `[storage_error]`, plus the failing request's HTTP status and
  path. Remove the cart item. Do not check out.

### S2 — live checks of what shipped, plus sanitized evidence
- S2.1 Price filter: status and product count for `/api/products?limit=50`,
  `/api/products?limit=50&minPrice=500&maxPrice=1000`, `/api/products?sort=price_asc&limit=5`.
  Filtered count must be lower; prices must lie in range (discounted price if any).
- S2.2 Image weight (network tab, cache disabled): `/images/cat-tshirt.png`,
  `/images/cat-cap.png`, `/images/hero-bg.png`, `/images/pattern.png`. Expected about
  0.4, 0.4, 0.2, 0.8 MB. Say which page you looked at and whether tiles look right.
- S2.3 Sanitized errors from the Admin Activity Log and Render logs (last 7 days), grouped
  by route, status, release, time and customer impact; for the upload route include
  `storageFailure` name, code, httpStatus only. Write "no errors seen" only if you looked.
- S2.4 Does `/service-worker.js` (or `/sw.js`) return JavaScript or the HTML shell? Give
  the version/hash if visible.

### S3 — files Claude needs
- S3.1 `claude/evidence/products-export.csv`: one row per live product — id, name,
  category, active, price, discount price, stock, image name/address. No customer or
  order data.
- S3.2 `claude/evidence/photopea-validator-report.*` for the 94 side-view surfaces. If it
  does not exist, say so (they stay `candidate`).
- S3.3 Read-only: what the live checkout's delivery-area picker offers (division >
  district > area) and whether the area step is mandatory. Do NOT place an order.
- S3.4 Real phone, if you can: open the live Design Studio, add text, drag, pinch, rotate,
  switch to back, tap Add to Cart (no checkout). Report phone model, browser, what worked
  or broke. Otherwise write "not available".

### S4 — owner decisions still open (only the owner can answer; relay if you have them)
- Water bottle print area: `approve`, `change`, `not yet`, or `send proof`.
- Contact messages: is the Admin Activity Log ("Contact Messages") enough, or name a
  provider (Telegram or email; name only, no keys)?
- Approval to prepare (not run) the order idempotency migration from
  `claude/T8_IDEMPOTENCY_MIGRATION_PLAN.md`: yes or no.
- Optional: backfill `shippingCity` on old orders — yes or no (nothing is changed without
  separate approval).

## What Claude does when each report lands
| Report | Claude's follow-up |
| --- | --- |
| S1.4 reason code | Names the cause. Access/credentials/bucket = owner action in the Cloudflare R2 dashboard (token with Object Read & Write, bucket name, endpoint). `storage_unreachable` = endpoint/account id. `storage_error` = Claude reads `storageFailure` from S2.3 and fixes any code cause. |
| S1.4 passes | Records the upload as verified live. |
| S1.1/S1.2 old commit or Node | Tells the owner what to redeploy/upgrade. |
| S2.1 wrong counts | Fixes the price filter or cache keys with a regression test. |
| S2.2 sizes unchanged | Checks the deploy and why old files are served. |
| S2.4 HTML | Fixes service worker route/registration with a test. |
| S3.1 export | Read-only catalog and image audit with a dry-run change list. |
| S3.2 report | Updates the mockup release gate (fail-closed unless every check holds). |
| S3.3 / S3.4 | Fixes any checkout or Studio defect found, tests first. |

Detail for each item lives in `claude/MANUS_SCHEDULED_TASKS.md` and
`claude/MANUS_AI_TODO_TASKS.md`; this file is the single starting point.
