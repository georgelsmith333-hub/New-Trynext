# Trynext Photorealistic Mockup System
## Deep Audit and Implementation Plan

**Date:** 2026-09-23  
**Scope:** Source assets, PSD/PSB Smart Objects, runtime role assets, browser/API compositing, Design Studio UX, storage, release verification, and deployment readiness.  
**Author:** Manus AI

> **Executive verdict:** Trynext has a substantial candidate mockup pipeline, not a verified full-stack photorealistic mockup system. The repository contains 188 staged PSD/PSB-looking masters, 1,128 runtime role PNGs, a browser compositor, and a separate Sharp API renderer. The active structural validator accepts the 188-surface matrix. That acceptance proves file inventory, dimensions, checksums, and selected role presence; it does **not** prove native Photoshop Smart Object editability, clean customer-ready payloads, real perspective or displacement, photorealistic material response, visual browser/API parity, or deployment/storage durability.

The current implementation explains why artwork does not reliably auto-fit, shade, or follow product perspective. Fit is a 2D scale-and-translate operation; the browser's curvature is a strip-based approximation; the API performs resize/rotate and compositing but does not consume the manifest's warp metadata. No true displacement map or projective transform is implemented. In addition, a processed-image replacement path can double-scale artwork, and a product-to-studio handoff drops variant identity.

**Release recommendation: NO-GO for a claim of full photorealistic, production-verified Smart Object mockups.** A limited GO is defensible only for a clearly labeled candidate/demo scope: browser-layer previews over the current 188-surface runtime catalog, with known visual and provenance limitations. Promotion to a photorealistic production release requires the gates and evidence described below.

---

## 1. Current Truth: Verified, Claimed, and Not Proven

### 1.1 Verified by repository evidence

The following statements are supported by direct file, script, or source inspection. They are implementation facts, not quality claims.

| Area | Verified fact | Implication |
|---|---|---|
| Active matrix | The current Smart v10.3 runtime contract contains **188 surfaces** across six families: 40 T-shirts, 50 long sleeves, 50 hoodies, 30 mugs, 16 caps, and 2 white water bottles. | The 188-surface matrix is internally complete only if the current white-only water-bottle contract is authoritative. |
| Staged masters | `dist-mockups/staging/smart-v10-v3` contains 188 PSD/PSB files: 156 PSD and 32 PSB, plus 188 previews, 188 proof-previews, and 200 source PNGs. Representative files have an `8BPS` signature and 1024×1024 RGB headers. | These are syntactically Photoshop-compatible binaries. This does not establish native Smart Object usability. |
| Provenance | The staging manifest marks 94 surfaces `authentic-preserved` and 94 `generated-master`. All 188 rows are `reviewStatus: candidate`; the manifest itself is `status: candidate` in staging. | Half of the staged surfaces are explicitly derived from other views. They cannot be represented as independently photographed masters without qualification. |
| Runtime roles | The public runtime catalog contains 1,128 role PNGs: six roles per surface. Roles include `studioBackground`, `base`, `shadow`, `protected`, `highlight`, and `printMask`, with some sleeve/label variants. | The browser has a usable layer representation of masks and shading roles. It is not a Photoshop Smart Object source. |
| Runtime validation | The active matrix validator accepts the 188 expected surfaces and 1,128 runtime role files. It checks schema, keys, checksums, PNG signature, 1024×1024 dimensions, and some alpha conditions. | Structural acceptance is useful but insufficient for semantic or visual acceptance. |
| Browser compositor | The Design Studio supports image, text, and shape layers; translation, scale, nonuniform scale, rotation, opacity, flips, CSS brightness/contrast/saturation, print-zone clipping, shape-specific paths, six runtime roles, procedural grain, and simulated curvature. | Basic interactive previews work in the source path, subject to the failure and scale bugs below. |
| API renderer | `POST /api/mockup/render` accepts an artwork data URL and six checksum-bound role images. It supports contain/cover, opacity, rotation, brightness, contrast, mask extraction, and Sharp compositing. | The API is a separate role compositor. It does not render the PSD/PSB at request time. |
| Admin ingestion | Admin upload stores PSD/PSB masters privately, parses them, checks Smart Object identity and geometry, rewrites metadata from parsed bytes, and validates the v10.3 contract. Missing masters can result in preview-only state. | There is an ingestion path, but its production status depends on parser coverage and actual source validation. |
| Order storage | Studio order creation persists rendered thumbnails, compressed custom textures, original asset metadata, and custom notes. Original production uploads use a separate object-storage flow. | Preview persistence and print-production source persistence are distinct concerns and must remain distinct. |
| Test execution | Focused storefront tests reportedly pass 19 files/69 tests; API mockup tests pass 4/4 in the cited audit environment. Vitest was not available in another checkout/context, so the full test environment is not reproducibly proven. | Existing tests cover contracts and happy paths, not photorealistic semantics or full browser behavior. |

### 1.2 Claims or documentation that are not current proof

Several documents describe stronger behavior than the active code or current evidence demonstrates.

* Older inventory and canonical validation documents describe a **202-surface Smart v4 matrix** with 16 water-bottle surfaces. The active v10.3 runtime matrix contains 188 surfaces and only white water bottles. The documents are stale or contradictory until one contract is explicitly declared authoritative.
* Design specifications describe a displacement-oriented Smart Object system, but the active builder and runtime role builder do not produce or consume displacement maps. The active API has no displacement input or operation.
* Builder metadata includes a `warp` object with modes such as `cylinder`, `cap-panel`, and `flat`, plus curvature values. This is declarative metadata. It is not evidence that uploaded artwork is projectively warped or displaced at render time.
* The presence of `8BPS`, a custom `smartObject` metadata object, and a placed-layer record does not prove Photoshop can open, edit, relink, and re-render the embedded or linked artwork. No Photoshop reopen/edit/render evidence was supplied.
* A public manifest marked `accepted` while every surface remains `reviewStatus: candidate` is not a valid visual approval record. It is an internal state contradiction.
* Historical visual inspection reports flag low texture/luminance variation and flat or abstract secondary views. Those reports are useful evidence that visual approval was not complete, but they do not by themselves describe every current pixel. They must be superseded by current per-surface evidence, not silently ignored.

### 1.3 Explicitly unproven or currently blocked

The following must be treated as **not proven** until a new evidence artifact exists:

1. Photoshop-native editability and successful Smart Object relink/re-render for all release masters.
2. Clean blank customer-ready Smart Object payloads. The builder intentionally uses `artworkProof()` and writes visible proof previews; the staging masters are therefore not proven clean release masters.
3. Photorealistic material fidelity for fabric weave, folds, seams, collars, mug curvature, cap panels, bottle surfaces, print integration, highlights, and shadows.
4. Correct source provenance for the 94 generated sleeve, neck-label, and mug-wrap derivatives.
5. One-to-one alignment between PSD layers and runtime role PNGs. Current staging metadata does not explicitly link mask, material, shading, protected-detail, or displacement files to each master.
6. A true projective/perspective warp and a true displacement-map pipeline.
7. Browser/API pixel parity.
8. Complete current browser visual coverage across all families, faces, colors, deep links, mobile states, errors, and export flows.
9. Durable production object storage. Render configuration does not make R2/S3 mandatory, and local filesystem fallback exists.
10. Deployment parity between Cloudflare Pages and Render, including release identifier, asset set, service-worker precache, and retired-path removal.

---

## 2. Why Artwork Does Not Auto-Fit, Shade, or Follow Perspective

The visible symptom is often described as “the artwork does not fit the product.” The actual system has several independent causes.

### 2.1 Fit is not geometry-aware

