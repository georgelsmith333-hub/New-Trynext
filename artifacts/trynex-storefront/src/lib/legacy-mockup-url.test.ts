import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  PRODUCT_IMAGE_PLACEHOLDER,
  WATER_BOTTLE_PHOTO_BACK,
  WATER_BOTTLE_PHOTO_FRONT,
  isRetiredMockupUrl,
  modernizeLegacyMockupUrl,
  runtimeBasePath,
} from "./legacy-mockup-url";
import { resolveImageUrl } from "./utils";
import { getCustomerProductImage } from "./product-options";
// The mobile app keeps its own copy of the mapping; these tests keep the two in step.
import { approvedMockupPath } from "../../../trynext-mobile/lib/mockup-url";

const SRC = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.resolve(SRC, "../public");
const ROOT = "/mockups/psd-master-v10/runtime-roles";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

describe("approved bottle photos", () => {
  it("point at the reviewed v10.3 folder and exist on disk", () => {
    expect(WATER_BOTTLE_PHOTO_FRONT).toBe(`${ROOT}/waterbottle/white/front-base.png`);
    expect(WATER_BOTTLE_PHOTO_BACK).toBe(`${ROOT}/waterbottle/white/back-base.png`);
    expect(existsSync(path.join(PUBLIC, WATER_BOTTLE_PHOTO_FRONT))).toBe(true);
    expect(existsSync(path.join(PUBLIC, WATER_BOTTLE_PHOTO_BACK))).toBe(true);
  });

  it("is what the storefront shows for a water bottle product", () => {
    expect(getCustomerProductImage({ name: "Custom Water Bottle", imageUrl: "/assets/products/x.png" })).toBe(WATER_BOTTLE_PHOTO_FRONT);
    expect(getCustomerProductImage({ name: "Classic Mug", imageUrl: "/assets/products/mug.png" })).toBe("/assets/products/mug.png");
    // An old record holding a retired URL is repaired on the way out.
    expect(getCustomerProductImage({ name: "Classic Hoodie", imageUrl: "/mockups/black-hoodie-front.png" })).toBe(runtimeBasePath("hoodie", "black", "front"));
  });
});

describe("isRetiredMockupUrl", () => {
  it("flags old mockup URLs and leaves approved and unrelated URLs alone", () => {
    expect(isRetiredMockupUrl("/mockups/black-hoodie-front.png")).toBe(true);
    expect(isRetiredMockupUrl("mockups/source-kit-v3/waterbottle/white/front.png")).toBe(true);
    expect(isRetiredMockupUrl("/mockups/white-waterbottle-photo.png?v=2")).toBe(true);
    expect(isRetiredMockupUrl(`${ROOT}/tshirt/white/front-base.png`)).toBe(false);
    expect(isRetiredMockupUrl("/assets/products/hoodie_abstract.png")).toBe(false);
    expect(isRetiredMockupUrl("https://example.invalid/mockups/black-hoodie-front.png")).toBe(false);
    expect(isRetiredMockupUrl("/api/admin/mockups/3")).toBe(false);
  });
});

