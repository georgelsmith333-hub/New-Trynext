# S1–S3 live evidence — 2026-10-10

**Captured:** 2026-10-10 01:12–01:15 UTC (07:12–07:15 +06:00)  
**Environment:** Manus Sandbox browser, public production site `https://trynext.shop`  
**Safety:** No login, checkout, payment, order, customer-data, provider-setting, database, or mockup-activation action was performed.

## S1 — deployment identity and harmless Studio upload

- Canonical homepage loaded successfully: HTTP 200, title `Premium Custom Apparel Bangladesh | Custom T-Shirts, Hoodies & Gifts |`.
- Live Design Studio loaded successfully: `https://trynext.shop/design-studio`.
- Production HTML build metadata observed: `20261010011208`.
- A harmless local 64×64 PNG (`s1-tiny.png`, solid color) was uploaded through the normal Studio file input.
- Upload succeeded in the browser. The image rendered as a Studio layer; UI changed to `Saved`; Add to Cart became enabled.
- Add to Cart was clicked once, with checkout intentionally not opened.
- Exact result: **blocked**. The live UI reported:

> Your design was not added to the cart. Couldn’t add design to cart. Original artwork could not be uploaded. The file could not be uploaded (direct: the browser could not reach storage directly; through our server: our server answered 502). Your design was not added to cart; please retry.

- Cart remained unmodified; no item, order, payment, or customer-data mutation was created.
- This directly confirms the current production blocker is still the original-artwork storage path/fallback, not a missing Studio UI control.

## S2 — read-only catalog, prices, assets, and service worker

| Check | Result |
|---|---|
| `/api/products?limit=50` | HTTP 200; 50 returned; total 70; `private, no-store` |
| `/api/products?limit=50&minPrice=500&maxPrice=1000` | HTTP 200; 41 returned/total 41 |
| `/api/products?sort=price_asc&limit=5` | HTTP 200; 5 returned; total 70 |
| `/images/cat-tshirt.png` | HTTP 200; 432,409 bytes; public cache 14,400s |
| `/images/cat-cap.png` | HTTP 200; 379,482 bytes; public cache 14,400s |
| `/images/hero-bg.png` | HTTP 200; 179,406 bytes; public cache 14,400s |
| `/images/pattern.png` | HTTP 200; 861,326 bytes; public cache 14,400s |
| `/service-worker.js` | HTTP 200 but served the SPA HTML (`text/html`), not a JavaScript service worker |
| `/sw.js` | HTTP 200; JavaScript; 34,246 bytes; Workbox 7.4.0 marker observed |

The `/service-worker.js` result should be treated as a freshness/configuration finding; the actual registered worker appears to be `/sw.js` through the PWA registration script.

## S3 — public health, catalog summary, delivery area, and deployment checks

- `/api/healthz` → HTTP 200, JSON: `status=ok`, `db=ok`, `redis=ok`, `redis_detail=healthy:primary`, `storage=r2`, `runtimeRole=primary`, `schedulerEnabled=true`, `backupSyncEnabled=false`. Timestamp returned by the endpoint: `2026-10-10T01:14:42.299Z`.
- `/api/health`, `/api/healthz` distinction: `/api/health` is HTTP 404; `/api/healthz` is the working health route.
- `/api/products?limit=100` → HTTP 200; 70/70 returned. Sanitized summary saved as [`s3-public-catalog-summary-2026-10-10.json`](./s3-public-catalog-summary-2026-10-10.json): T-Shirts 13, Water Bottles 10, Long Sleeves 10, Caps 12, Mugs 12, Hoodies 12, Custom Orders 1; observed price range ৳449–৳2690.
- `/api/delivery-areas`, `/api/districts`, and `/api/shipping-areas` → HTTP 404 `not_found`. The homepage and health/UI copy claim nationwide/64-district delivery, but no tested public route exposed a delivery-area list. Delivery-area read is therefore **not proven** by this check.
- `/manifest.json` → HTTP 200; valid Trynext PWA metadata.
- `/robots.txt` → HTTP 200; disallows admin/API/drafts/checkout/account/cart/wishlist; sitemap points to `https://trynext.shop/sitemap.xml`.
- Real-device touch test: **UNVERIFIED**. This was a cloud desktop browser, not an owner-provided phone/device.
- Sanitized Activity Log/Render logs and provider dashboard evidence: **UNAVAILABLE** from this public session. The exact storage-provider root cause remains owner/provider-side evidence work.

## S1–S3 conclusion

- **S1:** partially complete; production route and upload UI work, but live Add to Cart is blocked by direct-storage reachability plus server fallback HTTP 502. Deployment commit/Pages/Render identity was not authenticated from public page evidence; only build metadata was observed.
- **S2:** complete for public read-only checks above; no production mutation performed.
- **S3:** partially complete; catalog/health/PWA evidence captured, delivery-area endpoint not exposed, real-phone test and sanitized provider logs remain blocked.
