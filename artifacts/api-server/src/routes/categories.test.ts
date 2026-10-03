import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import categoriesRouter from "./categories";
import request from "supertest";
import { db } from "@workspace/db";

const mockRedisDel = vi.fn();
const mockLogActivity = vi.fn();
const mockGetAdminId = vi.fn().mockReturnValue(1);

let mockCategories: any[] = [];
let mockCategoryRow: any = null;

vi.mock("../middlewares/adminAuth", () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../lib/activityLog", () => ({
  logActivity: (...args: any[]) => mockLogActivity(...args),
  getAdminId: () => mockGetAdminId(),
}));

vi.mock("../lib/redis", () => ({
  redisCacheGet: vi.fn().mockResolvedValue(null),
  redisCacheSet: vi.fn().mockResolvedValue(undefined),
  redisCacheDel: (...args: any[]) => mockRedisDel(...args),
}));

vi.mock("../lib/sitemapPing", () => ({
  pingSitemaps: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@workspace/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockImplementation(() => {
      return {
        where: vi.fn().mockReturnThis(),
        values: vi.fn().mockImplementation((vals: any) => {
          mockCategoryRow = { id: 1, ...vals, createdAt: new Date(), productCount: 0 };
          mockCategories.push(mockCategoryRow);
          return { returning: vi.fn().mockResolvedValue([mockCategoryRow]) };
        }),
        set: vi.fn().mockImplementation((vals: any) => {
          if (mockCategoryRow) Object.assign(mockCategoryRow, vals);
          return { where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([mockCategoryRow]) };
        }),
        returning: vi.fn().mockResolvedValue(mockCategories),
      };
    }),
    insert: vi.fn().mockImplementation((table: any) => {
      return {
        values: vi.fn().mockImplementation((vals: any) => {
          mockCategoryRow = { id: 1, ...vals, createdAt: new Date(), productCount: 0 };
          mockCategories.push(mockCategoryRow);
          return { returning: vi.fn().mockResolvedValue([mockCategoryRow]) };
        }),
      };
    }),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((vals: any) => ({
        where: vi.fn().mockImplementation(() => ({
          returning: vi.fn().mockResolvedValue([mockCategoryRow]),
        })),
      })),
    })),
    delete: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    })),
    execute: vi.fn().mockResolvedValue([]),
  },
  categoriesTable: {
    id: { name: "id" },
    name: { name: "name" },
    slug: { name: "slug" },
    description: { name: "description" },
    imageUrl: { name: "image_url" },
    productCount: { name: "product_count" },
    createdAt: { name: "created_at" },
  },
  productsTable: {
    id: { name: "id" },
    categoryId: { name: "category_id" },
  },
}));

const app = express();
app.use(express.json());
app.use((req: any, _res, next) => {
  req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
  next();
});
app.use("/api", categoriesRouter);

describe("Categories API", () => {
  beforeEach(() => {
    mockCategories = [];
    mockCategoryRow = null;
    mockRedisDel.mockClear();
    mockLogActivity.mockClear();
  });

  it("POST /api/categories validates required fields with Zod", async () => {
    const res = await request(app).post("/api/categories").send({ description: "Missing name and slug" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
    expect(res.body.details).toBeDefined();
  });

  it("POST /api/categories creates a category with valid data", async () => {
    const res = await request(app).post("/api/categories").send({ name: "Mugs", slug: "mugs", description: "Coffee mugs" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Mugs");
    expect(res.body.slug).toBe("mugs");
  });

  it("PUT /api/categories/:id rejects invalid slug", async () => {
    const res = await request(app).put("/api/categories/1").send({ slug: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  it("PUT /api/categories/:id rejects empty body", async () => {
    const res = await request(app).put("/api/categories/1").send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No fields to update/i);
  });

  const duplicateSlugError = () =>
    Object.assign(new Error("Failed query: write to categories"), {
      cause: Object.assign(new Error("duplicate key value violates unique constraint"), { code: "23505" }),
    });

  it("POST /api/categories answers a duplicate slug with 409, not 500", async () => {
    vi.mocked(db.insert).mockImplementationOnce((() => ({
      values: () => ({ returning: () => Promise.reject(duplicateSlugError()) }),
    })) as any);
    const res = await request(app).post("/api/categories").send({ name: "Mugs", slug: "mugs" });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "conflict", message: "A category with this slug already exists." });
    expect(mockRedisDel).not.toHaveBeenCalled();
  });

  it("POST /api/categories still answers other database failures with 500", async () => {
    vi.mocked(db.insert).mockImplementationOnce((() => ({
      values: () => ({ returning: () => Promise.reject(new Error("connection terminated")) }),
    })) as any);
    const res = await request(app).post("/api/categories").send({ name: "Mugs", slug: "mugs" });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("internal_error");
  });

  it("PUT /api/categories/:id answers a duplicate slug with 409", async () => {
    // The handler reads the current row first, then updates it.
    vi.mocked(db.select).mockImplementationOnce((() => ({
      from: () => ({ where: () => Promise.resolve([{ id: 1, name: "Old", slug: "old" }]) }),
    })) as any);
    vi.mocked(db.update).mockImplementationOnce((() => ({
      set: () => ({ where: () => ({ returning: () => Promise.reject(duplicateSlugError()) }) }),
    })) as any);
    const res = await request(app).put("/api/categories/1").send({ slug: "taken" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("conflict");
  });
});
