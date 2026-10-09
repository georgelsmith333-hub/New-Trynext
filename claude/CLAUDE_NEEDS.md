# Claude needs (living list, updated by Claude)

This is the one place where Claude writes down what it needs from the owner.
Claude adds to it whenever it gets blocked, and marks items done when answered.

**How to answer:** write your answer after `ANSWER:` below, or reply in
`claude/reports.md` using the item numbers (N1, N2, ...). Push it to GitHub.
Claude checks every hour and then works on it automatically.

**Never paste** passwords, tokens, API keys, payment numbers or customer details.

Older list `claude/NEEDS_FROM_OWNER.md` (A1 to C12) was answered in
`claude/reports.md` on 2026-10-05. Items from it that are still open are carried
here as N1 to N4.

Last updated: 2026-10-05 (N11 added)

---

## Open needs

### N1. Phone check of the Design Studio (touch editing)
- **Reply received 2026-10-05 (operator):** not performed. Real-device touch stays
  UNVERIFIED. Still open.
- **Why:** Claude can simulate touch in a desktop browser, but only a real phone
  proves dragging, pinch-zoom, the keyboard and the sticky Add to cart bar work.
- **What to do (5 minutes, any phone):** open the live Studio, pick a T-shirt, add
  text, drag it, pinch to resize it, rotate it, switch to the back, tap Add to
  cart. Do NOT check out. Then answer: worked / what broke (phone model and
  browser help).
- **Blocks:** nothing. Claude does the simulated version meanwhile.
- ANSWER:

### N2. Uploaded-image test with real storage (optional)
- **Reply received 2026-10-05 (operator):** real storage is NOT verified. In
  production the upload reached the step where the storage link is created, but the
  final upload (PUT) to storage was rejected. See N7 for what Claude found and
  needs.
- **Why:** adding an uploaded picture to the cart saves the original file to
  storage first. Claude tests that path with a stand-in storage service, which
  proves the Studio logic but not your real bucket.
- **Pick one:**
  - (a) Not needed, the stand-in test is enough.
  - (b) You upload one small harmless test picture in the live Studio, add to
    cart, and tell Claude the result (do not check out).
  - (c) Give a separate non-production test bucket (name only, never keys).
- **Blocks:** nothing.
- ANSWER:

### N3. Live site check after merges
- **Reply received 2026-10-05 (operator):** still blocked from this workspace.
  Claude will not claim the newest `main` is live until a live check is supplied.
  Still open.
- **Why:** this workspace cannot open `trynext.shop` or `*.pages.dev`.
- **Pick one:**
  - (a) Allow those two hosts in the environment network settings, then start a
    new Claude session (Claude can then check live itself), or
  - (b) After each merge, run `node scripts/verify-critical-flows.mjs` yourself
    and paste the pass/fail lines.
- **Blocks:** confirming that merged changes are live and healthy.
- ANSWER:

### N4. Still waiting from the first list
- **Reply received 2026-10-05 (operator):** bottle not approved; the 94 side-view
  surfaces stay candidate (no saved hash report); no sanitized error logs. All
  three stay as they are. Still open.
- **Water bottle print area:** approve / change / not yet. The zones are in the
  code, the order block is on. Claude can produce front and back proof images in
  this repo for you to look at if you say "send proof".
- **94 side-view surfaces (sleeves, neck label, mug wrap):** paste the Photopea
  validator report (hash list), or write "accepted from the 188/188 operator
  report". Until then they stay `candidate`.
- **Real errors:** sanitized Admin Activity Log and Render error lines, or
  "no errors seen".
- ANSWER:

### N5. Artwork on a side the opened product does not have (low priority, a decision)
- **Why:** if a saved design has artwork on the back, sleeves or neck (for example
  from a T-shirt) and the customer then opens a product that lacks that side (a
  mug has Left/Right/Wrap, not a back), that artwork is kept in the design but
  never shown or sent with the cart item. This only happens through restored
  drafts, never by normal editing.
