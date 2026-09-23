import type {
  SmartMockupCategory,
  SmartMockupFace,
  SmartMockupRuntimeRoles,
} from "./smart-mockup-manifest";

export const SMART_V10_RUNTIME_ROOT = "/mockups/psd-master-v10/runtime-roles";
export const SMART_V10_RELEASE_VERSION = "smart-v10.3" as const;

/**
 * These are the color folders emitted by the reviewed v10.3 source-kit
 * package. Long Sleeve and Hoodie intentionally use the product-facing
 * vocabulary rather than legacy aliases.
 */
export const SMART_V10_COLORS: Readonly<Record<SmartMockupCategory, readonly string[]>> = {
  tshirt: ["white", "black", "navy", "maroon", "olive", "sky-blue", "grey", "red"],
  longsleeve: ["white", "black", "charcoal", "heather-grey", "navy", "royal-blue", "forest-green", "burgundy", "red", "sand"],
  hoodie: ["white", "black", "charcoal", "heather-grey", "navy", "royal-blue", "forest-green", "burgundy", "red", "sand"],
  mug: ["white", "black", "navy", "red", "green", "purple", "sky-blue", "pink", "maroon", "orange"],
  cap: ["white", "black", "navy", "maroon", "olive", "red", "grey", "forest"],
  waterbottle: ["white"],
};

export const SMART_V10_VIEWS: Readonly<Record<SmartMockupCategory, readonly SmartMockupFace[]>> = {
  tshirt: ["front", "back", "left-sleeve", "right-sleeve", "neck-label"],
  longsleeve: ["front", "back", "left-sleeve", "right-sleeve", "neck-label"],
  hoodie: ["front", "back", "left-sleeve", "right-sleeve", "neck-label"],
  mug: ["front", "back", "wrap"],
  cap: ["front", "back"],
  waterbottle: ["front", "back"],
};

export const SMART_V10_SURFACE_COUNT = Object.entries(SMART_V10_COLORS).reduce(
  (count, [category, colors]) => count + colors.length * SMART_V10_VIEWS[category as SmartMockupCategory].length,
  0,
);

/** Resolve the exact v10.3 color folder for a source-kit color slug. */
export function getSmartV10ColorSlug(
  category: SmartMockupCategory,
  sourceKitSlug: string,
): string | undefined {
  return SMART_V10_COLORS[category].includes(sourceKitSlug) ? sourceKitSlug : undefined;
}

export function getSmartV10SurfaceKey(
  category: SmartMockupCategory,
  colorSlug: string,
  face: SmartMockupFace,
): string {
  return `${category}:${colorSlug}:${face}`;
}

/**
 * Real displacement-map generation exists for every color of the
 * authentic-preserved front/back views of the flat-apparel families —
 * matches tools/build-displacement-maps.mjs's FLAT_APPAREL_FAMILIES and
 * DISPLACEMENT_VIEWS exactly. Sleeves/neck-label (synthetic-derivative
 * views, not real photography) and the curved families (mug/cap/
 * waterbottle, a different rendering path entirely) are excluded by
 * construction: their view/category simply isn't in these sets, not via a
 * separate allowlist that could drift out of sync with what the build
 * script actually generated.
 */
const DISPLACEMENT_FAMILIES: ReadonlySet<SmartMockupCategory> = new Set(["tshirt", "longsleeve", "hoodie"]);
const DISPLACEMENT_VIEWS: ReadonlySet<SmartMockupFace> = new Set(["front", "back"]);

export function getSmartV10RuntimeRoles(
  category: SmartMockupCategory,
  colorSlug: string,
  face: SmartMockupFace,
): SmartMockupRuntimeRoles {
  const prefix = `${SMART_V10_RUNTIME_ROOT}/${category}/${colorSlug}/${face}`;
  const roles: SmartMockupRuntimeRoles = {
    studioBackground: `${prefix}-studioBackground.png`,
    base: `${prefix}-base.png`,
    shadow: `${prefix}-shadow.png`,
    protected: `${prefix}-protected.png`,
    highlight: `${prefix}-highlight.png`,
    printMask: `${prefix}-print-mask.png`,
  };
  if (DISPLACEMENT_FAMILIES.has(category) && DISPLACEMENT_VIEWS.has(face)) {
    roles.displacement = `${SMART_V10_RUNTIME_ROOT}/${category}/_shared/${face}-displacement.png`;
  }
  return roles;
}