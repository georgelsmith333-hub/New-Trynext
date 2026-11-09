type CategoryProduct = {
  id?: number;
  name?: string;
  slug?: string;
  price?: number;
  discountPrice?: number | null;
  imageUrl?: string | null;
};

type CategoryConfig = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  categoryId: number;
  productLink: string;
  productLabel: string;
  bullets: string[];
  faqs: Array<{ question: string; answer: string }>;
};

type CategoryEnv = { ASSETS?: { fetch(request: Request): Promise<Response> } };
const SITE_URL = "https://trynext.shop";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function setMeta(html: string, name: string, content: string, attribute = "name"): string {
  const tag = `<meta ${attribute}="${escapeHtml(name)}" content="${escapeHtml(content)}">`;
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${name}["'][^>]*>`, "i");
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `  ${tag}\n</head>`);
}

function setTitle(html: string, title: string): string {
  const tag = `<title>${escapeHtml(title)}</title>`;
  return /<title>[\s\S]*?<\/title>/i.test(html) ? html.replace(/<title>[\s\S]*?<\/title>/i, tag) : html.replace("</head>", `  ${tag}\n</head>`);
}

function setCanonical(html: string, url: string): string {
  const tag = `<link rel="canonical" href="${escapeHtml(url)}">`;
  return /<link\s+rel=["']canonical["'][^>]*>/i.test(html) ? html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, tag) : html.replace("</head>", `  ${tag}\n</head>`);
}

async function loadShell(env: CategoryEnv, request: Request): Promise<Response> {
  if (env.ASSETS) return env.ASSETS.fetch(new Request(new URL("/", request.url), request));
  return fetch(new URL("/", request.url));
}

async function loadProducts(request: Request, categoryId: number): Promise<CategoryProduct[]> {
  try {
    const response = await fetch(new URL(`/api/products?categoryId=${categoryId}&limit=12`, request.url), { headers: { Accept: "application/json" } });
    if (!response.ok) return [];
    const data = await response.json() as { products?: CategoryProduct[] };
    return Array.isArray(data.products) ? data.products : [];
  } catch {
    return [];
  }
}

function productMarkup(products: CategoryProduct[]): string {
  if (!products.length) return "<p>Browse the live catalog to see currently available customizable products.</p>";
  return `<ul>${products.slice(0, 12).map((product) => {
    const href = `/product/${encodeURIComponent(String(product.slug || product.id || ""))}`;
    const currentPrice = product.discountPrice ?? product.price;
    const price = typeof currentPrice === "number" ? ` · ৳${currentPrice}` : "";
    return `<li><a href="${href}">${escapeHtml(product.name || "Custom product")}</a>${price}</li>`;
  }).join("")}</ul>`;
}

export async function renderCommerceCategory(request: Request, env: CategoryEnv, config: CategoryConfig): Promise<Response> {
  const shell = await loadShell(env, request);
  if (!shell.ok) return shell;
  const products = await loadProducts(request, config.categoryId);
  const canonical = `${SITE_URL}/${config.slug}`;
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: config.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
  const collectionSchema = { "@context": "https://schema.org", "@type": "CollectionPage", name: config.h1, description: config.description, url: canonical, isPartOf: { "@type": "WebSite", name: "Trynext Lifestyle", url: SITE_URL } };
  let html = await shell.text();
  html = setTitle(html, config.title);
  html = setMeta(html, "description", config.description);
  html = setMeta(html, "robots", "index, follow, max-image-preview:large");
  html = setCanonical(html, canonical);
  html = setMeta(html, "og:type", "website", "property");
  html = setMeta(html, "og:title", config.title, "property");
  html = setMeta(html, "og:description", config.description, "property");
  html = setMeta(html, "og:url", canonical, "property");
  html = setMeta(html, "og:site_name", "Trynext Lifestyle", "property");
  html = setMeta(html, "twitter:card", "summary_large_image");
  html = setMeta(html, "twitter:title", config.title);
  html = setMeta(html, "twitter:description", config.description);
  const markup = `<main data-seo-prerender="commerce-category" style="max-width:1000px;margin:0 auto;padding:32px 20px;font-family:Arial,sans-serif;color:#1f2937"><p style="color:#c2410c;font-weight:700">Trynext Lifestyle · Bangladesh</p><h1>${escapeHtml(config.h1)}</h1><p>${escapeHtml(config.intro)}</p><p><a href="${config.productLink}">${escapeHtml(config.productLabel)}</a> · <a href="/design-studio">Design your own</a></p><h2>What you can create</h2><ul>${config.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><h2>Available products</h2>${productMarkup(products)}<h2>Ordering in Bangladesh</h2><p>Trynext checkout currently shows ৳100 shipping, free shipping from ৳1,500, and the 25% advance plus cash-on-delivery balance flow where applicable. Confirm the live checkout options before submitting an order.</p><h2>Frequently asked questions</h2>${config.faqs.map((faq) => `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`).join("")}<p><a href="/shipping-policy">Read the shipping policy</a> · <a href="/blog">Read the Trynext Lifestyle blog</a></p><script type="application/ld+json">${JSON.stringify([faqSchema, collectionSchema])}</script></main>`;
  html = html.replace('<div id="root">', `<div id="root">${markup}`);
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
