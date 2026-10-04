import type { Face, MugMode } from "./types";

/**
 * Decides what a saved Design Studio draft may restore. A draft is a snapshot of
 * one product/colour/size/face; applying it blindly can attach a stale colour or
 * linked store product (and its price and id) to a different product the
 * customer just opened from a link. Artwork layers are always restorable.
 */

export interface RestoreColor { name: string; hex: string }
export interface RestoreProduct { id: string; category: string; colors: RestoreColor[] }
export interface LinkedStoreProductSnapshot { id: number; name: string; price: number }

export interface DraftRestoreContext<P extends RestoreProduct> {
  /** The product the studio is showing right now. */
  currentProduct: P;
  /** Looks up a studio product by saved id or category. */
  resolveProduct: (savedId: string) => P | undefined;
  /** The page link names a product or a store product, so the link wins. */
  linkOwnsVariant: boolean;
}

export interface DraftRestorePlan<P extends RestoreProduct> {
  product?: P;
  color?: RestoreColor;
  size?: string;
  face?: Face;
  mugMode?: MugMode;
  linkedStoreProduct?: LinkedStoreProductSnapshot;
  layers?: unknown[];
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const FACES: Face[] = ["front", "back", "left-sleeve", "right-sleeve", "neck-label"];
const MUG_MODES: MugMode[] = ["side1", "side2", "wrap"];
const TWO_FACE_CATEGORIES = new Set(["mug", "cap", "waterbottle", "watertumbler"]);

function sameHex(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function planDraftRestore<P extends RestoreProduct>(draft: any, ctx: DraftRestoreContext<P>): DraftRestorePlan<P> {
  const plan: DraftRestorePlan<P> = {};
  if (!draft || typeof draft !== "object") return plan;

  if (Array.isArray(draft.layers) && draft.layers.length > 0) plan.layers = draft.layers;

  // A product link owns the variant: only the artwork comes from the draft.
  if (ctx.linkOwnsVariant) return plan;

  const draftProduct = typeof draft.productId === "string" ? ctx.resolveProduct(draft.productId) : undefined;
  const product = draftProduct ?? ctx.currentProduct;
  if (draftProduct) plan.product = draftProduct;

  const savedHex = typeof draft.color?.hex === "string" ? draft.color.hex : null;
  const matchedColor = savedHex ? product.colors.find((color) => sameHex(color.hex, savedHex)) : undefined;
  if (matchedColor) plan.color = matchedColor;
  // The product changed but the saved colour does not exist on it: use its first colour.
  else if (draftProduct && draftProduct.id !== ctx.currentProduct.id) plan.color = draftProduct.colors[0];

  if (typeof draft.size === "string" && SIZES.includes(draft.size)) plan.size = draft.size;

  if (typeof draft.activeFace === "string" && FACES.includes(draft.activeFace as Face)) {
    const face = draft.activeFace as Face;
    if (!TWO_FACE_CATEGORIES.has(product.category) || face === "front" || face === "back") plan.face = face;
  }

  if (product.category === "mug" && typeof draft.mugMode === "string" && MUG_MODES.includes(draft.mugMode as MugMode)) {
    plan.mugMode = draft.mugMode as MugMode;
  }

  const linkedId = Number(draft.linkedStoreProductId);
  if (Number.isFinite(linkedId) && linkedId > 0 && typeof draft.linkedStoreProductName === "string") {
    const price = Number(draft.linkedStoreProductPrice);
    if (Number.isFinite(price) && price >= 0) {
      plan.linkedStoreProduct = { id: linkedId, name: draft.linkedStoreProductName, price };
    }
  }

  return plan;
}

/** Picks the more recently saved of two drafts so an older copy never overwrites a newer one. */
export function pickNewestDraft<T extends { savedAt?: unknown }>(cloud: T | null | undefined, local: T | null | undefined): T | null {
  const time = (draft: T | null | undefined) => (draft && typeof draft.savedAt === "number" ? draft.savedAt : 0);
  if (cloud && local) return time(local) >= time(cloud) ? local : cloud;
  return local ?? cloud ?? null;
}
