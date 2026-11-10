import { COMMERCE_CATEGORY_CONTENT, type CommerceCategoryContent, type CommerceProductGroup } from "../artifacts/trynex-storefront/src/content/commerceSeoContent";
import { getCustomerProductColors, getCustomerProductImage, hasVerifiedStock } from "../artifacts/trynex-storefront/src/lib/product-options";

type CategoryProduct = {
  id?: number | string;
  name?: string;
  slug?: string;
  price?: number | string | null;
  discountPrice?: number | string | null;
  imageUrl?: string | null;
  stock?: number | string | null;
  sizes?: string[] | null;
  colors?: string[] | null;
  customizable?: boolean;
  variants?: Array<{
    active?: boolean;
    stock?: number | string | null;
    sizes?: string[];
    colors?: string[];
    inStockColors?: string[];
  }> | null;
};

type ProductGroupResult = CommerceProductGroup & { products: CategoryProduct[] };
type CategoryEnv = { ASSETS?: { fetch(request: Request): Promise<Response> } };
const SITE_URL = "https://trynext.shop";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function setMeta(html: string, name: string, content: string, attribute = "name"): string {
  const tag = `<meta ${attribute}="${escapeHtml(name)}" content="${escapeHtml(content)}">`;
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${name}["'][^>]*>`, "i");
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `  ${tag}\n</head>`);
}

function setTitle(html: string, title: string): string {
  const tag = `<title>${escapeHtml(title)}</title>`;
  return /<title>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title>[\s\S]*?<\/title>/i, tag)
    : html.replace("</head>", `  ${tag}\n</head>`);
}

