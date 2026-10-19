# MANUS TO DO TASKS — ALL MAIN

Written by Claude on 2026-10-19 after a repo audit. This is the full task list for owner/Manus actions.
Do not assume Claude is polling or that a report automatically starts either agent; resume it explicitly.

## Current checkpoint — 2026-10-20 (supersedes the dated snapshot below)

- GitHub `main` is `1d8fb7b…` after PR #70 merged; that merge is documentation-only. Cloudflare Pages and Render both report `1d8fb7b…` deployed successfully. The application-source baseline remains the prior code commit; no recovery fix is deployed.
- Production liveness is 200, but readiness is 503 (`db=false`, `catalog=false`) and `/api/products` is 500 through both the public gateway and direct Render origin.
- Both known Neon primary `production` branches (`trynex` and `trynex-db`) are archived. Which one Render targets is unverified. Owner must identify and restore the authoritative branch; no provider change or database query was performed.
- PR #67 remains open/draft at `c9d55a3` with green checks and awaits the owner’s merge/handle decisions. PR #69 remains open/unmerged at `4255e9a` with green checks.
- Recovery branch `manus/recovery-phase1-2026-10-16` is pushed in draft PR #71 at `5d61f91`; local tests pass and CI is pending. It is not merged or deployed. See `docs/recovery/` and `claude/evidence/phase1-live-evidence-2026-10-20.md`.
- L1 route HTTP delivery was checked; L2/L3 API readiness currently fails; L4 release identities were checked; L5 DevTools/network rendering is UNVERIFIED. Do not treat HTTP 200 routes as proof of a working catalog.
- M1/R2 and the Neon recovery are owner-only. M2 live upload waits for explicit `M1 done`. M4 Photopea evidence is absent; 94 surfaces remain candidate. M6 seven-day request logs remain unavailable. No real order/payment, checkout, schema migration, or data mutation occurred; preserve 25% advance COD.
- Reports remain a manual handoff until an authorized trigger is confirmed. See `claude/reports.md` and `docs/recovery/DEPLOYMENT_REPORT.md`.

How to use: do the tasks in order. After each one, write a short report in
`claude/reports.md` under the heading shown in "Report as". No event trigger or
Claude polling is verified; explicitly resume Claude after a report is pushed.

## Safety rules (apply to every task)
- Never paste passwords, tokens, API keys, signed URLs, database URLs, payment numbers or customer data into GitHub, chat or any file. Write names and results only.
- Do not place a real order, submit a payment, or press the final checkout button.
- Do not change production data, the database schema, or the water-bottle hold.
- If a step does not match what you see on screen, stop and write what you see. Do not guess.

## Historical note — Claude verified on 2026-10-19 (superseded by the current checkpoint above)
- `main` is at `e6c7041`. Nothing has been merged since 2026-10-12. No new owner or Manus reply has arrived since then.
- Claude ran the full typecheck on current `main` (all packages: libs, api-server, storefront, mobile, promo, design systems, mockup-sandbox, scripts). Result: PASS, no errors.
- Claude could NOT reach the live site (`trynext.shop` returned a proxy 403 from the Claude workspace). So these are UNVERIFIED by Claude: whether the latest code is live, the Cloudflare cache behavior, the live upload, the live invoice download, and real-phone touch editing. Tasks T3 to T8 exist to close exactly these gaps.
- Last confirmed live backend: Render commit `2e5e63eda6d06800e15b2291225eff615d948849` (includes the upload 424 fix). Cloudflare Pages deploy state is not confirmed.

---

## PART A — Dashboard tasks (Cloudflare, Render, GitHub)

### T1. Fix the Cloudflare R2 write permission (BLOCKS ALL ARTWORK UPLOADS)
Where: Cloudflare dashboard and Render dashboard. Time: about 10 minutes.
1. Cloudflare dashboard -> R2 -> open the bucket the app uses -> API tokens.
2. Make sure the token the API uses has **Object Read & Write** on that bucket. If unsure, create a new token with that permission, scoped to that one bucket.
3. Render dashboard -> the API service -> Environment. Check that these values all belong to that bucket and token: R2 account ID, bucket name, endpoint, access key ID and secret. Look at the names only. Never copy values anywhere.
4. If you changed anything in Render, click Manual Deploy -> Deploy latest commit (or let it redeploy) and wait until it shows Live.
Done when: Render shows Live and no storage error appears in Render Logs after a test (T2).
Report as: `## Manus report — T1` — what you changed (names only), the time, the Render deploy status.

