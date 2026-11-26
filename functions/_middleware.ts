/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare Pages Middleware — Dynamic Rendering for Search Bots
   ───────────────────────────────────────────────────────────────────────────
   WHAT THIS DOES
   ──────────────
   Trynext is a React SPA. When Google/Bing crawl it they first see raw HTML
   with only generic meta tags, then come back days later to render JS.
   This "second wave" delay means product and blog pages can take months to
   rank properly.

   This middleware fixes it: requests from known search bots on dynamic page
   patterns (/product/:slug, /blog/:slug) receive the HTML with the correct
   page-specific title, description, OG tags, and JSON-LD already injected —
   no JavaScript required. Regular visitors always get the normal SPA.

   Google-approved technique: https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering

   FALLBACK
   ────────
   If the API is unreachable or times out (4 s), the middleware falls back to
   serving the unmodified SPA. No user is ever broken.
═══════════════════════════════════════════════════════════════════════════ */

// The verified custom domain is the canonical public origin. The Pages
// hostname remains available as a compatibility URL, but must not win SEO.
const SITE_URL = "https://trynext.shop";
const DEFAULT_OG = `${SITE_URL}/opengraph.jpg`;
const API_TIMEOUT_MS = 4000;

// Keep this aligned with App.tsx and public/manus-routes.json. Pages' catch-all
// rewrite must not turn a typo into a successful homepage shell.
const KNOWN_APP_PATHS = new Set([
  "/", "/products", "/shop", "/cart", "/checkout", "/track", "/track-order", "/blog",
  "/wishlist", "/shipping-policy", "/return-policy", "/privacy-policy", "/terms-of-service",
  "/referral", "/design-studio", "/design-studio-v1", "/design-studio-v2", "/hampers",
  "/hampers/build", "/sale", "/faq", "/about", "/contact", "/size-guide", "/seo-guide",
  "/custom-tshirt-bangladesh", "/custom-hoodie-bangladesh", "/custom-gift-bangladesh",
  "/corporate-gift-dhaka", "/custom-mug-bangladesh", "/custom-mugs-bangladesh",
  "/custom-drinkware-bangladesh", "/birthday-gift-bangladesh", "/login", "/signup", "/account",
  "/privacy", "/terms", "/shipping", "/returns", "/refund", "/customize", "/design",
  "/gift-hampers", "/gift-hamper", "/admin", "/admin/login", "/admin/products", "/admin/categories",
  "/admin/orders", "/admin/blog", "/admin/customers", "/admin/backup", "/admin/automation",
  "/admin/settings", "/admin/facebook-import", "/admin/reviews", "/admin/tech-stack",
  "/admin/facebook-guide", "/admin/designer", "/admin/deployment", "/admin/hampers", "/admin/logs",
  "/admin/security", "/admin/seo", "/admin/promo-codes", "/admin/referrals", "/admin/newsletter",
  "/admin/db-cluster", "/admin/live-health", "/admin/page-builder", "/admin/mockups",
  "/admin/ai-developer", "/admin/roles", "/admin/secrets",
]);

const DESIGN_STUDIO_META = {
  title: "Design Studio | Personalize Custom Apparel | Trynext Lifestyle",
  description: "Create a custom apparel design with your own photo, text, and options in Trynext Lifestyle's Design Studio.",
};

