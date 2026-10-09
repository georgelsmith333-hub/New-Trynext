import { describe, it, expect } from "vitest";
import { PRODUCTS } from "../design-studio/mockups";
import { getSwitchPrintZone, planProductSwitch } from "./productSwitch";

const product = (category: string) => PRODUCTS.find((p) => p.category === category)!;
const tee = product("tshirt");
const hoodie = product("hoodie");
const mug = product("mug");
const cap = product("cap");

const layer = (id: string, face: "front" | "back" | "left-sleeve", t: Partial<{ x: number; y: number; scale: number; scaleX: number; scaleY: number }> = {}) => ({
  id, face, transform: { x: 100, y: -50, scale: 0.5, ...t },
});

describe("planProductSwitch", () => {
  it("keeps the colour when the new product has it, otherwise uses its first colour", () => {
    const same = planProductSwitch({ from: tee, fromColor: tee.colors[0], fromMugMode: "side1", to: hoodie, layers: [] });
    const has = hoodie.colors.find((c) => c.hex.toLowerCase() === tee.colors[0].hex.toLowerCase());
    expect(same.color).toBe(has ?? hoodie.colors[0]);
    const unknown = planProductSwitch({ from: tee, fromColor: { hex: "#123456" }, fromMugMode: "side1", to: hoodie, layers: [] });
    expect(unknown.color).toBe(hoodie.colors[0]);
  });

  it("keeps the mug mode only for a mug-to-mug switch", () => {
    expect(planProductSwitch({ from: mug, fromColor: mug.colors[0], fromMugMode: "wrap", to: mug, layers: [] }).mugMode).toBe("wrap");
    expect(planProductSwitch({ from: mug, fromColor: mug.colors[0], fromMugMode: "wrap", to: tee, layers: [] }).mugMode).toBe("side1");
    expect(planProductSwitch({ from: tee, fromColor: tee.colors[0], fromMugMode: "wrap", to: mug, layers: [] }).mugMode).toBe("side1");
  });

  it("moves and scales every layer by the change in print zone, using the smaller ratio for scale", () => {
    const layers = [layer("a", "front", { scaleX: 1.2, scaleY: 0.8 })];
    const plan = planProductSwitch({ from: tee, fromColor: tee.colors[0], fromMugMode: "side1", to: cap, layers });
    const oldZone = getSwitchPrintZone("front", tee, tee.colors[0].hex, "side1");
    const color = plan.color;
    const nextZone = getSwitchPrintZone("front", cap, color.hex, "side1");
    const wr = nextZone.w / oldZone.w;
    const hr = nextZone.h / oldZone.h;
    const fit = Math.min(wr, hr);
    const t = plan.layerTransforms[0].transform;
    expect(t.x).toBeCloseTo(100 * wr, 8);
    expect(t.y).toBeCloseTo(-50 * hr, 8);
    expect(t.scale).toBeCloseTo(0.5 * fit, 8);
    expect(t.scaleX).toBeCloseTo(1.2 * fit, 8);
    expect(t.scaleY).toBeCloseTo(0.8 * fit, 8);
  });

  it("leaves an unset axis unset and keeps other transform fields such as rotation", () => {
    const l = { id: "r", face: "front" as const, transform: { x: 1, y: 1, scale: 1, rotation: 33, opacity: 0.7 } };
    const plan = planProductSwitch({ from: tee, fromColor: tee.colors[0], fromMugMode: "side1", to: hoodie, layers: [l] });
    const t = plan.layerTransforms[0].transform;
    expect(t.scaleX).toBeUndefined();
    expect(t.scaleY).toBeUndefined();
    expect(t.rotation).toBe(33);
    expect(t.opacity).toBe(0.7);
  });

  it("treats a layer without a face as front and refits each face against its own zone", () => {
    const noFace = { id: "n", transform: { x: 10, y: 10, scale: 1 } };
    const back = layer("b", "back");
    const plan = planProductSwitch({ from: tee, fromColor: tee.colors[0], fromMugMode: "side1", to: mug, layers: [noFace, back] });
    const frontPlan = planProductSwitch({ from: tee, fromColor: tee.colors[0], fromMugMode: "side1", to: mug, layers: [{ ...noFace, face: "front" as const }] });
    expect(plan.layerTransforms[0].transform).toEqual(frontPlan.layerTransforms[0].transform);
    expect(plan.layerTransforms).toHaveLength(2);
  });

  it("is an identity refit when switching to the same product and colour", () => {
    const l = layer("same", "front", { scaleX: 1.1 });
    const plan = planProductSwitch({ from: tee, fromColor: tee.colors[0], fromMugMode: "side1", to: tee, layers: [l] });
    const t = plan.layerTransforms[0].transform;
    expect(t.x).toBeCloseTo(100, 8);
    expect(t.scale).toBeCloseTo(0.5, 8);
    expect(t.scaleX).toBeCloseTo(1.1, 8);
  });
});

