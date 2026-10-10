# MANUS TO DO REPORTS — what Claude needs next (updated 2026-10-10 06:40 UTC)

Claude has finished everything it can do from the repository. What is left needs access Claude does not have (Cloudflare and Render dashboards, a phone, Photopea). This file is the only list. Report each item as `## Manus report — <id>` in `claude/reports.md` (evidence in `claude/evidence/`), push each one as soon as it is done, and Claude picks it up within minutes and acts on it without waiting.

## FOR THE OWNER — the short list (do these in order; everything else is automatic)
1. **Fix the upload (10 minutes, Cloudflare + Render dashboards).** This is the only thing stopping customers' artwork from saving.
   - Cloudflare R2 dashboard -> your bucket -> API tokens: make sure the token Render uses has **Object Read & Write** on that bucket (create a new token if unsure).
   - Render dashboard -> the API service -> Environment: the R2 account ID, bucket name, endpoint and the access key pair must all belong to that bucket and that token. Do not paste the keys into GitHub or chat.
   - If you changed anything in Render, redeploy the service.
2. **Tell Manus "M1 done"** (or write `## Manus report — M1` yourself in `claude/reports.md`). Manus then runs M2, the one harmless Studio upload. Claude records the result the same minute it lands.
3. **Answer these when you can** (one line each is enough, in `claude/reports.md` or to Manus):
   - D1: the 10 products with Unsplash or imgur images (ids 1-9 and 20): replace with your own images, hide, or keep?
   - D2: water-bottle print area: `approve`, `change`, or `not yet` (now: `not yet`).
   - D3: contact messages: keep in the Admin Activity Log (now) or add Telegram or email?
   - D4: prepare (not run) the order-protection database migration: yes or no?
   - D6: close the six old open PRs (#13, #15, #20, #21, #23, #40): yes or no?
4. **Security (GitHub settings, 2 minutes):** revoke the GitHub token that was pasted in chat earlier (D5).
5. **Only if you have a phone handy:** open the live Design Studio and try text, drag, pinch, rotate, then Add to Cart (do not check out); tell Manus what happened (M5).

Claude does everything else on its own: it checks the repository every 5 minutes, picks up Manus's reports, fixes code with tests, merges when all four checks are green, and keeps this file current.

## Safety rules (always)
No secrets, tokens, signed URLs or database URLs in any file or message. No real order or payment. No customer data. Stop before checkout submit. Do not change production data, the database schema or the water-bottle hold. Provider settings (Cloudflare R2, Render, DNS) may only be changed by someone with dashboard access who has the owner's go-ahead; write down exactly what was changed.

## M1 — Fix the Cloudflare R2 write permission (blocks all Studio uploads)
Why: the live Studio upload fails because R2 answers `AccessDenied` / 403 for the server-side write (Render logs 01:14 and 04:18 UTC). Render, Node and the code are fine.
Steps (anyone with Cloudflare R2 and Render dashboard access):
1. In the Cloudflare R2 dashboard, open the bucket the app uses. Create or edit the API token so it has **Object Read & Write** on that bucket.
2. In Render, check the service's storage environment values (names only, never paste values): the R2 account ID, bucket name and endpoint must belong to that bucket, and the access key pair must be the one from the token above.
3. Redeploy the Render service normally if you changed any environment value.
Report as M1: what you changed (names only, no keys), and the time.

## M2 — One harmless Studio upload after M1
On `https://trynext.shop/design-studio` upload a 64x64 PNG on a T-shirt and click Add to Cart. Report: did the cart count go to 1; the exact alert text if it failed (it should now end in a short bracketed reason such as `[storage_access_denied]`); the failing request's status and `content-type`. Then remove the cart item. Do not check out.
If it works, Claude records the upload as verified.

## M3 — Render confirmation of the latest build
Report the live deploy commit (should be `6dbff52` or newer, which includes the 424 status fix) and confirm the service started cleanly.

## M4 — Photopea validator report
Save the report (or a hash list) for the 94 side-view and mug-wrap surfaces as `claude/evidence/photopea-validator-report.*`, or write `BLOCKED: no report exists`. The surfaces stay `candidate` until it exists.

## M5 — Real phone check of the Design Studio
Phone (or a 390x844 emulator): upload the PNG, check the preview fits and scrolls into view, drag, pinch, rotate, switch to the back, scroll the page with the Select tool, tap Add to Cart (do not check out). Report device, browser, what worked and what broke.

## M6 — Admin Activity Log, last 7 days (needs admin login)
Errors grouped by route, status, release, time and customer impact; sanitized fields only.

## Owner decisions (Manus: relay them if the owner gives them; Claude acts on them as soon as they are written down in `claude/reports.md`)
- **D1** The 10 products with third-party images (ids 1–9 and 20, see `claude/evidence/catalog-audit-2026-10-10.md`): replace with first-party images, hide, or keep.
- **D2** Water-bottle print area: `approve`, `change`, `not yet` (current: `not yet`).
- **D3** Contact messages: stay in the Admin Activity Log (current) or add Telegram or email.
- **D4** Prepare (not run) the order-idempotency migration in `claude/T8_IDEMPOTENCY_MIGRATION_PLAN.md`: yes or no.
- **D5** Revoke or rotate the GitHub token that was pasted earlier and flagged as compromised.
- **D6** Close the stale open PRs #13, #15, #20, #21, #23 and #40 (all superseded).

## What Claude does when each item lands
| Item | Claude's action |
| --- | --- |
| M1 done | Asks for M2 if not already done; records the change in the handoff notes. |
| M2 works | Marks the upload verified in `AGENT_HANDOFF.md` and `CLAUDE_HANDOFF_CHECKLIST.md`. |
| M2 fails with a reason code | Names the cause and says exactly which setting to fix; fixes any code cause test first. |
| M3 older commit | Tells the owner to redeploy `main`. |
| M4 report | Updates the mockup release gate (fail-closed unless every check holds). |
| M5 breaks something | Writes a failing test first, then a small fix PR, merged when all four checks are green. |
| M6 lines | Reads sanitized fields and fixes any code cause with a test. |
| D1–D4 answers | Applies them inside the safety rules; D1 image changes go through the admin or a reviewed change list, not a bulk script. |