/* ── Keyword landing page static meta ───────────────────────────────────── */
const KEYWORD_PAGES: Record<string, { title: string; description: string; keywords: string }> = {
  "custom-tshirt-bangladesh": {
    title: "Custom T-Shirt Bangladesh — Design Your Own Tee | Trynext Lifestyle",
    description: "Design your own custom t-shirt in Bangladesh. Premium cotton, unlimited color & print options. Fast delivery to Dhaka & all 64 districts. bKash, Nagad, COD accepted.",
    keywords: "custom t-shirt bangladesh, কাস্টম টি-শার্ট বাংলাদেশ, custom tshirt dhaka, personalized tshirt bd, bulk tshirt printing dhaka",
  },
  "custom-hoodie-bangladesh": {
    title: "Custom Hoodie Bangladesh — Premium Oversized Hoodies | Trynext Lifestyle",
    description: "Premium custom hoodies in Bangladesh. Oversized 340GSM fleece. Name, logo, or photo printing. Fast delivery Dhaka & all districts. bKash, COD accepted.",
    keywords: "custom hoodie bangladesh, কাস্টম হুডি বাংলাদেশ, oversized hoodie bangladesh, couple hoodie bangladesh, corporate hoodie bd",
  },
  "custom-gift-bangladesh": {
    title: "Custom Gift Bangladesh — Personalized Gifts Delivered | Trynext Lifestyle",
    description: "Bangladesh's #1 personalized gift shop. Custom t-shirts, mugs, hoodies, caps & hampers. Fast delivery to Dhaka & all 64 districts. Gift wrapping available.",
    keywords: "custom gift bangladesh, কাস্টম গিফট বাংলাদেশ, personalized gift dhaka, customized gift bd, unique gift idea bangladesh",
  },
  "corporate-gift-dhaka": {
    title: "Corporate Gift Dhaka — Bulk Branded Gifts for Companies | Trynext Lifestyle",
    description: "Premium corporate gifts in Dhaka & across Bangladesh. Branded t-shirts, mugs, hoodies, caps with company logo. Bulk discounts. Tax invoice provided.",
    keywords: "corporate gift dhaka, corporate gift bangladesh, branded gift dhaka, bulk custom gift dhaka, promotional gift bangladesh",
  },
  "custom-mug-bangladesh": {
    title: "Custom Mug Bangladesh — Photo & Name Printed Mugs | Trynext Lifestyle",
    description: "Personalized custom mugs in Bangladesh. Photo, name & design printing. 11oz & 15oz ceramic mugs. Gift-ready packaging. Fast delivery Dhaka & all districts.",
    keywords: "custom mug bangladesh, কাস্টম মগ বাংলাদেশ, photo mug bangladesh, personalized mug dhaka, couple mug bangladesh",
  },
  "birthday-gift-bangladesh": {
    title: "Birthday Gift Bangladesh — Unique Personalized Birthday Gifts | Trynext Lifestyle",
    description: "Best birthday gift ideas in Bangladesh. Personalized t-shirts, mugs, hoodies, hampers with name & photo. Gift wrapping. Fast delivery Dhaka & all districts.",
    keywords: "birthday gift bangladesh, জন্মদিনের উপহার বাংলাদেশ, birthday gift dhaka, unique birthday gift bd, custom birthday tshirt bangladesh",
  },
};

const BOT_PATTERNS = [
  "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider",
  "yandexbot", "facebookexternalhit", "twitterbot", "linkedinbot",
  "whatsapp", "telegrambot", "applebot", "ia_archiver", "petalbot",
  "mj12bot", "semrushbot", "ahrefsbot", "dotbot", "rogerbot",
  "perplexitybot", "claudebot", "gptbot", "chatgpt-user", "ccbot",
  "omgili", "screaming frog",
];

function isBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_PATTERNS.some((p) => lower.includes(p));
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}

