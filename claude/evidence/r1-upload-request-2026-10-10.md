# R1 upload request evidence — 2026-10-10

**Status: VERIFIED**

- **Time (UTC):** 2026-10-10 04:18 UTC
- **Site:** `https://trynext.shop/design-studio`
- **Fixture:** harmless browser-local 64×64 PNG; no customer data
- **`request-url` call:** `POST /api/storage/uploads/request-url` — **200**; `application/json; charset=utf-8`; `server: cloudflare`; no `via` header observed. The response body was not copied because it contained a signed upload URL.
- **`upload-via-api` call:** `PUT /api/storage/upload-via-api/<opaque-id>` — **502**; `text/html; charset=UTF-8`; `server: cloudflare`; `cf-ray: a482d1b4ff17adc8-ATL`; no `via` header observed. The opaque path ID is intentionally not reproduced beyond the route shape.
- **First 200 response characters (redacted):** `<!DOCTYPE html> <!--[if lt IE 7]> <html class="no-js ie6 oldie" lang="en-US"> ...`
- **Body type:** HTML, not JSON.
- **UI result:** Add to Cart failed with the existing message that the server answered 502; the cart remained at 0 items. No checkout, order, payment, or customer-data mutation occurred.

This header/body combination identifies the observed 502 as a Cloudflare/edge or upstream response rather than the current storage route's JSON error response.
