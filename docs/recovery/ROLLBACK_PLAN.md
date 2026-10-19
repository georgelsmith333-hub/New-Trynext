# TryNext Rollback Plan — 2026-10-20

## Current recovery branch

The code changes are local and uncommitted on `manus/recovery-phase1-2026-10-16`. Rollback is simply to discard that branch’s uncommitted changes after preserving any desired patch; do not alter `main`. No remote PR, merge, or deployment exists for these changes yet.

## If a PR is opened but not merged

Close the PR or push a corrective commit. Do not merge until required CI and owner review pass. The Pages preview may be deleted through the normal PR workflow; production remains unchanged.

## If a future code PR is merged and causes an application regression

1. Identify the exact deployed commit and the affected behavior using safe status checks.
2. Prefer a reviewed `git revert <merge-commit>` in a new PR; do not reset shared `main` history.
3. Wait for required CI and owner approval, merge the revert, then verify the new Pages/Render deployment identities.
4. If the provider dashboard offers a previous-deployment rollback, use it only with owner authorization and record the exact release identity. Do not claim rollback complete until live health and routes are checked.

## Database outage recovery

Both known Neon production branches are archived, but the Render target is unknown. The owner must select the authoritative project/branch and restore it. Do not start compute, unarchive, restore a snapshot, rotate credentials, change Render environment values, or run migrations from this agent. If data restoration is considered, the owner must first verify the target, backup point, expected data-loss window, and provider rollback procedure.

## Data and commerce safeguards

- No production schema migration is part of this recovery.
- No orders, payments, stock, customer records, or 25% advance-COD behavior may be changed by rollback testing.
- R2 bucket/object data and credentials must not be deleted or rotated automatically.
- Keep the water-bottle order hold and all 94 visual-evidence-dependent mockup surfaces gated.
