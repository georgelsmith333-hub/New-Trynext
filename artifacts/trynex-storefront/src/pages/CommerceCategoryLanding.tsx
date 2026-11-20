import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Truck } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { ProductCard } from "@/components/ProductCard";
import { getApiUrl, formatPrice, resolveImageUrl } from "@/lib/utils";
import { getCustomerProductColors, getCustomerProductImage, hasVerifiedStock } from "@/lib/product-options";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { COMMERCE_CATEGORY_CONTENT, type CommerceCategoryContent, type CommerceProductGroup } from "@/content/commerceSeoContent";

type CategoryKind = "mugs" | "drinkware";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  imageUrl?: string;
  images?: string[];
  stock?: number;
  sizes?: string[] | null;
  colors?: string[] | null;
  variants?: Array<{ active?: boolean; stock?: number; sizes?: string[] }> | null;
  customizable?: boolean;
  categoryName?: string;
  category?: { name?: string };
};

type ProductGroupResult = CommerceProductGroup & { products: Product[] };

function isAvailable(product: Product): boolean {
  return hasVerifiedStock(product.stock);
}

function getAvailableSizes(product: Product): string[] {
  const variantSizes = Array.isArray(product.variants)
    ? product.variants.filter((variant) => variant.active !== false && hasVerifiedStock(variant.stock)).flatMap((variant) => variant.sizes ?? [])
    : [];
  return Array.from(new Set([...(product.sizes ?? []), ...variantSizes].map((size) => String(size).trim()).filter(Boolean)));
}

async function loadProductGroups(content: CommerceCategoryContent): Promise<ProductGroupResult[]> {
  return Promise.all(content.productGroups.map(async (group) => {
    try {
      const response = await fetch(getApiUrl(`/api/products?categoryId=${group.categoryId}&limit=12`));
      if (!response.ok) return { ...group, products: [] };
      const result = await response.json() as { products?: Product[] };
      return { ...group, products: Array.isArray(result.products) ? result.products.filter((product) => product.customizable === true && isAvailable(product)) : [] };
    } catch {
      return { ...group, products: [] };
    }
  }));
}

function FaqSection({ faqs }: { faqs: CommerceCategoryContent["faqs"] }) {
  return <section className="bg-white px-4 py-14" aria-labelledby="category-faq-heading">
    <div className="mx-auto max-w-4xl">
      <h2 id="category-faq-heading" className="mb-8 text-center text-3xl font-black text-neutral-950">Frequently asked questions</h2>
      <div className="divide-y divide-neutral-200 border-y border-neutral-200">
        {faqs.map((faq) => <article key={faq.question} className="py-6">
          <h3 className="text-lg font-bold text-neutral-900">{faq.question}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-700">{faq.answer}</p>
        </article>)}
      </div>
    </div>
  </section>;
}

