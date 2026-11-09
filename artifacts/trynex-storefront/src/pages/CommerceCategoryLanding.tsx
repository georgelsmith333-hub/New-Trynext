import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Truck } from "lucide-react";
import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { ProductCard } from "@/components/ProductCard";
import { getApiUrl } from "@/lib/utils";
import { useSiteSettings } from "@/context/SiteSettingsContext";

type CategoryKind = "mugs" | "drinkware";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  images?: string[];
  stock?: number;
  customizable?: boolean;
  categoryName?: string;
};

type FAQ = { question: string; answer: string };

const CONTENT: Record<CategoryKind, {
  slug: string;
  title: string;
  description: string;
  keywords: string;
  h1: string;
  intro: string;
  categoryId: number;
  productHeading: string;
  productLink: string;
  productLinkLabel: string;
  steps: string[];
  occasions: string[];
  faqs: FAQ[];
}> = {
  mugs: {
    slug: "custom-mugs-bangladesh",
    title: "Personalized Photo Mugs in Bangladesh | Trynext Lifestyle",
    description: "Create a personalized photo mug in Bangladesh with your own photo, name, message, or artwork. Browse real Trynext mug products, customize your design, and order with nationwide delivery.",
    keywords: "personalized photo mug Bangladesh, custom mug Bangladesh, photo mug, custom mug with text, personalized gift for couples",
    h1: "Personalized Photo Mugs in Bangladesh",
    intro: "Turn a favorite photo, name, message, or illustration into an everyday mug. Trynext Lifestyle offers real customizable mug products that you can order online across Bangladesh.",
    categoryId: 3,
    productHeading: "Customizable mugs available now",
    productLink: "/products?category=mugs",
    productLinkLabel: "View all mugs",
    steps: ["Choose a mug design or open the Design Studio.", "Upload your photo or artwork and add a name or message.", "Review your design, add it to cart, and confirm delivery and payment."],
    occasions: ["Photo gifts for couples", "Birthday and anniversary gifts", "Desk mugs with a name or message", "Personalized gifts for friends and family"],
    faqs: [
      { question: "Can I print my own photo on a mug?", answer: "Yes. Trynext's personalized mug products are marked customizable, so you can use your own photo, artwork, name, or message through the available product and Design Studio flow." },
      { question: "How much do personalized mugs cost?", answer: "The verified live mug catalog currently ranges from ৳349 to ৳599 after available discounts. The final amount depends on the selected product and options shown at checkout." },
      { question: "How does payment work for a custom mug?", answer: "Trynext checkout supports the Bangladesh 25% advance and cash-on-delivery balance flow where applicable. Available payment methods and merchant details are shown from the live checkout configuration." },
      { question: "Can I order a single custom mug?", answer: "The live catalog contains individual customizable mug products. Select a product, create your design, and confirm the available quantity and checkout options." },
    ],
  },
  drinkware: {
    slug: "custom-drinkware-bangladesh",
    title: "Custom Drinkware in Bangladesh | Bottles, Mugs & More | Trynext",
    description: "Shop customizable drinkware in Bangladesh, including personalized mugs and water bottles. Add a photo, name, message, or artwork and order from Trynext Lifestyle.",
    keywords: "custom drinkware Bangladesh, personalized drinkware, custom water bottle Bangladesh, personalized bottle, custom gifts Bangladesh",
    h1: "Custom Drinkware Designed for Everyday Moments",
    intro: "Choose customizable mugs and water bottles for gifts, work, school, fitness, or everyday use. Trynext Lifestyle helps customers in Bangladesh turn their own ideas into orderable drinkware designs.",
    categoryId: 7,
    productHeading: "Customizable water bottles available now",
    productLink: "/products?category=water-bottles",
    productLinkLabel: "View all water bottles",
    steps: ["Choose a customizable mug or water bottle from the live catalog.", "Add your photo, name, message, or artwork in the supported design flow.", "Review the product, add it to cart, and confirm the live checkout terms."],
    occasions: ["Personalized bottles for daily use", "Custom gifts for couples and friends", "Name bottles for school, work, or fitness", "Custom drinkware ideas for teams and businesses"],
    faqs: [
      { question: "What custom drinkware can I order from Trynext?", answer: "The verified live catalog currently includes customizable mugs and water bottles. Other drinkware types should only be advertised after a real orderable product is added and verified." },
      { question: "How much do custom water bottles cost?", answer: "The verified live water-bottle catalog currently ranges from ৳699 to ৳1,199 after available discounts. The final amount depends on the selected product and options shown at checkout." },
      { question: "Can I add a name or photo to a bottle?", answer: "The live water-bottle products are marked customizable. Use the supported product or Design Studio flow to confirm the available artwork and personalization options before ordering." },
      { question: "Do you offer custom tumblers or bulk drinkware orders?", answer: "This page does not claim tumbler availability or a separate bulk-order workflow because those capabilities were not confirmed in the current production catalog. Contact Trynext for a factual availability check." },
    ],
  },
};

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
    <button type="button" className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-neutral-900" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      <span>{faq.question}</span>{open ? <ChevronUp className="h-5 w-5 shrink-0 text-orange-600" /> : <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400" />}
    </button>
    {open && <p className="border-t border-neutral-100 px-5 pb-5 pt-3 text-sm leading-7 text-neutral-600">{faq.answer}</p>}
  </div>;
}

