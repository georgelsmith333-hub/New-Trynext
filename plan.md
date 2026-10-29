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