async function fetchTimeout(url: string): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export function injectMeta(html: string, opts: {
  title: string; description: string; canonical: string;
  ogType: string; ogImage: string; keywords?: string; jsonLd: unknown[];
}): string {
  const { title, description, canonical, ogType, ogImage, keywords, jsonLd } = opts;
  const t = esc(title); const d = esc(description);
  const c = esc(canonical); const img = esc(ogImage);

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${t}</title>`);
  const replaceContent = (pattern: RegExp, value: string) => {
    html = html.replace(pattern, (_match, prefix: string) => `${prefix}${value}"`);
  };
  replaceContent(/(<meta name="description"\s+content=")[^"]*"/i, d);
  html = html.replace(/(<link rel="canonical"\s+href=")[^"]*"/i, `$1${c}"`);
  replaceContent(/(<meta property="og:type"\s+content=")[^"]*"/i, esc(ogType));
  replaceContent(/(<meta property="og:title"\s+content=")[^"]*"/i, t);
  replaceContent(/(<meta property="og:description"\s+content=")[^"]*"/i, d);
  replaceContent(/(<meta property="og:image"\s+content=")[^"]*"/i, img);
  replaceContent(/(<meta property="og:url"\s+content=")[^"]*"/i, c);
  replaceContent(/(<meta name="twitter:title"\s+content=")[^"]*"/i, t);
  replaceContent(/(<meta name="twitter:description"\s+content=")[^"]*"/i, d);
  replaceContent(/(<meta name="twitter:image"\s+content=")[^"]*"/i, img);
  if (keywords) replaceContent(/(<meta name="keywords"\s+content=")[^"]*"/i, esc(keywords));

  const blocks = jsonLd
    .map((ld) => `  <script type="application/ld+json" data-cfasync="false">${escJson(ld)}</script>`)
    .join("\n");
  html = html.replace("</head>", `${blocks}\n</head>`);
  return html;
}

export function isKnownAppPath(path: string): boolean {
  if (KNOWN_APP_PATHS.has(path)) return true;
  return /^\/(product|blog|hampers)\/[^/]+$/.test(path);
}

function notFoundHtml(html: string, path: string): string {
  const canonical = `${SITE_URL}${path || "/"}`;
  return injectMeta(html, {
    title: "Page not found | Trynext Lifestyle",
    description: "The requested Trynext Lifestyle page could not be found.",
    canonical,
    ogType: "website",
    ogImage: DEFAULT_OG,
    jsonLd: [],
  }).replace(
    /<body([^>]*)>/i,
    `<body$1><main><h1>Page not found</h1><p>The requested Trynext Lifestyle page could not be found.</p><a href="${SITE_URL}/">Return to the homepage</a></main>`,
  );
}

function buildProductHtml(html: string, product: any, slug: string): string {
  const name = product.name || "Custom Product";
  const rawDesc = (product.description || "").replace(/<[^>]+>/g, "").trim();
  const desc = rawDesc.slice(0, 160) ||
    `Buy ${name} from Trynext Lifestyle. Premium quality, fast delivery across Bangladesh.`;
  const price = String(product.discountPrice || product.price || "");
  const image = product.imageUrl || DEFAULT_OG;
  const pageUrl = `${SITE_URL}/product/${slug}`;

  return injectMeta(html, {
    title: `${name} | Trynext Lifestyle`,
    description: desc,
    canonical: pageUrl,
    ogType: "product",
    ogImage: image,
    keywords: `${name}, buy ${name} bangladesh, custom ${name.toLowerCase()} bd, trynext lifestyle`,
    jsonLd: [
      {
        "@context": "https://schema.org", "@type": "Product",
        name, description: desc, image, sku: `TN-${product.id}`,
        brand: { "@type": "Brand", name: "Trynext Lifestyle" },
        offers: {
          "@type": "Offer", priceCurrency: "BDT", price,
          availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: pageUrl, itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: "Trynext Lifestyle" },
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: String(product.rating || "4.9"),
          reviewCount: String(product.reviewCount || "10"),
          bestRating: "5", worstRating: "1",
        },
      },
      {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/products` },
          { "@type": "ListItem", position: 3, name, item: pageUrl },
        ],
      },
    ],
  });
}

function buildBlogHtml(html: string, post: any, slug: string): string {
  const title = post.title || "Blog Post";
  const desc = post.excerpt || `Read "${title}" on Trynext Lifestyle blog.`;
  const image = post.imageUrl || DEFAULT_OG;
  const pageUrl = `${SITE_URL}/blog/${slug}`;
  const author = post.author || "Trynext Lifestyle";
  const tags: string[] = Array.isArray(post.tags) ? post.tags : [];

  return injectMeta(html, {
    title: `${title} | Trynext Lifestyle Blog`,
    description: desc.slice(0, 160),
    canonical: pageUrl,
    ogType: "article",
    ogImage: image,
    keywords: tags.join(", "),
    jsonLd: [
      {
        "@context": "https://schema.org", "@type": "BlogPosting",
        headline: title, description: desc,
        author: { "@type": "Person", name: author },
        datePublished: post.createdAt,
        dateModified: post.updatedAt || post.createdAt,
        publisher: {
          "@type": "Organization", name: "Trynext Lifestyle",
          logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
        },
        image, url: pageUrl,
        articleSection: post.category || "Fashion",
        keywords: tags.join(", "),
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
      },
      {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: title, item: pageUrl },
        ],
      },
    ],
  });
}

