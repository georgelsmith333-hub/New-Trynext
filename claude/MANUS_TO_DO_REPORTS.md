# MANUS TO DO REPORTS — what Claude needs next (updated 2026-10-12 04:20 +06:00)

Claude has finished the prior repository tasks. M5b is now measured: a local 390×844 pinch changed the layer from `scale=2.5, scaleX=1, scaleY=1, rotation=0°` to `scale=2.5, scaleX=0.15, scaleY=1, rotation=0°`; the visible frame narrowed from 54.72×54.72 to 28×54.72 CSS px. M5 remains partial until Claude adds a failing regression test and verifies a focused fix. M3 is verified; M6 remains partial because seven-day request logs are unavailable. M1 is owner-only; M2 is gated on explicit `M1 done`. Evidence is in `claude/evidence/`. Current report PR: [#66](https://github.com/georgelsmith333-hub/New-Trynext/pull/66), open with three checks pending at 04:20 +06:00.

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
   - D6: the old close-list (#13, #15, #20, #21, #23, #40) remains superseded. PR #63 is merged and was never part of that stale list; do not target it for closure.
4. **Security (GitHub settings, 2 minutes):** revoke the GitHub token that was pasted in chat earlier (D5).
5. **M5b transform evidence is recorded.** Before/after values and screenshots are in `claude/evidence/m5b-transform-local-2026-10-12.md`. Claude’s next action is a focused failing regression test, then the smallest source-of-truth fix; no merge/deploy without owner approval. No physical phone was used, and do not repeat Add to Cart until M1 is explicitly done.

Claude does the repository work when a session is started: **message Claude "check" after Manus pushes a report** (there is no background polling now; the earlier 5-minute loop ended 2026-10-10). Claude then reads the report, fixes code with tests, asks before merging, and keeps this file current.

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
**Status: VERIFIED (2026-10-12).** Current live commit is `2e5e63eda6d06800e15b2291225eff615d948849`, which includes PR #57's 424 fix. Deploy `dep-db5vau95efls73b3eq00` succeeded; Node `v24.14.1`; startup logged `Server listening`. Full evidence: `claude/evidence/m3-render-current-2026-10-12.md`. Do not redeploy or repeat this check unless the release changes.

## M4 — Photopea validator report
**Status: BLOCKED — no report exists.** No `photopea-validator-report.*` or Photopea hash list is in `claude/evidence/`; the 94 side-view and mug-wrap surfaces stay `candidate` until valid evidence is provided.

## M5 — Mobile check of the Design Studio
**Status: PARTIAL — emulator evidence; no physical phone.** The requested M5b local 390×844 check used a disposable 64×64 image. Before pinch the layer transform was `scale=2.5, scaleX=1, scaleY=1, rotation=0°`; after pinch it was `scale=2.5, scaleX=0.15, scaleY=1, rotation=0°`. The visible frame changed from 54.72×54.72 to 28×54.72 CSS px. Stage touch-callback diagnostics did not fire in this sequence, so Claude should trace the actual touch/pointer/Transformer path, write a focused failing regression test first, then make a small fix. Prior live Add to Cart remains blocked by `storage_access_denied` / HTTP 424; this is not M2. Evidence: `claude/evidence/m5b-transform-local-2026-10-12.md` and `claude/evidence/m5-mobile-emulator-2026-10-12.md`.

## M6 — Admin Activity Log, last 7 days (needs admin login)
**Status: PARTIAL — historical route-level request logs unavailable.** The sanitized live-health snapshot showed 7 requests / 2 4xx / 0 5xx in its last 60 minutes, but this process-local telemetry is not a seven-day history. Render exposed `app` and `build` log types only, not `request`; no operational failure/restart/suspension events were returned in the seven-day window. The requested seven-day route/status/release/time/customer-impact grouping and customer impact remain unverified. See `claude/evidence/m6-admin-health-2026-10-12.md`; do not claim a week with no errors.

## Owner decisions (Manus: relay them if the owner gives them; Claude acts on them as soon as they are written down in `claude/reports.md`)
- **D1** The 10 products with third-party images (ids 1–9 and 20, see `claude/evidence/catalog-audit-2026-10-10.md`): replace with first-party images, hide, or keep.
- **D2** Water-bottle print area: `approve`, `change`, `not yet` (current: `not yet`).
- **D3** Contact messages: stay in the Admin Activity Log (current) or add Telegram or email.
- **D4** Prepare (not run) the order-idempotency migration in `claude/T8_IDEMPOTENCY_MIGRATION_PLAN.md`: yes or no.
- **D5** Revoke or rotate the GitHub token that was pasted earlier and flagged as compromised.
- **D6 — NO ACTION:** the stale close-list (#13, #15, #20, #21, #23, #40) was not open at the baseline check. PR #63 is merged and was never part of that old list; do not target it for closure.

## What Claude does when each item lands
| Item | Claude's action |
| --- | --- |
| M1 done | Asks for M2 if not already done; records the change in the handoff notes. |
| M2 works | Marks the upload verified in `AGENT_HANDOFF.md` and `CLAUDE_HANDOFF_CHECKLIST.md`. |
| M2 fails with a reason code | Names the cause and says exactly which setting to fix; fixes any code cause test first. |
| M3 older commit | Tells the owner to redeploy `main`. |
| M4 report | Updates the mockup release gate (fail-closed unless every check holds). |
| M5b transform measurements | Writes a focused failing test first, traces the touch/pointer/Transformer event path, then prepares the smallest fix PR; asks the owner before merging or deploying. |
| M6 lines | Reads sanitized fields and fixes any code cause with a test. |
| D1–D4 answers | Applies them inside the safety rules; D1 image changes go through the admin or a reviewed change list, not a bulk script. |