### T2. One harmless Studio upload (run only after T1)
Where: the live site in any browser. Time: 3 minutes.
1. Open `https://trynext.shop/design-studio`, choose a T-shirt.
2. Upload a tiny test image (for example 64x64 PNG), place it, press Add to Cart.
3. Write down: did the cart count become 1? If it failed, copy the exact alert text (it ends in a short bracketed reason).
4. Remove the item from the cart. Do NOT check out.
Done when: cart count is 1 and no error text.
Report as: `## Manus report — T2` — worked, or the exact message.

### T3. Let Claude check the live site itself (one-time setting)
Where: Claude environment network settings (the page where Claude's environment is configured). Time: 2 minutes.
1. Add `trynext.shop`, `www.trynext.shop` and `*.pages.dev` to the allowed network hosts.
2. Start a new Claude session so the setting applies.
Why: Claude cannot confirm anything is live until it can open the site. After this, Claude runs the read-only live checks (T5 equivalents) every time.
If you do not want to do this: do T5 yourself after each merge and paste the output.
Report as: `## Manus report — T3` — done, or "not allowing".

### T4. Confirm what is actually deployed — DONE (2026-10-20; see current checkpoint)
Where: Cloudflare Pages and Render dashboards. Time: 5 minutes.
1. Cloudflare dashboard -> Workers & Pages -> the storefront project -> Deployments. Write the commit hash and status of the latest Production deployment and its time.
2. Render dashboard -> the API service -> Events or Deploys. Write the commit hash and status of the latest deploy.
3. GitHub -> New-Trynext -> Commits on `main`: newest main is `1d8fb7b…`; PR #70 was docs-only. Pages and Render both report `1d8fb7b…` deployed.
Done when: you have two hashes (Cloudflare, Render) and whether each equals the newest `main` commit that changed code. Docs-only commits do not need a deploy.
Report as: `## Manus report — T4` — the two hashes and statuses.

### T5. Safe public live check (read-only, no login) — PARTIAL (L1–L4 done; L5/cache unverified)
Where: any computer with internet and Node installed (or the terminal in your hosting). Time: 3 minutes.
1. In a clone of the repo run: `node scripts/verify-critical-flows.mjs`
2. Paste the pass/fail lines (not secrets, there are none) into the report.
3. Cache check: run `curl -sI https://trynext.shop/api/products` twice, a few seconds apart, and write the `cf-cache-status` line from each (expected: MISS then HIT after the cache change is deployed).
Done when: every line passes and the second request says HIT.
Report as: `## Manus report — T5` — the pass/fail lines and the two cache lines.

### T6. Photopea validator report (needed to approve 94 side-view surfaces)
Where: your Photopea validator output. Time: depends on the report.
1. Save the validator report or the hash list as `claude/evidence/photopea-validator-report.txt` (or `.csv`) in the repo and push it. No customer data.
2. Or write in `claude/reports.md`: "accepted from the 188/188 operator report" if you accept it as proof.
Until then: the 94 sleeve, neck-label and mug-wrap surfaces stay `candidate` and the water-bottle hold stays on. Claude will not change them without this.
Report as: `## Manus report — T6` — file path or "accepted".

### T7. Real-phone check of the Design Studio
Where: a real phone (not a desktop emulator). Time: 5 minutes.
1. Open the live Studio, pick a T-shirt, add text.
2. Drag it, pinch to resize it (including making it very small, then pinching again), rotate it, switch to the back, tap Add to Cart. Do NOT check out.
3. Write: worked, or what broke, plus phone model and browser. If pinch on small artwork misbehaves, say exactly what moved.
Why: Claude measured a pinch bug only in an emulator. A real phone proves it.
Report as: `## Manus report — T7`.

### T8. Admin Activity Log, last 7 days (needs admin login)
Where: live admin panel -> Activity Log (and Render Logs if you have access). Time: 10 minutes.
1. Write the counts for the last 7 days: total requests, 4xx errors, 5xx errors, and the top 5 error lines (sanitized: remove emails, phone numbers, names, tokens).
2. If there are none: write "no errors seen".
Report as: `## Manus report — T8`.

### T9. Revoke the GitHub token that was pasted in chat earlier
Where: GitHub -> your profile -> Settings -> Developer settings -> Personal access tokens. Time: 2 minutes.
1. Delete or revoke every token you do not recognize or that was shared in a chat.
2. If the repo needs a token for automation, create a new fine-grained one limited to this repository and store it only in the host's secret store, never in a file.
Report as: `## Manus report — T9` — revoked, with the date.

---

## PART B — Decisions only the owner can make (one line each)
Write the answer in `claude/reports.md` under `## Owner decisions`. Claude acts on it within the hour.

- **D1.** The 10 products with third-party images (ids 1 to 9 and 20): `replace`, `hide`, or `keep`. Nothing is changed until you answer.
- **D2.** Water-bottle print area: `approve`, `change`, or `not yet`. Current answer is `not yet`.
- **D3.** Contact messages: keep them only in the Admin Activity Log (current), or add email or Telegram.
- **D4.** Duplicate-order protection that survives restarts needs a database column and index. Claude prepares the migration and a dry run only, never runs it. Answer `yes prepare` or `no`.
- **D5.** Done by T9.
- **D6.** Old close-list issues (#13, #15, #20, #21, #23, #40) stay closed/superseded. Answer `confirm`.
- **D7. PR #67 (Studio pinch/resize fix, draft).** `approve merge`, `change` (say what), or `hold`. Claude will not merge it without `approve merge`.
- **D8. Browser test.** Write `add the browser test` to authorize one separate pull request that adds Playwright to the repo with its CI step. Without those words Claude adds no dependency.
- **D9. Resize handles.** Handles are 44 px, which leaves only about 10.7 px of free space on small artwork. Answer: `keep 44px`, `smaller handles on small artwork`, or `bigger touch area only`.
- **D10.** Meta Ads and the order-protection migration (T8 plan in `claude/T8_IDEMPOTENCY_MIGRATION_PLAN.md`) stay untouched and never executed. Answer `confirm`.

---

## PART C — What Claude does by itself when each report lands
- T1 + T2 pass -> Claude records uploads as verified and closes N2, N7, N8.
- T3 done -> Claude runs live read-only checks itself every session and records results.
- T4 + T5 pass -> Claude marks the latest build live, records cache behavior, and ticks the matching lines in `AGENT_HANDOFF.md` and `CLAUDE_HANDOFF_CHECKLIST.md`.
- T5 fails -> Claude opens a fix branch with a focused failing test first, then the smallest fix, then typecheck, tests and build, then a pull request.
- T6 present or accepted -> Claude promotes only the surfaces the report proves, with the full structural, visual and provenance gates. Nothing else is activated.
- T7 or D7 + D9 + D8 answered -> Claude does the Studio pinch fix with a regression test (and the browser test if authorized), keeping the COD advance at 25% and all payment, auth and order safeguards untouched.
- D1, D3 answered -> Claude implements them in code only, no production data change without a dry run and your explicit approval for that exact change.
- Claude merges code pull requests by itself only when small, tested, inside this list, and all checks are green (rule N6). Anything touching provider settings, the database, orders or payments always stops and asks.

## Finish line (everything complete when)
T1 to T9 reported, D1 to D10 answered, latest build confirmed live, cache shows HIT, Studio upload and phone check pass, Photopea evidence recorded. Claude then updates `AGENT_HANDOFF.md` and `CLAUDE_HANDOFF_CHECKLIST.md` with status, last completed, remaining work, blocker, next safe action and verification, and states clearly what is local, committed, pushed, merged and deployed.
