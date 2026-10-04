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

Last updated: 2026-10-05 (N7 built, N8 and N9 added)

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
