import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { getEditorialGuide } from "@/content/editorialGuides";
import { parseInlineMarkdown, parseSimpleMarkdown } from "@/content/simpleMarkdown";
import { formatPrice, getApiUrl } from "@/lib/utils";

type GuideProduct = {
  id?: number | string;
  name?: string;
  slug?: string;
  price?: number | string | null;
  discountPrice?: number | string | null;
  stock?: number | string | null;
  customizable?: boolean;
};

function InlineText({ value }: { value: string }) {
  return <>{parseInlineMarkdown(value).map((segment, index) => {
    if (segment.type === "link") return <Link key={index} href={segment.href} className="font-semibold text-orange-700 underline decoration-orange-200 underline-offset-4 hover:text-orange-900">{segment.text}</Link>;
    if (segment.type === "strong") return <strong key={index} className="font-bold text-neutral-900">{segment.text}</strong>;
    return <Fragment key={index}>{segment.text}</Fragment>;
  })}</>;
}

function ArticleBody({ markdown }: { markdown: string }) {
  return <div className="space-y-5 text-[16px] leading-8 text-neutral-700">
    {parseSimpleMarkdown(markdown).map((block, index) => {
      if (block.type === "heading") {
        const Heading = block.level === 2 ? "h2" : "h3";
        return <Heading key={index} className={block.level === 2 ? "pt-5 text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl" : "pt-3 text-xl font-bold text-neutral-900"}><InlineText value={block.text} /></Heading>;
      }
      if (block.type === "ordered-list" || block.type === "unordered-list") {
        const List = block.type === "ordered-list" ? "ol" : "ul";
        return <List key={index} className={`${block.type === "ordered-list" ? "list-decimal" : "list-disc"} space-y-3 pl-6 marker:font-bold marker:text-orange-600`}>
          {block.items.map((item, itemIndex) => <li key={itemIndex} className="pl-1"><InlineText value={item} /></li>)}
        </List>;
      }
      return <p key={index}><InlineText value={block.text} /></p>;
    })}
  </div>;
}