- **Pick one:** (a) keep it and show a clear warning, (b) move it onto the
  front, (c) drop it with a notice. Claude recommends (a).
- **Blocks:** nothing.
- ANSWER (operator, 2026-10-05): (a) keep the artwork and show a clear warning.
- STATUS: DONE. The Studio shows an amber warning naming the sides, the add-to-cart message repeats it, and the cart note records `unrenderedArtworkFaces`.

### N6. Merge permission: two instructions disagree
- **Why:** your chat message said to work and merge automatically. The operator
  reply in `claude/reports.md` says "ask before merging each PR".
- **What Claude is doing until you answer:** docs-only PRs merge automatically
  once green. PRs that change site code are opened and kept green, then Claude
  asks before merging (code merges deploy the live site).
- **Pick one:** (a) merge code PRs automatically too once all checks are green,
  or (b) always ask first for code PRs.
- **Blocks:** code PRs waiting for your OK.
- ANSWER (operator, 2026-10-05): (a) Claude may merge code PRs automatically once all checks are green and the release scope is reported; limited to small, tested changes in the approved backlog; no production data/settings/provider/schema/order/payment changes, no force-push, no bypassing fail-closed gates.
- STATUS: DONE. Applied from now on.

### N7. Image upload to storage is rejected in production
- **What was reported (N2):** adding an uploaded picture gets as far as creating
  the storage link, but the final browser upload (PUT) to storage is rejected.
- **What Claude checked in the code:** the API creates a normal presigned upload
  link for the bucket and does not tie it to a content type, so the link itself
  looks correct. A browser upload to a bucket that is rejected is most often the
  bucket's CORS rule (a provider setting). Claude has not changed any provider
  setting and will not without your approval.
- **How to confirm the cause (2 minutes, no secrets):** in the live Studio open
  browser DevTools, Network tab, upload a small picture, click the failed request
  to the storage address and write down: its status (for example 403) and any red
  console message that mentions CORS. Paste only those words.
- **Likely fix if it is CORS (your decision, in the Cloudflare R2 bucket
  settings):** allow origin `https://trynext.shop` and `https://www.trynext.shop`,
  method `PUT`, and header `Content-Type`. Claude will not do this itself.
- **Alternative if you would rather not change the bucket:** Claude can send
  uploads through the API instead of straight to the bucket. This avoids CORS but
  uses API bandwidth and has size limits, so it is a bigger change and needs your
  go-ahead.
- **Pick one:** (a) I will check DevTools and paste the status, (b) I will change
  the bucket CORS myself, (c) Claude should build the through-the-API upload.
- **Blocks:** customers uploading artwork for custom orders.
- ANSWER (operator, 2026-10-05): (c) build the through-the-API upload path. Do not change Cloudflare/R2 settings or credentials. Enforce type/size limits, authorization, origin protection, bounded size, safe keys, content validation, timeouts, no secret or link leakage; keep the cart contract; stand-in storage tests; stop before any real order or payment.
- STATUS: BUILT (PR for N7). Real-bucket verification is still UNVERIFIED until someone uploads against the real storage after deploy (see N8). Trade-offs: the through-the-API route is used only when the direct upload fails; the file passes through the Render API (up to 25 MB per file, held in memory during the upload, limited by the existing 30-uploads-per-10-minutes-per-IP limit), so heavy use costs API bandwidth and memory.

### N8. After the upload change is live: one real upload test
- **Why:** Claude proved the new path with a stand-in bucket that blocks the browser
  the same way production does, but cannot reach the real storage or live site.
- **What to do (3 minutes, no checkout):** once the change is deployed, open the live
  Studio, upload one small harmless picture, press Add to cart. Write: worked, or the
  exact message shown. Then remove the item from the cart.
- **Blocks:** confirming the fix on the real storage (N3 and N2 stay open until then).
- ANSWER:

