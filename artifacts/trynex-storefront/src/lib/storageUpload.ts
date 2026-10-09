/**
 * Uploads one file to private storage. The browser first tries the address the
 * API issued (straight to the storage bucket). If the bucket refuses the
 * browser (for example because of its cross-origin rules) or errors, the same
 * file is sent through the API using the signed fallback address from the same
 * response. If both fail the error says exactly what happened on each path;
 * nothing is reported as uploaded unless one of them succeeded.
 */
export interface UploadTarget {
  uploadURL: string;
  /** Relative API path, present when the API can accept the file itself. */
  fallbackUploadURL?: string;
}

export interface UploadDeps {
  fetchImpl?: typeof fetch;
  /** Turns a relative API path into a full URL (the storefront's getApiUrl). */
  resolveApiUrl: (path: string) => string;
}

export type UploadRoute = "direct" | "api";

export class StorageUploadError extends Error {
  constructor(message: string, public readonly directDetail: string | null, public readonly apiDetail: string | null) {
    super(message);
    this.name = "StorageUploadError";
  }
}

// After the direct path is refused for a browser/permission reason, go straight
// to the API for the rest of this page session instead of failing every time.
let directRefused = false;
export function resetDirectUploadMemory(): void {
  directRefused = false;
}

async function readServerMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown; reason?: unknown };
    const message = typeof body.message === "string" && body.message ? body.message.slice(0, 160) : "";
    // A short machine code such as "storage_access_denied" says WHY storage refused the file.
    const reason = typeof body.reason === "string" && /^[a-z_]{1,40}$/.test(body.reason) ? body.reason : "";
    if (message || reason) return `${message}${reason ? ` [${reason}]` : ""}`.trim();
  } catch {
    /* not JSON */
  }
  return "";
}

export async function uploadToStorage(target: UploadTarget, file: Blob, contentType: string, deps: UploadDeps): Promise<UploadRoute> {
  const doFetch = deps.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  let directDetail: string | null = null;

  const skipDirect = directRefused && Boolean(target.fallbackUploadURL);
  if (!skipDirect) {
    try {
      const direct = await doFetch(target.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": contentType } });
      if (direct.ok) return "direct";
      directDetail = `storage answered ${direct.status}`;
      if (direct.status >= 400 && direct.status < 500) directRefused = true;
    } catch {
      // A failed fetch with no status is how a browser reports a blocked cross-origin upload.
      directDetail = "the browser could not reach storage directly";
      directRefused = true;
    }
  } else {
    directDetail = "skipped, storage refused this browser earlier";
  }

  if (!target.fallbackUploadURL) {
    throw new StorageUploadError(`The file could not be uploaded (${directDetail}).`, directDetail, null);
  }

  let apiDetail: string;
  try {
    const viaApi = await doFetch(deps.resolveApiUrl(target.fallbackUploadURL), {
      method: "PUT",
      body: file,
      headers: { "Content-Type": contentType, "X-Requested-With": "XMLHttpRequest" },
    });
    if (viaApi.ok) return "api";
    const message = await readServerMessage(viaApi);
    apiDetail = `our server answered ${viaApi.status}${message ? `: ${message}` : ""}`;
  } catch {
    apiDetail = "our server could not be reached";
  }
  throw new StorageUploadError(`The file could not be uploaded (direct: ${directDetail}; through our server: ${apiDetail}).`, directDetail, apiDetail);
}
