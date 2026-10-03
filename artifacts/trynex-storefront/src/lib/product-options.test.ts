import { describe, expect, it } from "vitest";
import {
  getCustomerProductColors,
  getCustomerProductImage,
  getCustomerProductVariants,
  isWaterBottleProduct,
} from "./product-options";

describe("customer product options", () => {
  const bottle = {
    name: "Custom Sports Water Bottle",
    slug: "custom-sports-water-bottle",
    imageUrl: "/products/green-bottle.jpg",
    colors: ["Green", "Black"],
    variants: [
      { id: "mug", name: "General Mug", active: true },
      { id: "green", name: "Green Bottle", active: true },
      { id: "white", name: "White 600ml Bottle", active: true },
      { id: "size", name: "600ml", active: true },
      { id: "inactive", name: "Inactive", active: false },
    ],
  };

  it("enforces the white bottle identity, image, and sold color", () => {
    expect(isWaterBottleProduct(bottle)).toBe(true);
    expect(getCustomerProductColors(bottle)).toEqual(["White"]);
    expect(getCustomerProductImage(bottle)).toBe("/mockups/white-waterbottle-photo.png");
  });

  it("filters variants from unrelated product families", () => {
    expect(getCustomerProductVariants(bottle).map((variant) => variant.id)).toEqual(["white", "size"]);
  });

  it("leaves non-bottle catalog options unchanged", () => {
    const mug = { name: "Ceramic Mug", colors: ["White"], variants: bottle.variants, imageUrl: "/mug.jpg" };
    expect(isWaterBottleProduct(mug)).toBe(false);
    expect(getCustomerProductColors(mug)).toEqual(["White"]);
    expect(getCustomerProductVariants(mug)).toHaveLength(4);
    expect(getCustomerProductImage(mug)).toBe("/mug.jpg");
  });
});