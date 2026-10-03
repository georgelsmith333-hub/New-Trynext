import { useState } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@workspace/trynext-lifestyle-design-system/components/ui/button";
import { Checkbox } from "@workspace/trynext-lifestyle-design-system/components/ui/checkbox";
import { Input } from "@workspace/trynext-lifestyle-design-system/components/ui/input";
import { Label } from "@workspace/trynext-lifestyle-design-system/components/ui/label";

const categories = [
  { name: "All products", count: 128 },
  { name: "T-shirts", count: 42 },
  { name: "Hoodies", count: 18 },
  { name: "Mugs", count: 15 },
  { name: "Phone cases", count: 21 },
];

export function ImprovedMobileShopFilters() {
  const [open, setOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("T-shirts");
  const [activePrice, setActivePrice] = useState("৳500–1000");
  const [inStockOnly, setInStockOnly] = useState(true);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
        <span className="font-display text-lg font-black tracking-tight">TRY<span className="text-primary">NEXT</span></span>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="min-h-11">
          <SlidersHorizontal aria-hidden="true" />
          Filters
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">3</span>
        </Button>
      </header>
      <main className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Shop T-shirts</h2>
          <span className="text-sm text-muted-foreground">42 products</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {["Everyday Tee", "Classic Print", "Relaxed Fit", "Essential Tee"].map((name) => (
            <div key={name} className="rounded-2xl border border-card-border bg-card p-3">
              <div className="mb-3 aspect-square rounded-xl bg-muted" />
              <p className="text-sm font-semibold">{name}</p>
              <p className="mt-1 text-xs text-muted-foreground">৳850</p>
            </div>
          ))}
        </div>
      </main>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close shop filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 z-30 bg-foreground/45 backdrop-blur-[2px]"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-filter-title"
            className="absolute inset-y-0 right-0 z-40 flex w-[min(22rem,92vw)] flex-col border-l border-border bg-background shadow-2xl"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-4">
              <div>
                <h1 id="shop-filter-title" className="font-display text-lg font-black">Shop filters</h1>
                <p className="text-xs text-muted-foreground">3 filters active</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                aria-label="Close shop filters"
                onClick={() => setOpen(false)}
                className="min-h-11 min-w-11"
              >
                <X aria-hidden="true" />
              </Button>
            </header>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
              <section className="rounded-2xl border border-card-border bg-card p-4">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</h2>
                <div className="space-y-1">
                  {categories.map((category) => {
                    const selected = activeCategory === category.name;
                    return (
                      <Button
                        key={category.name}
                        variant={selected ? "secondary" : "ghost"}
                        onClick={() => setActiveCategory(category.name)}
                        aria-pressed={selected}
                        className="w-full justify-between"
                      >
                        <span>{category.name}</span>
                        <span className="text-xs text-muted-foreground">{category.count}</span>
                      </Button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-card-border bg-card p-4">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Price range (৳)</h2>
                <div className="mb-3 flex items-center gap-2">
                  <Input aria-label="Minimum price" inputMode="numeric" placeholder="Min" />
                  <span className="text-muted-foreground">–</span>
                  <Input aria-label="Maximum price" inputMode="numeric" placeholder="Max" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Under ৳500", "৳500–1000", "৳1000+"].map((range) => (
                    <Button
                      type="button"
                      key={range}
                      variant={activePrice === range ? "default" : "outline"}
                      size="sm"
                      aria-pressed={activePrice === range}
                      onClick={() => setActivePrice(range)}
                    >
                      {range}
                    </Button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-card-border bg-card p-4">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Availability</h2>
                <Label className="flex min-h-11 cursor-pointer items-center gap-3">
                  <Checkbox checked={inStockOnly} onCheckedChange={(checked) => setInStockOnly(checked === true)} />
                  <span>In stock only</span>
                </Label>
              </section>
            </div>

            <footer className="sticky bottom-0 border-t border-border bg-background p-4">
              <Button className="w-full" onClick={() => setOpen(false)}>
                <Check aria-hidden="true" />
                Show 24 products
              </Button>
            </footer>
          </section>
        </>
      )}
    </div>
  );
}