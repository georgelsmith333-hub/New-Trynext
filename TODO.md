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
