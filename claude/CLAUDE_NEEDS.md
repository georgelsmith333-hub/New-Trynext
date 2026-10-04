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

Last updated: 2026-10-05

---

## Open needs

### N1. Phone check of the Design Studio (touch editing)
- **Why:** Claude can simulate touch in a desktop browser, but only a real phone
  proves dragging, pinch-zoom, the keyboard and the sticky Add to cart bar work.
- **What to do (5 minutes, any phone):** open the live Studio, pick a T-shirt, add
  text, drag it, pinch to resize it, rotate it, switch to the back, tap Add to
  cart. Do NOT check out. Then answer: worked / what broke (phone model and
  browser help).
- **Blocks:** nothing. Claude does the simulated version meanwhile.
- ANSWER:

### N2. Uploaded-image test with real storage (optional)
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
- **Why:** this workspace cannot open `trynext.shop` or `*.pages.dev`.
- **Pick one:**
  - (a) Allow those two hosts in the environment network settings, then start a
    new Claude session (Claude can then check live itself), or
  - (b) After each merge, run `node scripts/verify-critical-flows.mjs` yourself
    and paste the pass/fail lines.
- **Blocks:** confirming that merged changes are live and healthy.
- ANSWER:

### N4. Still waiting from the first list
- **Water bottle print area:** approve / change / not yet. The zones are in the
  code, the order block is on. Claude can produce front and back proof images in
  this repo for you to look at if you say "send proof".
- **94 side-view surfaces (sleeves, neck label, mug wrap):** paste the Photopea
  validator report (hash list), or write "accepted from the 188/188 operator
  report". Until then they stay `candidate`.
- **Real errors:** sanitized Admin Activity Log and Render error lines, or
  "no errors seen".
- ANSWER:

---

## What Claude is doing itself meanwhile (no action from you)

- Back, left sleeve, right sleeve and neck-label faces: browser test of add to
  cart per product family.
- Export as PNG: browser test of the downloaded image against the canvas.
- Uploaded images: browser test with stand-in storage.
- Touch editing: simulated touch test (not a replacement for N1).
- Then checkout and orders, then catalog and first-party images, as ordered in
  `claude/reports.md`.

## Done

- 2026-10-05: first list answered in `claude/reports.md`.
