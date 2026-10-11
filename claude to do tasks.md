# Claude To-Do Tasks and Report-Back Loop

**Prepared:** 2026-10-12 02:19 +06:00
**Repository:** `georgelsmith333-hub/New-Trynext`
**Snapshot checked:** `main` at `cec19bd77e00f17276c0af987e2dd35e2b6d31a4` (`origin/main` matched; worktree clean)
**Purpose:** one concise entry point for Claude’s next safe work and the Manus ↔ Claude report loop. This is a repository handoff document, **not** a background scheduler or proof that either agent is polling continuously.

## Start here

1. Read this file, then `AGENTS.md`, `AGENT_HANDOFF.md`, `CLAUDE.md`, `CLAUDE_HANDOFF_CHECKLIST.md`, and the newest relevant entries in `claude/reports.md`.
2. Re-check `git status`, branch/remote, current `origin/main`, GitHub PRs, and whether a newer report changed the queue. Do not treat this dated snapshot as live truth.
3. Pick the first ready task below. Do not repeat a task whose evidence is already recorded unless new evidence or a changed deployment makes a retest necessary.
4. After each task, append a dated report to `claude/reports.md`, update this queue’s status/next item, and update `AGENT_HANDOFF.md` as required by the project rules.

## Verified project snapshot and completed work

- The checkout was clean on `main`; local `HEAD` and GitHub `origin/main` both resolved to `cec19bd77e00f17276c0af987e2dd35e2b6d31a4`.
- GitHub reported **no open pull requests** and **no open issues** when checked on 2026-10-12. Therefore the older D6 instruction to close PRs #13, #15, #20, #21, #23, and #40 is stale as an action; do not try to close anything unless a fresh check shows an open PR.
- Existing project reports say all currently identified repository-side code work is merged. No fresh code defect was established in this review. Claude should wait for new evidence or a newly authorized code task rather than inventing more implementation work.
- The live upload failure remains the substantive product blocker: the latest recorded harmless Studio attempt (2026-10-10, after PR #57) showed `storage_access_denied`; the API fallback returned 424 JSON and surfaced the reason, but the cart stayed empty. Render logs attributed the failed write to Cloudflare R2 `AccessDenied` / HTTP 403. This is an owner-controlled bucket/token/environment configuration issue, not evidence for another code patch.
- The API change in PR #57 was confirmed live by that response. A prior Render report recorded commit `6feed17` and Node 24.14.1 with a clean start, but the exact deployed commit after PR #57 was not recorded. M3 below is therefore **partially verified**, not complete.
- Already completed/merged: T7 order transitions and one-time stock restoration (PR #38), T9 artwork-size restoration on product switching (PR #39), T8 idempotency migration plan and throwaway dry run (design only), and the storage-failure 424 reason-code change (PR #57). Do not redo these. No live schema migration was run.
- Existing read-only work already reported: S2 public checks; R1 live upload failure/reason capture; R4 required division → district → area checkout picker; R5 Render runtime/startup evidence; R6 sanitized Render storage failure logs. Do not rerun without a reason.

## Current queue — Claude / owner / Manus

Status meanings: **READY** = can be done now with authorized access; **BLOCKED—OWNER** = requires owner/provider/device/admin evidence; **PARTIAL** = existing evidence proves some, but not all, of the requested check; **DONE** = evidence is already recorded. `UNVERIFIED` must remain explicit when not observed.

| ID | Status | Remaining work / next action | Who can unblock or perform it |
|---|---|---|---|
| **M1 — R2 write permission** | **BLOCKED—OWNER** | In Cloudflare R2, verify the token used by Render has Object Read & Write on the intended bucket; verify the Render account ID, bucket, endpoint, and key pair correspond. Redeploy normally only if an environment value was changed. Record setting names and time only—never values or keys. | Owner with Cloudflare and Render access |
| **M2 — Live Studio upload retest** | **WAITING ON M1** | Only after the owner says M1 is done: use one harmless 64×64 PNG on a T-shirt, click Add to Cart once, capture cart count, exact alert, HTTP status and content type; remove any temporary cart item; stop before checkout. | Manus/owner with live Studio access; Claude records/follows up |
| **M3 — Render release identity** | **PARTIAL** | Confirm the exact current Render primary deployed commit (must include PR #57 / the 424 behavior) and clean startup. Earlier `6feed17` / Node 24.14.1 startup evidence predates the recorded live PR #57 retest; the retest proves the 424 behavior was live, but does not identify the exact commit. Do not trigger a deploy unless a confirmed mismatch and normal owner authorization warrant it. | Owner with Render dashboard access |
| **M4 — Photopea visual validator evidence** | **BLOCKED—OWNER/TOOL** | Provide/save `claude/evidence/photopea-validator-report.*` or a hash list for the 94 side-view and mug-wrap surfaces. Until acceptable saved evidence exists, keep those surfaces `candidate`; the structural validator is not a substitute. | Owner/operator with Photopea evidence |
| **M5 — Real-phone Studio check** | **BLOCKED—DEVICE** | On a real phone, report model/browser and test upload preview, scroll, drag, pinch, rotate, back/surface switching, Select-tool page scroll, and Add to Cart; do not check out. | Owner with phone; Manus records the result |
| **M6 — Admin Activity Log review** | **BLOCKED—ADMIN ACCESS** | Provide a sanitized last-seven-days error summary grouped by route, status, release, time, and customer impact. No personal/customer/payment data or secrets. Render upload logs (R6) were already reviewed; this is the separate Admin Activity Log portion. | Owner/operator with admin access |
| **D1 — Third-party product images** | **BLOCKED—OWNER DECISION** | Decide for products 1–9 and 20: replace with first-party images, hide, or keep. No live catalog edits before a decision and reviewed change plan. | Owner |
| **D2 — Water-bottle print area** | **CURRENT DECISION: `not yet`** | Preserve the customer-order hold. Do not promote bottle masters or templates. | No action until owner changes the decision and evidence is reviewed |
| **D3 — Contact-message destination** | **DONE** | Activity Log is sufficient for now; Telegram/email remain unconfigured. Do not revisit absent a new owner decision. | — |
| **D4 — T8 idempotency preparation** | **DONE—DESIGN/DRY RUN ONLY** | Plan, reversible SQL, collision query, rollback, and throwaway dry run are already recorded. Never execute against a live database without separate explicit approval for that exact migration. | — until a new explicit approval |
| **D5 — GitHub token security** | **OWNER CHECK NEEDED** | Historical repo notes flag a pasted GitHub token as potentially compromised. Whether it was revoked/rotated is not evidenced in the files reviewed. Owner should verify/revoke in GitHub settings; do not search for, reproduce, or share the token. | Owner |
| **D6 — Close stale PRs** | **NO ACTION CURRENTLY** | The current GitHub open-PR query returned none. This old queue item is superseded; re-check only if a fresh query shows open PRs. | — |

### Priority order

1. Owner resolves **M1** in secure dashboards; no credentials or provider changes by Claude/Manus under this task.
2. After an explicit “M1 done” signal, perform **M2** once and record the exact result.
3. In parallel when access exists, complete **M3**, **M4**, **M5**, and **M6**. They are evidence tasks, not invitations to fabricate evidence or change production state.
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
