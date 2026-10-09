# Manus AI todo tasks (what Claude needs, all in one list)

Written by Claude, 2026-10-09. Status of `main` when written: `199a0f8` (PR #33).

**How this works:** Manus AI does each task below, then writes the result in
`claude/reports.md` under a heading `## Manus report — T<number>` and pushes it
to GitHub. Claude reads those reports and does the code and test work that
depends on them. Claude cannot reach the live site (`trynext.shop`), the
Cloudflare/Render dashboards, a real phone, or the admin panel from its sandbox.
That is why these tasks are listed for Manus.

**Rules for every task:**
- Never paste passwords, tokens, API keys, database URLs, presigned URLs, payment
  numbers, or customer details (names, phones, addresses). Redact them.
- No real order, no payment, no customer message, no change to live data or
  provider settings (R2 CORS, DNS, Render variables, Neon, Upstash, schema).
- Stop before checkout in every live test.
- Write "UNVERIFIED" for anything not actually seen. Do not guess.
- Report format per task: status (`done` / `blocked`), exact evidence, what you
  saw, any exact error text.

---

## A. Live checks (Claude's sandbox gets a 403 on the live domain)

### T1. Live Studio upload + Add to Cart re-test (highest priority)
After Cloudflare Pages serves `main` at or after `199a0f8` (PRs #32 and #33
contain the fixes for the earlier "Add to Cart stayed at 0 items" result):
1. Record the Pages production deployment commit id and the deployed
   Design Studio bundle name.
2. On `https://trynext.shop/design-studio`, choose a T-shirt, upload one tiny
   harmless PNG, confirm it shows as a layer on the preview.
3. Click Add to Cart. Report: did the cart count go to 1, was there an error
   alert ("Your design was not added to the cart" with a reason), the exact
   reason text, and any browser console or network error (status code and
   request path only, no signed URLs).
4. Remove the test item from the cart. Do not check out.

### T2. Live site health after the latest merge
Run `node scripts/verify-critical-flows.mjs` (or the equivalent browser checks)
and paste the pass/fail lines. Also report: health aliases, product / category /
mockup reads (HTTP status only), canonical host, service-worker/bundle
freshness, and the three public hostnames serving matching content.

### T3. Real phone check of the Design Studio (N1)
On any phone: open the live Studio, pick a T-shirt, add text, drag it, pinch to
resize, rotate, switch to the back, tap Add to cart. Do not check out. Report:
worked, or what broke (phone model and browser).

## B. Data Claude needs (read-only, sanitized)

### T4. Product export (N11)
A sanitized list of all live products, one row per product: id, name, category,
active or not, price, stock, image addresses or file names. No customer or
order data. Save it as a file on a branch (for example
`claude/evidence/products-export.csv`) or paste it into `claude/reports.md`.
Claude will then do the read-only catalog and image audit (retired `/mockups/`
paths, missing or duplicate records) and produce a dry-run report only.

### T5. Sanitized errors and health (N4, Command D)
Admin Activity Log and Render error lines for the last 7 days, grouped by route,
status, release, timestamp, correlation id, and customer impact. Redact
credentials, database URLs, signed URLs, personal data, and payment data. If
there are none, write "no errors seen" only if you actually looked.
Also report read-only: Render primary and standby roles, database, Redis,
storage, scheduler, and backup status.

### T6. Saved validator report for the 94 side-view surfaces (N4)
The sleeve, neck-label, and mug-wrap surfaces are `candidate` because there is
no saved hash report. Provide the Photopea validator report (file or hash list)
as a file on a branch. Without it they stay `candidate`. Do not mark them
accepted from a statement alone.

## C. Decisions Claude needs from the owner (answer in `claude/reports.md`)

### T7. Order status rules and cancellation
Today an order can be changed from any status to any other (for example
delivered back to pending), and cancelling does not put stock back.
Please decide:
1. **Allowed transitions:** (a) any to any as now, or (b) forward only, for
   example pending, confirmed, shipped, delivered, with cancel allowed before
   shipped. If (b), list the exact allowed moves.
2. **Cancel returns stock:** yes or no.
Claude then adds the rules and tests (local throwaway data only).

### T8. Duplicate-order protection that survives restarts (N9)
Choose (a) the current in-memory guard is enough, or (b) approve preparing a
reversible migration (new `idempotency_key` column and unique index on
`orders`) plus a dry run. Claude prepares it and asks again before anything is
run. No schema change is made without that second approval.

### T9. Artwork size after switching products and back
Switching T-shirt, hoodie, mug and back does not restore the original artwork
size (it only ever shrinks to fit). Choose (a) leave as is, or (b) remember the
pre-switch size per product and restore it. Claude will do (b) as one small PR.

### T10. Water bottle print area (N4)
Answer `approve`, `change`, or `not yet`. If you want to see proof images of the
front and back zones first, write `send proof` and Claude will produce them.
The customer order hold stays on until you approve.

### T11. Contact messages (N10)
Currently saved in Admin Activity Log (filter "Contact Messages"), no alerts.
Confirm that is enough, or name which provider to set up (Telegram or email;
provider name only, no keys).

## D. Not to be done under this list

- Meta ad campaign (the 600 BDT budget, Braintrack.LLC): not touched without
  separate verified evidence and approval.
- Provider setting changes (R2 CORS, DNS, Render variables, Neon, Upstash).
- Promoting bottle masters, activating mockup templates, or accepting the 94
  candidate surfaces without saved visual evidence.

## E. What Claude does as soon as Manus reports

| Manus report | Claude then |
| --- | --- |
| T1 fails or shows an error | Fixes the exact failing step, adds a regression test, opens a small PR |
| T1 passes | Records it as verified in the handoff files |
| T4 | Read-only catalog and image audit with a dry-run change list |
| T5 | Root-cause review of real errors, fixes in code only |
| T6 | Updates the mockup gate evidence (still fail-closed unless every check holds) |
| T7 | Status-transition rules, restock-on-cancel, tests |
| T8 | Reversible idempotency migration design and dry run (not executed) |
| T9 | Size-restore PR with tests |

Claude keeps `AGENT_HANDOFF.md` and `CLAUDE_HANDOFF_CHECKLIST.md` current after
each piece of work.