Initial upload uses `fitImageTransform` against a print zone with padding. Product switching computes width and height ratios from the old and new print zones and updates `x`, `y`, `scale`, `scaleX`, and `scaleY`. This is a useful 2D placement model, but it assumes the target print zone can be represented by a rectangle in product coordinates.

The compositor then derives rendered dimensions from natural image dimensions multiplied by `scale`, `scaleX`, and `scaleY`. The processed-image replacement path in `DesignStudioV2.tsx` computes the previous rendered size from `scaleX` and `scaleY` while ignoring the base `scale` when those values are present, then writes all three values. A fitted image can therefore jump to roughly its natural size or otherwise become double-scaled after remove-background, upscale, or auto-fix processing. This is a direct scale invariant violation.

**Required fix:** define one transform convention. Either store absolute rendered width/height in product coordinates, or store `scale` plus relative axes and always compute rendered dimensions as `naturalWidth × scale × scaleX` and `naturalHeight × scale × scaleY`. Add a replacement regression test that asserts rendered dimensions do not change when the processed bitmap has the same intrinsic dimensions.

### 2.2 The browser has curvature simulation, not perspective mapping

The browser compositor applies a strip-based approximation. It divides the artwork into vertical strips, pinches edges, bows strips vertically, and adjusts edge brightness. This can suggest cylinder curvature, but it cannot preserve a design's true correspondence with four or more destination corners, seams, taper, or occlusion.

There is no homography or projective transform in the active path. A perspective transform maps a source quadrilateral to a destination quadrilateral. A displacement transform maps each output pixel through a field. The current compositor implements neither.

### 2.3 The API cannot reproduce the builder's declarative warp metadata

The API renderer uses Sharp resize/rotate and then composites artwork through a resized print mask. It does not consume `surface.warp`, `normalizedFrame`, `smartObject.transform`, or material parameters. The API can therefore produce a valid PNG while ignoring the very metadata that describes curvature or placement.

Rotation also occurs after resized dimensions are calculated. Sharp may expand the rotated buffer, so the final placement can be offset or clipped relative to the mask. There is no post-rotation bounds reconciliation.

### 2.4 No displacement or material pipeline exists

The current runtime builder emits background, base, luminance-derived shadow, protected details, luminance-derived highlight, and a binary rectangular print mask. It does not emit a displacement map, a material map, a normal map, a roughness map, or an explicit print-depth map. The API has no operation that consumes one.

Without these fields, the system cannot make ink follow a knitted weave, fold around a mug handle, taper across a cap panel, or react to product-specific depth. A grayscale highlight/shadow overlay can shade artwork, but it does not physically deform or integrate it.

### 2.5 Metadata and role files are not contractually linked

Staging metadata contains geometry and Smart Object transform information, but it lacks explicit fields for `mask`, `masks`, `material`, `materialMap`, `shading`, `shadow`, `highlight`, `protected`, `printMask`, `geometry`, `layers`, `linkedSmartObject`, or `smartObjectPath` that point to checksummed runtime files. Separate PNGs existing at expected paths does not prove that a PSD uses the corresponding pixels.

### 2.6 Generated derivatives are not independent photographed views

The builder explicitly generates sleeve and neck-label views from polygon/crop derivations and generates mug wraps from another body view. These are reasonable prototypes or approximations. They are not evidence of independently photographed surfaces with correct local folds, perspective, and material response.

The system must either replace them with independently validated masters or label them as derived approximations and exclude them from a full photorealistic-source claim.

---

## 3. Missing Pieces for a Full-Stack Photorealistic System

A production-grade system requires a chain of evidence from source asset to browser output. The missing pieces are:

### 3.1 Asset provenance and master acceptance

Each surface needs a provenance record that identifies the source photograph or approved derivative process, capture/reference ID, operator, revision, and checksum. Generated derivatives must be explicitly marked and must not inherit an `authentic` claim.

Each release master needs an actual Photoshop or equivalent structural verification. The verification must open or parse the layer records, identify one editable Smart Object, verify its payload, edit or replace the payload, save a temporary copy, reopen it, and confirm the rendered composite changes as expected. If external linked files are used, the test must resolve the link from the packaged release and reject absolute workstation paths.

### 3.2 Clean customer payloads

Release masters must not embed `TRY NEX`, `ARTWORK HERE`, checkerboards, magenta/chroma-key content, proof labels, or other placeholder artwork. Proof previews must be isolated from release masters. A deterministic scan must inspect both image pixels and extracted Smart Object payloads.

### 3.3 Semantic role assets

Every surface must have explicit, checksummed assets for:

* base product/photo;
* transparent product alpha or silhouette;
* printable mask and print-zone geometry;
* protected details such as seams, hardware, handles, collars, and labels;
* shadow and highlight/light response;
* displacement/depth or a documented reason why the product is flat;
* material parameters and, where used, normal/roughness maps;
* background and color treatment;
* PSD/PSB layer and Smart Object records.

Each role needs a declared coordinate space, dimensions, color space, alpha convention, and version.

### 3.4 One canonical matrix

The project must choose 188 or 202 as the authoritative matrix. If 188 is intentional, the dated 202-surface documents must be marked superseded and every validator, resolver, source manifest, and catalog must point to v10.3. If 202 is required, the missing 14 water-bottle surfaces must be created and validated. No release may proceed while two incompatible matrices appear current.

### 3.5 A single release orchestrator

The repository has handoff references to `mockups:render-previews` and `mockups:release`, but package scripts do not wire a reproducible end-to-end release command. The orchestrator must run, in order, source audit, PSD/PSB structural audit, runtime-role generation, role semantic audit, matrix validation, browser/API parity renders, visual regression, security checks, and promotion. Any missing path or partial generation must fail nonzero.

### 3.6 Visual and browser evidence

A file-count validator is not visual QA. The release must create deterministic output for every canonical surface and representative customer artwork fixtures, save screenshots or image hashes, generate contact sheets, run perceptual comparisons, and attach human approvals or explicit exceptions to surface checksums.

### 3.7 UX integration fixes

The Design Studio needs upload state, cancellation/supersession, stale-frame indication, actionable retry, a visible 2D fallback when 3D fails, variant-preserving catalog handoff, and a mobile bottom-offset strategy that accounts for the variable-height purchase bar and safe-area insets.

### 3.8 Durable storage and deployment proof

Production must require R2/S3 or another durable object store. Local filesystem fallback must be rejected when `NODE_ENV=production`. A staging test must prove upload, retrieval after restart or instance change, access policy, and checksum stability. Cloudflare Pages and Render must expose the same release ID and asset contract, and the deployed bundle/service worker must be scanned for retired paths and legacy roots.

---

## 4. Target Architecture

The recommended architecture separates **authoring**, **asset publication**, **runtime composition**, and **evidence**. It should not use the browser's current approximation as the source of truth for print production.

```text
                     ┌──────────────────────────┐
                     │  PSD/PSB authoring kit    │
                     │  Smart Object + layers   │
                     └────────────┬─────────────┘
                                  │ ingest / verify / checksum
                     ┌────────────▼─────────────┐
                     │ Asset registry + release │
                     │ manifest and approvals   │
                     └───────┬─────────┬────────┘
                             │         │
                public role assets     │ private masters
                             │         │
             ┌───────────────▼───┐   ┌─▼────────────────┐
             │ CDN/object storage │   │ durable private  │
             │ role PNG/WebP/AVIF │   │ PSD/PSB + source  │
             └───────────────┬───┘   └─┬────────────────┘
                             │         │
              ┌──────────────▼─────────▼──────────────┐
              │ Surface service / contract resolver   │
              │ release ID, role URLs, geometry,      │
              │ transform, material, checksums        │
              └──────────────┬─────────┬──────────────┘
                             │         │
            interactive      │         │ final/export/server
            browser preview  │         │ render
              ┌──────────────▼───┐   ┌─▼────────────────┐
              │ Browser compositor │   │ Render worker/API │
              │ WebGL/Canvas       │   │ projective +      │
              │ low-latency preview │   │ displacement      │
              └──────────────┬────┘   └───────┬─────────┘
                             │                │
                             └──────┬─────────┘
                                    ▼
                       ┌──────────────────────────┐
                       │ preview/export/order     │
                       │ thumbnails + production  │
                       │ artwork references       │
                       └──────────────────────────┘
```

