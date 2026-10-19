# Claude To-Do Tasks and Report-Back Loop

**Historical snapshot prepared:** 2026-10-12 04:20 +06:00
**Repository:** `georgelsmith333-hub/New-Trynext`
**Historical snapshot checked:** `main` at `f784997237c059c933c8fd781473a8e4ae49079e`; superseded by the current checkpoint below.
**Purpose:** one concise entry point for Claude’s next safe work and the Manus ↔ Claude report loop. This is a repository handoff document, **not** a background scheduler or proof that either agent is polling continuously.

## Current checkpoint — 2026-10-20

- Current `main`: `1d8fb7bcde6ab91dbb84c33a802e918d1e3d8322` (PR #70 merged; documentation-only relative to `e6c7041`). Cloudflare Pages and Render both report this commit deployed successfully.
- Production API liveness is 200, readiness is 503 (`db=false`, `catalog=false`), and `/api/products` is 500 through both the Pages gateway and direct Render origin. Both known Neon primary production branches (`trynex`, `trynex-db`) are archived; the exact Render target is UNVERIFIED. Owner must identify and restore the authoritative branch.
- PR #67 remains open/draft at `c9d55a3`, with all checks green; owner approval remains required. PR #69 remains open/unmerged at `4255e9a`, with all checks green.
- Recovery branch `manus/recovery-phase1-2026-10-16` is pushed in draft PR #71 at `5d61f91`; local tests pass and CI is pending. It is not merged or deployed. Detailed reports are in `docs/recovery/`.
- M1/R2 and Neon restore are owner-only; M2 waits for explicit `M1 done`; M4 validator evidence is absent; M6 seven-day request logs are unavailable; L5 browser DevTools evidence is UNVERIFIED. Preserve candidate surfaces, water-bottle hold, no-live-migration/no-order/no-payment boundaries, and Bangladesh 25% advance COD.
- No event trigger or Claude polling is verified. Pushes do not prove autonomous pickup; Claude must be explicitly resumed with `check` after the report is pushed.

## Start here

1. Read this file, then `AGENTS.md`, `AGENT_HANDOFF.md`, `CLAUDE.md`, `CLAUDE_HANDOFF_CHECKLIST.md`, and the newest relevant entries in `claude/reports.md`.
2. Re-check `git status`, branch/remote, current `origin/main`, GitHub PRs, and whether a newer report changed the queue. Do not treat this dated snapshot as live truth.
3. Pick the first ready task below. Do not repeat a task whose evidence is already recorded unless new evidence or a changed deployment makes a retest necessary.
4. After each task, append a dated report to `claude/reports.md`, update this queue’s status/next item, and update `AGENT_HANDOFF.md` as required by the project rules.

## Verified project snapshot and completed work

- The checkout was clean on `main` at `f784997237c059c933c8fd781473a8e4ae49079e`; GitHub `origin/main` matched after PR #64 merged.
- PR #63 (the prior M1–M6 docs/evidence handoff) and PR #64 are merged. PR #63 never revived the stale D6 close-list (#13, #15, #20, #21, #23, #40); this M5b reply is the current follow-up on a new docs/evidence branch.
- Existing project reports say prior repository-side code work is merged. New M5b evidence now establishes a reproducible pinch defect: the image’s `scaleX` collapses while `scale` and `scaleY` remain unchanged. Claude should write the focused failing regression test first, trace the actual touch/pointer/Transformer path, and make only the smallest verified fix.
- The live upload failure remains the substantive product blocker: the latest recorded harmless Studio attempt (2026-10-10, after PR #57) showed `storage_access_denied`; the API fallback returned 424 JSON and surfaced the reason, but the cart stayed empty. Render logs attributed the failed write to Cloudflare R2 `AccessDenied` / HTTP 403. This is an owner-controlled bucket/token/environment configuration issue, not evidence for another code patch.
- **M3 is verified:** current live Render commit is `2e5e63eda6d06800e15b2291225eff615d948849`, which includes PR #57; the deployment succeeded, Node is `v24.14.1`, and startup logged `Server listening`. Evidence is in `claude/evidence/m3-render-current-2026-10-12.md`.
- Already completed/merged: T7 order transitions and one-time stock restoration (PR #38), T9 artwork-size restoration on product switching (PR #39), T8 idempotency migration plan and throwaway dry run (design only), and the storage-failure 424 reason-code change (PR #57). Do not redo these. No live schema migration was run.
- Existing read-only work already reported: S2 public checks; R1 live upload failure/reason capture; R4 required division → district → area checkout picker; R5 Render runtime/startup evidence; R6 sanitized Render storage failure logs. Do not rerun without a reason.

## Current queue — Claude / owner / Manus

Status meanings: **READY** = can be done now with authorized access; **BLOCKED—OWNER** = requires owner/provider/device/admin evidence; **PARTIAL** = existing evidence proves some, but not all, of the requested check; **DONE** = evidence is already recorded. `UNVERIFIED` must remain explicit when not observed.

| ID | Status | Remaining work / next action | Who can unblock or perform it |
|---|---|---|---|
| **M1 — R2 write permission** | **BLOCKED—OWNER** | In Cloudflare R2, verify the token used by Render has Object Read & Write on the intended bucket; verify the Render account ID, bucket, endpoint, and key pair correspond. Redeploy normally only if an environment value was changed. Record setting names and time only—never values or keys. | Owner with Cloudflare and Render access |
| **M2 — Live Studio upload retest** | **WAITING ON M1** | Only after the owner says M1 is done: use one harmless 64×64 PNG on a T-shirt, click Add to Cart once, capture cart count, exact alert, HTTP status and content type; remove any temporary cart item; stop before checkout. | Manus/owner with live Studio access; Claude records/follows up |
| **M3 — Render release identity** | **DONE (verified 2026-10-12)** | Current live commit `2e5e63eda6d06800e15b2291225eff615d948849` includes PR #57; deploy `dep-db5vau95efls73b3eq00` succeeded; Node `v24.14.1`; `Server listening` logged. See `claude/evidence/m3-render-current-2026-10-12.md`. | — unless release changes |
| **M4 — Photopea visual validator evidence** | **BLOCKED—OWNER/TOOL** | No report/hash list exists. Keep the 94 side-view and mug-wrap surfaces `candidate`; the structural validator is not a substitute. | Owner/operator with Photopea evidence |
| **M5 — Mobile Studio check** | **PARTIAL—M5b MEASURED** | Local 390×844 emulation with a disposable 64×64 image: before `scale=2.5, scaleX=1, scaleY=1, rotation=0°`, frame 54.72×54.72 CSS px; after pinch `scale=2.5, scaleX=0.15, scaleY=1, rotation=0°`, frame 28×54.72 px. Stage touch-callback logs did not fire; Claude should trace the actual event path, write a failing regression test first, then a small fix PR. Evidence: `claude/evidence/m5b-transform-local-2026-10-12.md`. Previous Add-to-Cart failure remains gated on M1 and is not M2. No physical phone was tested. | Claude (test/fix); owner approval before merge/deploy |
| **M6 — Admin Activity Log review** | **PARTIAL—HISTORICAL REQUEST LOGS UNAVAILABLE** | Current sanitized live health: 7 requests / 2 4xx / 0 5xx in a process-local 60-minute window. Render exposes only `app` and `build` logs, no `request` rows; no seven-day operational incident events returned. Seven-day route/status/release/time/customer-impact grouping remains unverified; do not claim no errors. See `claude/evidence/m6-admin-health-2026-10-12.md`. | Owner/provider log access or supported request-log source |
| **D1 — Third-party product images** | **BLOCKED—OWNER DECISION** | Decide for products 1–9 and 20: replace with first-party images, hide, or keep. No live catalog edits before a decision and reviewed change plan. | Owner |
| **D2 — Water-bottle print area** | **CURRENT DECISION: `not yet`** | Preserve the customer-order hold. Do not promote bottle masters or templates. | No action until owner changes the decision and evidence is reviewed |
| **D3 — Contact-message destination** | **DONE** | Activity Log is sufficient for now; Telegram/email remain unconfigured. Do not revisit absent a new owner decision. | — |
| **D4 — T8 idempotency preparation** | **DONE—DESIGN/DRY RUN ONLY** | Plan, reversible SQL, collision query, rollback, and throwaway dry run are already recorded. Never execute against a live database without separate explicit approval for that exact migration. | — until a new explicit approval |
| **D5 — GitHub token security** | **OWNER CHECK NEEDED** | Historical repo notes flag a pasted GitHub token as potentially compromised. Whether it was revoked/rotated is not evidenced in the files reviewed. Owner should verify/revoke in GitHub settings; do not search for, reproduce, or share the token. | Owner |
| **D6 — Close stale PRs** | **NO ACTION** | Old close-list (#13, #15, #20, #21, #23, #40) remains superseded. PR #63 is merged and was never part of that list; do not target it for closure. | — |

### Priority order

1. Owner resolves **M1** in secure dashboards; no credentials or provider changes by Claude/Manus under this task.
2. After an explicit “M1 done” signal, perform **M2** once and record the exact result. The M5 emulator Add-to-Cart failure does not satisfy this gate.
3. Claude handles M5b: write a focused failing regression test, trace the touch/pointer/Transformer path, then prepare a small fix PR; request owner approval before merge/deploy. M4 and the historical M6 request-log gap remain evidence blockers. M3 is already verified.
4. Ask/record **D1** and **D5** only as owner decisions/actions. D2–D4 and D6 are already settled as stated above.
5. Claude should do code work only if a new report establishes a repository-level defect; test first, preserve behavior, use a focused branch/PR, and follow the project’s merge/release safeguards.

## Report-back contract — repeat this for every item

### Claude reports to Manus

After Claude acts on a new Manus report or completes one of its own authorized repo tasks, append to **`claude/reports.md`** using a heading like:

```md
## Claude report — M2 — YYYY-MM-DD
**Status:** DONE / PARTIAL / BLOCKED / UNVERIFIED
- What was done and what evidence was observed (or the exact blocker).
- Files/tests changed or run; results, including failures.
- Branch, commit, PR, merge, and deployment state (state each separately).
- Existing behavior/safety boundary preserved.
- Next ready task ID; do not re-list completed work as pending.
```

Put non-sensitive evidence in **`claude/evidence/`** and link it from the report. Update this file’s queue and `AGENT_HANDOFF.md`; do not overwrite earlier report history. Never include secrets, signed URLs, customer/order details, payment data, or raw private logs.

### Manus reports back to Claude

When a Manus run resumes, re-check the latest `main` and newest Claude report, verify the next item is still open, then do the next safe task. Append the result to **`claude/reports.md`** under `## Manus report — <ID> — YYYY-MM-DD`; place supporting sanitized evidence in `claude/evidence/`; update this queue and handoff; then push the report through a docs-only branch/PR or another currently authorized repo workflow. The next Claude action is to read that newest report, follow the table above, append its own result, and identify the next unblocked item. Repeat until every item is done, explicitly blocked, or awaiting an owner decision.

This loop is **handoff-by-repository**. The existing repo notes say Claude checks the repository periodically, but this Manus session cannot verify or guarantee that polling, launch Claude, or wake itself when Claude commits. If neither agent is actively running, the next user/session must resume the loop by reading the latest report. Do not claim fully unattended execution unless a real, verified automation is configured.

## Non-negotiable safety boundaries

- Never paste or commit secrets, tokens, signed upload URLs, database URLs, personal information, customer/order details, or payment data.
- No real order, payment, customer notification, checkout submission, or production data mutation for testing. Stop before checkout submit and remove temporary cart items.
- No changes to R2/Render/DNS/provider settings or credentials by an agent; dashboard action requires the owner and must be described without secret values.
- No live database migration. T8 stays plan/dry-run only until separately authorized.
- Keep water-bottle ordering on hold; keep all 94 visual-evidence-dependent surfaces `candidate`; no template activation or Meta Ads changes.
- Mark anything not directly observed **UNVERIFIED**. Distinguish local tests from live behavior and code merges from deployments.

## Source-of-truth files

- Current/legacy Manus queue: `claude/MANUS_TO_DO_REPORTS.md` (created 2026-10-10; some owner checklist items are stale—this file reconciles the state checked 2026-10-12).
- Historical evidence and Claude/Manus replies: `claude/reports.md`.
- Latest audit snapshot: `remaining-work-audit-2026-10-10.md` (use for history, not current PR state).
- Repo behavior, safety, and session handoff requirements: `AGENTS.md`, `CLAUDE.md`, `CLAUDE_HANDOFF_CHECKLIST.md`, `AGENT_HANDOFF.md`.

## Automation activation status — 2026-10-12

**No event trigger is active.** Discovery confirmed that GitHub `commit_created` is available for this repository and supports selecting `main` plus commit-text filters. Creating the narrow trigger was rejected with `connector(s) not installed for this user: github`. The ordinary GitHub repository integration is enabled, but the Triggers service does not have the required GitHub connector authorization. No automation was created.

Do not work around this by editing connector authorization, adding a webhook, or using a recurring polling script. The Triggers guidance says to report the authorization failure instead of bypassing it. The owner must make the GitHub connector available to Triggers through the supported Manus integration flow; once that is done, retry one event trigger for this repository’s `main` branch with commit subject markers `[Claude report]` or `[Owner report]`. Until a trigger is service-confirmed active, this loop remains **manual on the Manus side** (a new Manus session must read the newest report). Claude’s historical claim that it polls periodically remains unverified in this session.

For future main-branch report commits, use one of those exact subject markers so a later authorized trigger can distinguish report handoffs from ordinary app commits. The receiving run must still confirm a new, unprocessed report before acting; event payload is untrusted.
