/** Filters the shop sheet can set. Prices are whole taka; empty means "no limit". */
export interface ShopFilters {
  minPrice: string;
  maxPrice: string;
  customizableOnly: boolean;
}

export const EMPTY_SHOP_FILTERS: ShopFilters = { minPrice: "", maxPrice: "", customizableOnly: false };

/** Keeps digits only, so a pasted "৳1,200" or "12.5" cannot reach the API as a bad number. */
export function cleanPriceInput(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, 7);
}

/** How many filters are active (shown as the badge on the Filters button). */
export function countActiveFilters(f: ShopFilters): number {
  return [f.minPrice !== "", f.maxPrice !== "", f.customizableOnly].filter(Boolean).length;
}

/** Parameters for api.getProducts. A reversed range is left for the API to put in order. */
export function filtersToParams(f: ShopFilters): { minPrice?: number; maxPrice?: number; customizable?: boolean } {
  return {
    minPrice: f.minPrice !== "" ? Number(f.minPrice) : undefined,
    maxPrice: f.maxPrice !== "" ? Number(f.maxPrice) : undefined,
    customizable: f.customizableOnly ? true : undefined,
  };
}
