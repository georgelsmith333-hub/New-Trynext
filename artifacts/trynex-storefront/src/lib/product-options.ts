const WATER_BOTTLE_IMAGE = "/mockups/white-waterbottle-photo.png";

export function isWaterBottleProduct(product: any): boolean {
  const identity = [
    product?.name,
    product?.slug,
    product?.categoryName,
    product?.category?.name,
  ].filter(Boolean).join(" ").toLowerCase();
  return /\b(water[\s-]?bottle|bottle|tumbler|flask)\b/.test(identity);
}

export function getCustomerProductVariants(product: any): any[] {
  const variants = Array.isArray(product?.variants)
    ? product.variants.filter((variant: any) => variant && variant.active !== false)
    : [];
  if (!isWaterBottleProduct(product)) return variants;
  const unsupportedBottleColors = /\b(black|green|navy|blue|red|pink|teal|forest|olive|grey|gray|charcoal|maroon|burgundy|purple|orange|yellow|sand|brown)\b/i;
  return variants.filter((variant: any) => {
    const name = String(variant.name ?? "");
    if (/\b(mug|cup|rim|handle|ceramic)\b/i.test(name) || unsupportedBottleColors.test(name)) return false;
    const variantColors = Array.isArray(variant.colors) ? variant.colors : [];
    return variantColors.length === 0 || variantColors.some((color: unknown) => String(color).toLowerCase() === "white");
  });
}

export function getCustomerProductColors(product: any): string[] {
  return isWaterBottleProduct(product) ? ["White"] : Array.isArray(product?.colors) ? product.colors : [];
}

export function getCustomerProductImage(product: any): string | undefined {
  return isWaterBottleProduct(product) ? WATER_BOTTLE_IMAGE : product?.imageUrl;
}