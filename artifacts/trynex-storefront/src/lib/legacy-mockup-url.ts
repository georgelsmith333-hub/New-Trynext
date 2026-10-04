import { SMART_V10_COLORS, SMART_V10_RUNTIME_ROOT, SMART_V10_VIEWS } from "@/pages/design-studio/smart-v10-runtime";
import type { SmartMockupCategory, SmartMockupFace } from "@/pages/design-studio/smart-mockup-manifest";

/**
 * Production answers 410 Gone for every /mockups/ URL outside the reviewed
 * Smart v10.3 folder (functions/mockups/[[path]].ts). Older product records,
 * cached bundles and saved carts can still carry those URLs, which then show as
 * broken images. This module maps a retired URL to the approved v10.3 photo of
 * the same product, colour and face, and falls back to the family's white front
 * (or the placeholder when the family cannot be told).
 */

export const PRODUCT_IMAGE_PLACEHOLDER = "/images/product-placeholder.svg";

const RUNTIME_PREFIX = `${SMART_V10_RUNTIME_ROOT}/`;

/** Approved v10.3 base photo for one product, colour and face. */
export function runtimeBasePath(family: SmartMockupCategory, color: string, face: SmartMockupFace): string {
  return `${SMART_V10_RUNTIME_ROOT}/${family}/${color}/${face}-base.png`;
}

/** The white sublimation bottle photo used wherever the regular bottle product is shown. */
export const WATER_BOTTLE_PHOTO_FRONT = runtimeBasePath("waterbottle", "white", "front");
export const WATER_BOTTLE_PHOTO_BACK = runtimeBasePath("waterbottle", "white", "back");

// Order matters: "long sleeve" must win over "sleeve"/"tee", "bottle" over "cap" (as in "cap on bottle").
const FAMILY_PATTERNS: Array<[RegExp, SmartMockupCategory]> = [
  [/water[-_ ]?bottle|bottle|tumbler|flask/, "waterbottle"],
  [/long[-_ ]?sleeve/, "longsleeve"],
  [/hoodie|sweatshirt/, "hoodie"],
  [/t[-_ ]?shirt|tshirt|\btee\b/, "tshirt"],
  [/\bmug\b|\bcup\b|[-_/]mug[-_.]/, "mug"],
  [/(^|[-_/. ])cap([-_/. ]|$)|\bhat\b/, "cap"],
];

// Old names for colours, per family where the approved folder uses a different word.
const COLOR_WORDS: Array<[RegExp, (family: SmartMockupCategory) => string]> = [
  [/sky[-_ ]?blue|skyblue/, () => "sky-blue"],
  [/royal[-_ ]?blue|royal/, () => "royal-blue"],
  [/forest[-_ ]?green/, (f) => (f === "cap" ? "forest" : "forest-green")],
  [/forest/, (f) => (f === "cap" ? "forest" : "forest-green")],
  [/heather[-_ ]?gr[ae]y|heather/, () => "heather-grey"],
  [/charcoal/, () => "charcoal"],
  [/gr[ae]y/, (f) => (f === "hoodie" || f === "longsleeve" ? "heather-grey" : "grey")],
  [/burgundy/, () => "burgundy"],
  [/maroon/, () => "maroon"],
  [/navy/, () => "navy"],
  [/olive/, () => "olive"],
  [/purple/, () => "purple"],
  [/orange/, () => "orange"],
  [/pink/, () => "pink"],
  [/green/, () => "green"],
  [/sand|cream|beige/, () => "sand"],
  [/black/, () => "black"],
  [/\bred\b|[-_/]red[-_.]/, () => "red"],
  [/white/, () => "white"],
];

/** True for a relative /mockups/ URL that production no longer serves. */
export function isRetiredMockupUrl(url: string): boolean {
  const path = normalisePath(url);
  return path !== null && path.startsWith("/mockups/") && !path.startsWith(RUNTIME_PREFIX);
}

function normalisePath(url: string): string | null {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//")) return null;
  const withoutQuery = trimmed.split(/[?#]/, 1)[0];
  if (withoutQuery.startsWith("/mockups/")) return withoutQuery;
  if (withoutQuery.startsWith("mockups/")) return `/${withoutQuery}`;
  return null;
}

/**
 * Maps a retired /mockups/ URL to its approved equivalent. Returns undefined
 * when the URL is not a retired mockup URL, so callers can leave it alone.
 */
export function modernizeLegacyMockupUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const path = normalisePath(url);
  if (path === null || path.startsWith(RUNTIME_PREFIX)) return undefined;

  const text = path.slice("/mockups/".length).toLowerCase();
  const family = FAMILY_PATTERNS.find(([pattern]) => pattern.test(text))?.[1];
  if (!family) return PRODUCT_IMAGE_PLACEHOLDER;

  const allowedColors = SMART_V10_COLORS[family];
  // The water bottle has exactly one approved colour; never invent others.
  let color = "white";
  if (family !== "waterbottle") {
    // Look at the file name first ("black-hoodie-front"), then the folders.
    const fileName = text.split("/").pop() ?? text;
    for (const scope of [fileName, text]) {
      const hit = COLOR_WORDS.find(([pattern]) => pattern.test(scope));
      if (hit) {
        color = hit[1](family);
        break;
      }
    }
    if (!allowedColors.includes(color)) color = "white";
  }

  const views = SMART_V10_VIEWS[family];
  // Compare whole words only, so "background" is never read as "back".
  const words = `-${text.replace(/[^a-z]+/g, "-")}-`;
  const viewFromText = (["left-sleeve", "right-sleeve", "neck-label", "wrap", "back", "front"] as const).find((view) =>
    words.includes(`-${view}-`),
  );
  const face: SmartMockupFace = viewFromText && views.includes(viewFromText) ? viewFromText : "front";

  return runtimeBasePath(family, color, face);
}
