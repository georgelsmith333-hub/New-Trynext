---
name: Native PSD audit parser
description: The release audit uses ag-psd in Node because Python psd_tools and native canvas are not available in this workspace.
---

Use the repository's Node/ag-psd audit for generated PSD/PSB release verification. Parse with layer, composite, thumbnail, and merged image data skipped; verify dimensions, placed-layer count, embedded linked-file bytes, and the raw composite section without requiring a native canvas package.

**Why:** The Python dependency is not installed and ag-psd's optional composite decoding throws `Canvas not initialized` without a native canvas implementation, even though structural parsing of the same documents succeeds.

**How to apply:** Keep the Node audit aligned with the API upload parser and make release manifests consume its structural-audit output. Treat composite decoding as a separate visual/runtime concern when native canvas is unavailable.