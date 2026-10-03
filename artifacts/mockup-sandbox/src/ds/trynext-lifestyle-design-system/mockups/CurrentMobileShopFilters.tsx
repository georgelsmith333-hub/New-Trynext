import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { Check, Grid3X3, LayoutList, SlidersHorizontal, Sparkles, X, Zap } from "lucide-react";
import { twMerge } from "tailwind-merge";

const cn = (...values: ClassValue[]) => twMerge(clsx(values));

const categories = [
  { id: "tshirts", name: "T-Shirts" },
  { id: "hoodies", name: "Hoodies" },
  { id: "mugs", name: "Mugs" },
  { id: "phone-cases", name: "Phone Cases" },
];

const products = ["Everyday Tee", "Classic Hoodie", "Ceramic Mug", "Phone Case"];

/**
 * CurrentMobileShopFilters keeps the existing Products.tsx filter trigger and
 * sidebar markup as the baseline. API-driven categories/counts are stubbed so
 * the extracted UI stays usable in the isolated preview.
 */
export function CurrentMobileShopFilters() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("shop");
  const hasActiveFilters = Boolean(priceMin || priceMax || inStockOnly);

  return (
    <div className="min-h-screen bg-[#f8f8f8] font-['Plus_Jakarta_Sans'] text-gray-900">
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4">
        <span className="font-['Outfit'] text-lg font-black tracking-tight">TRY<span className="text-orange-600">NEXT</span></span>
        <span className="text-xs font-semibold text-gray-500">Shop / Apparel</span>
      </header>
      <main className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              aria-label="Search products"
              placeholder="Search products..."
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            aria-label={mobileFiltersOpen ? "Close filters" : "Open filters"}
            aria-expanded={mobileFiltersOpen}
            data-testid="button-mobile-filters"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <div className="hidden items-center bg-white sm:flex">
            <button type="button" aria-label="Show products as a grid" onClick={() => setViewMode("grid")} className="p-2">
              <Grid3X3 className={cn("h-4 w-4", viewMode === "grid" ? "text-orange-600" : "text-gray-400")} />
            </button>
            <button type="button" aria-label="Show products as a list" onClick={() => setViewMode("list")} className="p-2">
              <LayoutList className={cn("h-4 w-4", viewMode === "list" ? "text-orange-600" : "text-gray-400")} />
            </button>
          </div>
        </div>

        {activeTab === "offers" && (
          <p role="status" className="mb-3 text-xs font-bold text-orange-700">Special offers selected</p>
        )}
        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
          {/* Extracted from the existing Products.tsx mobile filter overlay. */}
          {mobileFiltersOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/40 md:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
          )}
          <aside className={cn(
            "shrink-0 md:block md:w-56",
            mobileFiltersOpen
              ? "fixed inset-y-0 left-0 z-40 w-72 max-w-[80vw] overflow-y-auto bg-white shadow-2xl md:relative md:inset-auto md:overflow-visible md:shadow-none"
              : "hidden md:block",
          )}>
            <div className="sticky top-24 pt-4 md:pt-0">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Categories</p>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategory(undefined)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-all",
                      activeCategory === undefined
                        ? "border border-orange-200 bg-orange-50 text-orange-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <span>All Products</span>
                    <span className="text-xs font-bold opacity-60">128</span>
                  </button>
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={cn(
                        "w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-all",
                        activeCategory === category.id
                          ? "border border-orange-200 bg-orange-50 text-orange-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Price Range (৳)</p>
                <div className="mb-3 flex items-center gap-2">
                  <input
                    type="number"
                    aria-label="Minimum price"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(event) => setPriceMin(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-100"
                  />
                  <span className="shrink-0 text-xs font-bold text-gray-400">–</span>
                  <input
                    type="number"
                    aria-label="Maximum price"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(event) => setPriceMax(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-100"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Under ৳500", min: "", max: "500" },
                    { label: "৳500–1000", min: "500", max: "1000" },
                    { label: "৳1000+", min: "1000", max: "" },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => { setPriceMin(preset.min); setPriceMax(preset.max); }}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
                        priceMin === preset.min && priceMax === preset.max
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600",
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-gray-400">Availability</p>
                <button
                  type="button"
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className="group flex w-full items-center gap-3"
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all"
                    style={{ background: inStockOnly ? "#E85D04" : "white", borderColor: inStockOnly ? "#E85D04" : "#d1d5db" }}
                  >
                    {inStockOnly && <Check className="h-3 w-3 text-white" />}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 transition-colors group-hover:text-orange-600">
                    In Stock Only
                  </span>
                </button>
              </div>

              {(hasActiveFilters || activeCategory) && (
                <button
                  type="button"
                  onClick={() => { setPriceMin(""); setPriceMax(""); setInStockOnly(false); setActiveCategory(undefined); }}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-100 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
                >
                  <X className="h-3 w-3" /> Clear All Filters
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab("offers")}
                className="group mt-4 w-full rounded-2xl p-5 text-center text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #E85D04, #FB8500)" }}
              >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Zap className="h-5 w-5 text-white group-hover:animate-pulse" />
                </div>
                <p className="mb-0.5 text-sm font-bold">Special Offers</p>
                <p className="mb-3 text-xs text-orange-100">Combos & deals — save up to 30%!</p>
                <span className="inline-block rounded-xl bg-white px-4 py-1.5 text-xs font-black text-orange-600">
                  View Deals →
                </span>
              </button>

              <div className="mt-3 rounded-2xl bg-gray-900 p-4 text-center text-white">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20">
                  <Sparkles className="h-4 w-4 text-orange-400" />
                </div>
                <p className="mb-1 text-sm font-bold">Custom Order?</p>
                <p className="mb-3 text-xs text-gray-400">Design your own from ৳750.</p>
                <a href="/design-studio" className="inline-block rounded-xl bg-orange-500 px-4 py-1.5 text-xs font-black text-white transition-colors hover:bg-orange-600">
                  Open Design Studio
                </a>
              </div>
            </div>
          </aside>

          <div className="grid flex-1 grid-cols-2 gap-3">
            {products.map((name) => (
              <div key={name} className="rounded-2xl border border-gray-100 bg-white p-3">
                <div className="mb-3 aspect-square rounded-xl bg-gradient-to-br from-orange-50 to-gray-100" />
                <p className="text-xs font-bold">{name}</p>
                <p className="mt-1 text-xs text-gray-500">৳850</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}