### 4.1 Authoring and ingestion

Authors provide a PSD or PSB with a named editable Smart Object and a documented layer structure. Ingestion runs in a worker or controlled admin service. It stores the original private file, extracts structural metadata, validates the source against the release contract, creates role assets from approved layers or calibrated extraction, and writes a content-addressed manifest.

The ingestion result must be immutable. A changed master or changed role bytes creates a new release revision rather than mutating an accepted revision.

### 4.2 Registry and release state

Use separate states:

* `candidate`: generated or uploaded, not approved;
* `structurally_verified`: source and role structure pass;
* `visually_verified`: current rendered evidence passes and human approval exists;
* `accepted`: eligible for public runtime use;
* `quarantined`: known issue or superseded;
* `rejected`: failed acceptance.

A manifest cannot be `accepted` while any included surface remains `candidate`.

### 4.3 Preview and final rendering

The browser compositor should use the same surface contract and transform math as the server. For flat products, Canvas 2D may remain sufficient. For curved products, use a shared projective/displacement implementation or a deterministic render service. WebGL can provide interactive previews; the server remains the authority for export and production-grade images.

The API should receive a stable `surfaceId`, release ID, artwork object reference or bounded data URL, and transform/options. It should resolve role assets server-side rather than accepting six large arbitrary role images from the client. If data URLs remain supported for low-latency previews, validate MIME, Base64, dimensions, decoded byte size, and checksum policy strictly.

### 4.4 Storage boundaries

Public role assets may be served from a versioned CDN path. PSD/PSB masters, original customer uploads, production source artwork, and order render outputs must be private object records with authorization and retention policies. Preview thumbnails may be public only when deliberately made non-sensitive; customer artwork should be private by default.

---

## 5. Data Contracts

The following contracts are implementation targets. Field names may be adapted to local conventions, but the semantics must remain explicit.

### 5.1 Surface manifest

```ts
type SurfaceStatus =
  | "candidate"
  | "structurally_verified"
  | "visually_verified"
  | "accepted"
  | "quarantined"
  | "rejected";

type Surface = {
  id: string;                       // stable family/color/view key
  family: "tshirt" | "longsleeve" | "hoodie" | "mug" | "cap" | "waterbottle";
  color: string;
  view: "front" | "back" | "left-sleeve" | "right-sleeve" | "neck-label" | "wrap";
  releaseId: string;
  status: SurfaceStatus;
  provenance: {
    kind: "authentic" | "derived" | "generated";
    sourceIds: string[];
    method?: string;
    sourceChecksum?: string;
  };
  master: {
    storageKey: string;
    format: "psd" | "psb";
    sha256: string;
    width: number;
    height: number;
    colorMode: "RGB" | "CMYK" | "Grayscale";
    smartObject: {
      layerId: number;
      layerName: string;
      payloadStorageKey: string;
      payloadSha256: string;
      linkMode: "embedded" | "linked";
      relativeLink?: string;
    };
  };
  geometry: {
    coordinateSpace: "normalized-1024";
    printZone: { x: number; y: number; width: number; height: number };
    sourceCorners?: [[number, number], [number, number], [number, number], [number, number]];
    destinationCorners?: [[number, number], [number, number], [number, number], [number, number]];
    transform: "flat" | "projective" | "projective-displacement";
    displacement?: { storageKey: string; sha256: string; scale: number };
  };
  roles: {
    studioBackground: AssetRef;
    base: AssetRef;
    protected: AssetRef;
    shadow: AssetRef;
    highlight: AssetRef;
    printMask: AssetRef;
    productAlpha: AssetRef;
    material?: AssetRef;
  };
  blendModes: {
    shadow: "multiply";
    highlight: "screen";
    protected: "source-over";
  };
  approvals: {
    structural?: Approval;
    visual?: Approval;
    exception?: string;
  };
};

type AssetRef = {
  storageKey: string;
  url: string;
  sha256: string;
  mime: "image/png" | "image/webp" | "image/avif";
  width: number;
  height: number;
  colorSpace: "sRGB";
  alpha: "straight" | "premultiplied";
};

type Approval = {
  actor: string;
  approvedAt: string;
  evidenceKey: string;
  referenceSha256: string;
};
```

### 5.2 Render request and response

```ts
type RenderRequest = {
  releaseId: string;
  surfaceId: string;
  artwork: {
    storageKey?: string;
    dataUrl?: string;
    sha256: string;
    mime: "image/png" | "image/jpeg" | "image/webp";
    width: number;
    height: number;
  };
  placement: {
    mode: "contain" | "cover";
    x: number;
    y: number;
    width: number;
    height: number;
    rotationDeg: number;
    opacity: number;
    flipX?: boolean;
    flipY?: boolean;
  };
  effects?: {
    brightness: number;
    contrast: number;
    saturation?: number;
  };
  purpose: "preview" | "export" | "order-proof";
  idempotencyKey: string;
};

type RenderResponse = {
  renderId: string;
  releaseId: string;
  surfaceId: string;
  sha256: string;
  mime: "image/png";
  width: number;
  height: number;
  cache: "hit" | "miss" | "private-no-store";
  warnings: string[];
};
```

The server must recompute or securely resolve every referenced checksum. It must not trust a client-provided master checksum as proof that the master was read. Render cache keys should include release ID, surface checksum, artwork checksum, transform/options, renderer version, and material/displacement version.

### 5.3 Customer artwork lifecycle

Record the original upload separately from derived previews:

```ts
type CustomerArtwork = {
  id: string;
  ownerId: string;
  original: {
    storageKey: string;
    sha256: string;
    mime: string;
    width: number;
    height: number;
    bytes: number;
  };
  derived: {
    previewKey?: string;
    transparentKey?: string;
    printReadyKey?: string;
  };
  createdAt: string;
  retentionClass: "cart" | "order" | "production";
};
```

The studio-to-cart handoff must preserve `storeProductId`, `variantId`, and `variantName`. A studio item may intentionally use `productId: 0` internally, but the selected catalog identity must not disappear silently.

---

## 6. Real PSD/PSB Smart Object Acceptance Requirements

A real source kit is accepted only when all requirements below pass for every release surface.

### 6.1 File and structure

* The file opens successfully in Photoshop or an equivalent parser that understands the required PSD/PSB layer records.
* The document dimensions, color mode, bit depth, and profile match the manifest.
* Exactly one designated editable Smart Object exists for the customer artwork, with a stable layer ID/name and no accidental rasterized replacement.
* The Smart Object payload is embedded or linked through a portable relative path. Absolute workstation paths, missing links, and unresolved external references fail.
* The product/photo, mask, protected details, shadows, highlights, guides, and Smart Object layers match the declared layer contract.
* The composite is non-empty, has no proof labels or placeholder pixels, and renders correctly after save/reopen.

### 6.2 Edit/relink/re-render test

For each master, an automated or controlled verification must:

