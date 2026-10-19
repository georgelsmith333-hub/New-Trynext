# TryNext Architecture and Free-Tier Notes — 2026-10-20

## Current topology

- Storefront: Vite/React application on Cloudflare Pages, with Pages Functions serving the `/api/*` gateway.
- API: Express service on Render (`trynex-lifestyle-main-render`). Both configured read/write gateway roles were previously audited as pointing to this single origin; no standby origin was found.
- Database: Neon PostgreSQL. Two known projects are named `trynex` and `trynex-db`; both primary production branches currently report `archived`.
- Object storage: Cloudflare R2. R2 write permission/configuration remains owner-gated under M1; no live upload was attempted.
- Cache/rate-limit libraries reference Upstash; exact live usage and quota were not measured in this pass.
- CI: GitHub Actions. The recovery branch adds no external dependency; Playwright remains unapproved.

## Availability and failure modes observed

The current production API process is alive but not ready: liveness 200, readiness 503 with DB and catalog false, and product-list API 500. Pages routes answered HTTP 200 in a CLI probe, but that does not prove the React app rendered or that its API data loaded. The two archived Neon branches are a likely cause; the exact Render connection target is not known.

The gateway has a single Render origin and no discovered standby. Therefore a sleeping, unavailable, or DB-disconnected origin can leave HTML routes reachable while product data is unavailable. No secondary production database, replica, new hosting provider, or fallback was created.

## Quotas and plan limits

Provider account plan names, remaining quota, compute limits, request ceilings, and current cost are **NOT VERIFIED** in this audit. These limits are account- and time-dependent; no unlimited/free-uptime assumption is made. The owner should check provider dashboards before changing compute, enabling replicas, or adding background services.

## Recovery and consistency rules

1. Owner chooses the authoritative Neon project/branch and restores it through the dashboard; do not auto-unarchive or infer it from names.
2. Verify Render readiness and product response after provider recovery. Avoid SQL or customer/order queries.
3. Keep R2 upload verification separate; M1 must be explicitly completed before M2.
4. Do not add a second API/database provider or asynchronous worker without measured need and a consistency/recovery design.
5. Never publicly cache personalized carts, customer/auth/admin responses, or sensitive content.
6. Preserve Bangladesh commerce rules, including 25% advance COD. No payment behavior was changed.