### N9. Make the duplicate-order protection survive restarts (optional, a database change)
- **Why:** checkout used to retry order creation after a gateway error with nothing to
  stop a second order if the first one had actually gone through. Claude added an
  in-memory guard (PR for N9). It covers retries and double taps within minutes on one
  API process, but it is forgotten when the API restarts and would not work across two
  API instances. A permanent version needs a new column and unique index on the orders
  table (`idempotency_key`), which is a database schema change.
- **Pick one:** (a) the in-memory guard is enough, (b) approve the schema change: Claude
  will prepare a reversible migration and a dry run and ask again before running it.
- **Note:** the standby-database sync code already adds an `idempotency_key` column
  to its copy of `orders`, so this seems to have been planned.
- **Blocks:** nothing now.
- ANSWER:

### N10. Where should contact-form messages go? (Telegram is not configured)
- **Why:** the Contact page told visitors "Your message has been sent" but the message
  only went to Telegram, which your operator reports is not configured, and it was
  stored nowhere. Messages could be lost. Claude fixed the wording and now saves every
  message where the admin can read it: Admin > Activity Log, filter "Contact Messages".
  Nobody is alerted when one arrives, though, unless Telegram works.
- **Pick one (your decision, Claude changes no provider setting):**
  (a) set up Telegram (a bot token and chat id in the Render settings, names only), or
  (b) tell Claude to also send contact messages by email (Claude needs to know which
  email service is configured, name only), or (c) the Activity Log is enough for now.
- **Blocks:** nothing now; messages are safe in the Activity Log.
- ANSWER:

### N11. Product list export for the catalog and image check (read-only)

- **What:** a sanitized list of your live products: for each one the id, name, category,
  active or not, price, stock, and the image web addresses (or file names). No customer
  data, no order data, no settings.
- **Why:** Claude can only check the files in the code. It cannot see your live products,
  so it cannot say which ones still point at retired `/mockups/` pictures, outside
  images, or missing files. The storefront already swaps retired pictures for the
  approved photo when a page is shown, so customers should not see broken images.
- **How to give it (no secrets):** in Admin, export or copy the product table into a
  file on a branch, or paste it into `claude/reports.md`.
- **Blocks:** the read-only catalog report only. Claude changes no live product data;
  any fix needs a dry run and your OK for that exact change.
- ANSWER:

---

## What Claude is doing itself meanwhile (no action from you)

- Touch editing: simulated touch test (not a replacement for N1).
- Then checkout and orders, then catalog and first-party images, as ordered in
  `claude/reports.md`.

## Done

- 2026-10-05: uploaded images with a stand-in bucket that blocks the browser (like production): the file goes through the API, the bucket holds the exact PNG, the cart points at it.
- 2026-10-05: back, left sleeve, right sleeve and neck-label artwork: browser test with
  text added through the real Studio UI. All five textures contain real artwork.
- 2026-10-05: PNG export on a T-shirt front: a PNG downloads and the user sees a message.
- 2026-10-05: first list answered in `claude/reports.md`.

- 2026-10-05: N10 decided by operator: Activity Log is enough for contact messages; Telegram/email stay unconfigured and truthful. N9: design and dry-run only, no schema change.


## 2026-10-08 Current consolidated work order

Claude should pick up the following commands automatically in order. Existing N1-N11 answers and safety boundaries remain binding.