1. Open the master.
2. Record the initial composite checksum and layer inventory.
3. Replace the Smart Object payload with a known calibration artwork containing asymmetric colored markers and a registration grid.
4. Save a temporary copy without modifying the release master.
5. Reopen the copy.
6. Confirm the Smart Object remains editable and the composite checksum changes.
7. Confirm markers appear inside the print zone, with expected clipping, protected details, shading, and geometry.
8. Restore or discard the temporary file and record the evidence checksum.

If Photoshop automation is unavailable, a parser-only result may be labeled **structural compatibility**, never native editability. It must not be reported as a full pass.

### 6.3 Pixel and placeholder scan

Scan the master composite, Smart Object payload, previews, proof previews, and runtime roles for:

* `TRY NEX`, `ARTWORK HERE`, `PROOF`, or equivalent text;
* checkerboard transparency patterns;
* magenta/chroma-key blocks;
* empty or uniformly flat product regions where texture is required;
* unexpected opaque background pixels outside the product silhouette;
* missing protected details;
* role-specific alpha and luminance anomalies.

The scan must target the actual repository-relative staging and runtime roots. A missing root is a hard error. A checker that traverses zero files and exits 0 is invalid.

### 6.4 Geometry and material acceptance

For every surface, validate:

* product silhouette and alpha bounds;
* print-mask containment within the declared product/print zone;
* protected-detail coverage and expected seams/hardware;
* calibration artwork registration at center and all print-zone edges;
* projective or displacement behavior where the product is curved;
* material-specific response for fabric, ceramic, coated metal, and structured panels;
* color/material response after artwork changes;
* no clipping caused by rotation or cover/contain mode.

A human visual owner must approve any surface that falls outside an automated perceptual threshold. The approval must reference the exact master and role checksums.

---

## 7. Compositor Strategy

### 7.1 Shared coordinate model

Use a normalized 0–1 surface coordinate space backed by a fixed reference raster such as 1024×1024. Store print-zone bounds and, for non-flat products, source and destination corners. Do not mix natural-image pixels, product pixels, and canvas CSS pixels without explicit conversion.

Transform order should be deterministic:

1. Decode and validate artwork.
2. Fit or place artwork in print-zone coordinates.
3. Apply flips and rotation around the artwork center.
4. Apply projective warp from source rectangle to destination quadrilateral.
5. Apply displacement field and material-specific scale.
6. Clip through print mask.
7. Apply product base/material response.
8. Composite shadows and highlights with declared blend modes.
9. Composite protected details last.
10. Encode output and record renderer/version metadata.

### 7.2 Browser preview

Use WebGL for interactive projective and displacement operations where available. Keep Canvas 2D as a deliberate flat-product fallback. The browser should show the same transform and role semantics as the server, but it may use lower resolution or a preview displacement scale for latency.

The preview state must distinguish:

* loading a new surface;
* loading artwork;
* rendering;
* stale last-good frame;
* successful frame;
* retryable failure;
* permanent contract failure.

Do not display “Preview retrying” unless an actual retry is scheduled or the user can invoke one.

### 7.3 Server/export compositor

The server must use a deterministic renderer that consumes the manifest, not arbitrary client role images. For projective products, implement a homography or equivalent mesh warp. For products requiring local material deformation, consume an explicit displacement map and apply bounded displacement in a fixed coordinate space. Use a renderer version in the cache key.

The current Sharp pipeline can remain as a flat-product implementation during migration, but it must be labeled as `transform: flat` and must not claim perspective fidelity. Add post-rotation bounds reconciliation or rotate into a fixed-size zone canvas so clipping is deterministic.

### 7.4 Material model

Do not infer photorealism from a single shadow and highlight PNG. For each material class, define a calibrated response:

* textile: low-frequency fold shading plus high-frequency weave response;
* ceramic: smooth highlight and controlled reflection around curvature;
* coated metal/plastic: edge highlights and specular response with protected hardware;
* cap panels: panel seams, taper, and local directional curvature;
* bottle: cylindrical or tapered projective geometry and handle/edge occlusion where applicable.

A lightweight runtime model is acceptable for previews if it is calibrated against approved references. Final export must use the same or a higher-fidelity deterministic model.

---

## 8. Frontend UX Requirements and Known Fixes

### 8.1 Upload flow

Implement `uploadState = idle | reading | decoding | ready | error`, a request token or `AbortController`, duplicate-selection suppression, and a visible progress or preparation indicator. Late `FileReader` callbacks must not add stale artwork after a newer selection.

Align UI copy and validation with the server. The UI currently advertises JPG, PNG, and WebP while MIME checks and server behavior differ, including GIF support in the API. Choose a supported list and make the browser, API, storage route, and copy agree.

### 8.2 Fit stability

Fix processed-image replacement as described in Section 2.1. Add tests for same-size replacement, changed aspect ratio, product switching, rotation, and cover/contain. The invariant is that a replacement operation does not unexpectedly change the visible fitted dimensions unless the product explicitly requests refit.

### 8.3 Product and variant handoff

Carry `variantId` and `variantName` from catalog/product detail into the Design Studio URL or navigation state, into `LinkedStoreProduct`, into `CartItem`, and into checkout/order metadata. If the studio intentionally creates a new custom product rather than modifying a catalog SKU, show that fact to the customer instead of silently dropping stock identity.

### 8.4 Render errors and stale frames

Use clear states: “Loading preview,” “Preview unavailable — Retry,” and “Showing previous preview while loading.” Add a retry button that increments a render key and resets error state. Preserve the last good frame only with a visible stale indicator when the new surface has not completed.

### 8.5 3D fallback

Wrap the 3D viewer in an error boundary. Replace null Suspense fallback and console-only failures with a loading skeleton, a user-visible failure reason, retry, and a direct 2D compositor fallback. A blank or neutral viewer is not an acceptable customer-facing error state.

### 8.6 Mobile purchase controls

Measure the sticky purchase bar or expose a CSS custom property for its dynamic height. Position floating tools relative to that value plus safe-area inset. Test at 390×844 and short-height viewports with disabled-reason text visible.

---

## 9. Storage, Performance, and Security

### 9.1 Storage

Require a durable object store in production. Reject local filesystem storage when `NODE_ENV=production`. Store private masters and original customer artwork under owner/order authorization. Use immutable versioned keys for releases and content-addressed keys for derived assets.

Persist only what is needed for each retention class. Preview thumbnails may be garbage-collected after cart expiration. Order proof images and production source files require order-retention policy. Record checksums and MIME/dimensions at ingestion.

### 9.2 Performance

Use a stable surface ID and server-side role lookup instead of sending six role data URLs on every render. CDN-cache immutable role assets by release ID and checksum. Bound browser image caches and role-data caches with size and TTL. Invalidate rejected manifest promises and provide a retry path.

Use a render cache only when privacy policy permits it. A safe cache key includes release ID, surface/role checksums, artwork checksum, transform/effects, renderer version, and displacement/material version. Never cache private customer artwork in a public CDN.

For interactive previews, use lower resolution and debounce transforms. For exports, run a queue or worker with bounded concurrency and idempotency keys. Return render IDs for asynchronous jobs if output generation exceeds request limits.

### 9.3 Input validation

Parse data URLs strictly. Permit only supported MIME types. Validate Base64 rather than relying on permissive decoding. Bound decoded bytes, dimensions, pixel count, and decompression ratio before passing content to Sharp or another image library. Return structured 400 errors for malformed input and 413 for size/pixel limits.

Validate every role's dimensions, PNG signature, color space, alpha convention, and checksum. Do not let clients select arbitrary role URLs. Apply authorization to private object reads and admin ingestion. Log release ID, surface ID, renderer version, and checksums without logging customer artwork bytes or sensitive data.

