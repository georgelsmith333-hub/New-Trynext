import type { Request } from "express";

export class BodyTooLargeError extends Error {
  constructor(public readonly limit: number) {
    super(`Request body exceeds ${limit} bytes`);
    this.name = "BodyTooLargeError";
  }
}

export class BodyTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Request body was not received within ${timeoutMs} ms`);
    this.name = "BodyTimeoutError";
  }
}

/**
 * Reads a raw request body into memory with a hard size cap and an overall
 * deadline. Stops collecting as soon as either limit is hit, so a slow or
 * oversized upload cannot hold memory or a connection open.
 */
export function readBoundedBody(req: Request, maxBytes: number, timeoutMs: number): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;

    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      req.off("data", onData);
      req.off("end", onEnd);
      req.off("error", onError);
      req.off("aborted", onAborted);
      action();
    };
    const onData = (chunk: Buffer) => {
      total += chunk.length;
      if (total > maxBytes) {
        finish(() => reject(new BodyTooLargeError(maxBytes)));
        return;
      }
      chunks.push(chunk);
    };
    const onEnd = () => finish(() => resolve(Buffer.concat(chunks)));
    const onError = (err: Error) => finish(() => reject(err));
    const onAborted = () => finish(() => reject(new Error("Upload was cancelled before it finished")));
    const timer = setTimeout(() => finish(() => reject(new BodyTimeoutError(timeoutMs))), timeoutMs);

    req.on("data", onData);
    req.on("end", onEnd);
    req.on("error", onError);
    req.on("aborted", onAborted);
  });
}
