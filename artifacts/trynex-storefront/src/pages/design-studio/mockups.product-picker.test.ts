import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getActiveMockupReleaseVersion,
  getProductPickerFallbackSrc,
  getProductPickerPreviewSrc,
  PRODUCTS,
  resolveMockup,
} from "./mockups";
import { isSmartV10SurfaceApproved } from "./smart-v10-runtime";
import type { SmartMockupCategory, SmartMockupFace } from "./smart-mockup-manifest";

const runtimeManifest = JSON.parse(readFileSync(
  new URL("../../../public/mockups/psd-master-v10/runtime-roles/manifest.json", import.meta.url),
  "utf8",
)) as {
  surfaces: Array<{
    family: SmartMockupCategory;
    color: string;
    view: SmartMockupFace;
    reviewStatus: string;
  }>;
};

describe("smart-v10.3 product picker previews", () => {
  it("uses the accepted v10.3 surface for product picker previews", () => {
    const tshirt = PRODUCTS.find((product) => product.id === "tshirt");
    if (!tshirt) throw new Error("fixture requires the T-shirt product");

    expect(getProductPickerPreviewSrc(tshirt)).toBe(
      "/mockups/psd-master-v10/runtime-roles/tshirt/white/front-base.png",
    );
    expect(getProductPickerFallbackSrc(tshirt)).toBeUndefined();
    expect(getActiveMockupReleaseVersion()).toBe("smart-v10.3");
  });

  it("matches the runtime allowlist exactly to every surface reviewStatus", () => {
    expect(runtimeManifest.surfaces).toHaveLength(188);
    expect(runtimeManifest.surfaces.filter((surface) => surface.reviewStatus === "accepted")).toHaveLength(94);
    expect(runtimeManifest.surfaces.filter((surface) => surface.reviewStatus === "candidate")).toHaveLength(94);

    for (const surface of runtimeManifest.surfaces) {
      expect(isSmartV10SurfaceApproved(surface.family, surface.color, surface.view))
        .toBe(surface.reviewStatus === "accepted");
    }
  });

  it("keeps candidate sleeve and mug-wrap surfaces unavailable to customers", () => {
    const tshirt = PRODUCTS.find((product) => product.id === "tshirt");
    const mug = PRODUCTS.find((product) => product.id === "mug");
    if (!tshirt || !mug) throw new Error("fixtures require T-shirt and mug products");

    const sleeve = resolveMockup(tshirt, "#f8f7f4", "left-sleeve");
    const wrap = resolveMockup(mug, "#f5f5f5", "wrap");

    expect(sleeve.runtimeStatus).toBe("disabled");
    expect(sleeve.photoSrc).toBe("");
    expect(sleeve.disabledReason).toContain("not approved for customer rendering");
    expect(wrap.runtimeStatus).toBe("disabled");
    expect(wrap.photoSrc).toBe("");
    expect(wrap.disabledReason).toContain("not approved for customer rendering");
  });

  it("keeps the water-bottle surfaces on hold pending authenticated visual approval", () => {
    const bottle = PRODUCTS.find((product) => product.category === "waterbottle");
    if (!bottle) throw new Error("fixture requires the water-bottle product");

    const resolution = resolveMockup(bottle, bottle.colors[0].hex, "front");

    expect(resolution.runtimeStatus).toBe("disabled");
    expect(resolution.disabledReason).toContain("awaiting authenticated visual approval");
  });

  it("fails closed instead of substituting the white surface for an unknown color", () => {
    const tshirt = PRODUCTS.find((product) => product.id === "tshirt");
    if (!tshirt) throw new Error("fixture requires the T-shirt product");

    const resolution = resolveMockup(tshirt, "#123456");

    expect(resolution.runtimeStatus).toBe("disabled");
    expect(resolution.disabledReason).toContain("No approved tshirt");
    expect(resolution.photoSrc).toBe("");
    expect(resolution.sourceKitKey).toBe("tshirt:unresolved:front");
    expect(resolution.contractErrors).toContain("base and cutout assets are required");
  });
});
