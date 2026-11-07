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

type BlogApiEnv = {
  ASSETS?: { fetch(request: Request): Promise<Response> };
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function articleMarkup(post: BlogPost): string {
  const title = escapeHtml(post.title || "Trynext Lifestyle Blog");
  const excerpt = escapeHtml(post.excerpt || plainText(post.content).slice(0, 240));
  const content = escapeHtml(plainText(post.content));
  const author = escapeHtml(post.author || "Trynext Lifestyle");
  const category = escapeHtml(post.category || "Custom Apparel");
  const published = post.createdAt ? escapeHtml(post.createdAt.slice(0, 10)) : "";
  return `<main data-seo-prerender="blog-post" style="max-width:760px;margin:0 auto;padding:32px 20px;font-family:Arial,sans-serif;color:#1f2937"><p style="color:#e85d04;font-weight:700">${category}</p><h1>${title}</h1><p>${excerpt}</p><p>By ${author}${published ? ` · ${published}` : ""}</p><article>${content}</article><p><a href="/blog">Read more from the Trynext Lifestyle blog</a></p></main>`;
}

function listingMarkup(posts: BlogPost[]): string {
  const cards = posts.map((post) => {
    const slug = encodeURIComponent(String(post.slug || ""));
    const title = escapeHtml(post.title || "Trynext Lifestyle article");
    const excerpt = escapeHtml(post.excerpt || plainText(post.content).slice(0, 180));
    return `<article><h2><a href="/blog/${slug}">${title}</a></h2><p>${excerpt}</p></article>`;
  }).join("");
  return `<main data-seo-prerender="blog-list" style="max-width:960px;margin:0 auto;padding:32px 20px;font-family:Arial,sans-serif;color:#1f2937"><h1>Custom Apparel &amp; Fashion Blog in Bangladesh</h1><p>Practical guides about custom T-shirts, hoodies, mugs, caps, gifts, printing, and Bangladesh fashion from Trynext Lifestyle.</p>${cards || "<p>Explore custom apparel ideas and guides from Trynext Lifestyle.</p>"}</main>`;
}

async function loadShell(env: BlogApiEnv, request: Request): Promise<Response> {
  if (env.ASSETS) {
    return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
  }
  return fetch(new URL("/index.html", request.url));
}

export const onRequest = async ({ request, env }: { request: Request; env: BlogApiEnv }) => {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const slug = parts.length > 1 ? decodeURIComponent(parts[1]) : null;
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
  const title = post?.title ? `${post.title} | Trynext Lifestyle` : "Custom Apparel & Fashion Blog Bangladesh | Trynext Lifestyle";
  const description = post?.excerpt || "Custom apparel, T-shirt printing, hoodie design, gift ideas, and Bangladesh fashion guides from Trynext Lifestyle.";
  const image = absoluteUrl(post?.imageUrl);
  html = setTitle(html, title);
  html = setMeta(html, "description", description);
  html = setMeta(html, status === 404 ? "noindex, nofollow" : "index, follow, max-image-preview:large", "robots");
  html = setCanonical(html, canonical);
  html = setMeta(html, "og:title", title, "property");
  html = setMeta(html, "og:description", description, "property");
  if (image) html = setMeta(html, "og:image", image, "property");
  const markup = status === 404
    ? `<main data-seo-prerender="not-found" style="max-width:760px;margin:0 auto;padding:32px 20px;font-family:Arial,sans-serif"><h1>Blog post not found</h1><p>This Trynext Lifestyle article is no longer available.</p><p><a href="/blog">Browse the blog</a></p></main>`
    : post ? articleMarkup(post) : listingMarkup(posts);
  html = html.replace('<div id="root">', `<div id="root">${markup}`);
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": status === 200 ? "public, max-age=60, s-maxage=300" : "public, max-age=30" } });
};