describe("modernizeLegacyMockupUrl", () => {
  it("returns undefined for anything that is not a retired mockup URL", () => {
    for (const url of [undefined, null, "", "/assets/products/a.png", `${ROOT}/mug/white/front-base.png`, "https://x.invalid/mockups/a.png"]) {
      expect(modernizeLegacyMockupUrl(url as string | null | undefined)).toBeUndefined();
    }
  });

  it("maps the bottle photos, whatever their old name", () => {
    expect(modernizeLegacyMockupUrl("/mockups/white-waterbottle-photo.png")).toBe(WATER_BOTTLE_PHOTO_FRONT);
    expect(modernizeLegacyMockupUrl("/mockups/source-kit-v3/waterbottle/white/front.png")).toBe(WATER_BOTTLE_PHOTO_FRONT);
    expect(modernizeLegacyMockupUrl("/mockups/source-kit-v3/waterbottle/white/back.png")).toBe(WATER_BOTTLE_PHOTO_BACK);
    // The bottle has one approved colour; a black legacy bottle must not invent another.
    expect(modernizeLegacyMockupUrl("/mockups/black-waterbottle-front.png")).toBe(WATER_BOTTLE_PHOTO_FRONT);
  });

  it("keeps product, colour and face for apparel, mugs and caps", () => {
    expect(modernizeLegacyMockupUrl("/mockups/black-hoodie-front.png")).toBe(runtimeBasePath("hoodie", "black", "front"));
    expect(modernizeLegacyMockupUrl("/mockups/black-tshirt-back-real.png")).toBe(runtimeBasePath("tshirt", "black", "back"));
    expect(modernizeLegacyMockupUrl("/mockups/burgundy-longsleeve-front_2.png")).toBe(runtimeBasePath("longsleeve", "burgundy", "front"));
    expect(modernizeLegacyMockupUrl("/mockups/black-cap-front.png")).toBe(runtimeBasePath("cap", "black", "front"));
    expect(modernizeLegacyMockupUrl("/mockups/black-mug-front.png")).toBe(runtimeBasePath("mug", "black", "front"));
  });

  it("translates old colour words to the folder names that product actually has", () => {
    expect(modernizeLegacyMockupUrl("/mockups/grey-hoodie-front.png")).toBe(runtimeBasePath("hoodie", "heather-grey", "front"));
    expect(modernizeLegacyMockupUrl("/mockups/grey-tshirt-front.png")).toBe(runtimeBasePath("tshirt", "grey", "front"));
    expect(modernizeLegacyMockupUrl("/mockups/forest-cap-front.png")).toBe(runtimeBasePath("cap", "forest", "front"));
    expect(modernizeLegacyMockupUrl("/mockups/forest-hoodie-front.png")).toBe(runtimeBasePath("hoodie", "forest-green", "front"));
    expect(modernizeLegacyMockupUrl("/mockups/sky-blue-tshirt-front.png")).toBe(runtimeBasePath("tshirt", "sky-blue", "front"));
  });

  it("falls back to white when the colour does not exist for that product", () => {
    expect(modernizeLegacyMockupUrl("/mockups/orange-tshirt-front.png")).toBe(runtimeBasePath("tshirt", "white", "front"));
  });

  it("reads the face from whole words only", () => {
    expect(modernizeLegacyMockupUrl("/mockups/background-hoodie.png")).toBe(runtimeBasePath("hoodie", "white", "front"));
    expect(modernizeLegacyMockupUrl("/mockups/white-hoodie-left-sleeve.png")).toBe(runtimeBasePath("hoodie", "white", "left-sleeve"));
    expect(modernizeLegacyMockupUrl("/mockups/white-mug-wrap.png")).toBe(runtimeBasePath("mug", "white", "wrap"));
    // A face the product does not have falls back to its front.
    expect(modernizeLegacyMockupUrl("/mockups/white-cap-left-sleeve.png")).toBe(runtimeBasePath("cap", "white", "front"));
  });

  it("uses the placeholder when it cannot tell what the product is", () => {
    expect(modernizeLegacyMockupUrl("/mockups/mystery-item.png")).toBe(PRODUCT_IMAGE_PLACEHOLDER);
    expect(existsSync(path.join(PUBLIC, PRODUCT_IMAGE_PLACEHOLDER))).toBe(true);
  });

  it("ignores query strings", () => {
    expect(modernizeLegacyMockupUrl("/mockups/black-hoodie-front.png?v=3")).toBe(runtimeBasePath("hoodie", "black", "front"));
  });
});

