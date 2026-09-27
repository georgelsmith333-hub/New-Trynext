---
name: Browser validator surface keys
description: The browser validator consumes a staging manifest whose surfaceKey field may be absent even though the runtime manifest includes it.
---

Normalize every staged surface at the API boundary to the canonical `family/color/view` key before returning it to the browser.

**Why:** The staging manifest used by the private PSD catalog omitted `surfaceKey`. Returning that missing value created duplicate empty select values, so choosing a cap color/view could not remain selected.

**How to apply:** Treat `surfaceKey` as optional in staging data; derive it from the three stable catalog fields, and keep the frontend select controlled by that normalized key.