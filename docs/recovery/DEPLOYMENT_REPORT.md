# TryNext Deployment Report — 2026-10-20

## Current production release

- GitHub main: `1d8fb7bcde6ab91dbb84c33a802e918d1e3d8322`, merged via PR #70. The commit changes documentation only relative to the prior main `e6c7041`.
- Cloudflare Pages project `trynext-shop-new`: deployment `9cd98a6f-b6e7-4278-9d71-2ba59a456f8d`, commit `1d8fb7b…`, status `success`, completed 2026-10-19 22:00:58Z.
- Render API service: deployment `dep-dbb9553rjlhs73ck7r10`, same commit `1d8fb7b…`, status `live`, completed 2026-10-19 22:03:25Z.
- These provider releases do not include the local recovery code changes; those changes are not committed, pushed, merged, or deployed.

## Safe public and origin checks

Sampled public HTML routes (`/`, `/products`, `/shop`, `/product/1`, `/cart`, `/checkout`, `/track`, `/blog`, `/hampers`, `/design-studio`, `/sale`, `/faq`, `/about`, `/contact`, `/size-guide`, `/login`, `/signup`, `/account`, policy pages, `/referral`, `/wishlist`, `/admin/login`) returned HTTP 200 by CLI GET. `/sitemap.xml` returned 301 to `/api/sitemap.xml`. This checks HTTP delivery only, not client-side rendering.

Read-only API probes:

| Endpoint | Public site | Render origin | Result |
|---|---:|---:|---|
| `/api/health/liveness` | 200 | 200 | Process responds |
| `/api/health/readiness` | 503 | 503 | `status=error`, `db=false`, `catalog=false`, `runtimeRole=primary` |
| `/api/products?limit=1` | 500 | 500 | Generic `internal_error`; no raw error captured |

Neon metadata from two known projects shows both primary `production` branches archived. This is strongly consistent with the readiness failure, but the exact Render database target is unknown because connection values were not inspected. Owner must identify and restore the intended production branch. No compute was started or database state changed.

Subsequent public requests from this egress received HTTP 403 at Cloudflare. No bypass was attempted. Browser DevTools L5, cache HIT behavior, live page rendering, and seven-day request impact are **UNVERIFIED**.

## PR states at check time

- PR #70: merged; CI passed; docs-only.
- PR #67: open, draft, head `c9d55a3`; CI passed; no owner merge approval; no production deployment.
- PR #69: open, non-draft, head `4255e9a`; CI passed; not merged.
- PR #71: open, draft, implementation commit `5d61f91`; required checks were running at 2026-10-20 04:26 +06:00; Cloudflare Pages preview check succeeded. Not merged or production-deployed.
- Recovery branch `manus/recovery-phase1-2026-10-16`: pushed; no production deployment.

## Status labels

**MERGED:** PR #70 only.

**DEPLOYED:** PR #70’s docs-only main commit on Pages and Render.

**LIVE VERIFIED:** route/API status responses listed above; API is not ready.

**NOT DEPLOYED:** all current recovery code changes and PR #67 gesture code.
