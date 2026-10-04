import { describe, it, expect } from "vitest";
import { fallbackForFailedImage } from "./image-fallback";
import { PRODUCT_IMAGE_PLACEHOLDER, WATER_BOTTLE_PHOTO_FRONT } from "./legacy-mockup-url";

describe("fallbackForFailedImage", () => {
  it("tries the full-size original when a generated thumbnail is missing", () => {
    expect(fallbackForFailedImage("/assets/products/optimized/bottle_matte.webp", 0)).toBe("/assets/products/bottle_matte.png");
    expect(fallbackForFailedImage("http://localhost:5173/assets/products/optimized/bottle_matte.webp", 0)).toBe("/assets/products/bottle_matte.png");
  });

  it("then gives up and uses the placeholder", () => {
    expect(fallbackForFailedImage("/assets/products/bottle_matte.png", 0)).toBe(PRODUCT_IMAGE_PLACEHOLDER);
    expect(fallbackForFailedImage("/assets/products/optimized/bottle_matte.webp", 1)).toBe(PRODUCT_IMAGE_PLACEHOLDER);
  });

  it("repairs a retired mockup URL with the approved photo", () => {
    expect(fallbackForFailedImage("/mockups/source-kit-v3/waterbottle/white/front.png", 0)).toBe(WATER_BOTTLE_PHOTO_FRONT);
  });

  it("falls back to the placeholder for any other failed image", () => {
    expect(fallbackForFailedImage("https://cdn.example.invalid/missing.jpg", 0)).toBe(PRODUCT_IMAGE_PLACEHOLDER);
    expect(fallbackForFailedImage("/mockups/psd-master-v10/runtime-roles/tshirt/white/front-base.png", 0)).toBe(PRODUCT_IMAGE_PLACEHOLDER);
  });

  it("never loops: a failing placeholder, an exhausted attempt count, and non-network images are left alone", () => {
    expect(fallbackForFailedImage(PRODUCT_IMAGE_PLACEHOLDER, 0)).toBeUndefined();
    expect(fallbackForFailedImage("/assets/products/x.png", 2)).toBeUndefined();
    expect(fallbackForFailedImage("data:image/png;base64,AAAA", 0)).toBeUndefined();
    expect(fallbackForFailedImage("blob:https://x.invalid/abc", 0)).toBeUndefined();
    expect(fallbackForFailedImage("", 0)).toBeUndefined();
  });
});