1. **PR #27 / live upload:** wait for green CI, active-app, and Pages checks; merge the small tested CSRF-header fix only after checks pass; deploy; run one harmless live Studio PNG upload and Add to Cart test; stop before checkout; record exact deployment and result.
2. **Studio reliability:** complete local/stand-in-storage evidence for upload retry/cache, processed-image replacement, export-versus-canvas parity, switching/variant identity, draft restore, cart payload, and supported faces across T-shirt, long sleeve, hoodie, mug, and cap. Add focused tests only where a real gap exists.
3. **Live/device verification:** keep real-phone touch and any unavailable live route explicitly UNVERIFIED until evidence exists; after code merges verify the custom domain, Pages bundle, health aliases, catalog reads, mockups, and Studio route.
4. **Checkout/order safety:** local/throwaway-DB checks only for idempotency, duplicates, pricing, stock, promo, statuses, cancellation/restock, payment truthfulness, and notifications. No real order, payment, customer notification, or live data mutation. Persistent idempotency schema work is design/dry-run only.
5. **Catalog/images:** perform a read-only audit from a sanitized live product export if available. No live imports/deletes/repairs without a reversible dry run and explicit approval. Keep the bottle custom-order hold.
6. **Mockup release:** preserve 94 accepted plus 94 candidate status until saved visual evidence is available; do not claim Photoshop/Photopea-level editability or 188/188 release approval from historical statements alone; do not promote bottle masters or activate templates.
7. **Errors/infrastructure:** inspect only sanitized Activity Log/Render/health evidence. Do not change R2 CORS, DNS, Render variables, Neon, Upstash, schema, or credentials under this queue.

After each command, update `reports.md`, `claude/reports.md`, and `AGENT_HANDOFF.md` with status, exact tests/evidence, commit/PR/deployment ID, limitation, and next command. Never expose secrets or claim live success from local tests.


- 2026-10-08: Commands 0-6 processed. PR 27 and PR 29 merged. Open for the owner: live upload + Add to Cart check after the `014bdce` deploy (UNVERIFIED, sandbox cannot reach the live domain); sanitized product export (N11); sanitized Activity Log / Render evidence; decision on order status transitions and restock-on-cancel.

## 2026-10-09 Owner decisions and execution update

The owner authorized Manus to decide the remaining behavior choices conservatively. T7 is now decided: forward-only transitions are `pending -> processing|cancelled`, `processing -> ongoing|shipped|cancelled`, `ongoing -> shipped|cancelled`, and `shipped -> delivered`; no transitions out of `delivered` or `cancelled`. Cancellation is allowed only before shipping and restores reserved stock exactly once with an audit record. Claude must implement and test locally/throwaway only before any release or live-data change.

T8: prepare the reversible persistent `idempotency_key` migration and dry run, but do not execute it. T9: remember and restore each product’s pre-switch artwork size while retaining fit-to-zone safety, face behavior, undo/redo, and variant identity. T10 remains `not yet`; T11 remains Activity Log sufficient, with Telegram/email unconfigured.

The current highest-priority task is reproducing and fixing or classifying the live API fallback upload 502. T2 public verification passed 30/30; T3 real phone, T4 sanitized product export, T5 sanitized Activity Log/Render evidence, T6 saved 94-surface validator report, and current Pages deployment parity remain blocked. Do not fabricate evidence or change provider settings, live data, mockup promotion, bottle hold, payments, orders, or ads.

- 2026-10-09 (N12): **Live upload still fails at the storage fallback (T1).** Needed from the owner/operator, without secrets: either (a) the sanitized `storageFailure` line from Render logs for `/api/storage/upload-via-api` (fields: name, code, httpStatus only), or (b) a go-ahead to merge PR 37, which shows a short reason code (`storage_access_denied`, `storage_credentials_rejected`, `storage_bucket_missing`, `storage_unreachable`) in the Studio alert so one more live test names the cause. Blocks: any further storage code work; if the reason is access/credentials/bucket, the fix is in the Cloudflare R2 token or bucket settings (owner action, not code).

- 2026-10-10 (N12 update): PR 37 was merged by the owner as `70acdb0` (Studio now shows a short storage reason code such as `[storage_access_denied]` when the through-the-API upload fails). Option (b) is therefore done in code; it is not confirmed deployed or tested live. Still needed: after the Pages/Render deploy, one harmless live upload + Add to Cart (stop before checkout) and the exact `[reason]` text from the alert. If it is access-denied, credentials-rejected or bucket-missing, the fix is in the Cloudflare R2 token or bucket settings (owner action); `storage_unreachable` points at the endpoint/account id. Claude will not change provider settings.
