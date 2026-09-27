# TryNext Smart Mockup / Photopea Validator Runbook

## Current status

The source fix is merged into `main` and locally verified. The live site must still be redeployed before the production proof can be considered valid. The current live result is **FAIL** because `trynext.shop` is still serving the pre-merge bundle/API path: the modified and baseline exports remain identical.

Merged source checkpoint: `main` merge commit `89fe820bfa5f5414281963a16b26a7a098c40df1`.

## What was fixed

The server previously replaced only the linked Smart Object file bytes. It did not update the placed layer’s raster or the parent PSD’s cached composite, so Photopea could open and export the untouched cached image. The corrected path decodes the artwork to the selected layer’s native dimensions, updates the placed-layer raster, and reserializes the PSD. The current main branch also contains the browser-side `placedLayerEditContents` refresh flow, which opens, saves, and closes the selected Smart Object before exporting the modified parent document.

## Deployment procedure

1. Confirm GitHub `main` contains the merged checkpoint above and that the active verification workflow is successful.
2. Deploy both components that serve the validator:
   - the API bundle containing `prepareSmartObjectArtworkImage()` and the updated `browser-payload` route;
   - the storefront bundle containing the current Photopea refresh flow.
3. Confirm the deployment has completed, then purge the Pages/CDN cache or hard-refresh the authenticated admin browser. A stale `AdminMockups` asset is not evidence of a successful deployment.
4. Verify `https://trynext.shop/admin/mockups` loads the new storefront asset. The deployed JS should contain the Photopea placed-layer refresh marker (`placedLayerEditContents`).
5. Confirm an unauthenticated POST to `/api/admin/smart-mockups/browser-payload` returns the expected authentication boundary (401/403), not a gateway timeout. Do not disable authentication to test this.

## Representative live proof

Use the authenticated admin session:

1. Open `https://trynext.shop/admin/mockups`.
2. Select **cap · black · back**.
3. Upload a small high-contrast PNG containing asymmetric marks or text. Avoid a transparent blank image.
4. Click **Run browser validation** once.
5. Wait for both renders to finish. The flow should produce:
   - a modified PSD export;
   - an untouched baseline PSD export;
   - a modified PNG preview.
6. Record the output dimensions and both SHA-256 values.
7. Require all of the following before approval:
   - both outputs are valid PNGs;
   - modified SHA-256 differs from baseline SHA-256;
   - the uploaded artwork is visibly present on the cap;
   - the artwork follows the product surface rather than appearing as an unrelated full-canvas rectangle;
   - product shadows, highlights, protected details, and layer order remain intact;
   - the status reads **changed composite: PASS**.

## Failure interpretation

| Observation | Meaning | Action |
|---|---|---|
| Request fails immediately with 401/403 | Browser session/auth boundary | Re-authenticate the existing admin session; do not change API auth rules. |
| Request takes several seconds and returns gateway timeout | Pages/API gateway budget or deployment issue | Confirm the route-specific long-running budget and deploy the current gateway copies. |
| Modified and baseline hashes are identical | Old API/storefront, stale PSD composite, or Photopea refresh not executed | Check deployed bundle version, rerun after cache purge, inspect browser console. Keep template inactive. |
| Hashes differ but artwork is invisible | Byte mutation exists but the selected layer/Smart Object mapping is wrong | Inspect `smartObjectId`, `smartObjectName`, and selected surface; do not activate. |
| Artwork is visible as a flat rectangle | Composite changed but faithful product rendering is not proven | Reject the surface and investigate Photopea Smart Object editing/transform behavior. |
| Modified artwork is visible and realistic, baseline differs | Representative proof passed | Save screenshot and hashes; proceed only with the representative-family checks. |

## Release gate

Do not activate any Smart Mockup template after only a successful API response, a changed PSD hash, or a local build. Activation requires the real browser-side Photopea proof above. After `cap/black/back` passes, repeat representative checks across a flat apparel surface and a curved surface, then run the documented 188-surface release matrix. Any failed or visually ambiguous surface remains inactive.

## Local verification already completed

- API tests: 39/39 passed.
- API typecheck: passed.
- API production build: passed.
- Workspace typecheck: passed.
- Storefront tests: 69/69 passed.
- Storefront production build: passed.
- PSD audit: 188/188 masters openable with the Smart Object gate passed.
- No templates were activated.

The generic `mockups:validate-matrix` command currently points at the stale `smart-v10/manifest.json` path while the active staging tree is `smart-v10-v3`; that command must be corrected before using it as a release gate.