describe("every legacy file still in the repository", () => {
  const legacyRoot = path.join(PUBLIC, "mockups");
  const legacyFiles = walk(legacyRoot)
    .map((file) => `/${path.relative(PUBLIC, file).split(path.sep).join("/")}`)
    .filter((url) => !url.startsWith(`${ROOT}/`) && /\.(png|jpe?g|webp|svg)$/i.test(url));

  it("has legacy files to check", () => {
    expect(legacyFiles.length).toBeGreaterThan(50);
  });

  it("maps to an approved photo that exists, never to a missing file", () => {
    const broken = legacyFiles.filter((url) => {
      const target = modernizeLegacyMockupUrl(url);
      return !target || !existsSync(path.join(PUBLIC, target));
    });
    expect(broken).toEqual([]);
  });

  it("never maps into another retired folder", () => {
    for (const url of legacyFiles) expect(isRetiredMockupUrl(modernizeLegacyMockupUrl(url) ?? "")).toBe(false);
  });
});

describe("resolveImageUrl", () => {
  it("repairs a retired mockup URL coming from an old database row", () => {
    expect(resolveImageUrl("/mockups/source-kit-v3/waterbottle/white/front.png")).toBe(WATER_BOTTLE_PHOTO_FRONT);
    expect(resolveImageUrl("mockups/black-hoodie-front.png")).toBe(runtimeBasePath("hoodie", "black", "front"));
  });

  it("leaves other image URLs exactly as before", () => {
    expect(resolveImageUrl(`${ROOT}/tshirt/white/front-base.png`)).toBe(`${ROOT}/tshirt/white/front-base.png`);
    expect(resolveImageUrl("/assets/products/hoodie_abstract.png")).toBe("/assets/products/optimized/hoodie_abstract.webp");
    expect(resolveImageUrl("/images/cat-tshirt.png")).toBe("/images/cat-tshirt.png");
    expect(resolveImageUrl("https://images.unsplash.com/photo-1?w=700")).toBe("https://images.unsplash.com/photo-1?w=700");
    expect(resolveImageUrl("")).toBe("/images/product-placeholder.svg");
    expect(resolveImageUrl(null)).toBe("/images/product-placeholder.svg");
  });
});

describe("source guard", () => {
  it("has no storefront file pointing at a retired mockup folder", () => {
    const offenders = walk(SRC)
      .filter((file) => /\.(ts|tsx)$/.test(file) && !/\.test\.tsx?$/.test(file) && !file.endsWith(`${path.sep}legacy-mockup-url.ts`))
      .flatMap((file) => {
        const text = readFileSync(file, "utf8");
        const hits = text.match(/["'`]\/?mockups\/(?!psd-master-v10\/)[^"'`$]+/g) ?? [];
        return hits.map((hit) => `${path.relative(SRC, file)}: ${hit}`);
      });
    expect(offenders).toEqual([]);
  });
});

describe("mobile app copy", () => {
  const legacyFiles = walk(path.join(PUBLIC, "mockups"))
    .map((file) => `/${path.relative(PUBLIC, file).split(path.sep).join("/")}`)
    .filter((url) => !url.startsWith(`${ROOT}/`) && /\.(png|jpe?g|webp|svg)$/i.test(url));

  it("gives the same answer as the storefront for every legacy file", () => {
    const disagreements = legacyFiles.filter((url) => approvedMockupPath(url) !== modernizeLegacyMockupUrl(url));
    expect(disagreements).toEqual([]);
  });

  it("leaves an already approved path unchanged", () => {
    expect(approvedMockupPath(`${ROOT}/tshirt/white/front-base.png`)).toBe(`${ROOT}/tshirt/white/front-base.png`);
  });

  it("maps every file name the mobile Design tab uses to an approved photo that exists", () => {
    const source = readFileSync(path.resolve(SRC, "../../trynext-mobile/app/(tabs)/design.tsx"), "utf8");
    const names = [...new Set([...source.matchAll(/"((?:normalized|apparel-v5)\/[^"]+\.(?:png|jpe?g|webp))"/g)].map((match) => match[1]))];
    expect(names.length).toBeGreaterThan(20);
    const broken = names.filter((name) => {
      const target = approvedMockupPath(name);
      return !target || !existsSync(path.join(PUBLIC, target));
    });
    expect(broken).toEqual([]);
  });
});
