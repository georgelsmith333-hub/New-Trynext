# Phase 1 Live Evidence — 2026-10-20

Read-only evidence was collected 2026-10-20 04:00–04:05 +06. No secrets, SQL, customer/order/payment records, uploads, production writes, or provider settings were read or changed.

## Release identities

- Main commit `1d8fb7bcde6ab91dbb84c33a802e918d1e3d8322`, merged through PR #70; its application-source diff from prior main was empty (documentation-only change).
- Cloudflare Pages project `trynext-shop-new`: production deployment `9cd98a6f-b6e7-4278-9d71-2ba59a456f8d`, commit `1d8fb7b…`, success, completed `2026-10-19T22:00:58Z`.
- Render API service `trynex-lifestyle-main-render`: deployment `dep-dbb9553rjlhs73ck7r10`, commit `1d8fb7b…`, status live, finished `2026-10-19T22:03:25Z`.

## Live GET results

Sampled public HTML routes including `/`, `/products`, `/shop`, `/product/1`, `/cart`, `/checkout`, `/track`, `/blog`, `/hampers`, `/design-studio`, `/sale`, `/faq`, `/about`, `/contact`, `/size-guide`, `/login`, `/signup`, `/account`, policy pages, `/referral`, `/wishlist`, and `/admin/login` returned HTTP 200. `/sitemap.xml` returned 301 to `/api/sitemap.xml`. These are HTTP results only; browser rendering is not verified.

Public site and direct Render-origin GETs: liveness 200; readiness 503; product list 500. Readiness returned only the allowlisted fields `status=error`, `db=false`, `catalog=false`, `dbLatencyMs=0`, `runtimeRole=primary`. Product error was generic `internal_error`; raw body message not recorded. The API is therefore not live-healthy for catalog service.

## Neon branch metadata

Read-only Neon metadata currently reports `production` primary branches archived in both known projects: `trynex` (`misty-dust-70559510`) and `trynex-db` (`proud-dew-38401180`). This is consistent with the API readiness failure. Render’s database target is unknown because environment values were not inspected. No compute was started, no branch unarchived, and no SQL/data queried. Owner must identify the authoritative production project and restore it through the dashboard.

## Boundaries / remaining gaps

Subsequent public requests from this egress received Cloudflare HTTP 403; no bypass was attempted. Browser DevTools L5, cache HIT behavior, real-time client rendering, R2 access, live upload, seven-day request log impact, and order/payment flows remain **UNVERIFIED**. See `docs/recovery/DEPLOYMENT_REPORT.md` for detailed statuses.