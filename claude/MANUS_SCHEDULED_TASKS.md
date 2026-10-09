# Manus scheduled tasks — three slots (2026-10-09 22:45 UTC start)

Written by Claude for Manus. `main` is at `49fa6d6` (PRs 37, 45, 46, 47 merged and
green). Everything below needs things Claude's sandbox cannot do (reach the live site,
read provider dashboards, use a real browser session as the owner). Do each slot
by its deadline and **write the result into `claude/reports.md`**; Claude reads it
after it lands and does the follow-up work.

| Slot | Deadline (UTC) | Theme |
| --- | --- | --- |
| S1 | 23:00 | Deploy check + the one live upload test |
| S2 | 23:15 | Live checks of what just shipped + sanitized evidence |
| S3 | 23:30 | Files Claude needs (exports, reports) |

## How to report (all slots)

1. Append a section to `claude/reports.md` titled exactly
   `## Manus report — S1` (or `S2`, `S3`) with: status per task (`done` / `blocked`
   / `not applicable`), what you saw, exact error text, and the commit/deployment id.
2. Put it on `main`: open a PR from a `manus/...` branch and write "docs-only" in the
   title (or push to `main` if your access allows).
3. Push each slot when it is done. Do not wait to batch all three.
4. If a task cannot be done, say exactly why in one line and move on.

## Rules for every task (the owner's safety rules still apply)

- **Never** paste secrets: passwords, tokens, API keys, database URLs, signed/presigned
  URLs, private customer data, payment numbers. Redact them.
- No real order, no payment, no customer message, no change to live data or provider
  settings (R2 CORS, DNS, Render variables, Neon, Upstash, schema).
- Stop before checkout in every live test. Remove any test cart item afterwards.
- Write `UNVERIFIED` for anything you did not actually see.

---

## S1 — due 23:00 UTC: deploy check and the one live upload test

**S1.1 Deploy identity.** Report the production Cloudflare Pages deployment commit for
`trynext-shop-new` and the Render primary service's deployed commit. Both should be
`49fa6d6` or newer. If either is older, say which and the commit it is on, and trigger
a normal deploy of `main` in the provider dashboard if you can (this is a normal
deploy, not a settings change).

**S1.2 Render runtime.** Report the Node version the Render primary runs (nodemailer 10
needs Node 20 or newer) and whether the service started cleanly after the latest
deploy (health URL status only).

**S1.3 Live critical flows.** Run `node scripts/verify-critical-flows.mjs` against
`https://trynext.shop` and paste the pass/fail lines.

**S1.4 The one live Studio upload test (most important).**
On `https://trynext.shop/design-studio`: choose a T-shirt, upload one tiny harmless
PNG (for example 64x64), confirm it appears as a layer, click Add to Cart. Report:
- did the cart count go to 1?
- if an error alert appears ("Your design was not added to the cart ..."), copy the
  **exact text**, especially the bracketed reason at the end, such as
  `[storage_access_denied]`, `[storage_credentials_rejected]`,
  `[storage_bucket_missing]`, `[storage_unreachable]` or `[storage_error]`;
- the HTTP status and request path (no signed URLs) of any failing request in the
  browser's network tab.
Then remove the cart item. **Do not check out.**

---

## S2 — due 23:15 UTC: live checks of what just shipped, plus sanitized evidence

**S2.1 Price filter live.** In a browser or with read-only requests, report the
status and the product count for:
`/api/products?limit=50`, `/api/products?limit=50&minPrice=500&maxPrice=1000`,
`/api/products?sort=price_asc&limit=5`. Confirm the filtered count is lower than the
full count and that prices in the response are within the range (price the customer
pays: the discounted price when there is one).

**S2.2 Image weight live.** Report the transfer size (as shown by the browser's network
tab, with cache disabled) of `/images/cat-tshirt.png`, `/images/cat-cap.png`,
`/images/hero-bg.png` and `/images/pattern.png`. Expected: roughly 0.4 MB, 0.4 MB,
0.2 MB and 0.8 MB (before the change they were about 1.7, 1.7, 0.9 and 2.1 MB). Also
confirm category tiles on the live site still look right (no blur, no banding) and
say which page you checked.

**S2.3 Sanitized errors (T5).** From the Admin Activity Log and the Render logs for the
last 7 days, summarize errors grouped by route, status, release, time and customer
impact. Include **only** sanitized fields. For the upload route also report the
`storageFailure` fields (name, code, httpStatus only) if any line exists. If there
are none, write "no errors seen" only if you actually looked.

**S2.4 Service worker freshness.** Report whether `https://trynext.shop/service-worker.js`
(or the registered worker file) returns JavaScript or the HTML app shell, and the
worker version/hash if visible. (An earlier check saw HTML at that path; confirm
whether the real worker is at another path such as `/sw.js`.)

---

## S3 — due 23:30 UTC: files Claude needs

**S3.1 Product export (T4 / N11).** A sanitized export of all live products, one row
per product: id, name, category, active or not, price, discount price, stock, image
address or file name. No customer or order data. Save as
`claude/evidence/products-export.csv` in the same PR as the report.

**S3.2 Validator report (T6).** The saved Photopea validator report (hash list or
file) for the 94 side-view surfaces (sleeves, neck labels, mug wraps), saved as
`claude/evidence/photopea-validator-report.*`. If it does not exist, say so; the
surfaces then stay `candidate`.

**S3.3 Address check on the live site (read-only).** Do NOT place an order. Report
what the live checkout's delivery-area picker offers (division > district > area),
and confirm the area step is mandatory. (Claude changed the web checkout so the
picked area is stored as the order's city; this checks the form only.)

**S3.4 Real phone (N1), if you can.** On any real phone, open the live Design Studio,
add text, drag, pinch to resize, rotate, switch to the back, tap Add to Cart (do not
check out). Report worked / what broke, with phone model and browser. If you cannot
use a phone, write "not available".

---

## What Claude does when your reports land

| Your report | Claude's follow-up (automatic) |
| --- | --- |
| S1.4 shows a reason code | Names the cause. Access / credentials / bucket = owner action in the Cloudflare R2 dashboard (token needs Object Read & Write on the bucket, or fix the bucket name/endpoint); Claude will not change provider settings. `storage_unreachable` = endpoint / account id. `storage_error` = Claude reads the `storageFailure` fields from S2.3 and fixes any code cause. |
| S1.4 passes | Records the upload as verified live and closes N12. |
| S1.1/S1.2 old commit or old Node | Tells the owner exactly what to redeploy / upgrade. |
| S2.1 wrong counts | Fixes the price filter or its cache keys with a regression test. |
| S2.2 sizes unchanged | Checks the deploy; if deployed, finds why the old files are served. |
| S2.4 shows HTML | Fixes the service worker route/registration with a test. |
| S3.1 export | Read-only catalog and image audit with a dry-run change list (no live changes). |
| S3.2 report | Updates the mockup release gate (still fail-closed unless every check holds). |
