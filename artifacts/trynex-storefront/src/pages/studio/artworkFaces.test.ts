import { describe, it, expect } from "vitest";
import { supportedFaces, unsupportedArtworkFaces, unsupportedArtworkMessage } from "./artworkFaces";

describe("supportedFaces", () => {
  it("matches the sides the Studio actually offers", () => {
    for (const c of ["tshirt", "longsleeve", "hoodie"]) expect(supportedFaces(c)).toEqual(["front", "back", "left-sleeve", "right-sleeve", "neck-label"]);
    for (const c of ["cap", "waterbottle", "watertumbler"]) expect(supportedFaces(c)).toEqual(["front", "back"]);
    expect(supportedFaces("mug")).toEqual(["front"]);
    expect(supportedFaces("something-new")).toEqual(["front"]);
  });
});

describe("unsupportedArtworkFaces", () => {
  const layers = [{ face: "front" as const }, { face: "back" as const }, { face: "left-sleeve" as const }, {}, { face: "neck-label" as const }];

  it("is empty when every side with artwork exists on the product", () => {
    expect(unsupportedArtworkFaces(layers, "hoodie")).toEqual([]);
    expect(unsupportedArtworkFaces([{}, { face: "front" }], "mug")).toEqual([]);
  });

  it("lists sides the product lacks, once each and in a fixed order", () => {
    expect(unsupportedArtworkFaces(layers, "mug")).toEqual(["back", "left-sleeve", "neck-label"]);
    expect(unsupportedArtworkFaces(layers, "cap")).toEqual(["left-sleeve", "neck-label"]);
    expect(unsupportedArtworkFaces([{ face: "back" }, { face: "back" }], "mug")).toEqual(["back"]);
  });

  it("treats a layer with no face as front", () => {
    expect(unsupportedArtworkFaces([{}], "mug")).toEqual([]);
  });
});

describe("unsupportedArtworkMessage", () => {
  it("returns nothing when there is nothing to say", () => {
    expect(unsupportedArtworkMessage([], "Mug")).toBeNull();
  });

  it("names the sides and the product, and says the artwork is kept but not ordered", () => {
    const one = unsupportedArtworkMessage(["back"], "Classic Mug")!;
    expect(one).toContain("artwork on the back");
    expect(one).toContain("Classic Mug does not have");
    expect(one).toMatch(/kept in your design/);
    expect(one).toMatch(/will not be shown, exported or ordered/);
    const many = unsupportedArtworkMessage(["back", "left-sleeve", "neck-label"], "Classic Mug")!;
    expect(many).toContain("back, left sleeve and neck label");
  });
});
