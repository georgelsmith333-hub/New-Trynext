/**
 * Production answers 410 Gone for every /mockups/ URL outside the reviewed
 * Smart v10.3 folder, so the older file names this app used (for example
 * "normalized/tshirt-black-front.png") no longer load. This maps such a name to
 * the approved v10.3 photo of the same product, colour and face.
 *
 * This is a copy of artifacts/trynex-storefront/src/lib/legacy-mockup-url.ts
 * (the mobile app cannot import from the storefront). The storefront tests
 * check that both copies give the same answer for every legacy file.
 */

type Family = "tshirt" | "longsleeve" | "hoodie" | "mug" | "cap" | "waterbottle";
type Face = "front" | "back" | "left-sleeve" | "right-sleeve" | "neck-label" | "wrap";

const ROOT = "/mockups/psd-master-v10/runtime-roles";
const PLACEHOLDER_PATH = "/images/product-placeholder.svg";

const COLORS: Record<Family, readonly string[]> = {
  tshirt: ["white", "black", "navy", "maroon", "olive", "sky-blue", "grey", "red"],
  longsleeve: ["white", "black", "charcoal", "heather-grey", "navy", "royal-blue", "forest-green", "burgundy", "red", "sand"],
  hoodie: ["white", "black", "charcoal", "heather-grey", "navy", "royal-blue", "forest-green", "burgundy", "red", "sand"],
  mug: ["white", "black", "navy", "red", "green", "purple", "sky-blue", "pink", "maroon", "orange"],
  cap: ["white", "black", "navy", "maroon", "olive", "red", "grey", "forest"],
  waterbottle: ["white"],
};

const VIEWS: Record<Family, readonly Face[]> = {
  tshirt: ["front", "back", "left-sleeve", "right-sleeve", "neck-label"],
  longsleeve: ["front", "back", "left-sleeve", "right-sleeve", "neck-label"],
  hoodie: ["front", "back", "left-sleeve", "right-sleeve", "neck-label"],
  mug: ["front", "back", "wrap"],
  cap: ["front", "back"],
  waterbottle: ["front", "back"],
};

const FAMILY_PATTERNS: Array<[RegExp, Family]> = [
  [/water[-_ ]?bottle|bottle|tumbler|flask/, "waterbottle"],
  [/long[-_ ]?sleeve/, "longsleeve"],
  [/hoodie|sweatshirt/, "hoodie"],
  [/t[-_ ]?shirt|tshirt|\btee\b/, "tshirt"],
  [/\bmug\b|\bcup\b|[-_/]mug[-_.]/, "mug"],
  [/(^|[-_/. ])cap([-_/. ]|$)|\bhat\b/, "cap"],
];

const COLOR_WORDS: Array<[RegExp, (family: Family) => string]> = [
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

export const WATER_BOTTLE_PHOTO_PATH = `${ROOT}/waterbottle/white/front-base.png`;

/**
 * Approved v10.3 path for a legacy mockup file name (with or without a leading
 * "/mockups/"). An unrecognisable name returns the shared placeholder path.
 */
export function approvedMockupPath(legacyName: string): string {
  const cleaned = legacyName.split(/[?#]/, 1)[0].replace(/^\/?mockups\//, "").toLowerCase();
  if (cleaned.startsWith("psd-master-v10/runtime-roles/")) return `/mockups/${cleaned}`;

  const family = FAMILY_PATTERNS.find(([pattern]) => pattern.test(cleaned))?.[1];
  if (!family) return PLACEHOLDER_PATH;

  let color = "white";
  if (family !== "waterbottle") {
    const fileName = cleaned.split("/").pop() ?? cleaned;
    for (const scope of [fileName, cleaned]) {
      const hit = COLOR_WORDS.find(([pattern]) => pattern.test(scope));
      if (hit) {
        color = hit[1](family);
        break;
      }
    }
    if (!COLORS[family].includes(color)) color = "white";
  }

  const words = `-${cleaned.replace(/[^a-z]+/g, "-")}-`;
  const viewFromText = (["left-sleeve", "right-sleeve", "neck-label", "wrap", "back", "front"] as const).find((view) =>
    words.includes(`-${view}-`),
  );
  const face: Face = viewFromText && VIEWS[family].includes(viewFromText) ? viewFromText : "front";
  return `${ROOT}/${family}/${color}/${face}-base.png`;
}