### 9.4 Deployment

Pages and Render must expose a shared release/build identifier. Deployment verification must:

* probe API readiness;
* fetch and decode at least one surface for every family and required view;
* verify the public manifest release ID;
* scan deployed JavaScript and service-worker precache for retired paths and old roots;
* verify private object retrieval from a second instance or after restart;
* reject a release if storage silently falls back to local disk.

Retired routes should use short/no-store caching unless a 24-hour 410 policy is intentional and documented.

---

## 10. Test and Evidence Matrix

Every row below is a release gate. “Not run,” “path missing,” or “historical only” is not a pass.

| Gate | Scope | Required evidence | Pass condition | Current status |
|---|---|---|---|---|
| Matrix contract | 188 or 202, one authoritative choice | Versioned manifest and generated report | All validators, docs, resolver, and catalog agree | **BLOCKED** by 188/202 contradiction |
| Source provenance | Every master/source pair | Repository-relative manifest, hashes, provenance records | No missing roots; all included surfaces have source evidence | **BLOCKED** for current release claim |
| PSD/PSB structure | 188/188 | Parser/Photoshop report and layer inventory | Correct format, dimensions, Smart Object, portable links | **PARTIAL**; syntax observed, native editability unverified |
| Smart Object edit/re-render | 188/188 | Before/after checksums and calibration renders | Payload replacement changes composite and remains editable | **NOT PROVEN** |
| Placeholder scan | masters, payloads, previews, proof previews, roles | Machine-readable scan | Zero proof/checkerboard/magenta/placeholder findings | **BLOCKED**; builder embeds proof artwork |
| Runtime roles | 188×6 minimum plus declared extras | Checksums, dimensions, semantic alpha/luminance report | Correct roles, geometry, and coordinate space | **STRUCTURAL PASS ONLY** |
| Geometry | all surfaces and fixtures | Alpha/mask/registration report | Artwork stays in print zone; protected details preserved | **NOT PROVEN** |
| Projective/displacement | curved surfaces | Calibration artwork renders and difference images | Correct corners/curvature and bounded displacement | **FAIL** in current implementation; no pipeline |
| Material fidelity | six families and representative colors | Per-surface rubric and references | Texture, folds, edges, highlights, shadows, color response meet threshold | **NOT PROVEN**; historical issues exist |
| Browser/API parity | representative and edge fixtures | Same-input output hashes/perceptual diffs | Outputs match within calibrated tolerance | **NOT IMPLEMENTED** |
| Full browser matrix | desktop/mobile, all families/views | Playwright screenshots and retrieval logs | Current release renders, switches, uploads, exports, and errors correctly | **NOT PROVEN** |
| Upload lifecycle | large files, concurrent selection, malformed files | Automated tests and UI evidence | Progress, cancellation/supersession, strict errors | **FAIL/PARTIAL** |
| Variant handoff | catalog to studio to order | Request/order payload fixture | Product and variant identity preserved or explicitly reclassified | **FAIL** |
| Render errors | failed asset, failed API, stale frame | UI screenshots and retry test | Actionable state and working retry/fallback | **FAIL/PARTIAL** |
| Security | malformed data URLs, role spoofing, auth, limits | Negative test report | Correct 400/413/401/403 and no arbitrary role access | **PARTIAL** |
| Storage durability | upload/read/restart/second instance | Staging retrieval proof | Durable object store, no production local fallback | **NOT PROVEN** |
| Deployment parity | Pages and Render | Build IDs, probes, bundle/service-worker scan | Same release and no stale legacy paths | **NOT PROVEN** |
| Release state | included surfaces | Manifest plus approvals | No candidate row in accepted release | **FAIL** in current public manifest |

### 10.1 Minimum visual fixture set

Use asymmetric calibration artwork, a transparent logo, fine text, high-contrast edges, a gradient, and a halftone or grid. Include:

* flat T-shirt front and back;
* sleeve and neck-label views;
* hoodie front and back;
* mug body/wrap with handle occlusion;
* cap panel with seam/taper;
* cylindrical and tapered bottle;
* black, white, and at least one colored product;
* rotation, cover, contain, opacity, and boundary placements;
* protected-detail and shadow/highlight preservation cases.

For every output, record the release ID, surface checksum, artwork checksum, renderer version, and perceptual comparison result.

---

## 11. Staged Implementation Plan

### Stage 0 — Freeze truth and stop false promotion

**Deliverables:** one canonical matrix decision; superseded-document markers; repository-relative paths; corrected release states; fixed no-op scripts.

* Decide whether the product ships 188 or 202 surfaces. Default recommendation is to keep 188 temporarily because it is the active v10.3 catalog, while explicitly labeling water bottles white-only.
* Mark dated Smart v4/202 documents historical or regenerate them.
* Fix `check_generated_mockup_artifacts.py` to resolve the repository root, fail on missing roots, and scan staging proofs plus active runtime output.
* Make `normalize_mockups_v3.py` exit nonzero when errors exist.
* Prevent `status: accepted` when any surface is `candidate`.

**Gate 0 — GO only if:** one matrix contract is machine-readable; missing paths fail; no accepted release contains candidate rows. Otherwise stop.

### Stage 1 — Build a trustworthy source and role kit

**Deliverables:** repository-relative source manifest; master parser report; role contract; placeholder scan; provenance classification.

* Add explicit role references and checksums to every surface.
* Separate clean release masters from proof previews.
* Add product alpha, displacement/material references, or explicitly mark a surface flat and exclude perspective claims.
* Replace or quarantine generated sleeve/neck/wrap derivatives for any family claiming photorealistic source fidelity.
* Record a per-surface approval object tied to exact checksums.

**Gate 1 — GO only if:** 188/188 or 202/202 sources are present; all included masters and roles are structurally verified; placeholder scan is clean; provenance claims are accurate. Otherwise stop at candidate/demo status.

### Stage 2 — Verify real Smart Objects

**Deliverables:** edit/relink/re-render harness; per-master evidence; portable links; clean payloads.

* Implement Photoshop automation or document the equivalent parser limitation.
* Run the calibration artwork edit/reopen test for every master.
* Ensure linked files resolve from package-relative paths.
* Reject masters that only have custom metadata or an `8BPS` header without editable layer proof.

**Gate 2 — GO only if:** every release master passes native or explicitly qualified equivalent edit/re-render verification. If only parser evidence exists, the release may proceed only as structural, never photorealistic production.

### Stage 3 — Implement shared geometry and materials

**Deliverables:** shared transform library; projective warp; displacement map support; semantic role validation; browser/API parity.

* Define normalized coordinate math and transform ordering.
* Implement homography/projective mapping for curved and tapered products.
* Add displacement maps where material/product geometry requires them.
* Apply rotation in a fixed-size zone canvas or reconcile bounds after rotation.
* Make API consume manifest transform/material data and make browser use the same contract.
* Add golden renders and perceptual thresholds.

**Gate 3 — GO only if:** calibration artwork registers correctly for all required surfaces, browser/API output is within tolerance, and protected details/material response pass. Otherwise label flat/approximate surfaces clearly.

### Stage 4 — Repair Design Studio integration

**Deliverables:** robust upload lifecycle, fit invariant, variant handoff, error UX, 3D fallback, mobile layout tests.

* Fix scale replacement and add regression coverage.
* Add upload state/progress/supersession.
* Preserve variant identity.
* Add explicit retry and stale-frame states.
* Add visible 2D fallback and error boundary around 3D.
* Anchor floating controls to purchase-bar height.

