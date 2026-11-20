import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EDITORIAL_GUIDES, getEditorialGuide } from "../src/content/editorialGuides";
import { renderSimpleMarkdownHtml } from "../src/content/simpleMarkdown";
import { COMMERCE_CATEGORY_CONTENT } from "../src/content/commerceSeoContent";
import { renderCommerceCategory } from "../../../functions/_commerce-category";
import { onRequest as blogOnRequest } from "../../../functions/blog/[[slug]]";

const BASE_HTML = `<!doctype html><html><head>
<title>Trynext Lifestyle</title>
<meta name="description" content="home">
<link rel="canonical" href="https://trynext.shop/">
<meta property="og:type" content="website">
<meta property="og:title" content="home">
<meta property="og:description" content="home">
<meta property="og:url" content="https://trynext.shop/">
<meta name="twitter:title" content="home">
<meta name="twitter:description" content="home">
</head><body><div id="root"></div></body></html>`;

function pageEnv() {
  return {
    ASSETS: {
      fetch: vi.fn().mockResolvedValue(new Response(BASE_HTML, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })),
    },
  };
}

function readSchemas(html: string): Array<Record<string, any>> {
  return Array.from(html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g), (match) => JSON.parse(match[1]));
}

afterEach(() => vi.unstubAllGlobals());

describe("Trynext source-managed editorial guides", () => {
  it("serves every static guide from the root Pages handler without querying the CMS API", async () => {
    const fetchedPaths: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      fetchedPaths.push(url.pathname);
      const product = url.searchParams.get("categoryId") === "7"
        ? { id: 701, name: "Current Water Bottle", slug: "current-water-bottle", price: 900, stock: 2, customizable: true }
        : { id: 301, name: "Current Mug", slug: "current-mug", price: 700, stock: 3, customizable: true };
      return new Response(JSON.stringify({ products: [product] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    for (const guide of EDITORIAL_GUIDES) {
      const response = await blogOnRequest({
        request: new Request(`https://trynext.shop/blog/${guide.slug}`, { headers: { "user-agent": "Googlebot/2.1" } }),
        env: pageEnv(),
      });
      const html = await response.text();

      expect(response.status, guide.slug).toBe(200);
      expect(response.headers.get("X-Prerendered"), guide.slug).toBe("1");
      expect(html).toContain(`data-seo-prerender="static-editorial-guide"`);
      expect(html).toContain(`<h1 style="font-size:clamp(30px,5vw,46px);line-height:1.1;color:#111827">${guide.title}</h1>`);
      expect(html).toContain(`<link rel="canonical" href="https://trynext.shop/blog/${guide.slug}">`);
      expect(html).toContain(guide.description);
      expect(html).toContain("Frequently asked questions");
      expect(html).toContain("/design-studio");
      expect(html).toContain("/shipping-policy");
      expect(html).toContain("/products?");
      expect(html).toContain("/product/current-mug");

      const schemas = readSchemas(html);
      expect(schemas.map((schema) => schema["@type"])).toEqual(expect.arrayContaining(["BlogPosting", "FAQPage", "BreadcrumbList"]));
      const faqSchema = schemas.find((schema) => schema["@type"] === "FAQPage");
      expect(faqSchema.mainEntity).toHaveLength(guide.faqs.length);
      expect(faqSchema.mainEntity[0].name).toBe(guide.faqs[0].question);
      expect(html).toContain(guide.faqs[0].answer);
    }

    expect(fetchMock).toHaveBeenCalled();
    expect(fetchedPaths.every((path) => path === "/api/products")).toBe(true);
    expect(fetchedPaths).not.toContain("/api/blog");
  });

  it("includes all source-managed guides in the CMS-backed blog index without writing blog records", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ posts: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));
    const response = await blogOnRequest({ request: new Request("https://trynext.shop/blog"), env: pageEnv() });
    const html = await response.text();

    expect(response.status).toBe(200);
    for (const guide of EDITORIAL_GUIDES) {
      expect(html).toContain(`/blog/${guide.slug}`);
      expect(html).toContain(guide.title);
    }
  });

  it("keeps the drinkware collection restricted to current mug and water-bottle groups", () => {
    expect(COMMERCE_CATEGORY_CONTENT.drinkware.productGroups.map((group) => group.key)).toEqual(["mugs", "water-bottles"]);
    expect(COMMERCE_CATEGORY_CONTENT.drinkware.productGroups.map((group) => group.categoryId)).toEqual([3, 7]);
    const inquiryFaq = COMMERCE_CATEGORY_CONTENT.drinkware.faqs.find((faq) => /team or event/i.test(faq.question));
    expect(inquiryFaq?.answer).toContain("no separate automatic bulk or corporate ordering flow");
  });
});

