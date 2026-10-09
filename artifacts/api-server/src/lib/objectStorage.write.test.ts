import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Exercises the REAL storage adapter (real AWS SDK client) against a local
 * stand-in S3 server, so the through-the-API upload write is tested end to end
 * without any real bucket or credentials. The stand-in records what the SDK
 * actually sends and can be told to refuse the write.
 */
const stub = vi.hoisted(() => ({ port: 0 }));
vi.hoisted(() => {
  process.env.S3_ACCESS_KEY_ID = "test-access-key-id";
  process.env.S3_SECRET_ACCESS_KEY = "test-secret-not-real";
  process.env.S3_BUCKET = "stand-in-bucket";
  process.env.S3_REGION = "auto";
  process.env.S3_FORCE_PATH_STYLE = "1";
  delete process.env.R2_ACCOUNT_ID;
});

type Seen = { method?: string; url?: string; headers: http.IncomingHttpHeaders; body: Buffer };
let seen: Seen[] = [];
let respond: (res: http.ServerResponse) => void = (res) => { res.statusCode = 200; res.end(); };
let server: http.Server;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      seen.push({ method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks) });
      respond(res);
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  stub.port = (server.address() as AddressInfo).port;
  process.env.S3_ENDPOINT = `http://127.0.0.1:${stub.port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));
beforeEach(() => { seen = []; respond = (res) => { res.statusCode = 200; res.end(); }; });

const ID = "123e4567-e89b-42d3-a456-426614174000";
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 7)]);

async function load() {
  const mod = await import("./objectStorage");
  return mod;
}

describe("storeUploadedObject against a stand-in S3 server", () => {
  it("writes the exact bytes to uploads/<id> with the declared content type", async () => {
    const { ObjectStorageService } = await load();
    await new ObjectStorageService().storeUploadedObject(ID, PNG, "image/png");
    expect(seen).toHaveLength(1);
    const put = seen[0];
    expect(put.method).toBe("PUT");
    expect(put.url).toContain(`/stand-in-bucket/uploads/${ID}`);
    expect(put.headers["content-type"]).toBe("image/png");
    // Whatever framing the SDK chose (plain or aws-chunked), the PNG bytes must be inside it.
    expect(put.body.includes(PNG)).toBe(true);
  });

  it("does not ask the storage provider for optional trailing checksums", async () => {
    const { ObjectStorageService } = await load();
    await new ObjectStorageService().storeUploadedObject(ID, PNG, "image/png");
    const h = seen[0].headers;
    expect(String(h["x-amz-content-sha256"] ?? "")).not.toMatch(/STREAMING-.*TRAILER/);
    expect(h["x-amz-sdk-checksum-algorithm"]).toBeUndefined();
    expect(h["x-amz-trailer"]).toBeUndefined();
    expect(String(h["content-encoding"] ?? "")).not.toMatch(/aws-chunked/);
  });

  it("rejects when the storage server refuses the write, without leaking the secret", async () => {
    respond = (res) => {
      res.statusCode = 403;
      res.setHeader("content-type", "application/xml");
      res.end("<Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>");
    };
    const { ObjectStorageService } = await load();
    const err = await new ObjectStorageService().storeUploadedObject(ID, PNG, "image/png").catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(JSON.stringify(err, Object.getOwnPropertyNames(err))).not.toContain("test-secret-not-real");
  });
});