**Gate 4 — GO only if:** Playwright covers desktop/mobile flows, failure states are actionable, and no silent identity or scale loss occurs.

### Stage 5 — Storage, performance, and deployment hardening

**Deliverables:** mandatory durable storage; bounded caches; secure input validation; Pages/Render parity checks; release orchestrator.

* Require R2/S3 in production.
* Move runtime role lookup server-side and version CDN assets.
* Add strict data-URL validation and request limits.
* Add bounded TTL caches and deterministic render cache where privacy permits.
* Add release scripts that run every gate in order.
* Probe deployed build IDs, assets, service workers, and storage durability.

**Gate 5 — GO only if:** all gates pass with current evidence from the exact build being promoted. Any unavailable evidence is BLOCKED, not implicitly passed.

### Stage 6 — Controlled promotion and monitoring

Start with a small accepted surface cohort, preferably flat products with independently verified masters. Monitor render errors, cache misses, latency, failed asset reads, upload failures, and user retry rates. Expand only after the next cohort passes the same evidence gates. Never convert a historical or candidate surface to accepted solely by changing a status field.

---

## 12. Explicit Stop/Go Policy

### Immediate STOP conditions

Stop promotion and retain candidate/quarantine state if any of the following is true:

* Matrix count or water-bottle contract is ambiguous.
* A required source, master, role, or manifest path is missing.
* A checker exits 0 after scanning zero files.
* A master contains proof artwork, checkerboard, magenta placeholder, or unresolved link.
* Native Smart Object editability is claimed without edit/reopen evidence.
* A generated derivative is labeled independently photographed.
* Accepted manifest includes candidate surfaces.
* Perspective/displacement is advertised but not implemented for the claimed surface.
* Browser/API parity or material/photorealism evidence is absent.
* Production may fall back to local filesystem storage.
* Deployment build IDs or public asset roots do not match.
* Security tests permit malformed input, role spoofing, or unauthorized private reads.

### GO conditions for a limited candidate/demo release

A limited demo may proceed only when the UI and documentation clearly say that it is a browser-layer preview over candidate runtime assets. It must not claim native Photoshop editability, photorealistic fidelity, true perspective, production-ready print geometry, or complete source provenance. Candidate assets must be isolated from the customer-facing production claim.

### GO conditions for full photorealistic production release

All gates in Section 10 must pass for the exact promoted release. The manifest must be `accepted`, every included surface must be approved, all required evidence must reference current checksums, and a named owner must sign the final visual exceptions report.

---

## 13. SUPER COMMAND

The following is a self-contained task prompt for another coding agent. It is intentionally explicit about truth, scope, gates, and non-claims.

