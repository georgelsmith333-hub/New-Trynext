# MANUS REPORTS — current TryNext recovery command notes

**Updated:** 2026-10-21 03:51 +06
**Owner request:** restore the live site safely and compare the four reported Neon databases before any production failover.
**Current branch for this note:** `manus/current-truth-2026-10-20`

## Current verified state

The storefront shell is serving successfully, and the API process is alive. The site is **not fully operational**: readiness returns HTTP 503 with `db=false` and `catalog=false`; `/api/products?limit=1` and `/api/categories` return HTTP 500; `/api/mockups` returns HTTP 200. The Render API service is not suspended and its latest successful deployment is from `main` commit `35b7883`.

Render application logs show PostgreSQL error `53000`: the account or project has exceeded its quota. The repository already contains a guarded database candidate chain and requires both `products` and `orders` before accepting a candidate. No confirmed repository-code defect has been found for this incident.

The owner reported four Neon accounts/projects: the primary Trynex main database, a main backup, a secondary backup, and a third/final backup. The API keys are deliberately not recorded here. They were exposed in chat and must be revoked and rotated. No key has been used, copied into Git, stored in this note, or printed in logs.

## Claude command notes

1. Read this file, the newest `claude/reports.md`, and `AGENT_HANDOFF.md`. Treat the current `main` SHA as `35b7883` unless a fresh GitHub check proves otherwise.

2. Do not claim that this file automatically starts Claude. The repository’s prior relay note says no verified GitHub-to-Claude trigger or polling relay is active. Claude must be started/resumed by the owner or an explicitly connected automation; pushing this file alone is only a handoff.

3. Do not change the database failover chain, add a database fallback, edit Render variables, merge PR #71, deploy, migrate, run SQL, access customer/order/payment data, or create a new database.

4. Once the owner provides an authorized Neon connector with the four existing projects visible, compare them read-only. For each candidate record only project/branch name, branch state, compute state, update timestamp, schema presence/version, product row count, newest product timestamp, and required-table presence. Do not read product descriptions, customer rows, order rows, settings values, credentials, connection strings, or payment data.

5. Determine “most up to date” only from evidence. A candidate is not safe merely because it has more products. It must be the authoritative/current production dataset or an explicitly approved transactional replica, contain the required schema (`products`, `orders`, `mockups`, and runtime tables), and be safe for both reads and writes. Record uncertainty if any comparison is incomplete.

6. If the original authoritative branch is archived or quota-blocked, restore/start that branch rather than switching production to a backup. If the branch is deleted or the target is ambiguous, stop and report the exact provider state. Never create a replacement database to solve this incident.

7. After the owner resolves the provider issue, Manus should run only these read-only checks and append exact results to `claude/reports.md`:

```bash
BASE=https://trynext.shop
curl -sS -i "$BASE/api/health/liveness"
curl -sS -i "$BASE/api/health/readiness"
curl -sS -i "$BASE/api/products?limit=1"
curl -sS -i "$BASE/api/categories"
curl -sS -i "$BASE/api/mockups"
```

8. The recovery is complete only when storefront, liveness, readiness, products, categories, and mockups are verified, and the provider target is documented without exposing credentials. A green deployment alone is not a database recovery.

## What the owner can do now

Revoke and rotate all four Neon API keys because they were pasted into chat. Then connect the Neon account through the authorized Neon integration or use the Neon dashboard to identify the four project names/IDs privately. Share only project/branch names and status, never API keys or connection strings.

In Render, open the API service environment page and privately identify which Neon project/branch the database setting targets. Do not paste the value. If the target is the authoritative branch, restore its quota/compute state in Neon. If it is archived, unarchive/start that same branch. Do not point production to a backup until the comparison proves it is the current transactional source and the owner explicitly approves that exact switch.

## Safety boundary

This note authorizes documentation and read-only comparison only. It does not authorize a production database switch, credential change, schema migration, data repair, order/payment action, merge, deployment, or backup import. Those require a separate explicit owner approval after the target and rollback plan are known.

## Required reporting format

Claude should append a dated entry to `claude/reports.md` with: `done`, `blocked`, or `not applicable`; exact project/branch names without secrets; branch/compute states; schema and product comparison counts; tests or read-only checks; deployment/PR state; uncertainty; and the next owner action. Never paste API keys, database URLs, customer data, order data, payment data, signed URLs, or full settings values.