export default function CommerceCategoryLanding({ kind }: { kind: CategoryKind }) {
  const content = CONTENT[kind];
  const settings = useSiteSettings();
  const { data } = useQuery<{ products: Product[] }>({
    queryKey: ["seo-category-products", content.categoryId],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/products?categoryId=${content.categoryId}&limit=12`));
      if (!response.ok) throw new Error("Unable to load category products");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  const products = data?.products ?? [];
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: content.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
  const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://trynext.shop/" }, { "@type": "ListItem", position: 2, name: content.h1, item: `https://trynext.shop/${content.slug}` }] };
  const collectionSchema = { "@context": "https://schema.org", "@type": "CollectionPage", name: content.h1, description: content.description, url: `https://trynext.shop/${content.slug}`, isPartOf: { "@type": "WebSite", name: "Trynext Lifestyle", url: "https://trynext.shop/" } };

  return <>
    <SEOHead title={content.title} description={content.description} canonical={`/${content.slug}`} keywords={content.keywords} jsonLd={[faqSchema, breadcrumbSchema, collectionSchema]} />
    <main>
      <section className="bg-gradient-to-b from-orange-50 via-white to-white px-4 pb-14 pt-16">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-orange-700">Trynext Lifestyle · Bangladesh</p>
          <h1 className="text-4xl font-black tracking-tight text-neutral-950 md:text-6xl">{content.h1}</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-neutral-600">{content.intro}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={content.productLink} className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-orange-200">{content.productLinkLabel}<ArrowRight className="h-4 w-4" /></Link>
            <Link href="/design-studio" className="rounded-2xl border-2 border-orange-200 bg-white px-6 py-3.5 font-bold text-orange-700">Design your own</Link>
          </div>
          <p className="mt-5 text-sm text-neutral-500">Nationwide Bangladesh delivery · ৳{settings.freeShippingThreshold || 1500}+ free shipping · 25% advance and COD balance where applicable</p>
        </div>
      </section>

      <section className="border-y border-neutral-100 bg-white px-4 py-6">
        <div className="mx-auto grid max-w-5xl gap-4 text-center sm:grid-cols-3">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-700"><CheckCircle2 className="h-5 w-5 text-green-600" /> Real live catalog products</div>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-700"><Truck className="h-5 w-5 text-blue-600" /> Bangladesh delivery options</div>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-700"><CheckCircle2 className="h-5 w-5 text-orange-600" /> Customizable designs</div>
        </div>
      </section>

      <section className="bg-neutral-50 px-4 py-14"><div className="mx-auto max-w-6xl"><h2 className="text-center text-3xl font-black text-neutral-950">{content.productHeading}</h2><p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">Choose a real product below, then confirm the available design options and current price before checkout.</p>{products.length > 0 ? <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product as any} />)}</div> : <p className="mt-8 text-center text-neutral-500">Products are loading. Please refresh to view the current catalog.</p>}<div className="mt-9 text-center"><Link href={content.productLink} className="font-bold text-orange-700 underline underline-offset-4">{content.productLinkLabel}</Link></div></div></section>

      <section className="bg-white px-4 py-14"><div className="mx-auto max-w-5xl"><h2 className="text-center text-3xl font-black text-neutral-950">How customization works</h2><div className="mt-9 grid gap-5 md:grid-cols-3">{content.steps.map((step, index) => <div key={step} className="rounded-2xl bg-orange-50 p-6"><div className="text-4xl font-black text-orange-200">0{index + 1}</div><p className="mt-3 text-sm font-semibold leading-7 text-neutral-700">{step}</p></div>)}</div></div></section>

      <section className="bg-neutral-950 px-4 py-14 text-white"><div className="mx-auto max-w-5xl"><h2 className="text-3xl font-black">Ideas for your next custom order</h2><div className="mt-7 grid gap-3 sm:grid-cols-2">{content.occasions.map((occasion) => <div key={occasion} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-200">{occasion}</div>)}</div><p className="mt-8 max-w-3xl leading-7 text-neutral-400">Current checkout settings show ৳{settings.shippingCost || 100} shipping and free shipping from ৳{settings.freeShippingThreshold || 1500}. Payment destinations and available methods are shown from the live checkout configuration, so the page does not publish private merchant numbers.</p></div></section>

      <section className="bg-white px-4 py-14"><div className="mx-auto max-w-3xl"><h2 className="mb-7 text-center text-3xl font-black text-neutral-950">Frequently asked questions</h2><div className="space-y-3">{content.faqs.map((faq) => <FAQItem key={faq.question} faq={faq} />)}</div></div></section>
      <section className="bg-orange-50 px-4 py-12 text-center"><h2 className="text-3xl font-black text-neutral-950">Explore more from Trynext</h2><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href={kind === "mugs" ? "/custom-drinkware-bangladesh" : "/custom-mugs-bangladesh"} className="rounded-full border border-orange-200 bg-white px-5 py-2.5 text-sm font-bold text-orange-700">{kind === "mugs" ? "Custom drinkware" : "Personalized mugs"}</Link><Link href="/blog" className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-bold text-neutral-700">Read the blog</Link><Link href="/shipping-policy" className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-bold text-neutral-700">Shipping policy</Link></div></section>
    </main>
  </>;
}
