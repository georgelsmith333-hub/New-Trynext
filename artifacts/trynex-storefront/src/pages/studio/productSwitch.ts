import {
  getZonePZ, MUG_PZ, MUG_WRAP_BACK_PZ, MUG_SIDE_PZ, MUG_SIDE_BACK_PZ,
  type DesignProduct,
} from "../design-studio/mockups";
import type { Face, MugMode } from "./types";

/**
 * One plan for switching the product in the Studio, shared by the quick
 * switcher and the product picker so both refit artwork identically: the
 * colour is kept when the new product has it, the mug mode only survives a
 * mug-to-mug switch, and every layer is moved and scaled by how the target
 * print zone differs from the current one.
 */

type Zone = { x: number; y: number; w: number; h: number };

export function getSwitchPrintZone(face: Face, product: DesignProduct, colorHex: string, mugMode: MugMode): Zone {
  if (product.category === "mug") {
    if (mugMode === "wrap") return face === "back" ? MUG_WRAP_BACK_PZ : MUG_PZ;
    return face === "back" ? MUG_SIDE_BACK_PZ : MUG_SIDE_PZ;
  }
  return getZonePZ(face, product, colorHex);
}

export interface SwitchTransform { x: number; y: number; scale: number; scaleX?: number; scaleY?: number }

export interface SwitchLayer<X extends SwitchTransform = SwitchTransform> {
  id: string;
  face?: Face;
  transform: X;
}

/**
 * What the Studio remembers so switching to another product and back gives the
 * artwork its old size again. `saved` holds each layer's transform as it was
 * when it left a product (with the size of that product's print zone);
 * `applied` holds the transform the last switch gave the layer. A saved size is
 * only reused while the layer still has exactly the `applied` transform, so
 * anything the customer changed since (or an undo) is never overwritten.
 */
export interface SwitchMemory<X extends SwitchTransform = SwitchTransform> {
  saved: Record<string, Record<string, { transform: X; w: number; h: number }>>;
  applied: Record<string, { productId: string; transform: X }>;
}

export const EMPTY_SWITCH_MEMORY: SwitchMemory<never> = { saved: {}, applied: {} };

export interface ProductSwitchPlan<X extends SwitchTransform> {
  color: DesignProduct["colors"][number];
  mugMode: MugMode;
  layerTransforms: Array<{ id: string; transform: X }>;
  memory: SwitchMemory<X>;
}

const sameTransform = (a: SwitchTransform, b: SwitchTransform): boolean => JSON.stringify(a) === JSON.stringify(b);

export function planProductSwitch<X extends SwitchTransform>(args: {
  from: DesignProduct;
  fromColor: { hex: string };
  fromMugMode: MugMode;
  to: DesignProduct;
  layers: Array<SwitchLayer<X>>;
  memory?: SwitchMemory<X>;
}): ProductSwitchPlan<X> {
  const { from, fromColor, fromMugMode, to, layers } = args;
  const memory: SwitchMemory<X> = {
    saved: { ...(args.memory?.saved ?? {}) },
    applied: { ...(args.memory?.applied ?? {}) },
  };
  const color = to.colors.find((c) => c.hex.toLowerCase() === fromColor.hex.toLowerCase()) ?? to.colors[0];
  const oldMugMode: MugMode = from.category === "mug" ? fromMugMode : "side1";
  const mugMode: MugMode = from.category === "mug" && to.category === "mug" ? fromMugMode : "side1";
  const layerTransforms = layers.map((layer) => {
    const face = layer.face ?? "front";
    const oldZone = getSwitchPrintZone(face, from, fromColor.hex, oldMugMode);
    const nextZone = getSwitchPrintZone(face, to, color.hex, mugMode);
    const widthRatio = nextZone.w / Math.max(1, oldZone.w);
    const heightRatio = nextZone.h / Math.max(1, oldZone.h);
    const fitRatio = Math.min(widthRatio, heightRatio);

    // Remember the size this layer has on the product it is leaving.
    memory.saved[layer.id] = { ...(memory.saved[layer.id] ?? {}), [from.id]: { transform: layer.transform, w: oldZone.w, h: oldZone.h } };

    // Coming back to a product the layer was sized on: restore that size, but
    // only if the layer is untouched since the last switch and the print zone
    // is the same size as then (so it still fits exactly as it did).
    const remembered = memory.saved[layer.id]?.[to.id];
    const applied = memory.applied[layer.id];
    if (
      remembered && applied
      && applied.productId === from.id
      && sameTransform(applied.transform, layer.transform)
      && remembered.w === nextZone.w && remembered.h === nextZone.h
    ) {
      memory.applied[layer.id] = { productId: to.id, transform: remembered.transform };
      return { id: layer.id, transform: remembered.transform };
    }

    const refit = {
      id: layer.id,
      transform: {
        ...layer.transform,
        x: layer.transform.x * widthRatio,
        y: layer.transform.y * heightRatio,
        scale: layer.transform.scale * fitRatio,
        scaleX: layer.transform.scaleX ? layer.transform.scaleX * fitRatio : undefined,
        scaleY: layer.transform.scaleY ? layer.transform.scaleY * fitRatio : undefined,
      } as X,
    };
    memory.applied[layer.id] = { productId: to.id, transform: refit.transform };
    return refit;
  });
  return { color, mugMode, layerTransforms, memory };
}
