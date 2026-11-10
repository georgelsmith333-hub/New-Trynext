import { EDITORIAL_GUIDES, getEditorialGuide } from "../../artifacts/trynex-storefront/src/content/editorialGuides";
import { renderSimpleMarkdownHtml } from "../../artifacts/trynex-storefront/src/content/simpleMarkdown";

const SITE_URL = "https://trynext.shop";

type BlogPost = {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  author?: string | null;
  category?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type GuideProduct = {
  id?: number | string;
  name?: string;
  slug?: string;
  price?: number | string | null;
  discountPrice?: number | string | null;
  stock?: number | string | null;
  customizable?: boolean;
};

type BlogApiEnv = {
  ASSETS?: { fetch(request: Request): Promise<Response> };
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function plainText(value: unknown): string {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${SITE_URL}${raw}`;
  return null;
}

function currentPrice(value: unknown): string {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0
    ? `৳${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(amount)}`
    : "";
}

async function loadGuideProducts(request: Request, guide: NonNullable<ReturnType<typeof getEditorialGuide>>): Promise<GuideProduct[]> {
  const groups = await Promise.all(guide.productCategoryIds.map(async (categoryId) => {
    try {
      const url = new URL(`/api/products?categoryId=${categoryId}&limit=6`, request.url);
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(1500),
      });
      if (!response.ok) return [];
      const data = await response.json() as { products?: GuideProduct[] };
      if (!Array.isArray(data.products)) return [];
      return data.products.filter((product) => {
        const stock = Number(product.stock);
        return product.customizable === true && Number.isFinite(stock) && stock > 0;
      }).slice(0, 2);
    } catch {
      return [];
    }
  }));
  return groups.flat();
}

function setMeta(html: string, name: string, content: string, attribute = "name"): string {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${name}["'][^>]*>`, "i");
  const tag = `<meta ${attribute}="${name}" content="${escaped}">`;
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

function insertJsonLd(html: string, values: unknown[]): string {
  const scripts = values.map((value) => `<script type="application/ld+json" data-seo-prerender="true">${escapeJson(value)}</script>`).join("\n");
  return html.replace("</head>", `  ${scripts}\n</head>`);
}

function articleMarkup(post: BlogPost): string {
  const title = escapeHtml(post.title || "Trynext Lifestyle Blog");
  const excerpt = escapeHtml(post.excerpt || plainText(post.content).slice(0, 240));
  const content = escapeHtml(plainText(post.content));
  const author = escapeHtml(post.author || "Trynext Lifestyle");
  const category = escapeHtml(post.category || "Custom Apparel");
  const published = post.createdAt ? escapeHtml(post.createdAt.slice(0, 10)) : "";
  return `<main data-seo-prerender="blog-post" style="max-width:760px;margin:0 auto;padding:32px 20px;font-family:Arial,sans-serif;color:#1f2937"><p style="color:#e85d04;font-weight:700">${category}</p><h1>${title}</h1><p>${excerpt}</p><p>By ${author}${published ? ` · ${published}` : ""}</p><article>${content}</article><p><a href="/blog">Read more from the Trynext Lifestyle blog</a></p></main>`;
}

function staticGuideMarkup(guide: NonNullable<ReturnType<typeof getEditorialGuide>>, products: GuideProduct[]): string {
  const links = guide.relatedLinks.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.title)}</a></li>`).join("");
  const currentProducts = products.map((product) => {
    const productId = String(product.slug || product.id || "");
    if (!productId) return "";
    const href = `/product/${encodeURIComponent(productId)}`;
    const price = currentPrice(product.discountPrice ?? product.price);
    const priceText = price ? ` · ${escapeHtml(price)}` : "";
    return `<li><a href="${escapeHtml(href)}">${escapeHtml(product.name || "Customizable product")}</a>${priceText} · In stock in the current catalog</li>`;
  }).join("");
  const productSection = currentProducts
    ? `<section><h2>Current customizable products</h2><ul>${currentProducts}</ul></section>`
    : "";
  const faqs = guide.faqs.map((faq) => `<div><h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p></div>`).join("");
  return `<main data-seo-prerender="static-editorial-guide" style="max-width:960px;margin:0 auto;padding:32px 20px 48px;font-family:Arial,sans-serif;color:#1f2937;line-height:1.7"><p style="color:#c2410c;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">${escapeHtml(guide.category)} · Trynext Lifestyle</p><h1 style="font-size:clamp(30px,5vw,46px);line-height:1.1;color:#111827">${escapeHtml(guide.title)}</h1><p style="max-width:760px;font-size:18px;color:#4b5563">${escapeHtml(guide.excerpt)}</p><article>${renderSimpleMarkdownHtml(guide.contentMarkdown)}${productSection}<section><h2>Frequently asked questions</h2>${faqs}</section></article><section><h2>Related Trynext pages</h2><ul>${links}<li><a href="/shipping-policy">Shipping policy</a></li></ul></section><p><a href="/blog">Browse all Trynext guides</a></p></main>`;
}

function staticGuideJsonLd(guide: NonNullable<ReturnType<typeof getEditorialGuide>>) {
  const pageUrl = `${SITE_URL}/blog/${guide.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: guide.title,
      description: guide.description,
      author: { "@type": "Organization", name: "Trynext Lifestyle" },
      publisher: { "@type": "Organization", name: "Trynext Lifestyle", url: SITE_URL },
      articleSection: guide.category,
      url: pageUrl,
      mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: guide.title, item: pageUrl },
      ],
    },
  ];
}