function AvailableProductGroups({ groups }: { groups: ProductGroupResult[] }) {
  let cardIndex = 0;
  return <>
    {groups.map((group) => {
      const currentIndex = cardIndex;
      cardIndex += group.products.length;
      return <section key={group.key} className="mt-10 first:mt-8" aria-labelledby={`products-${group.key}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id={`products-${group.key}`} className="text-xl font-black text-neutral-950 sm:text-2xl">{group.label}</h3>
            <p className="mt-1 text-sm text-neutral-600">Live product listings and availability; confirm design options and the full total in the selected flow.</p>
          </div>
          <Link href={group.productLink} className="inline-flex items-center gap-2 text-sm font-bold text-orange-700 underline decoration-orange-200 underline-offset-4">{group.productLinkLabel}<ArrowRight className="h-4 w-4" /></Link>
        </div>
        {group.products.length > 0
          ? <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{group.products.map((product, index) => {
            const sizes = getAvailableSizes(product);
            const colors = getCustomerProductColors(product);
            const inStock = hasVerifiedStock(product.stock);
            return <div key={product.id} className="flex h-full flex-col">
              <ProductCard product={product as any} index={currentIndex + index} eagerImage={currentIndex + index === 0} />
              <div className="flex flex-1 flex-col gap-2 border-x border-b border-neutral-200 bg-white px-3 pb-4 pt-1 text-xs text-neutral-600">
                {(sizes.length > 0 || colors.length > 0) && <p className="leading-5">
                  {sizes.length > 0 && <><span className="font-semibold text-neutral-800">Sizes:</span> {sizes.join(", ")}{colors.length > 0 ? " · " : ""}</>}
                  {colors.length > 0 && <><span className="font-semibold text-neutral-800">Colors/finish:</span> {colors.join(", ")}</>}
                </p>}
                <p>{inStock ? "In stock in the live catalog" : "Confirm current availability on the product page"}</p>
                <Link href={`/product/${product.slug || product.id}`} className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-orange-200 px-3 py-2 text-center font-bold text-orange-800 hover:bg-orange-50">View product and customization options <ArrowRight className="h-4 w-4 shrink-0" /></Link>
              </div>
            </div>;
          })}</div>
          : <p className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-sm leading-6 text-neutral-600">No in-stock items were returned for this group just now. Open the live catalogue to check current availability.</p>}
      </section>;
    })}
  </>;
}

export default function CommerceCategoryLanding({ kind }: { kind: CategoryKind }) {
  const content = COMMERCE_CATEGORY_CONTENT[kind];
  const settings = useSiteSettings();
  const { data, isLoading } = useQuery<ProductGroupResult[]>({
    queryKey: ["seo-category-products", content.slug],
    queryFn: () => loadProductGroups(content),
    staleTime: 60_000,
  });
  const groups = data ?? content.productGroups.map((group) => ({ ...group, products: [] }));
  const availableProducts = groups.flatMap((group) => group.products);
  const featuredProduct = availableProducts.find((product) => Boolean(getCustomerProductImage(product))) ?? null;
  const featuredImage = featuredProduct ? resolveImageUrl(getCustomerProductImage(featuredProduct)) : undefined;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  };
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: content.h1,
    description: content.description,
    url: `https://trynext.shop/${content.slug}`,
    isPartOf: { "@type": "WebSite", name: "Trynext Lifestyle", url: "https://trynext.shop/" },
  };
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: availableProducts.slice(0, 12).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: { "@type": "Product", name: product.name, url: `https://trynext.shop/product/${encodeURIComponent(product.slug || String(product.id))}` },
    })),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://trynext.shop/" },
      { "@type": "ListItem", position: 2, name: content.h1, item: `https://trynext.shop/${content.slug}` },
    ],
  };

  const shippingCost = Number(settings.shippingCost);
  const freeShippingThreshold = Number(settings.freeShippingThreshold);
  const shippingText = settings.isLoaded
    ? `${Number.isFinite(shippingCost) && shippingCost >= 0 ? `The current standard shipping setting is ${formatPrice(shippingCost)}.` : "Shipping charges are shown at checkout."}${Number.isFinite(freeShippingThreshold) && freeShippingThreshold > 0 ? ` Free shipping is currently configured for eligible orders over ${formatPrice(freeShippingThreshold)}.` : ""}`
    : "Current delivery charges and any free-shipping eligibility are shown in checkout.";
  const supportNumber = String(settings.whatsappNumber || settings.phone || "").replace(/[^0-9]/g, "");
  const supportHref = supportNumber ? `https://wa.me/${supportNumber}` : "/contact";
  const supportLabel = supportNumber ? "Ask Trynext on WhatsApp" : "Contact Trynext";

  return <>
    <SEOHead title={content.title} description={content.description} canonical={`/${content.slug}`} keywords={content.keywords} ogType="website" ogImage={featuredImage} jsonLd={[faqSchema, collectionSchema, itemListSchema, breadcrumbSchema]} />
    <main>
      <section className="bg-gradient-to-b from-orange-50 via-white to-white px-4 pb-12 pt-24 sm:pt-28">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.08fr_0.92fr] md:gap-12">
          <div className="order-2 md:order-1">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-orange-700">Trynext Lifestyle · Bangladesh</p>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-neutral-950 sm:text-5xl">{content.h1}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">{content.intro}</p>
            <div className="mt-5 rounded-2xl border border-orange-100 bg-white/80 p-4 text-sm leading-7 text-neutral-700 shadow-sm">
              <strong className="text-neutral-950">Quick answer: </strong>{content.directAnswer}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/design-studio" className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-700">{content.primaryCtaLabel}<ArrowRight className="h-4 w-4" /></Link>
              {content.productGroups.map((group) => <Link key={group.key} href={group.productLink} className="rounded-2xl border-2 border-orange-200 bg-white px-5 py-3.5 text-sm font-bold text-orange-800">{group.productLinkLabel}</Link>)}
            </div>
            <p className="mt-4 text-xs leading-6 text-neutral-600">Delivery is available across Bangladesh. Where COD is offered, the current order may require a 25% advance. Production and dispatch estimates vary by product and destination; confirm at checkout. Design controls and previews vary by product. Need help? <Link href={supportHref} target={supportNumber ? "_blank" : undefined} rel={supportNumber ? "noopener noreferrer" : undefined} className="font-bold text-orange-800 underline underline-offset-4">{supportLabel}</Link>.</p>
            <p className="mt-4 text-xs leading-6 text-neutral-500">Catalog prices and stock can change. Review the selected product, any displayed customization charge and the final cart total before confirming.</p>
          </div>

          <div className="order-1 md:order-2">
            <div className="relative mx-auto flex aspect-[4/3] w-full max-w-xl items-center justify-center overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-xl shadow-orange-100/70">
              {featuredProduct && featuredImage ? <>
                <img src={featuredImage} alt={featuredProduct.name} width={640} height={480} loading="eager" decoding="async" fetchPriority="high" className="h-full w-full object-contain p-5 sm:p-8" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-neutral-700 shadow">From the live catalog</span>
              </> : <div className="px-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-700"><CheckCircle2 className="h-7 w-7" /></div>
                <p className="font-bold text-neutral-800">{isLoading ? "Loading current product image…" : "See real product images in the live listings below."}</p>
                <p className="mt-2 text-sm leading-6 text-neutral-500">Only images returned for currently available catalog products are used here.</p>
              </div>}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-100 bg-white px-4 py-5">
        <div className="mx-auto grid max-w-6xl gap-4 text-center sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-700"><CheckCircle2 className="h-5 w-5 text-green-600" />Live catalog products</div>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-700"><Truck className="h-5 w-5 text-blue-600" />Delivery across Bangladesh</div>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-700"><CheckCircle2 className="h-5 w-5 text-orange-600" />COD may require 25% advance</div>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-700"><CheckCircle2 className="h-5 w-5 text-purple-600" />Options and preview vary by item</div>
        </div>
      </section>

      <section className="bg-neutral-50 px-4 py-14" aria-labelledby="current-products-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="current-products-heading" className="text-center text-3xl font-black text-neutral-950">Browse current customizable products</h2>
          <p className="mx-auto mt-3 max-w-3xl text-center leading-7 text-neutral-600">Each product card comes from the live catalog. Check the item’s own options, availability and current price; if you use Design Studio, confirm any customization charge and the complete total in your cart.</p>
          <AvailableProductGroups groups={groups} />
        </div>
      </section>

      <section className="bg-white px-4 py-14" aria-labelledby="personalization-ideas-heading">
        <div className="mx-auto max-w-5xl">
          <h2 id="personalization-ideas-heading" className="text-center text-3xl font-black text-neutral-950">What can you personalize?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-center leading-7 text-neutral-600">These are design ideas, not a promise that every combination is supported. Use only the tools shown for the selected live listing or in its Design Studio flow.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">{content.personalizationIdeas.map((idea) => <article key={idea.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"><h3 className="font-black text-neutral-900">{idea.title}</h3><p className="mt-2 text-sm leading-7 text-neutral-700">{idea.description}</p></article>)}</div>
        </div>
      </section>

      {kind === "mugs" && <section className="bg-white px-4 py-14" aria-labelledby="photo-guide-heading">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-orange-700">Artwork checklist</p>
          <h2 id="photo-guide-heading" className="mt-2 text-center text-3xl font-black text-neutral-950">How to prepare a photo for a custom mug</h2>
          <p className="mx-auto mt-3 max-w-3xl text-center leading-7 text-neutral-600">A good source image gives you a clearer starting point. The final crop and personalization options depend on the selected mug and its design flow.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {content.imageTips.map((tip, index) => <li key={tip} className="flex gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-sm font-black text-orange-800">0{index + 1}</span>
              <p className="text-sm leading-7 text-neutral-700">{tip}</p>
            </li>)}
          </ul>
          <p className="mt-6 text-center"><Link href="/blog/how-to-design-a-custom-photo-mug" className="font-bold text-orange-700 underline decoration-orange-200 underline-offset-4">Read the full photo mug design guide</Link></p>
        </div>
      </section>}

      {kind === "drinkware" && content.comparison && <section className="bg-white px-4 py-14" aria-labelledby="comparison-heading">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-orange-700">Compare product types</p>
          <h2 id="comparison-heading" className="mt-2 text-center text-3xl font-black text-neutral-950">Mugs or water bottles?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-center leading-7 text-neutral-600">This comparison covers the two currently verified product groups. Check each live listing for the exact options and availability.</p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <caption className="sr-only">Comparison of current customizable mugs and water bottles</caption>
              <thead className="bg-neutral-100 text-neutral-900"><tr><th scope="col" className="px-5 py-4 font-black">Consideration</th><th scope="col" className="px-5 py-4 font-black">Mugs</th><th scope="col" className="px-5 py-4 font-black">Water bottles</th></tr></thead>
              <tbody>{content.comparison.map((row) => <tr key={row.feature} className="border-t border-neutral-200 align-top"><th scope="row" className="w-40 px-5 py-4 font-bold text-neutral-900">{row.feature}</th><td className="px-5 py-4 leading-6 text-neutral-700">{row.mugs}</td><td className="px-5 py-4 leading-6 text-neutral-700">{row.bottles}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>}

      {content.businessInquiry && <section className="bg-orange-50 px-4 py-12" aria-labelledby="business-inquiry-heading">
        <div className="mx-auto max-w-5xl rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 id="business-inquiry-heading" className="text-2xl font-black text-neutral-950">{content.businessInquiry.title}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-neutral-700">{content.businessInquiry.description}</p>
          <Link href="/contact" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700">Ask Trynext about a team or event request <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>}

      <section className="bg-neutral-950 px-4 py-14 text-white" aria-labelledby="gift-ideas-heading">
        <div className="mx-auto max-w-5xl">
          <h2 id="gift-ideas-heading" className="text-3xl font-black">Ideas for a personal gift</h2>
          <p className="mt-3 max-w-3xl leading-7 text-neutral-300">Start from the person and the moment rather than adding more decoration than the design needs.</p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">{content.giftIdeas.map((idea) => <li key={idea} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-neutral-200">{idea}</li>)}</ul>
        </div>
      </section>

      {kind === "drinkware" && <section className="bg-white px-4 py-14" aria-labelledby="drinkware-artwork-heading">
        <div className="mx-auto max-w-5xl">
          <h2 id="drinkware-artwork-heading" className="text-center text-3xl font-black text-neutral-950">Artwork checks for either product</h2>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2">{content.imageTips.map((tip) => <li key={tip} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm leading-7 text-neutral-700">{tip}</li>)}</ul>
        </div>
      </section>}

      <section className="bg-orange-50 px-4 py-14" aria-labelledby="order-steps-heading">
        <div className="mx-auto max-w-5xl">
          <h2 id="order-steps-heading" className="text-center text-3xl font-black text-neutral-950">How to place a custom order</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {content.orderSteps.map((step, index) => <li key={step} className="flex gap-4 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-sm font-black text-white">{index + 1}</span>
              <p className="text-sm leading-7 text-neutral-700">{step}</p>
            </li>)}
          </ol>
        </div>
      </section>

      <section className="bg-white px-4 py-14" aria-labelledby="shipping-payment-heading">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-neutral-200 p-6 sm:p-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Truck className="h-5 w-5" /></div>
            <h2 className="text-xl font-black text-neutral-950">Delivery across Bangladesh</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-700">{shippingText} Delivery dates and service availability depend on the destination and current operations; check the <Link href="/shipping-policy" className="font-semibold text-orange-700 underline underline-offset-4">shipping policy</Link> and checkout rather than assuming a fixed arrival time.</p>
          </div>
          <div className="rounded-3xl border border-neutral-200 p-6 sm:p-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-700"><CheckCircle2 className="h-5 w-5" /></div>
            <h2 className="text-xl font-black text-neutral-950">Confirm payment terms at checkout</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-700">Available payment methods are shown in the live order flow. Where cash on delivery is offered, a 25% advance with the remaining balance due by COD may apply. Confirm the terms for your address and selected product before submitting.</p>
            <Link href={supportHref} target={supportNumber ? "_blank" : undefined} rel={supportNumber ? "noopener noreferrer" : undefined} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-700 underline underline-offset-4">{supportLabel}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 px-4 py-14" aria-labelledby="related-guides-heading">
        <div className="mx-auto max-w-5xl">
          <h2 id="related-guides-heading" className="text-center text-3xl font-black text-neutral-950">Related design and gift guides</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">{content.relatedGuides.map((guide) => <Link key={guide.href} href={guide.href} className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
            <span className="inline-flex items-center gap-2 font-bold text-neutral-950 group-hover:text-orange-700">{guide.title}<ArrowRight className="h-4 w-4" /></span>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{guide.description}</p>
          </Link>)}</div>
        </div>
      </section>

      <FaqSection faqs={content.faqs} />
      <section className="bg-orange-600 px-4 py-10 text-center text-white">
        <h2 className="text-2xl font-black">Ready to choose a design?</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-orange-50">Start with the current catalog and confirm the exact customization, delivery and payment terms for your order.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">{content.productGroups.map((group) => <Link key={group.key} href={group.productLink} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-orange-800 hover:bg-orange-50">{group.productLinkLabel}</Link>)}<Link href="/design-studio" className="rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Open Design Studio</Link></div>
      </section>
    </main>
  </>;
}