```text
SUPER COMMAND: Implement and verify the Trynext full-stack photorealistic mockup system.

ROLE
You are the lead implementation engineer in the Trynext repository. Work directly in the existing checkout. Do not claim that an asset, test, deployment, Photoshop editability result, photorealistic result, or storage guarantee exists unless you generate current evidence for the exact build. Preserve historical evidence but label it historical. Never convert a candidate result into an accepted result by changing only a status field.

PRIMARY OUTCOME
Deliver an implementation-ready, testable mockup pipeline with:
1. one authoritative surface matrix;
2. real PSD/PSB Smart Object acceptance evidence;
3. explicit role/material/geometry contracts;
4. shared browser/API compositor math;
5. true projective mapping and displacement where required;
6. robust Design Studio UX;
7. secure, durable storage and bounded performance;
8. a release orchestrator with fail-closed gates.

REPOSITORY FACTS TO VERIFY FIRST
Inspect these paths before editing:
- dist-mockups/staging/smart-v10-v3/manifest.json
- dist-mockups/staging/smart-v10-v3/masters/
- dist-mockups/staging/smart-v10-v3/previews/
- dist-mockups/staging/smart-v10-v3/proof-previews/
- dist-mockups/staging/smart-v10-v3/sources/
- artifacts/trynex-storefront/public/mockups/psd-master-v10/runtime-roles/
- scripts/validate-mockup-matrix.mjs
- scripts/check_generated_mockup_artifacts.py
- scripts/audit_mockup_assets.py
- tools/build-smartobject-mockups.mjs
- tools/build-smartobject-runtime-roles.mjs
- artifacts/api-server/src/routes/mockupRender.ts
- artifacts/api-server/src/routes/mockups.ts
- artifacts/api-server/src/lib/mockupContract.ts
- artifacts/api-server/src/lib/psdMasterParser.ts
- artifacts/trynex-storefront/src/pages/design-studio/composer.ts
- artifacts/trynex-storefront/src/pages/design-studio/server-mockup-render.ts
- artifacts/trynex-storefront/src/pages/studio/DesignStudioV2.tsx
- artifacts/trynex-storefront/src/pages/studio/LiveCompositorPreview.tsx
- artifacts/trynex-storefront/src/pages/design-studio/ProductViewer3D.tsx
- artifacts/trynex-storefront/src/context/CartContext.tsx
- artifacts/api-server/src/routes/orders.ts
- render.yaml
- wrangler.toml

NON-NEGOTIABLE TRUTH RULES
- Current evidence describes 188 active v10.3 surfaces and older docs describe 202 v4 surfaces. Decide which contract is authoritative before implementation. Default to 188 unless product requirements prove 202 is required.
- `8BPS`, custom metadata, and a PSD/PSB extension do not prove Photoshop Smart Object editability.
- Builder-generated proof artwork is not customer-ready source. Release masters must be clean or remain candidate-only.
- A runtime PNG role is not a PSD/PSB source of truth.
- `warp` metadata is not a perspective transform. Do not claim perspective until output tests prove it.
- A grayscale shadow/highlight overlay is not a displacement/material pipeline.
- Structural file-count/dimension/checksum passes are not visual approval.
- Missing/unavailable evidence is BLOCKED, never PASS by omission.

PHASE A — BASELINE AND RECONCILIATION
1. Run repository-relative inventory commands. Remove hard-coded /home/ubuntu/trynext-lifestyle and other checkout-specific paths from validators.
2. Fix `check_generated_mockup_artifacts.py` so missing roots fail nonzero and it scans staging masters, proof previews, sources, and active runtime roles.
3. Make normalization and all builders fail nonzero on any error.
4. Decide 188 vs 202. Update manifests, validators, resolver, docs, and package scripts so only one contract is current. Mark all others SUPERSEDED.
5. Separate `candidate`, `structurally_verified`, `visually_verified`, `accepted`, `quarantined`, and `rejected`. Reject any accepted release containing candidate surfaces.
6. Add a single release command, for example `pnpm mockups:release --release-id <id>`, that runs all gates in order and fails closed.

PHASE B — SOURCE AND ROLE CONTRACT
1. Extend the manifest with stable surface ID, family/color/view, release ID, provenance kind, master checksum, Smart Object record, portable link/payload record, normalized geometry, source/destination corners, transform mode, displacement/material references, role AssetRefs, blend modes, and approvals.
2. Add a machine-readable report for every surface. Report missing paths, dimensions, MIME, alpha convention, checksum, provenance, and approval.
3. Require roles: studioBackground, base, productAlpha, protected, shadow, highlight, printMask, plus displacement/material when the surface requires them.
4. Validate role dimensions, PNG signature, sRGB, alpha semantics, checksum, print-mask containment, protected-detail coverage, and non-empty meaningful pixels. Do not use only “has some alpha” as semantic validation.
5. Add a deterministic placeholder scan for TRY NEX, ARTWORK HERE, PROOF, checkerboard, magenta/chroma-key, and equivalent content in masters, Smart Object payloads, previews, proof previews, and roles.
6. Do not label generated sleeve, neck-label, or mug-wrap derivatives as independently photographed. Replace with independent masters or mark them derived and exclude them from photorealistic-source acceptance.

PHASE C — REAL PSD/PSB VERIFICATION
1. Use Photoshop automation if available. If not available, implement the strongest parser-only check possible and label the result structural compatibility, not native editability.
2. For every master, verify format, dimensions, color mode, layer records, exactly one editable Smart Object, portable linked/embedded payload, expected layers, and no absolute workstation links.
3. Run a calibration edit test: replace the Smart Object payload with an asymmetric colored marker/grid, save a temporary copy, reopen it, verify the Smart Object remains editable, verify the composite checksum changes, verify artwork registration, clipping, protected details, shading, and geometry, then discard the temporary copy.
4. Store per-file evidence with input checksum, output checksum, tool/version, timestamp, and pass/fail. Do not mutate release masters during testing.

PHASE D — SHARED COMPOSITOR
1. Define one normalized coordinate model and one transform order: fit/place, flip, rotate around center, projective warp, displacement, print-mask clip, base/material response, shadow/highlight, protected details.
2. Fix Design Studio processed-image replacement so rendered dimensions remain invariant. Use either absolute rendered dimensions or one unambiguous scale convention. Add regression tests for same-size and changed-size replacements.
3. Implement a shared transform module used by browser and API. Use a homography/projective mapping for curved/tapered surfaces. Add displacement-map support and per-surface scale where required.
4. If a surface is genuinely flat, mark `transform: flat` and do not claim perspective.
5. Fix API rotation bounds by rotating into a fixed-size print-zone canvas or recomputing placement after rotation.
6. Make the API resolve roles from a trusted surface ID/release ID. Do not trust arbitrary client role URLs or a client master checksum. Validate all artwork MIME, Base64, dimensions, bytes, and pixel count before image processing.
7. Add browser/API parity fixtures and perceptual comparisons.

PHASE E — FRONTEND UX AND IDENTITY
1. Add upload state idle/reading/decoding/ready/error, progress where available, cancellation or request-token supersession, duplicate-selection suppression, and clear supported-format copy.
2. Add explicit Loading preview, Preview unavailable — Retry, and stale previous preview states. Implement a real retry action. Do not say retrying unless a retry is scheduled.
3. Add a 2D fallback, loading skeleton, retry, and error boundary around 3D/WebGL asset failures.
4. Preserve storeProductId, variantId, and variantName from catalog/product detail through studio, cart, checkout, and order metadata. If studio designs intentionally become new custom products, show that explicitly.
5. Anchor mobile floating controls to the dynamic sticky purchase-bar height plus safe-area inset. Test 390x844 and short viewports.

PHASE F — STORAGE, PERFORMANCE, SECURITY
1. Require durable R2/S3/object storage in production. Fail startup or release checks if production would use local filesystem storage.
2. Keep PSD/PSB masters and original customer artwork private. Use immutable, versioned, content-addressed keys. Record checksum/MIME/dimensions and retention class.
3. Serve immutable runtime roles through versioned CDN paths. Add bounded TTL caches for role data and manifest promises. Invalidate rejected promises and provide retry.
4. Add render cache only if privacy permits. Key by release ID, surface/role checksums, artwork checksum, placement/effects, renderer version, and material/displacement version.
5. Add strict 400/413/401/403 negative tests for malformed data URLs, oversize images, role spoofing, unauthorized private objects, missing roles, bad checksums, and retired paths.
6. Add deployment parity checks for Cloudflare Pages and Render: release/build ID, manifest, one decodable asset per family/view, full bundle and service-worker scan for retired paths, and durable object retrieval after restart/second instance.

PHASE G — TEST MATRIX AND RELEASE EVIDENCE
Implement automated tests for:
- matrix count and contract consistency;
- missing-root and zero-file validator failures;
- PSD/PSB layer/Smart Object structure;
- calibration Smart Object edit/re-render;
- placeholder scan;
- role dimensions/checksums/semantic alpha/luminance;
- print-mask containment and protected-detail preservation;
- flat, projective, and displacement renders;
- rotation, contain, cover, opacity, flips, and boundary placement;
- browser/API parity;
- same-size processed-image replacement scale invariant;
- upload progress/concurrency/supersession;
- failed first render and actual retry;
- 3D failure to visible 2D fallback;
- catalog variant handoff through order payload;
- mobile sticky purchase-bar overlap;
- malformed MIME/Base64, image limits, auth, role spoofing, and storage failures;
- Pages/Render deployment parity and durable storage.

Generate for the exact release:
- manifest and per-surface JSON report;
- master/role checksum report;
- placeholder report;
- Smart Object evidence report;
- golden render images or hashes;
- browser screenshots and contact sheets;
- perceptual diff report;
- deployment/storage probe report;
- final release decision with blockers and named approvals.

STOP/GO POLICY
STOP if any source root is missing, any checker silently scans zero files, the matrix is ambiguous, any accepted surface is candidate, placeholder content is found, Smart Object editability is claimed without evidence, perspective/displacement is claimed without output proof, visual/browser parity is absent, production local storage is possible, or deployment IDs/assets disagree.

LIMITED DEMO GO is allowed only if UI/docs explicitly say candidate browser-layer preview and disclaim native Photoshop editability, photorealistic fidelity, true perspective, production print geometry, and complete provenance.

FULL PRODUCTION GO requires every gate and evidence artifact to pass for the exact promoted release. Do not substitute historical docs for current evidence.

DELIVERY
- Modify only the necessary repository files.
- Add or update package scripts so the process is reproducible from a clean checkout.
- Add tests and run them. If a dependency such as Vitest is missing, install/declare it or report the exact blocker; do not report tests as passed.
- Write a final implementation report to `MOCKUP_DEEP_AUDIT_AND_IMPLEMENTATION_PLAN_2026-09-23.md` or update the existing report with actual results.
- At completion, report: files changed, commands run, tests passed/failed, release ID, matrix count, current release state, unresolved blockers, and whether the result is demo-only, structurally verified, or full production GO.
```

---

## 14. References and Evidence Index

This report is synthesized exclusively from the supplied repository audit results and cited local evidence. Local paths are included so an engineer can inspect the exact source of each conclusion.

### Active source and asset evidence

* [1] `dist-mockups/staging/smart-v10-v3/manifest.json` — active staging manifest, counts, provenance, candidate state, geometry, and Smart Object metadata.
* [2] `dist-mockups/staging/smart-v10-v3/masters/` — staged PSD/PSB masters.
* [3] `dist-mockups/staging/smart-v10-v3/previews/` and `proof-previews/` — generated preview and proof artifacts.
* [4] `artifacts/trynex-storefront/public/mockups/psd-master-v10/runtime-roles/manifest.json` — active public runtime manifest.
* [5] `artifacts/trynex-storefront/public/mockups/psd-master-v10/runtime-roles/` — active runtime role PNGs.

### Builders, validators, and historical documents