describe("planProductSwitch remembers artwork size across switches", () => {
  const start = () => ({ id: "L", face: "front" as const, transform: { x: 40, y: -20, scale: 0.62, scaleX: 0.7, scaleY: 0.5, rotation: 12 } });
  type Plan = ReturnType<typeof planProductSwitch<ReturnType<typeof start>["transform"]>>;
  const go = (from: typeof tee, to: typeof tee, layer: ReturnType<typeof start>, memory?: Plan["memory"]) => {
    const plan = planProductSwitch({ from, fromColor: from.colors[0], fromMugMode: "side1", to, layers: [layer], memory });
    return { plan, layer: { ...layer, transform: plan.layerTransforms[0].transform } };
  };

  it("gives the artwork its exact old size back after switching away and back", () => {
    const l0 = start();
    for (const other of [mug, cap, hoodie]) {
      const away = go(tee, other, l0);
      const back = go(other, tee, away.layer, away.plan.memory);
      expect(back.plan.layerTransforms[0].transform).toEqual(l0.transform);
    }
  });

  it("restores through a chain of switches (tee -> mug -> cap -> tee)", () => {
    const l0 = start();
    const a = go(tee, mug, l0);
    const b = go(mug, cap, a.layer, a.plan.memory);
    const c = go(cap, tee, b.layer, b.plan.memory);
    expect(c.plan.layerTransforms[0].transform).toEqual(l0.transform);
  });

  it("restores the size the artwork had on the product it returns to, not a stale one", () => {
    const l0 = start();
    const a = go(tee, mug, l0);
    const b = go(mug, tee, a.layer, a.plan.memory);
    const c = go(tee, mug, b.layer, b.plan.memory);
    // going to the mug again gives the same size as the first time
    expect(c.plan.layerTransforms[0].transform).toEqual(a.plan.layerTransforms[0].transform);
  });

  it("does not overwrite a change the customer made after switching (they keep their edit, refitted)", () => {
    const l0 = start();
    const a = go(tee, mug, l0);
    const edited = { ...a.layer, transform: { ...a.layer.transform, scale: a.layer.transform.scale * 1.5 } };
    const back = go(mug, tee, edited, a.plan.memory);
    expect(back.plan.layerTransforms[0].transform).not.toEqual(l0.transform);
    const plain = go(mug, tee, edited); // no memory at all
    expect(back.plan.layerTransforms[0].transform).toEqual(plain.plan.layerTransforms[0].transform);
  });

  it("does not restore after an undo-style change of the transform", () => {
    const l0 = start();
    const a = go(tee, mug, l0);
    const undone = { ...a.layer, transform: { ...l0.transform } }; // a transform that is not the one the switch applied
    const back = go(mug, tee, undone, a.plan.memory);
    const plain = go(mug, tee, undone);
    expect(back.plan.layerTransforms[0].transform).toEqual(plain.plan.layerTransforms[0].transform);
  });

  it("falls back to the normal refit when the print zone is not the same size as before", () => {
    const l0 = start();
    // Remember a size for the tee that belongs to a different zone size.
    const a = go(tee, mug, l0);
    const memory = { ...a.plan.memory, saved: { L: { ...a.plan.memory.saved.L, [tee.id]: { ...a.plan.memory.saved.L[tee.id], w: 1, h: 1 } } } };
    const back = go(mug, tee, a.layer, memory);
    const plain = go(mug, tee, a.layer);
    expect(back.plan.layerTransforms[0].transform).toEqual(plain.plan.layerTransforms[0].transform);
  });

  it("keeps layers independent and leaves new layers on the normal refit", () => {
    const l0 = start();
    const extra = { id: "N", face: "front" as const, transform: { x: 5, y: 5, scale: 1 } };
    const away = planProductSwitch({ from: tee, fromColor: tee.colors[0], fromMugMode: "side1", to: mug, layers: [l0] });
    const moved = [{ ...l0, transform: away.layerTransforms[0].transform }, extra];
    const back = planProductSwitch({ from: mug, fromColor: mug.colors[0], fromMugMode: "side1", to: tee, layers: moved, memory: away.memory });
    expect(back.layerTransforms[0].transform).toEqual(l0.transform);
    const plain = planProductSwitch({ from: mug, fromColor: mug.colors[0], fromMugMode: "side1", to: tee, layers: [extra] });
    expect(back.layerTransforms[1].transform).toEqual(plain.layerTransforms[0].transform);
  });
});
