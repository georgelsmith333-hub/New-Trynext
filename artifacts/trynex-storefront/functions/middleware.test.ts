import { describe, expect, it, vi } from "vitest";
import { injectMeta, isKnownAppPath, onRequest } from "./_middleware";

const baseHtml = `<!doctype html><html><head>
<title>Trynext Lifestyle | Premium Custom Apparel Bangladesh</title>
<meta name="description" content="home">
<link rel="canonical" href="https://trynext.shop/">
<meta property="og:type" content="website">
<meta property="og:title" content="home">
<meta property="og:description" content="home">
<meta property="og:image" content="https://trynext.shop/opengraph.jpg">
<meta property="og:url" content="https://trynext.shop/">
<meta name="twitter:title" content="home">
<meta name="twitter:description" content="home">
<meta name="twitter:image" content="https://trynext.shop/opengraph.jpg">
</head><body><div id="root"></div></body></html>`;

function context(path: string, userAgent: string, apiUrl = "") {
  const assets = { fetch: vi.fn().mockResolvedValue(new Response(baseHtml, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })) };
  return {
    request: new Request(`https://trynext.shop${path}`, { headers: { "user-agent": userAgent } }),
    env: { ASSETS: assets, API_URL: apiUrl },
    params: {},
    waitUntil: vi.fn(),
  } as any;
}

describe("public crawler and route hardening", () => {
  it("replaces route-specific canonical and OG URL even with normal tag whitespace", () => {
    const html = injectMeta(baseHtml, {
      title: "Article | Trynext Lifestyle Blog",
      description: "A useful article.",
      canonical: "https://trynext.shop/blog/article",
      ogType: "article",
      ogImage: "https://trynext.shop/article.jpg",
      jsonLd: [],
    });
    expect(html).toContain('<link rel="canonical" href="https://trynext.shop/blog/article"');
    expect(html).toContain('<meta property="og:url" content="https://trynext.shop/blog/article"');
    expect(html).not.toContain('<meta property="og:url" content="https://trynext.shop/"');
  });

  it("recognizes supported dynamic and static app routes but not arbitrary paths", () => {
    expect(isKnownAppPath("/design-studio")).toBe(true);
    expect(isKnownAppPath("/product/personalized-photo-mug")).toBe(true);
    expect(isKnownAppPath("/blog/article")).toBe(true);
    expect(isKnownAppPath("/not-a-real-route")).toBe(false);
  });

  it("returns a noindex 404 instead of the homepage for an unknown app path", async () => {
    const response = await onRequest(context("/not-a-real-route", "Mozilla/5.0"));
    expect(response.status).toBe(404);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    const body = await response.text();
    expect(body).toContain("<h1>Page not found</h1>");
    expect(body).toContain("https://trynext.shop/");
  });

  it("serves truthful Design Studio metadata to crawlers without indexing the editor", async () => {
    const response = await onRequest(context("/design-studio", "Googlebot/2.1"));
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, follow");
    const body = await response.text();
    expect(body).toContain("Design Studio | Personalize Custom Apparel | Trynext Lifestyle");
    expect(body).toContain('<link rel="canonical" href="https://trynext.shop/design-studio"');
    expect(body).toContain('<meta property="og:url" content="https://trynext.shop/design-studio"');
  });

  it("returns a true noindex 404 when the blog API confirms a missing article", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not found", { status: 404 })));
    const response = await onRequest(context("/blog/does-not-exist", "Googlebot/2.1", "https://api.example.test"));
    expect(response.status).toBe(404);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(await response.text()).toContain("<h1>Page not found</h1>");
    vi.unstubAllGlobals();
  });
});