function listingMarkup(posts: BlogPost[]): string {
  const cards = posts.map((post) => {
    const slug = encodeURIComponent(String(post.slug || ""));
    const title = escapeHtml(post.title || "Trynext Lifestyle article");
    const excerpt = escapeHtml(post.excerpt || plainText(post.content).slice(0, 180));
    return `<article><h2><a href="/blog/${slug}">${title}</a></h2><p>${excerpt}</p></article>`;
  }).join("");
  const guideCards = EDITORIAL_GUIDES.map((guide) => `<article><h3><a href="/blog/${escapeHtml(guide.slug)}">${escapeHtml(guide.title)}</a></h3><p>${escapeHtml(guide.excerpt)}</p></article>`).join("");
  return `<main data-seo-prerender="blog-list" style="max-width:960px;margin:0 auto;padding:32px 20px;font-family:Arial,sans-serif;color:#1f2937"><h1>Custom Gift &amp; Design Guides in Bangladesh</h1><p>Practical guides about custom gifts, mug design, drinkware and choosing artwork for Trynext products in Bangladesh.</p><section><h2>Design and gift guides</h2>${guideCards}</section><section><h2>Stories &amp; updates</h2>${cards || "<p>Explore custom gift ideas and guides from Trynext Lifestyle.</p>"}</section></main>`;
}

async function loadShell(env: BlogApiEnv, request: Request): Promise<Response> {
  if (env.ASSETS) {
    return env.ASSETS.fetch(new Request(new URL("/", request.url), request));
  }
  return fetch(new URL("/", request.url));
}

async function renderStaticGuide(request: Request, env: BlogApiEnv, guide: NonNullable<ReturnType<typeof getEditorialGuide>>): Promise<Response> {
  const [shell, products] = await Promise.all([loadShell(env, request), loadGuideProducts(request, guide)]);
  if (!shell.ok) return shell;
  const canonical = `${SITE_URL}/blog/${guide.slug}`;
  const title = `${guide.title} | Trynext Lifestyle`;
  let html = await shell.text();
  html = setTitle(html, title);
  html = setMeta(html, "description", guide.description);
  html = setMeta(html, "robots", "index, follow, max-image-preview:large");
  html = setCanonical(html, canonical);
  html = setMeta(html, "og:type", "article", "property");
  html = setMeta(html, "og:title", title, "property");
  html = setMeta(html, "og:description", guide.description, "property");
  html = setMeta(html, "og:url", canonical, "property");
  html = setMeta(html, "og:site_name", "Trynext Lifestyle", "property");
  html = setMeta(html, "twitter:card", "summary_large_image");
  html = setMeta(html, "twitter:title", title);
  html = setMeta(html, "twitter:description", guide.description);
  html = html.replace("<div id=\"root\">", `<div id="root">${staticGuideMarkup(guide, products)}`);
  html = insertJsonLd(html, staticGuideJsonLd(guide));
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "X-Robots-Tag": "index, follow, max-image-preview:large",
      "X-Prerendered": "1",
    },
  });
}

export const onRequest = async ({ request, env }: { request: Request; env: BlogApiEnv }) => {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const slug = parts.length > 1 ? decodeURIComponent(parts[1]) : null;
  const staticGuide = slug ? getEditorialGuide(slug) : undefined;
  if (staticGuide) return renderStaticGuide(request, env, staticGuide);

  const apiUrl = slug
    ? new URL(`/api/blog/${encodeURIComponent(slug)}`, request.url)
    : new URL("/api/blog?published=true&limit=12&page=1", request.url);

  let data: BlogPost | { posts?: BlogPost[] } | null = null;
  let status = 200;
  try {
    const response = await fetch(apiUrl, { headers: { Accept: "application/json" } });
    status = response.status;
    if (response.ok) data = await response.json() as BlogPost | { posts?: BlogPost[] };
  } catch {
    status = 503;
  }

  const shell = await loadShell(env, request);
  if (!shell.ok) return shell;
  let html = await shell.text();
  const post = slug && data && !Array.isArray(data) && "title" in data ? data as BlogPost : null;
  const posts = !slug && data && "posts" in data ? data.posts ?? [] : [];
  const canonical = slug ? `${SITE_URL}/blog/${encodeURIComponent(slug)}` : `${SITE_URL}/blog`;
  const title = post?.title ? `${post.title} | Trynext Lifestyle` : "Custom Gift & Design Guides Bangladesh | Trynext Lifestyle";
  const description = post?.excerpt || "Helpful custom gift, mug design and drinkware guides from Trynext Lifestyle in Bangladesh.";
  const image = absoluteUrl(post?.imageUrl);
  html = setTitle(html, title);
  html = setMeta(html, "description", description);
  html = setMeta(html, "robots", status === 404 ? "noindex, nofollow" : "index, follow, max-image-preview:large");
  html = setCanonical(html, canonical);
  html = setMeta(html, "og:title", title, "property");
  html = setMeta(html, "og:description", description, "property");
  if (image) html = setMeta(html, "og:image", image, "property");
  const markup = status === 404
    ? `<main data-seo-prerender="not-found" style="max-width:760px;margin:0 auto;padding:32px 20px;font-family:Arial,sans-serif"><h1>Blog post not found</h1><p>This Trynext Lifestyle article is no longer available.</p><p><a href="/blog">Browse the blog</a></p></main>`
    : post ? articleMarkup(post) : listingMarkup(posts);
  html = html.replace("<div id=\"root\">", `<div id="root">${markup}`);
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": status === 200 ? "public, max-age=60, s-maxage=300" : "public, max-age=30" } });
};
