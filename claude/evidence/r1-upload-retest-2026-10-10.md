# Live R1 upload retest — 2026-10-10 06:38 UTC

A harmless 64×64 PNG was loaded into the public Design Studio on a Unisex T-Shirt. The artwork rendered as a new layer. Add to Cart was clicked once; checkout was not opened and no order or payment was created. The temporary test layer was removed afterward.

## Sanitized request evidence

- `POST /api/storage/uploads/request-url` → **200**, `application/json; charset=utf-8`.
- Direct `PUT /uploads/<redacted-object-id>` → browser `TypeError: Failed to fetch` (direct storage path still unavailable to the browser).
- Fallback `PUT /api/storage/upload-via-api/<redacted-object-id>` → **424**, `application/json; charset=utf-8`.
- Sanitized fallback body: `{"error":"storage_write_failed","reason":"storage_access_denied","message":"The file could not be saved to storage. Please try again later."}`.
- Studio alert displayed the same failure and the bracketed reason **`[storage_access_denied]`**.
- Cart remained empty; checkout was not opened.

## Conclusion

PR #57 is deployed and working: Cloudflare no longer masks the JSON reason behind an HTML 502. The R2 write itself still fails with `storage_access_denied`; the configured R2 access key/token or bucket policy still lacks permission for the object write. No provider setting, credential, live data, order, payment, or customer record was changed.
