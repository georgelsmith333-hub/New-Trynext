import type { Face } from "./types";

/**
 * Which design sides a product has in the Studio. Garments have five (front,
 * back, both sleeves, neck label), caps and bottles have front and back, and a
 * mug has only the front (its Left/Right/Wrap modes are separate). Artwork on
 * any other side is kept in the design but is never drawn, exported or sent
 * with the cart item, so the customer must be told.
 */
const ALL_FACES: Face[] = ["front", "back", "left-sleeve", "right-sleeve", "neck-label"];
const GARMENTS = new Set(["tshirt", "longsleeve", "hoodie"]);
const FRONT_BACK = new Set(["cap", "waterbottle", "watertumbler"]);

export function supportedFaces(category: string): Face[] {
  if (GARMENTS.has(category)) return ALL_FACES;
  if (FRONT_BACK.has(category)) return ["front", "back"];
  return ["front"];
}

const LABELS: Record<Face, string> = {
  front: "front",
  back: "back",
  "left-sleeve": "left sleeve",
  "right-sleeve": "right sleeve",
  "neck-label": "neck label",
};

/** Sides that have artwork but that the product does not have, in a fixed order. */
export function unsupportedArtworkFaces(layers: ReadonlyArray<{ face?: Face }>, category: string): Face[] {
  const supported = new Set(supportedFaces(category));
  const used = new Set(layers.map((layer) => layer.face ?? "front"));
  return ALL_FACES.filter((face) => used.has(face) && !supported.has(face));
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

export function unsupportedArtworkMessage(faces: ReadonlyArray<Face>, productName: string): string | null {
  if (faces.length === 0) return null;
  const sides = joinWords(faces.map((face) => LABELS[face]));
  return `Your design has artwork on the ${sides}, which ${productName} does not have. It is kept in your design, but it will not be shown, exported or ordered with this product. Switch to a product with that side, or delete those layers.`;
}
