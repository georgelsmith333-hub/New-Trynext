---
name: Patchy Smart Object limitation
description: Result of the first genuine Patchy v0.99 render through the repository's Smart Object pipeline
---

Patchy v0.99's documented headless path (`app.open` followed by `doc.exportAs`) does not recompute the Smart Object composite in this repository's generated masters after their linked bytes are replaced. An untouched export and a modified export were byte-for-byte identical, so Patchy cannot currently serve as the pipeline's Smart Object compositor.

**Why:** Structural PSD validity and a non-empty export are not enough evidence for a usable mockup. Treating Patchy's successful process exit as a pass would activate templates whose artwork is not actually composited.

**How to apply:** Keep the Smart Mockup templates inactive until a compositor produces a visually and byte-differing output for a representative master, then repeat the check on the admin validation path before activation.