function setCanonical(html: string, url: string): string {
  const tag = `<link rel="canonical" href="${escapeHtml(url)}">`;
  const pattern = /<link\s+rel=["']canonical["'][^>]*>/i;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `  ${tag}\n</head>`);
}

function setJsonLd(html: string, data: unknown[]): string {
  const blocks = data
    .map((item) => `<script type="application/ld+json" data-seo-prerender="true">${safeJson(item)}</script>`)
    .join("\n");
  return html.replace("</head>", `  ${blocks}\n</head>`);
}

async function loadShell(env: CategoryEnv, request: Request): Promise<Response> {
  if (env.ASSETS) return env.ASSETS.fetch(new Request(new URL("/", request.url), request));
  return fetch(new URL("/", request.url));
}

function isAvailable(product: CategoryProduct): boolean {
  if (product.customizable !== true) return false;
  return hasVerifiedStock(product.stock);
}

async function loadProducts(request: Request, categoryId: number): Promise<CategoryProduct[]> {
  try {
    const response = await fetch(new URL(`/api/products?categoryId=${categoryId}&limit=12`, request.url), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return [];
    const data = await response.json() as { products?: CategoryProduct[] };
    return Array.isArray(data.products) ? data.products.filter(isAvailable) : [];
  } catch {
    return [];
  }
}

function absoluteImageUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw || raw.startsWith("//")) return "";
  try {
    const url = raw.startsWith("/") ? new URL(raw, SITE_URL) : new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    if (!raw.startsWith("/") && !/^https:\/\//i.test(raw)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function productUrl(product: CategoryProduct): string {
  const id = String(product.slug || product.id || "");
  return `${SITE_URL}/product/${encodeURIComponent(id)}`;
}

function productSizes(product: CategoryProduct): string[] {
  const variantSizes = Array.isArray(product.variants)
    ? product.variants
      .filter((variant) => {
        return variant.active !== false && hasVerifiedStock(variant.stock);
      })
      .flatMap((variant) => variant.sizes ?? [])
    : [];
  return Array.from(new Set([...(product.sizes ?? []), ...variantSizes].map((value) => String(value).trim()).filter(Boolean)));
}

function formatPrice(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return "";
  return `৳${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(amount)}`;
}

function productMarkup(groups: ProductGroupResult[]): string {
  return groups.map((group) => {
    const items = group.products.map((product) => {
      const name = String(product.name || "Custom product");
      const safeName = escapeHtml(name);
      const href = `/product/${encodeURIComponent(String(product.slug || product.id || ""))}`;
      const image = absoluteImageUrl(getCustomerProductImage(product));
      const discount = Number(product.discountPrice);
      const price = formatPrice(Number.isFinite(discount) && discount > 0 ? product.discountPrice : product.price);
      const availability = hasVerifiedStock(product.stock)
        ? "In stock in the live catalog"
        : "Confirm current availability on the product page";
      const colors = getCustomerProductColors(product);
      const sizes = productSizes(product);
      const facts = [
        sizes.length ? `<p><strong>Sizes:</strong> ${escapeHtml(sizes.join(", "))}</p>` : "",
        colors.length ? `<p><strong>Available color/finish:</strong> ${escapeHtml(colors.join(", "))}</p>` : "",
      ].filter(Boolean).join("");
      const imageMarkup = image
        ? `<img src="${escapeHtml(image)}" alt="${safeName} product photo" width="320" height="320" loading="lazy" decoding="async" style="display:block;width:100%;aspect-ratio:1/1;object-fit:contain;background:#fafafa;border-radius:12px">`
        : `<div role="img" aria-label="${safeName} product photo not available" style="display:grid;place-items:center;aspect-ratio:1/1;background:#fafafa;border-radius:12px;color:#6b7280">Open product for current images</div>`;
      const priceMarkup = price ? `<p style="font-size:18px;font-weight:700;color:#c2410c">${escapeHtml(price)}</p>` : `<p>See current price on the product page</p>`;
      return `<li style="list-style:none;border:1px solid #e5e7eb;border-radius:18px;padding:14px;background:#fff">${imageMarkup}<h4 style="margin:12px 0 6px;font-size:18px"><a href="${escapeHtml(href)}">${safeName}</a></h4><p style="font-size:13px;color:#4b5563">Check this listing for supported photo, text or artwork options.</p>${priceMarkup}${facts}<p style="font-size:13px;color:#4b5563">${escapeHtml(availability)}</p><a href="${escapeHtml(href)}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#ea580c;color:#fff;font-weight:700;text-decoration:none">Customize this product</a></li>`;
    }).join("");
    const content = items
      ? `<ul style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:16px;padding:0">${items}</ul>`
      : `<p>No in-stock customizable products were returned for this group just now. <a href="${escapeHtml(group.productLink)}">Check the live catalogue</a>.</p>`;
    return `<section><h3>${escapeHtml(group.label)}</h3>${content}</section>`;
  }).join("");
}

function heroMarkup(groups: ProductGroupResult[]): { html: string; image: string } {
  const product = groups.flatMap((group) => group.products).find((item) => Boolean(absoluteImageUrl(getCustomerProductImage(item))));
  if (!product) {
    return {
      html: `<div aria-label="Product photo" style="display:flex;align-items:center;justify-content:center;min-height:240px;border-radius:24px;background:#fff7ed;color:#57534e;padding:24px;text-align:center">See product images in the live catalogue below.</div>`,
      image: "",
    };
  }
  const image = absoluteImageUrl(getCustomerProductImage(product));
  const name = escapeHtml(product.name || "Current Trynext product");
  return {
    html: `<figure style="margin:0;overflow:hidden;border:1px solid #ffedd5;border-radius:24px;background:#fff;box-shadow:0 12px 32px rgba(124,45,18,.08)"><img src="${escapeHtml(image)}" alt="${name} product photo" width="640" height="480" fetchpriority="high" decoding="async" style="display:block;width:100%;height:auto;max-height:320px;object-fit:contain;padding:20px"><figcaption style="padding:0 20px 16px;color:#57534e;font-size:14px">${name} · current catalogue image</figcaption></figure>`,
    image,
  };
}

function faqSchema(config: CommerceCategoryContent) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

function renderFaqs(config: CommerceCategoryContent): string {
  return `<section><h2>Frequently asked questions</h2>${config.faqs.map((faq) => `<div><h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p></div>`).join("")}</section>`;
}

function relatedGuideMarkup(config: CommerceCategoryContent): string {
  const links = config.relatedGuides.map((guide) => `<li><a href="${escapeHtml(guide.href)}">${escapeHtml(guide.title)}</a> — ${escapeHtml(guide.description)}</li>`).join("");
  return `<section><h2>Related design and gift guides</h2><ul>${links}</ul></section>`;
}

function renderComparison(config: CommerceCategoryContent): string {
  if (!config.comparison) return "";
  const rows = config.comparison.map((row) => `<tr><th scope="row">${escapeHtml(row.feature)}</th><td>${escapeHtml(row.mugs)}</td><td>${escapeHtml(row.bottles)}</td></tr>`).join("");
  return `<section><h2>Mugs or water bottles?</h2><p>This comparison covers the two product groups currently verified in the live catalog. Check each listing for current availability and options.</p><div style="overflow-x:auto"><table style="width:100%;min-width:600px;border-collapse:collapse"><caption>Comparison of customizable mugs and water bottles</caption><thead><tr><th scope="col">Consideration</th><th scope="col">Mugs</th><th scope="col">Water bottles</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function renderPersonalizationIdeas(config: CommerceCategoryContent): string {
  const ideas = config.personalizationIdeas.map((idea) => `<li><h3>${escapeHtml(idea.title)}</h3><p>${escapeHtml(idea.description)}</p></li>`).join("");
  return `<section><h2>What can you personalize?</h2><p>These are design ideas, not a promise that every combination is supported. Use only the tools shown for the selected live listing or its Design Studio flow.</p><ul style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:14px;padding:0;list-style:none">${ideas}</ul></section>`;
}

function renderBusinessInquiry(config: CommerceCategoryContent): string {
  if (!config.businessInquiry) return "";
  return `<section><h2>${escapeHtml(config.businessInquiry.title)}</h2><p>${escapeHtml(config.businessInquiry.description)}</p><p><a href="/contact">Ask Trynext about a team or event request</a></p></section>`;
}

function renderCategoryMarkup(config: CommerceCategoryContent, groups: ProductGroupResult[], hero: { html: string; image: string }): string {
  const productGroupLinks = config.productGroups
    .map((group) => `<a href="${escapeHtml(group.productLink)}">${escapeHtml(group.productLinkLabel)}</a>`)
    .join(" · ");
  const photoGuide = config.kind === "mugs"
    ? `<section><h2>How to choose the best photo for a custom mug</h2><p>A clear source image gives you a better starting point. The final crop and supported personalization options depend on the selected mug.</p><ul>${config.imageTips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul><p><a href="/blog/how-to-design-a-custom-photo-mug">Read the full custom photo mug design guide</a></p></section>`
    : `<section><h2>Artwork checks for either product</h2><ul>${config.imageTips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul></section>`;
  const trustDetails = `<p style="font-size:13px;color:#4b5563">Delivery across Bangladesh · Where COD is offered, a 25% advance may apply · Production and dispatch estimates vary by product and destination; confirm at checkout · Preview and personalization controls vary by product · <a href="/contact">Contact or WhatsApp support</a></p>`;
  const orderSteps = config.orderSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  const giftIdeas = config.giftIdeas.map((idea) => `<li>${escapeHtml(idea)}</li>`).join("");
  return `<main data-seo-prerender="commerce-category" style="max-width:1080px;margin:0 auto;padding:24px 20px 48px;font-family:Arial,sans-serif;color:#1f2937;line-height:1.7"><header style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:28px;align-items:center;padding:12px 0 32px"><div><p style="color:#c2410c;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">Trynext Lifestyle · Bangladesh</p><h1 style="font-size:clamp(30px,5vw,48px);line-height:1.08;color:#111827">${escapeHtml(config.h1)}</h1><p>${escapeHtml(config.intro)}</p><p style="border-left:4px solid #ea580c;padding:12px 16px;background:#fff7ed"><strong>Quick answer: </strong>${escapeHtml(config.directAnswer)}</p><p><a href="/design-studio">${escapeHtml(config.primaryCtaLabel)}</a> · ${productGroupLinks}</p>${trustDetails}<p style="font-size:13px;color:#6b7280">Catalog prices and stock can change. Review the selected product, any displayed customization charge and the full cart total before confirming.</p></div><div>${hero.html}</div></header><section><h2>Current customizable products</h2>${productMarkup(groups)}</section>${renderPersonalizationIdeas(config)}${photoGuide}${renderComparison(config)}${renderBusinessInquiry(config)}<section><h2>Gift and everyday-use ideas</h2><ul>${giftIdeas}</ul></section><section><h2>How to place a custom order</h2><ol>${orderSteps}</ol></section><section><h2>Delivery and payment information</h2><p>Trynext offers delivery across Bangladesh. Current shipping charges, eligibility and estimates are shown by the shipping policy and checkout; no fixed arrival time is promised here.</p><p>Payment options and their terms are shown in the live checkout. Where cash on delivery is offered, the current arrangement may require a 25% advance with the balance due by COD. Confirm the terms for your address and selected product before submitting.</p><p><a href="/shipping-policy">Read the shipping policy</a> · <a href="/contact">Contact Trynext</a></p></section>${relatedGuideMarkup(config)}${renderFaqs(config)}<section><h2>Choose from the live catalog</h2><p>${productGroupLinks} · <a href="/design-studio">${escapeHtml(config.primaryCtaLabel)}</a></p></section></main>`;
}

export async function renderCommerceCategory(request: Request, env: CategoryEnv, config: CommerceCategoryContent): Promise<Response> {
  const shell = await loadShell(env, request);
  if (!shell.ok) return shell;

  const groups: ProductGroupResult[] = await Promise.all(
    config.productGroups.map(async (group) => ({
      ...group,
      products: await loadProducts(request, group.categoryId),
    })),
  );
  const products = groups.flatMap((group) => group.products).slice(0, 12);
  const hero = heroMarkup(groups);
  const canonical = `${SITE_URL}/${config.slug}`;
  const title = `${config.title} | Trynext Lifestyle`;
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: { "@type": "Product", name: product.name || "Custom product", url: productUrl(product) },
    })),
  };
  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: config.h1,
    description: config.description,
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "Trynext Lifestyle", url: SITE_URL },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: config.h1, item: canonical },
    ],
  };

  let html = await shell.text();
  html = setTitle(html, title);
  html = setMeta(html, "description", config.description);
  html = setMeta(html, "robots", "index, follow, max-image-preview:large");
  html = setCanonical(html, canonical);
  html = setMeta(html, "og:type", "website", "property");
  html = setMeta(html, "og:title", title, "property");
  html = setMeta(html, "og:description", config.description, "property");
  html = setMeta(html, "og:url", canonical, "property");
  html = setMeta(html, "og:site_name", "Trynext Lifestyle", "property");
  html = setMeta(html, "twitter:card", "summary_large_image");
  html = setMeta(html, "twitter:title", title);
  html = setMeta(html, "twitter:description", config.description);
  if (hero.image) {
    html = setMeta(html, "og:image", hero.image, "property");
    html = setMeta(html, "twitter:image", hero.image);
  }
  html = html.replace('<div id="root">', `<div id="root">${renderCategoryMarkup(config, groups, hero)}`);
  html = setJsonLd(html, [faqSchema(config), collection, itemList, breadcrumb]);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "X-Prerendered": "1",
    },
  });
}

export { COMMERCE_CATEGORY_CONTENT };
