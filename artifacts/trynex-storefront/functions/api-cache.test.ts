import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetGatewayState, onRequest } from "../../../functions/api/[[path]].ts";

class StrictMemoryCache {
  readonly entries = new Map<string, Response>();

  async match(request: Request): Promise<Response | undefined> {
    return this.entries.get(request.url)?.clone();
  }

  async put(request: Request, response: Response): Promise<void> {
    if (response.headers.has("vary")) {
      throw new TypeError("Synthetic cache requests cannot satisfy Vary headers");
    }
    this.entries.set(request.url, response.clone());
  }
}

let edgeCache: StrictMemoryCache;

function catalogResponse(headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify({ products: [] }), {
    status: 200,
    headers: new Headers({
      "content-type": "application/json",
      vary: "Origin",
      ...Object.fromEntries(new Headers(headers).entries()),
    }),
  });
}

function stubCatalogOrigin(responseFactory: () => Response = () => catalogResponse()) {
  const fetchMock = vi.fn(async () => responseFactory());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function callGateway(
  route: string,
  headers: HeadersInit = {},
): Promise<Response> {
  const request = new Request(`https://trynext.shop/api/${route}`, {
    method: "GET",
    headers,
  });
  return onRequest({
    request,
    env: {},
    params: { path: route.split("?")[0].split("/") },
  } as never);
}

describe("public catalog edge cache safety", () => {
  beforeEach(() => {
    __resetGatewayState();
    edgeCache = new StrictMemoryCache();
    vi.stubGlobal("caches", { default: edgeCache });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores a public catalog response without Vary and serves the next identical request from cache", async () => {
    const fetchMock = stubCatalogOrigin();

    const miss = await callGateway("products?page=1&limit=24", {
      origin: "https://trynext.shop",
    });
    expect(miss.headers.get("X-Trynext-Edge-Cache")).toBe("MISS");
    expect(miss.headers.get("X-Trynext-Edge-Cache-Store")).toBe("STORED");
    expect(miss.headers.get("Cache-Control")).toMatch(/public/);
    expect(miss.headers.get("vary")).toBe("Origin");
    expect(edgeCache.entries.size).toBe(1);
    expect([...edgeCache.entries.values()][0].headers.has("vary")).toBe(false);

    const hit = await callGateway("products?page=1&limit=24", {
      origin: "https://trynext.shop",
    });
    expect(hit.headers.get("X-Trynext-Edge-Cache")).toBe("HIT");
    expect(hit.headers.get("X-Trynext-Edge-Cache-Store")).toBe("HIT");
    expect(hit.headers.get("access-control-allow-origin")).toBe("https://trynext.shop");
    expect(await hit.json()).toEqual({ products: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["search query", "products?search=hoodie", {}],
    ["query alias", "products?q=hoodie", {}],
    ["unknown query parameter", "products?account=private", {}],
    ["browser cookie", "products", { cookie: "session=private" }],
    ["authorization", "products", { authorization: "Bearer user-token" }],
    ["user context header", "products", { "x-customer-id": "customer-123" }],
    ["API key header", "products", { "x-api-key": "private-key" }],
  ])("does not cache a %s request", async (_label, route, headers) => {
    stubCatalogOrigin();

    const response = await callGateway(route, headers);

    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Trynext-Edge-Cache")).not.toBe("HIT");
    expect(edgeCache.entries.size).toBe(0);
  });

  it.each([
    ["Set-Cookie", { "set-cookie": "session=private; HttpOnly" }],
    ["non-origin Vary", { vary: "Accept-Language" }],
    ["private cache directive", { "cache-control": "private, max-age=60" }],
  ])("does not store an origin response with %s", async (_label, headers) => {
    stubCatalogOrigin(() => catalogResponse(headers));

    const response = await callGateway("products?page=1");

    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Trynext-Edge-Cache")).toBe("BYPASS");
    expect(response.headers.get("X-Trynext-Edge-Cache-Store")).toBe("UNSAFE_RESPONSE");
    expect(edgeCache.entries.size).toBe(0);
  });
});