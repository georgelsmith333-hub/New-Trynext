---
name: Photopea Smart Object renderer
description: The supported Photopea browser automation path and the acceptance gate for real PSD Smart Object renders.
---

Photopea can be used as a genuine compositor through its iframe API: send the PSD bytes as an ArrayBuffer, wait for `done`, execute `app.activeDocument.saveToOE("png")`, and receive the exported ArrayBuffer. The output must still differ from an untouched baseline before a template is accepted.

**Why:** PSD byte replacement proves the container changed, not that the host recomputed Smart Object pixels. Only a changed exported composite proves the artwork entered the render.

**How to apply:** Keep Photopea selectable through the renderer seam with a configurable URL and Chromium path. Treat Cloudflare challenges, timeouts, and empty exports as unavailable; never activate candidate masters or fall back to a flat paste.