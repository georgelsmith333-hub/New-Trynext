# M3 — Current production release identities (Pages + Render)

**Checked:** 2026-10-12 05:34 +06 (2026-10-11 23:34 UTC)
**Method:** Read-only Cloudflare Pages API and GitHub commit comparison, reconciled with the already-recorded Render deployment evidence in `m3-render-current-2026-10-12.md`.

## Cloudflare Pages production

- Project: `trynext-shop-new`; production branch: `main`.
- Latest production deployment: `065ea212-1430-434e-9a78-93afe9603b2e`.
- Deployment created: `2026-10-11T22:36:09Z`; deploy stage completed successfully at `2026-10-11T22:38:42Z`.
- Production aliases: `https://trynext.shop` and `https://www.trynext.shop`.
- GitHub trigger commit: `e6c7041b6bdb0c38d5ce86d276c8e85705c866aa`, matching current `main` at the time checked.
- The project-level `latest_deployment` field pointed to a newer preview; the production identity above was taken from the production-filtered deployments endpoint, not inferred from that preview.

## Render production

- Current live deployment: `dep-db5vau95efls73b3eq00`, commit `2e5e63eda6d06800e15b2291225eff615d948849`.
- Existing Render evidence confirms successful startup, Node.js `v24.14.1`, and inclusion of PR #57's storage-failure reason-preserving fix. See `m3-render-current-2026-10-12.md`.

## Reconciliation and limits

GitHub comparison from the Render commit to current `main` showed two later commits (`4a922c1`, `e6c7041`); the changed paths were documentation/evidence only, with no storefront or API application code. Therefore the Render commit is behind the current repository head only by documentation changes; no Render redeploy is indicated by this comparison.

PR #67 (`c9d55a3`) remains open/draft and is not in the production commit. PR #69 is also open/unmerged; its report branch is not a production release. No deployment was triggered and no provider setting, production data, database, order, or customer state was changed.

**Result:** M3 production deployment identity is verified for both Pages and Render. This does not verify R2 write permission or close the M1/M2 upload blocker.