* [6] `tools/build-smartobject-mockups.mjs` — master builder, proof artwork, generated derivatives, metadata, and warp declarations.
* [7] `tools/build-smartobject-runtime-roles.mjs` — runtime role generation and release status behavior.
* [8] `scripts/validate-mockup-matrix.mjs` — active 188-surface and role validator.
* [9] `scripts/check_generated_mockup_artifacts.py` — generated-artifact checker with the hard-coded absent path described in the audit.
* [10] `scripts/audit_mockup_assets.py` — limited role audit.
* [11] `docs/FULL_MOCKUP_MATRIX_INVENTORY_2026-08-17.json` and `docs/CANONICAL_MOCKUP_VALIDATION_2026-08-17.json` — older 202-surface Smart v4 inventory and validation.
* [12] `docs/MOCKUP_REFERENCE_FINDINGS_2026-08-17.md` and `docs/PHASE4_FINAL_MOCKUP_CATALOG_REGRESSION_2026-08-17.md` — historical checkerboard, source-kit, and incomplete-state findings.
* [13] `docs/APPAREL_V5_VISUAL_INSPECTION_2026-08-18.md` — historical visual inspection reporting low texture/luminance variation and non-final apparel views.
* [14] `docs/TRYNEXT_RELEASE_STATUS.md` and `docs/PARALLEL_RELEASE_VERIFICATION_2026-08-18.md` — mixed-scope release status and structural-versus-visual distinction.

### API and storefront implementation evidence

* [15] `artifacts/api-server/src/lib/mockupContract.ts` — current role, checksum, geometry, and blend-mode contract.
* [16] `artifacts/api-server/src/lib/psdMasterParser.ts` — PSD/PSB ingestion parser path.
* [17] `artifacts/api-server/src/routes/mockups.ts` — admin ingestion and public catalog behavior.
* [18] `artifacts/api-server/src/routes/mockupRender.ts` — Sharp API rendering behavior and limits.
* [19] `artifacts/trynex-storefront/src/pages/design-studio/composer.ts` — browser compositor, role blending, and strip curvature.
* [20] `artifacts/trynex-storefront/src/pages/design-studio/server-mockup-render.ts` — browser-to-API render adapter and caches.
* [21] `artifacts/trynex-storefront/src/pages/studio/DesignStudioV2.tsx` — upload, replacement, product switching, cart handoff, and variant-loss path.
* [22] `artifacts/trynex-storefront/src/pages/studio/LiveCompositorPreview.tsx` — loading, stale-frame, and retry-state behavior.
* [23] `artifacts/trynex-storefront/src/pages/design-studio/ProductViewer3D.tsx` — 3D failure and fallback behavior.
* [24] `artifacts/trynex-storefront/src/context/CartContext.tsx`, `artifacts/trynex-storefront/src/pages/ProductDetail.tsx`, and `artifacts/api-server/src/routes/orders.ts` — catalog variant and studio order identity behavior.
* [25] `artifacts/api-server/src/lib/objectStorage.ts`, `artifacts/api-server/src/routes/storage.ts`, `render.yaml`, and `wrangler.toml` — object storage and deployment configuration.

### Tests and release automation

* [26] `artifacts/api-server/src/routes/mockupRender.test.ts`, `artifacts/api-server/src/routes/mockups.test.ts`, and `artifacts/trynex-storefront/src/pages/design-studio/composer.contract.test.ts` — focused contract and happy-path tests.
* [27] `.github/workflows/active-app-verification.yml` — current CI coverage and its omission of browser visual/perceptual gates.
* [28] `package.json`, `scripts/package.json`, `docs/superpowers/specs/2026-09-01-six-family-psd-smart-mockup-design.md`, and `docs/superpowers/plans/2026-09-03-mockup-rebuild-implementation.md` — package-script and documentation mismatch.

[1]: file:///home/ubuntu/work/New-Trynext/dist-mockups/staging/smart-v10-v3/manifest.json "Active staging manifest"
[2]: file:///home/ubuntu/work/New-Trynext/dist-mockups/staging/smart-v10-v3/masters/ "Staged PSD and PSB masters"
[3]: file:///home/ubuntu/work/New-Trynext/dist-mockups/staging/smart-v10-v3/previews/ "Staged previews and proof previews"
[4]: file:///home/ubuntu/work/New-Trynext/artifacts/trynex-storefront/public/mockups/psd-master-v10/runtime-roles/manifest.json "Active public runtime manifest"
[5]: file:///home/ubuntu/work/New-Trynext/artifacts/trynex-storefront/public/mockups/psd-master-v10/runtime-roles/ "Active runtime role assets"
[6]: file:///home/ubuntu/work/New-Trynext/tools/build-smartobject-mockups.mjs "Smart Object mockup builder"
[7]: file:///home/ubuntu/work/New-Trynext/tools/build-smartobject-runtime-roles.mjs "Runtime role builder"
[8]: file:///home/ubuntu/work/New-Trynext/scripts/validate-mockup-matrix.mjs "Active mockup matrix validator"
[9]: file:///home/ubuntu/work/New-Trynext/scripts/check_generated_mockup_artifacts.py "Generated-artifact checker"
[10]: file:///home/ubuntu/work/New-Trynext/scripts/audit_mockup_assets.py "Mockup asset audit"
[11]: file:///home/ubuntu/work/New-Trynext/docs/FULL_MOCKUP_MATRIX_INVENTORY_2026-08-17.json "Historical 202-surface inventory"
[12]: file:///home/ubuntu/work/New-Trynext/docs/MOCKUP_REFERENCE_FINDINGS_2026-08-17.md "Historical reference findings"
[13]: file:///home/ubuntu/work/New-Trynext/docs/APPAREL_V5_VISUAL_INSPECTION_2026-08-18.md "Historical visual inspection"
[14]: file:///home/ubuntu/work/New-Trynext/docs/TRYNEXT_RELEASE_STATUS.md "Historical release status"
[15]: file:///home/ubuntu/work/New-Trynext/artifacts/api-server/src/lib/mockupContract.ts "Mockup API contract"
[16]: file:///home/ubuntu/work/New-Trynext/artifacts/api-server/src/lib/psdMasterParser.ts "PSD and PSB parser"
[17]: file:///home/ubuntu/work/New-Trynext/artifacts/api-server/src/routes/mockups.ts "Mockup catalog and ingestion routes"
[18]: file:///home/ubuntu/work/New-Trynext/artifacts/api-server/src/routes/mockupRender.ts "Mockup render route"
[19]: file:///home/ubuntu/work/New-Trynext/artifacts/trynex-storefront/src/pages/design-studio/composer.ts "Browser compositor"
[20]: file:///home/ubuntu/work/New-Trynext/artifacts/trynex-storefront/src/pages/design-studio/server-mockup-render.ts "Server render adapter"
[21]: file:///home/ubuntu/work/New-Trynext/artifacts/trynex-storefront/src/pages/studio/DesignStudioV2.tsx "Design Studio implementation"
[22]: file:///home/ubuntu/work/New-Trynext/artifacts/trynex-storefront/src/pages/studio/LiveCompositorPreview.tsx "Live preview implementation"
[23]: file:///home/ubuntu/work/New-Trynext/artifacts/trynex-storefront/src/pages/design-studio/ProductViewer3D.tsx "3D viewer implementation"
[24]: file:///home/ubuntu/work/New-Trynext/artifacts/api-server/src/routes/orders.ts "Order handling"
[25]: file:///home/ubuntu/work/New-Trynext/artifacts/api-server/src/lib/objectStorage.ts "Object storage implementation"
[26]: file:///home/ubuntu/work/New-Trynext/artifacts/api-server/src/routes/mockupRender.test.ts "Mockup render tests"
[27]: file:///home/ubuntu/work/New-Trynext/.github/workflows/active-app-verification.yml "Active application verification workflow"
[28]: file:///home/ubuntu/work/New-Trynext/package.json "Repository package scripts"

---

**Bottom line:** the next engineering milestone is not to add another preview effect. It is to establish a single truthful release contract, verify actual Smart Object behavior, implement shared projective/material geometry, repair the customer lifecycle, and make visual/deployment/storage evidence mandatory. Until then, the system should be described as a candidate Smart v10.3 browser/runtime mockup pipeline rather than a full-stack photorealistic mockup product.