export default function EditorialGuide({ slug }: { slug: string }) {
  const guide = getEditorialGuide(slug);
  const currentProductsQuery = useQuery<GuideProduct[]>({
    queryKey: ["editorial-guide-products", guide?.slug],
    enabled: Boolean(guide),
    queryFn: async () => {
      if (!guide) return [];
      const groups = await Promise.all(guide.productCategoryIds.map(async (categoryId) => {
        try {
          const response = await fetch(getApiUrl(`/api/products?categoryId=${categoryId}&limit=6`), {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(1500),
          });
          if (!response.ok) return [];
          const data = await response.json() as { products?: GuideProduct[] };
          if (!Array.isArray(data.products)) return [];
          return data.products.filter((product) => product.customizable === true && Number(product.stock) > 0 && Boolean(product.slug || product.id)).slice(0, 2);
        } catch {
          return [];
        }
      }));
      return groups.flat();
    },
    staleTime: 60_000,
  });

  if (!guide) {
    return <div className="min-h-screen bg-white"><Navbar /><main className="mx-auto max-w-3xl px-4 py-24 text-center"><h1 className="text-3xl font-black">Guide not found</h1><p className="mt-4 text-neutral-600">This guide is unavailable. Browse the current Trynext blog instead.</p><Link href="/blog" className="mt-6 inline-flex items-center gap-2 font-bold text-orange-700"><ArrowLeft className="h-4 w-4" /> Back to the blog</Link></main><Footer /></div>;
  }

  const canonical = `/blog/${guide.slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: guide.title,
    description: guide.description,
    author: { "@type": "Organization", name: "Trynext Lifestyle" },
    publisher: { "@type": "Organization", name: "Trynext Lifestyle", url: "https://trynext.shop" },
    articleSection: guide.category,
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://trynext.shop${canonical}` },
    url: `https://trynext.shop${canonical}`,
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://trynext.shop/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://trynext.shop/blog" },
      { "@type": "ListItem", position: 3, name: guide.title, item: `https://trynext.shop${canonical}` },
    ],
  };
  const currentProducts = currentProductsQuery.data ?? [];

  return <div className="min-h-screen bg-white">
    <SEOHead title={guide.title} description={guide.description} canonical={canonical} ogType="article" jsonLd={[articleSchema, faqSchema, breadcrumbSchema]} />
    <Navbar />
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
      <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/blog" className="inline-flex items-center gap-1.5 font-semibold hover:text-orange-700"><ArrowLeft className="h-4 w-4" /> Blog</Link>
        <span aria-hidden="true">/</span><span aria-current="page" className="line-clamp-1">{guide.title}</span>
      </nav>
      <header className="mb-10 max-w-3xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-orange-700"><BookOpen className="h-3.5 w-3.5" />{guide.category}</p>
        <h1 className="text-3xl font-black leading-tight tracking-tight text-neutral-950 sm:text-5xl">{guide.title}</h1>
        <p className="mt-5 text-lg leading-8 text-neutral-600">{guide.excerpt}</p>
        <p className="mt-4 text-sm text-neutral-500">Trynext Lifestyle Editorial Team · Practical guide for shoppers in Bangladesh</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0">
          <ArticleBody markdown={guide.contentMarkdown} />
          {currentProducts.length > 0 && <section className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6" aria-labelledby="guide-current-products-heading">
            <h2 id="guide-current-products-heading" className="text-xl font-black text-neutral-950">Current customizable products</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Live catalog links; confirm current options and the full total on the selected product page.</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {currentProducts.map((product) => {
                const productId = String(product.slug || product.id || "");
                const rawPrice = product.discountPrice != null && Number(product.discountPrice) > 0 ? product.discountPrice : product.price;
                const price = Number.isFinite(Number(rawPrice)) ? formatPrice(Number(rawPrice)) : "";
                return <li key={productId} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <Link href={`/product/${encodeURIComponent(productId)}`} className="font-bold text-orange-800 underline decoration-orange-200 underline-offset-4">{product.name || "View current product"}</Link>
                  <p className="mt-2 text-sm text-neutral-600">In stock in the current catalog{price ? ` · ${price}` : ""}</p>
                </li>;
              })}
            </ul>
          </section>}
          {guide.faqs.length > 0 && <section className="mt-12 border-t border-neutral-200 pt-8" aria-labelledby="guide-faq-heading">
            <h2 id="guide-faq-heading" className="mb-5 text-2xl font-black text-neutral-950">Frequently asked questions</h2>
            <div className="space-y-6">
              {guide.faqs.map((faq) => <div key={faq.question}>
                <h3 className="text-lg font-bold text-neutral-900">{faq.question}</h3>
                <p className="mt-2 leading-7 text-neutral-700">{faq.answer}</p>
              </div>)}
            </div>
          </section>}
          <section className="mt-12 rounded-3xl bg-neutral-950 p-6 text-white sm:p-8">
            <h2 className="text-2xl font-black">Explore current Trynext options</h2>
            <p className="mt-3 max-w-2xl leading-7 text-neutral-300">Use the live product listing and checkout to confirm availability, customization options, current price and delivery terms for your order.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {guide.relatedLinks.map((link) => <Link key={link.href} href={link.href} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-neutral-900 hover:bg-orange-50">{link.title}<ArrowRight className="h-4 w-4" /></Link>)}
            </div>
          </section>
        </article>

        <aside className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-5 lg:sticky lg:top-28">
          <h2 className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">Related Trynext pages</h2>
          <ul className="mt-4 space-y-3">
            {guide.relatedLinks.map((link) => <li key={link.href}><Link href={link.href} className="font-semibold leading-6 text-orange-800 underline decoration-orange-200 underline-offset-4">{link.title}</Link></li>)}
            <li><Link href="/shipping-policy" className="font-semibold leading-6 text-orange-800 underline decoration-orange-200 underline-offset-4">Shipping policy</Link></li>
          </ul>
        </aside>
      </div>
    </main>
    <Footer />
  </div>;
}
