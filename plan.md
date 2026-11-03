# TryNext Design Studio recovery plan

## Goal
Make the active Design Studio behave like a professional mobile editor: realistic compositor-first product previews, compact selection controls, predictable single/double-click interactions, working crop/edit entry points, and AI requests that are not prematurely aborted by the Pages gateway.

## Design direction
- **Movement:** premium mobile creative-tool canvas, with controls that recede until artwork is selected.
- **Core principles:** compositor-first realism; compact neutral controls; explicit active state; safe provider fallbacks.
- **Color philosophy:** keep Trynext orange for active actions only; use slate/white controls so the artwork remains the visual focus.
- **Layout paradigm:** canvas-first editor with contextual controls near the selected artwork and tools in the existing panel/sheet.
- **Signature elements:** rounded studio canvas, compact floating action strip, orange reserved for primary actions and focus rings.
- **Interaction philosophy:** one tap selects, outside tap dismisses, double tap opens the full edit tools; no oversized visual handles.
- **Brand essence:** premium custom product design for Bangladesh creators; warm, capable, trustworthy.

## Implementation scope
1. Add explicit long-running gateway budgets for `/api/ai/generate` and `/api/ai/reference`.
2. Make the approved live compositor the sole product renderer when enabled; retain SVG only as a fallback when live composition is disabled.
3. Replace oversized orange image handles with compact accessible controls and add a small contextual Edit/Crop entry point.
4. Add document-level outside-pointer dismissal while preserving canvas controls and mobile tool-sheet behavior.
5. Map all six admin-configured Studio color settings to their product category.
6. Add focused regression tests for timeout classification, renderer authority, control sizing/labels, and color-setting mapping.

## Boundaries
No provider credentials, Cloudflare/Render/Neon setting changes, live migrations, customer-data access, Photopea activation, or production deployment are part of this repository change.

## Professional resilience follow-up
### Movement
Operationally explicit, fail-closed commerce infrastructure: the storefront stays fast and public, while transactional authority remains singular and auditable.
### Core principles
- One authoritative write database; no row-count-based promotion.
- Bounded, paginated catalog responses with explicit totals.
- Primary-only writes and admin/AI operations.
- Health probes are evidence, not proof of replica freshness.
### Implementation scope
1. Standardize the public product API default to 24 items per page while preserving explicit bounded limits and pagination metadata.
2. Make database candidate selection honor configured authority order; row counts remain diagnostic telemetry only.
3. Correct the admin database-cluster copy to distinguish connectivity/schema probes from safe transactional promotion.
4. Add `docs/RESILIENCE_ARCHITECTURE.md` documenting the Cloudflare → Render → Neon flow, admin boundary, quota policy, and provider actions.
### Infrastructure decisions not executable from the repository alone
Automatic 80–90% quota-based migration requires provider quota metrics, synchronized transactional replication, freshness watermarks, promotion fencing, and a rollback plan. It must be configured and verified in Neon/Render/Cloudflare; this repository must not guess or silently switch to an independent database.

## Studio interaction correction pass
- Treat the selected artwork's rotated frame as the interaction boundary, not the full transparent image hitbox.
- A tap or press outside that frame clears the selection and suppresses the delayed Konva tap callback that can reselect it after a long press.
- Keep selected-artwork controls available for handles and toolbar buttons only; inert mockup/background taps must not restore the overlay.
- The contextual Crop action sets the upload panel to crop mode and keeps the mobile panel mounted so the fixed crop dialog opens directly.

## Checkout and mockup reliability follow-up
### Goal
Ensure a Design Studio item has a durable, orderable cart representation and that checkout reports actionable errors immediately. Preserve the 25% Bangladesh COD advance rule and never create a false success state.

### Implementation scope
1. Trace and validate the Studio cart payload from upload staging through cart persistence, checkout serialization, server order classification, pricing, and stock handling.
2. Add regression coverage for Studio item order creation, idempotent retry behavior, missing/invalid artwork metadata, and checkout navigation/error mapping.
3. Keep the approved runtime-role compositor as the customer-facing realistic preview/export path; do not claim that a browser-side PSD Smart Object is available when it is not.
4. Keep Facebook provider configuration owner-controlled: the application may expose the provider state and exact setup guidance, but the owner must authorize Meta and provide the App ID/secret through the provider secret store.

### Boundaries
Do not place a real order or submit payment. Do not read customer records. Do not add provider credentials to source control or chat. Do not silently switch database or payment providers.
