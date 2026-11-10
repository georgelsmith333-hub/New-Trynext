import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  tables: {
    products: {
      slug: { name: "products.slug" },
      updatedAt: { name: "products.updated_at" },
      imageUrl: { name: "products.image_url" },
      name: { name: "products.name" },
      createdAt: { name: "products.created_at" },
    },
    categories: {
      slug: { name: "categories.slug" },
      name: { name: "categories.name" },
    },
    blogPosts: {
      slug: { name: "blog_posts.slug" },
      updatedAt: { name: "blog_posts.updated_at" },
      imageUrl: { name: "blog_posts.image_url" },
      title: { name: "blog_posts.title" },
      published: { name: "blog_posts.published" },
    },
  },
}));

vi.mock("@workspace/db", () => ({
  db: { select: mocks.select },
  productsTable: mocks.tables.products,
  categoriesTable: mocks.tables.categories,
  blogPostsTable: mocks.tables.blogPosts,
}));

vi.mock("drizzle-orm", () => ({
  desc: (column: unknown) => column,
  eq: (column: unknown, value: unknown) => ({ column, value }),
}));

vi.mock("../lib/logger", () => ({
  logger: { warn: mocks.warn, error: mocks.error },
}));

vi.mock("../lib/storefrontUrl", () => ({
  getStorefrontUrl: () => "https://trynext.shop",
}));

import sitemapRouter from "./sitemap";

const app = express();
app.use("/api", sitemapRouter);

function queryFor(table: unknown, rowsByTable: Map<unknown, unknown[]>, failure?: Error) {
  const createQuery = () => ({
    where: vi.fn(() => createQuery()),
    orderBy: vi.fn(() => createQuery()),
    then: (onFulfilled?: any, onRejected?: any) => {
      const result = failure
        ? Promise.resolve().then(() => { throw failure; })
        : Promise.resolve(rowsByTable.get(table) ?? []);
      return result.then(onFulfilled, onRejected);
    },
  });
  return createQuery();
}

describe("sitemap route", () => {
  beforeEach(() => {
    mocks.select.mockReset();
    mocks.warn.mockReset();
    mocks.error.mockReset();
  });

  it("returns core and source-managed URLs when every database query fails", async () => {
    const failure = new Error("database connection unavailable");
    mocks.select.mockImplementation(() => ({
      from: (table: unknown) => queryFor(table, new Map(), failure),
    }));

    const response = await request(app).get("/api/sitemap.xml");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/xml");
    expect(response.text).toContain("https://trynext.shop/custom-mugs-bangladesh");
    expect(response.text).toContain("https://trynext.shop/custom-drinkware-bangladesh");
    expect(response.text).toContain("https://trynext.shop/blog/how-to-design-a-custom-photo-mug");
    expect(response.text).toContain("https://trynext.shop/blog/custom-mug-gift-ideas-for-couples");
    expect(response.text).toContain("https://trynext.shop/blog/custom-drinkware-gifts-in-bangladesh");
    expect(mocks.warn).toHaveBeenCalledTimes(3);
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it("retains dynamic catalog and CMS URLs and avoids duplicate static article URLs", async () => {
    const rowsByTable = new Map<unknown, unknown[]>([
      [mocks.tables.products, [{
        slug: "custom-mug-live",
        updatedAt: new Date("2026-10-01T00:00:00.000Z"),
        imageUrl: "/products/mug.jpg",
        name: "Mug & Photo",
      }]],
      [mocks.tables.categories, [{ slug: "mugs", name: "Mugs" }]],
      [mocks.tables.blogPosts, [
        {
          slug: "how-to-design-a-custom-photo-mug",
          updatedAt: new Date("2026-10-02T00:00:00.000Z"),
          imageUrl: null,
          title: "CMS duplicate of a static guide",
        },
        {
          slug: "live-cms-guide",
          updatedAt: new Date("2026-10-03T00:00:00.000Z"),
          imageUrl: null,
          title: "A live CMS guide",
        },
      ]],
    ]);
    mocks.select.mockImplementation(() => ({
      from: (table: unknown) => queryFor(table, rowsByTable),
    }));

    const response = await request(app).get("/api/sitemap.xml");

    expect(response.status).toBe(200);
    expect(response.text).toContain("https://trynext.shop/product/custom-mug-live");
    expect(response.text).toContain("https://trynext.shop/products?category=mugs");
    expect(response.text).toContain("https://trynext.shop/blog/live-cms-guide");
    expect(response.text).toContain("Mug &amp; Photo");
    expect(response.text.match(/<loc>https:\/\/trynext\.shop\/blog\/how-to-design-a-custom-photo-mug<\/loc>/g)).toHaveLength(1);
    expect(mocks.warn).not.toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
  });
});
