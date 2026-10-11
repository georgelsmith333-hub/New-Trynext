# M5 — Design Studio mobile-emulator check

**Checked:** 2026-10-12 03:24–03:28 +06:00
**Environment:** isolated Chromium 154 on Ubuntu, 390×844 viewport, Android 14 / Pixel 7 mobile user-agent, touch enabled. This was an emulator, **not a physical phone**. The browser context and its local storage were disposable.

- Loaded `https://trynext.shop/design-studio` successfully (HTTP 200). Dismissed the quick-start guide and uploaded a locally generated 64×64 PNG. The image appeared as a canvas layer; the Studio displayed its low-resolution/print-quality warning. The upload step itself made no storage request.
- **Drag:** worked. The selected artwork frame moved by about +30×+24 CSS pixels.
- **Pinch:** two-touch events were observed, but the selected frame changed from 54.72×54.72 px to 28×54.72 px and its rotation remained 0°. This is a non-uniform narrowing, not the advertised scale-and-rotate behavior. Report as a likely mobile pinch defect for Claude to reproduce and test; do not treat the emulator as a physical-device test.
- **Dedicated rotate handle:** worked; the same frame reached about 25.2° rotation.
- **Surface switch:** Front → Back worked; the page label changed to `Designing: Unisex T-Shirt · Back`.
- **Select-tool page scroll:** a mobile touch swipe moved `window.scrollY` from 443 to 828; scrolling remained available.
- **Add to Cart:** tapped once, without opening checkout or entering personal details. The design was **not** added. Sanitized request results: `POST /api/storage/uploads/request-url` → HTTP 200 `application/json; charset=utf-8`; `PUT /api/storage/upload-via-api/<redacted-id>` → HTTP 424 `application/json; charset=utf-8`.
- Exact visible failure, with no identifiers or secrets: “Couldn’t add design to cart. Original artwork could not be uploaded. The file could not be uploaded (direct: the browser could not reach storage directly; through our server: our server answered 424: The file could not be saved to storage. Please try again later. [storage_access_denied]). Your design was not added to the cart; please retry.”
- No cart item was created, no checkout/order/payment was submitted, and the isolated browser context was discarded. This M5 attempt **does not satisfy M2**, which remains gated on the owner explicitly saying M1 is done.

Screenshots:
- `m5-mobile-gesture-390x844.png` — selected layer and dedicated rotation control after gesture check.
- `m5-mobile-pinch-only-390x844.png` — frame immediately after the two-finger pinch; the text report records the before/after dimensions.
- `m5-mobile-add-to-cart-424-390x844.png` — sanitized 424 / `storage_access_denied` state.

**Result:** M5 evidence is partial/emulator-only. Drag, explicit rotation, back-surface switching, and page scrolling worked; two-finger pinch behaved incorrectly; cart saving remains blocked by the known R2 permission failure. No product, provider, database, or catalog settings were changed.
