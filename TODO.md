# Design Studio recovery checklist

## Completed in this repository change

- [x] AI generation and reference-edit requests receive a bounded 45-second primary gateway budget instead of the ordinary 3.5-second timeout.
- [x] Approved product surfaces use one authoritative live compositor; the flat SVG is not painted underneath an active compositor.
- [x] A single tap/click selects uploaded artwork and shows compact neutral controls rather than oversized orange circles.
- [x] Clicking outside the canvas clears the contextual selection controls.
- [x] Double-click/double-tap still opens the existing image-edit workflow, with explicit Edit and Crop entry points.
- [x] All six Studio product categories honor their corresponding admin-configured color settings, including frontend types and defaults.
- [x] Regression tests, TypeScript validation, and the production build pass locally.

## Still requires verification outside this repository

- [ ] Test single-click, double-click, crop/extend, drag, resize, rotate, and outside-tap behavior on a real phone and on the deployed preview.
- [ ] Verify the AI provider/API credentials and provider quota in the authorized production environment; no provider settings were changed here.
- [ ] Verify the live database catalog, mockup asset coverage, and admin settings after deployment; no migration or production data write was performed here.
- [ ] Owner approval is still required before merging, deploying, or changing Cloudflare, Render, Neon, GitHub, Photopea, or production settings.

## Professional resilience follow-up

- [x] Product API uses a bounded professional default of 24 items per page, while explicit requests remain capped and return pagination metadata.
- [x] Database candidate selection follows configured authority order; independent database row counts no longer select the production write target.
- [x] Admin Database Cluster copy distinguishes health/schema probes from safe transactional promotion and warns that independent Neon databases are not replicas.
- [x] Add `docs/RESILIENCE_ARCHITECTURE.md` with the current Cloudflare → Render → Neon request flow, admin boundary, database roles, and quota policy.
- [ ] Privately confirm the live Render database target is the approved `trynex-main-backup` / `main` source; do not paste the connection string into chat.
- [ ] Identify and verify a genuinely synchronized transactional standby before enabling any write failover.
- [ ] Configure Neon/Render quota alerts at 80% warning and 90% critical; repository code alone cannot obtain provider quota metrics.
- [ ] If a second Render service is introduced, prove it as a stateless read-only origin before adding it to Cloudflare read routing.
- [ ] Revoke and rotate the four Neon API keys previously exposed in chat history.

## Studio correction pass

- [x] Tapping or pressing outside the selected artwork's actual rotated frame clears the overlay even when the transparent Konva hitbox extends farther.
- [x] A delayed tap after an outside long press cannot immediately reselect the artwork and restore the controls.
- [x] Contextual Crop opens the crop dialog directly on mobile by keeping the ImagePanel mounted; Edit remains the separate full image-tools entry point.
- [x] Touch swipes on artwork no longer start Konva artwork dragging; native vertical page scrolling remains available, while mouse/pen dragging remains supported.
- [x] Horizontal Studio control strips explicitly use touch-pan behavior, and crop preview handles use a touch-safe editing surface with 44px hit targets.
- [ ] Verify the final gesture timing, crop handles, apply/cancel behavior, and Edit/Crop transitions on a real phone after deployment.

## Checkout and mockup reliability follow-up

- [ ] A Design Studio item that reaches the cart retains its Studio marker, product identity, selected options, preview, print-ready original artwork references, and quantity when the checkout payload is serialized.
- [ ] Studio items are accepted by the order route without being rejected as missing catalog products, while ordinary catalog items still receive product and stock validation.
- [ ] A Studio order can be retried safely with the same checkout idempotency key and cannot create a duplicate order or show a false success state.
- [ ] Checkout surfaces an immediate, actionable error for invalid artwork, unavailable mockup surfaces, storage failures, or transient API failures instead of silently leaving the customer in a broken route.
- [ ] The customer-facing mockup path remains the approved compositor/runtime-role pipeline and is described honestly; a true browser-side PSD Smart Object is not claimed unless Photopea/provider setup is completed.
- [ ] Facebook Login/Signup remains visible with an explicit setup state; Meta authorization and App ID/secret entry remain owner-controlled and are never committed to source.
- [ ] Real order placement and payment submission remain unperformed during repository validation.

## SEO category expansion — personalized mugs and custom drinkware

- [x] Verify the live catalog before creating SEO pages: 12 Mugs and 10 Water Bottles are present in production; all verified items are customizable and in stock; effective price ranges are recorded in `docs/SEO_CATEGORY_PHASES.md`.
- [x] Verify the live public commerce settings before writing page copy: ৳100 shipping, ৳1,500 free-shipping threshold, COD enabled, and current configured payment-method state recorded without exposing merchant numbers.
- [ ] Confirm live mug and water-bottle image/mockup rendering on mobile and validate the Design Studio add-to-cart path without submitting payment.
- [ ] Resolve the difference between catalog prices and Studio-configured custom-order prices before publishing price claims.
- [x] Build and validate the personalized mug category page with real products, crawler-visible copy, truthful Bangladesh payment/shipping rules, internal links, and structured data. Live Googlebot verification passed for `/custom-mugs-bangladesh`.
- [x] Build and validate the custom drinkware category page using only real orderable drinkware; do not advertise tumblers or bulk ordering until verified. Live Googlebot verification passed for `/custom-drinkware-bangladesh`.
- [ ] Publish the first supporting mug/drinkware editorial pages and connect them to the category pages and product pages.
- [ ] Verify raw HTML, metadata, canonical URLs, JSON-LD, sitemap, robots, mobile layout, product CTA, cart, Design Studio entry, and checkout navigation before release.
- [ ] Publish the verified category expansion and recheck production responses, CI, and active-app verification.
- [ ] Submit the new URLs for indexing through the verified Google Search Console property when URL inspection is available.
- [ ] Re-measure Google Search Console and Peec AI visibility after data has accumulated; do not claim ranking or citation gains from publication alone.
