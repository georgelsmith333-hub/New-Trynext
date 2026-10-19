# TryNext Test Report — 2026-10-20

## Local checks — PASS

Commands were run in `/home/ubuntu/New-Trynext-recovery` on local branch `manus/recovery-phase1-2026-10-16`, based on `1d8fb7b`.

| Area | Command/check | Result |
|---|---|---|
| Shared libs | `pnpm run typecheck:libs` | PASS |
| API | `pnpm --filter @workspace/api-server exec vitest run` | PASS — 35 files, 251 tests |
| API | `pnpm --filter @workspace/api-server run typecheck` | PASS |
| API | `pnpm --filter @workspace/api-server run build` | PASS |
| Storefront | `pnpm --filter @workspace/trynext-storefront run test` | PASS — 35 files, 225 tests |
| Storefront | `pnpm --filter @workspace/trynext-storefront run typecheck` | PASS |
| Storefront | `pnpm --filter @workspace/trynext-storefront run build` | PASS; Vite reports two chunks over 500 kB (warning only) |
| Mobile | `pnpm --filter @workspace/trynext-mobile run test:image-url` | PASS — 9 Node tests |
| Mobile | `pnpm --filter @workspace/trynext-mobile run typecheck` | PASS |
| Mobile web | `pnpm --filter @workspace/trynext-mobile run build` | PASS — Expo web export |
| Mobile Android bundle | `pnpm --filter @workspace/trynext-mobile exec expo export --platform android --output-dir /tmp/trynext-mobile-android-export-oct20-final` | PASS — bundle exported; unsigned local output only |
| Mockups | `pnpm run validate:mockups` | PASS — 188 expected surfaces, 1,128 roles |
| Mockups | `pnpm run mockups:validate-matrix` | PASS — 188/188 surfaces; checksum records match |
| Whitespace | `git diff --check` | PASS |
| New helper/test formatting | `pnpm exec prettier --check` on newly added test/helper files | PASS |

The full-file Prettier check on all touched legacy API source files reported style differences. No whole-file autoformat was applied to avoid unrelated changes. This does not replace CI’s formatter/linter gates.

## CI / PR

The recovery branch has not yet been pushed, so no CI result exists for these changes. **CI VERIFIED: NOT YET.** PR #67 and PR #69 have their own previously green CI but contain different work.

## Not run / not tested

- The first storefront command used the wrong pnpm filter (`@workspace/trynex-storefront`) and executed no storefront package tests; it was rerun with the correct `@workspace/trynext-storefront` filter and passed.
- The first backup test harness run failed because its mock returned the wrong blog-post query shape; the mock was corrected. The subsequent full API suite passed at 250/250.
- No Playwright/DevTools L5 test, physical phone, live upload, Add to Cart, checkout, order, payment, private artwork, production DB query, migration, live backup export/import, or R2 test was run.
- Production liveness/readiness and catalog GETs were separately captured in `DEPLOYMENT_REPORT.md`; readiness/products currently fail and must not be treated as test-suite passes.