describe("active root Pages category renderer", () => {
  it("prerenders mug copy, current products, image alt text, current price and matching visible FAQ/schema", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      return new Response(JSON.stringify({ products: [{
        id: 501,
        name: "Custom Photo Mug",
        slug: "custom-photo-mug-current",
        price: 850,
        imageUrl: "/assets/products/custom-photo-mug.webp",
        stock: 4,
        sizes: ["11 oz"],
        colors: ["White"],
        customizable: true,
      }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await renderCommerceCategory(
      new Request("https://trynext.shop/custom-mugs-bangladesh", { headers: { "user-agent": "Googlebot/2.1" } }),
      pageEnv(),
      COMMERCE_CATEGORY_CONTENT.mugs,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Personalized Photo Mugs in Bangladesh");
    expect(html).toContain("A personalized photo mug is a mug personalized");
    expect(html).toContain("Custom Photo Mug");
    expect(html).toContain("৳850");
    expect(html).toContain('alt="Custom Photo Mug product photo"');
    expect(html).toContain('src="https://trynext.shop/assets/products/custom-photo-mug.webp"');
    expect(html).toContain("11 oz");
    expect(html).toContain("Available color/finish:</strong> White");
    expect(html).toContain("In stock in the live catalog");
    expect(html).toContain("Customize this product");
    expect(html).toContain("/design-studio");
    expect(html).toContain("/blog/how-to-design-a-custom-photo-mug");
    expect(html).toContain(COMMERCE_CATEGORY_CONTENT.mugs.faqs[0].answer);
    expect(html).toContain('<link rel="canonical" href="https://trynext.shop/custom-mugs-bangladesh">');
    expect(html).toContain('<meta property="og:title" content="Custom Photo Mugs in Bangladesh | Personalized Mugs | Trynext Lifestyle">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');

    const types = readSchemas(html).map((schema) => schema["@type"]);
    expect(types).toEqual(expect.arrayContaining(["FAQPage", "CollectionPage", "ItemList", "BreadcrumbList"]));
  });

  it("fetches both live product groups for the drinkware prerender and emits no tumbler offer", async () => {
    const requestedCategoryIds: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const categoryId = url.searchParams.get("categoryId") ?? "";
      requestedCategoryIds.push(categoryId);
      const product = categoryId === "3"
        ? { id: 601, name: "Current Mug", slug: "current-mug", price: 500, imageUrl: "/assets/products/current-mug.webp", stock: 2, customizable: true }
        : { id: 701, name: "Current Water Bottle", slug: "current-water-bottle", price: 900, imageUrl: "/assets/products/current-water-bottle.webp", stock: 1, customizable: true };
      return new Response(JSON.stringify({ products: [product] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const response = await renderCommerceCategory(
      new Request("https://trynext.shop/custom-drinkware-bangladesh"),
      pageEnv(),
      COMMERCE_CATEGORY_CONTENT.drinkware,
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(requestedCategoryIds.sort()).toEqual(["3", "7"]);
    expect(html).toContain("Current Mug");
    expect(html).toContain("Current Water Bottle");
    expect(html).toContain("Mugs or water bottles?");
    expect(html).toContain("Available color/finish:</strong> White");
    expect(html).toContain("Custom drinkware for teams and businesses");
    expect(html).toContain("This is an inquiry only");
    expect(html).not.toMatch(/Custom\s+tumbler|shop\s+tumblers/i);
    expect(html).toContain(COMMERCE_CATEGORY_CONTENT.drinkware.faqs.find((faq) => /larger request/i.test(faq.question))?.answer ?? "There is no separate automatic bulk or corporate ordering flow described on this page.");
  });

  it("fails closed for unknown or malformed stock in visible products and ItemList schema", async () => {
    const candidates = [
      { id: 801, name: "Missing Stock Mug", slug: "missing-stock-mug", stock: null },
      { id: 802, name: "Empty Stock Mug", slug: "empty-stock-mug", stock: "" },
      { id: 803, name: "Malformed Stock Mug", slug: "malformed-stock-mug", stock: "unknown" },
      { id: 804, name: "Zero Stock Mug", slug: "zero-stock-mug", stock: 0 },
      { id: 805, name: "Negative Stock Mug", slug: "negative-stock-mug", stock: -2 },
      { id: 806, name: "Verified Stock Mug", slug: "verified-stock-mug", stock: 2 },
    ].map((product) => ({ ...product, price: 700, customizable: true }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ products: candidates }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));

    const response = await renderCommerceCategory(
      new Request("https://trynext.shop/custom-mugs-bangladesh"),
      pageEnv(),
      COMMERCE_CATEGORY_CONTENT.mugs,
    );
    const html = await response.text();
    const itemList = readSchemas(html).find((schema) => schema["@type"] === "ItemList");

    expect(response.status).toBe(200);
    expect(html).toContain("Verified Stock Mug");
    for (const name of ["Missing Stock Mug", "Empty Stock Mug", "Malformed Stock Mug", "Zero Stock Mug", "Negative Stock Mug"]) {
      expect(html).not.toContain(name);
    }
    expect(itemList.itemListElement.map((entry: any) => entry.item.url)).toEqual(["https://trynext.shop/product/verified-stock-mug"]);
  });
});

describe("route and Markdown safety", () => {
  it("publishes exact static route declarations without dropping the dynamic CMS route", () => {
    const manifest = JSON.parse(readFileSync(new URL("../public/manus-routes.json", import.meta.url), "utf8")) as { routes: Array<{ path: string; title?: string }> };
    const paths = manifest.routes.map((route) => route.path);
    for (const guide of EDITORIAL_GUIDES) expect(paths).toContain(`/blog/${guide.slug}`);
    expect(paths).toContain("/blog/:slug");
    expect(new Set(paths).size).toBe(paths.length);
    expect(getEditorialGuide("how-to-design-a-custom-photo-mug")).toBeDefined();
  });

  it("renders only local article links and escapes HTML in source-managed Markdown", () => {
    const output = renderSimpleMarkdownHtml("## Safe heading\n\nText <script>alert(1)</script> and [product](/products?category=mugs).");
    expect(output).toContain("<h2>Safe heading</h2>");
    expect(output).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(output).toContain('<a href="/products?category=mugs">product</a>');
    expect(output).not.toContain("<script>alert");
  });
});
