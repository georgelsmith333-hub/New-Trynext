import { describe, it, expect } from "vitest";
import { pickNewestDraft, planDraftRestore, type RestoreProduct } from "./draftRestore";

const hoodie: RestoreProduct = {
  id: "hoodie", category: "hoodie",
  colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Navy", hex: "#1e3a5f" }],
};
const mug: RestoreProduct = {
  id: "mug", category: "mug",
  colors: [{ name: "White", hex: "#ffffff" }, { name: "Red", hex: "#dc2626" }],
};
const products = [hoodie, mug];
const resolveProduct = (id: string) => products.find((p) => p.id === id || p.category === id);

const layers = [{ id: "l1", type: "text" }];
const draft = {
  layers,
  productId: "hoodie",
  color: { name: "Navy", hex: "#1E3A5F" },
  size: "L",
  activeFace: "back",
  mugMode: "wrap",
  linkedStoreProductId: 42,
  linkedStoreProductName: "Hoodie A",
  linkedStoreProductPrice: 1200,
};

describe("planDraftRestore", () => {
  it("restores the whole variant when the page link does not name a product", () => {
    const plan = planDraftRestore(draft, { currentProduct: mug, resolveProduct, linkOwnsVariant: false });
    expect(plan.product).toBe(hoodie);
    expect(plan.color).toEqual({ name: "Navy", hex: "#1e3a5f" }); // canonical colour, hex compared ignoring case
    expect(plan.size).toBe("L");
    expect(plan.face).toBe("back");
    expect(plan.layers).toBe(layers);
    expect(plan.linkedStoreProduct).toEqual({ id: 42, name: "Hoodie A", price: 1200 });
    expect(plan.mugMode).toBeUndefined(); // a hoodie has no mug mode
  });

  it("keeps only the artwork when the link names a product, so a stale variant cannot leak in", () => {
    const plan = planDraftRestore(draft, { currentProduct: mug, resolveProduct, linkOwnsVariant: true });
    expect(plan).toEqual({ layers });
  });

  it("falls back to the product's first colour when the saved colour does not exist on it", () => {
    const plan = planDraftRestore(
      { ...draft, color: { name: "Hot Pink", hex: "#ff69b4" } },
      { currentProduct: mug, resolveProduct, linkOwnsVariant: false },
    );
    expect(plan.product).toBe(hoodie);
    expect(plan.color).toBe(hoodie.colors[0]);
  });

  it("does not change the colour of the current product when the saved colour is unknown", () => {
    const plan = planDraftRestore(
      { layers, productId: "hoodie", color: { name: "Hot Pink", hex: "#ff69b4" } },
      { currentProduct: hoodie, resolveProduct, linkOwnsVariant: false },
    );
    expect(plan.color).toBeUndefined();
  });

  it("validates the colour against the current product when the saved product is unknown", () => {
    const plan = planDraftRestore(
      { layers, productId: "retired-product", color: { name: "Red", hex: "#dc2626" } },
      { currentProduct: mug, resolveProduct, linkOwnsVariant: false },
    );
    expect(plan.product).toBeUndefined();
    expect(plan.color).toBe(mug.colors[1]);
  });

  it("rejects sizes, faces and mug modes the product cannot use", () => {
    const bad = planDraftRestore(
      { layers, productId: "mug", size: "XXXXL", activeFace: "left-sleeve", mugMode: "diagonal" },
      { currentProduct: hoodie, resolveProduct, linkOwnsVariant: false },
    );
    expect(bad.size).toBeUndefined();
    expect(bad.face).toBeUndefined(); // a mug has no sleeves
    expect(bad.mugMode).toBeUndefined();

    const good = planDraftRestore(
      { layers, productId: "mug", size: "M", activeFace: "back", mugMode: "wrap" },
      { currentProduct: hoodie, resolveProduct, linkOwnsVariant: false },
    );
    expect(good.face).toBe("back");
    expect(good.mugMode).toBe("wrap");
  });

  it("drops a linked store product that is malformed", () => {
    for (const bad of [
      { linkedStoreProductId: 0, linkedStoreProductName: "x", linkedStoreProductPrice: 10 },
      { linkedStoreProductId: "abc", linkedStoreProductName: "x", linkedStoreProductPrice: 10 },
      { linkedStoreProductId: 5, linkedStoreProductPrice: 10 },
      { linkedStoreProductId: 5, linkedStoreProductName: "x", linkedStoreProductPrice: "free" },
      { linkedStoreProductId: 5, linkedStoreProductName: "x", linkedStoreProductPrice: -1 },
    ]) {
      const plan = planDraftRestore({ layers, productId: "hoodie", ...bad }, { currentProduct: hoodie, resolveProduct, linkOwnsVariant: false });
      expect(plan.linkedStoreProduct).toBeUndefined();
    }
  });

  it("handles empty or non-object drafts and empty layers", () => {
    expect(planDraftRestore(null, { currentProduct: hoodie, resolveProduct, linkOwnsVariant: false })).toEqual({});
    expect(planDraftRestore("nope", { currentProduct: hoodie, resolveProduct, linkOwnsVariant: false })).toEqual({});
    expect(planDraftRestore({ layers: [] }, { currentProduct: hoodie, resolveProduct, linkOwnsVariant: false }).layers).toBeUndefined();
  });
});

describe("pickNewestDraft", () => {
  it("uses the newer draft, and the local one on a tie", () => {
    const cloud = { savedAt: 200, from: "cloud" };
    const local = { savedAt: 100, from: "local" };
    expect(pickNewestDraft(cloud, local)).toBe(cloud);
    expect(pickNewestDraft(local, cloud)).toBe(cloud);
    expect(pickNewestDraft({ savedAt: 5, from: "cloud" }, { savedAt: 5, from: "local" })?.from).toBe("local");
  });

  it("falls back to whichever draft exists, treating a missing time as oldest", () => {
    const only = { savedAt: 1 };
    expect(pickNewestDraft(only, null)).toBe(only);
    expect(pickNewestDraft(undefined, only)).toBe(only);
    expect(pickNewestDraft(null, null)).toBeNull();
    const undated = { from: "cloud" } as { savedAt?: number; from: string };
    const dated = { savedAt: 1, from: "local" };
    expect(pickNewestDraft(undated, dated)).toBe(dated);
  });
});
