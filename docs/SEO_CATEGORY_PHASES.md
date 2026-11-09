# Trynext SEO Category Expansion — Execution Tracker

Last updated: 2026-11-09

## Goal

Create trustworthy, orderable, crawler-visible category experiences for personalized mugs and custom drinkware, then publish supporting content and measure Google Search Console and Peec AI visibility improvements. Preserve the live Bangladesh commerce rules: 25% advance plus COD balance, current shipping settings, and real catalog availability.

## Phase status

### Phase 1 — Production catalog and commerce verification: COMPLETE

Evidence collected from the live production endpoints on 2026-11-09:

- Category inventory: 12 Mugs products and 10 Water Bottles products.
- All 22 products returned as `customizable: true`.
- All 22 products had positive stock at the time of verification.
- Effective live mug prices ranged from ৳349 to ৳599.
- Effective live water-bottle prices ranged from ৳699 to ৳1,199.
- Production settings reported shipping cost ৳100 and free shipping threshold ৳1,500.
- COD was enabled.
- bKash, Nagad, and Rocket were configured; uPay was not configured and must not be advertised as an available payment destination until verified again.
- Production settings reported Studio mug base price ৳650 plus ৳99 customization fee, and Studio water-bottle base price ৳899 plus ৳99 customization fee. These are distinct from the catalog product prices and must not be mixed in page copy.
- The live catalog included a dedicated `Personalized Photo Mug` product and a `Minimalist Name Bottle` product.
- The current public category API was verified with numeric category IDs. A slug-query request was not used as evidence for page implementation because edge behavior returned an access failure during the audit; the storefront must use the established working API contract or a server-side category resolver.

### Phase 1 gaps to resolve before publication

- Confirm current product images and mockup rendering for the selected hero/product cards on mobile.
- Confirm actual delivery-time language from the current shipping policy before writing a numeric promise.
- Confirm whether bulk/corporate drinkware orders are a real supported workflow; do not promise quotation or minimum-order behavior without evidence.
- Verify the live Design Studio route can add a mug and water bottle to cart, then verify the existing Re-edit recovery path without submitting payment.
- Validate exact payment destination display in checkout without recording or exposing private merchant numbers.
- Reconcile any mismatch between catalog pricing and Studio-configured custom-order pricing before adding price statements to SEO pages.

## Next action queue — execute in order

### Phase 2 — Build the personalized mug category page: COMPLETE

- Add a public route using the approved slug after checking existing URL collisions.
- Use real mug products and real product links.
- Include a crawler-visible definition, customization steps, photo-quality guidance, Bangladesh ordering rules, gift use cases, FAQ, breadcrumbs, and collection/product structured data.
- Make the CTA lead to the tested mug customization or product flow.
- Add internal links to relevant products, Design Studio, shipping/payment policy, and relevant blog content.
- Add the route to the public sitemap only after the page returns a correct 200 response.

Production verification completed on 2026-11-09 for commit `5d984b4`: both `/custom-mugs-bangladesh` and `/custom-drinkware-bangladesh` return HTTP 200 to a Googlebot request, expose route-specific titles and canonicals, include crawler-visible category markup and JSON-LD, link to live products, and appear in the live sitemap. CI and active-app verification both passed.

### Phase 3 — Build the custom drinkware category page: COMPLETE

- Add a public route using the approved slug after checking existing URL collisions.
- Include mugs, water bottles, and any other drinkware only when backed by live products.
- Include a factual product-type comparison, customization process, everyday/gifting use cases, and a cautious corporate section.
- Do not claim tumbler availability until a real orderable tumbler product is verified.
- Add structured data, internal links, and sitemap coverage after validation.

The drinkware page was released together with the mug page and passed the same live crawler verification. It intentionally does not claim tumbler availability or a separate bulk-order workflow because those were not confirmed in the production catalog.

### Phase 4 — Supporting content and internal linking: NEXT

- Publish the first three high-quality articles: custom photo mug design guide, custom mug ideas for couples, and custom drinkware gifts in Bangladesh.
- Link each article to the relevant category page and real product pages.
- Link existing relevant blog posts and keyword pages to the new category pages.
- Avoid thin, duplicated, or unsupported claims.

### Phase 5 — Validation and release

- Run typecheck, tests, build, diff checks, and raw HTML/metadata checks.
- Test mobile layout, product CTA, add-to-cart, Design Studio entry, and checkout navigation without completing payment.
- Verify HTTP 200, canonical, title, description, Open Graph, JSON-LD, robots, and sitemap output.
- Publish only after the repository release checks pass and the production response is rechecked.

### Phase 6 — Search and AI measurement

- Confirm the new URLs are present in the live sitemap.
- Request indexing through the verified Google Search Console property when URL inspection is available.
- Record Google indexing, queries, impressions, CTR, and average position only after Search Console has processed the property.
- Re-run Peec AI visibility analysis after enough prompt cycles and compare retrieval, citation, mention, position, and sentiment metrics.
- Keep this tracker updated after every phase; do not mark a phase complete from source changes alone.

## Truthfulness rules

- No product, price, material, delivery time, guarantee, payment method, bulk-order service, or customization capability may be advertised unless confirmed from production or an owner-approved source.
- Never expose merchant numbers, API keys, customer data, or payment evidence in this tracker.
- Never claim Google indexing or ranking improvement before Search Console confirms it.
- Never claim Peec improvement from page publication alone; measure it after publication.