/* ─── Main entry point ───────────────────────────────────────────── */
export const onRequest: PagesFunction<{ API_URL: string }> = async ({ request, env }) => {
  if (request.method !== "GET") return env.ASSETS.fetch(request);

  const ua = request.headers.get("user-agent") || "";
  const path = new URL(request.url).pathname;

  // Do not let the Pages catch-all rewrite manufacture a 200 homepage for a
  // typo. API requests and file-like paths have their own handlers.
  if (!path.startsWith("/api/") && !path.includes(".") && !isKnownAppPath(path)) {
    const baseRes = await env.ASSETS.fetch(new Request(new URL("/", request.url).toString()));
    const baseHtml = await baseRes.text();
    return new Response(notFoundHtml(baseHtml, path), {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=30",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const productMatch = path.match(/^\/product\/([^/]+)$/);
  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  const keywordSlug = path.replace(/^\//, "");
  const keywordPage = KEYWORD_PAGES[keywordSlug];

  // Pass through: not a bot, or not a dynamic page pattern
  if (!isBot(ua) || (!productMatch && !blogMatch && !keywordPage)) {
    if (isBot(ua) && path === "/design-studio") {
      const baseRes = await env.ASSETS.fetch(new Request(new URL("/", request.url).toString()));
      const baseHtml = await baseRes.text();
      const canonical = `${SITE_URL}/design-studio`;
      return new Response(injectMeta(baseHtml, {
        ...DESIGN_STUDIO_META,
        canonical,
        ogType: "website",
        ogImage: DEFAULT_OG,
        jsonLd: [{
          "@context": "https://schema.org", "@type": "WebPage",
          name: DESIGN_STUDIO_META.title, description: DESIGN_STUDIO_META.description,
          url: canonical,
        }],
      }), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Robots-Tag": "noindex, follow",
          "X-Prerendered": "1",
        },
      });
    }
    return env.ASSETS.fetch(request);
  }

  // Keyword landing page — static meta injection (no API call needed)
  if (keywordPage && !productMatch && !blogMatch) {
    const baseRes = await env.ASSETS.fetch(new Request(new URL("/", request.url).toString()));
    const baseHtml = await baseRes.text();
    try {
      const canonical = `${SITE_URL}/${keywordSlug}`;
      const injected = injectMeta(baseHtml, {
        title: keywordPage.title,
        description: keywordPage.description,
        canonical,
        ogType: "website",
        ogImage: DEFAULT_OG,
        keywords: keywordPage.keywords,
        jsonLd: [{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: keywordPage.title.split("—")[0].trim(),
          description: keywordPage.description,
          url: canonical,
          publisher: { "@type": "Organization", name: "Trynext Lifestyle", url: SITE_URL },
        }],
      });
      return new Response(injected, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=300",
          "X-Robots-Tag": "index, follow, max-image-preview:large",
          "X-Prerendered": "1",
        },
      });
    } catch {
      return baseRes;
    }
  }

  const slug = (productMatch ?? blogMatch)![1];
  const type = productMatch ? "product" : "blog";
  // No hardcoded Render fallback: if API_URL is unset, serve the plain SPA.
  const apiBase = (env.API_URL || "").replace(/\/$/, "");
  if (!apiBase) return env.ASSETS.fetch(new Request(new URL("/", request.url).toString()));
  const apiUrl = type === "product"
    ? `${apiBase}/api/products/${encodeURIComponent(slug)}`
    : `${apiBase}/api/blog/${encodeURIComponent(slug)}`;

  // Fetch the SPA base HTML and the API data in parallel
  const [baseRes, apiRes] = await Promise.all([
    env.ASSETS.fetch(new Request(new URL("/", request.url).toString())),
    fetchTimeout(apiUrl),
  ]);

  // A confirmed missing detail item is a real 404, not an indexable SPA shell.
  // Other API failures retain the resilient homepage fallback for visitors.
  if (!apiRes || !apiRes.ok) {
    if (apiRes?.status === 404) {
      const baseHtml = await baseRes.text();
      return new Response(notFoundHtml(baseHtml, path), {
        status: 404,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=30",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
    return baseRes;
  }

  let data: any;
  try { data = await apiRes.json(); } catch { return baseRes; }
  if (!data) return baseRes;

  const baseHtml = await baseRes.text();

  try {
    const injected = type === "product"
      ? buildProductHtml(baseHtml, data, slug)
      : buildBlogHtml(baseHtml, data, slug);

    return new Response(injected, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Cache at edge for 10 min so bots don't hammer the API
        "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=60",
        "X-Robots-Tag": "index, follow, max-image-preview:large",
        "X-Prerendered": "1",
      },
    });
  } catch {
    // If meta injection somehow fails, return the unmodified base HTML
    return new Response(baseHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
};
