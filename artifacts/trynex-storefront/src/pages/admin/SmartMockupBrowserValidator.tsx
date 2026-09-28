import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, ShieldCheck, Upload } from "lucide-react";
import { getApiUrl, getAuthHeaders } from "@/lib/utils";
import {
  buildSmartObjectRefreshScript,
  SMART_OBJECT_ERROR_MARKER,
  SMART_OBJECT_REFRESH_MARKER,
} from "./photopeaSmartObject";

interface BrowserSurface {
  surfaceKey: string;
  family: string;
  color: string;
  view: string;
  relativePath: string;
  masterFormat: "psd" | "psb";
  smartObjectId: string;
  smartObjectName: string | null;
}

interface BrowserPayload {
  originalPsdBase64: string;
  modifiedPsdBase64: string;
  smartObjectName: string;
  documentWidth: number;
  documentHeight: number;
}

interface BrowserResult {
  renderedSha256: string;
  baselineSha256: string;
  differsFromBaseline: boolean;
  width: number;
  height: number;
  outputBytes: number;
}

const PHOTOPEA_URL = "https://www.photopea.com/";
const PHOTOPEA_ORIGIN = new URL(PHOTOPEA_URL).origin;
const PHOTOPEA_TIMEOUT_MS = 60_000;
const ADMIN_REQUEST_TIMEOUT_MS = 45_000;

async function adminFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), ADMIN_REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(getApiUrl(url), {
      ...init,
      signal: init.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...getAuthHeaders(),
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("The API took too long to prepare the private PSD pair. Retry once the API is healthy.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body as { message?: string }).message ?? `Request failed (${response.status})`);
  return body as T;
}

async function fileToDataUrl(file: File): Promise<string> {
  const mimeByExtension: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = file.type.toLowerCase() || mimeByExtension[extension];
  if (!mimeType || !["image/png", "image/jpeg", "image/webp"].includes(mimeType)) {
    throw new Error("Choose a PNG, JPG, JPEG, or WebP artwork file.");
  }
  if (!file.size) {
    throw new Error("The selected artwork file is empty.");
  }

  try {
    // FileReader intermittently fails for files selected from Android's
    // document picker. Reading the bytes directly is more reliable and keeps
    // the private artwork in the browser until the authenticated API request.
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return `data:${mimeType};base64,${btoa(binary)}`;
  } catch {
    throw new Error("Could not read the artwork file from this browser. Choose the file again or use a PNG under 10MB.");
  }
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function readPhotopeaExport(value: unknown): Uint8Array | null {
  if (Object.prototype.toString.call(value) === "[object ArrayBuffer]") {
    return new Uint8Array(value as ArrayBuffer);
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
  }
  return null;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", asArrayBuffer(bytes));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readImageDimensions(bytes: Uint8Array): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(new Blob([asArrayBuffer(bytes)], { type: "image/png" }));
  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dimensions;
}

export function renderPsdInPhotopea(
  iframe: HTMLIFrameElement,
  base64: string,
  smartObjectName?: string,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    let finished = false;
    let refreshRequested = false;
    let exportRequested = false;
    let iframeLoaded = false;
    let photopeaReady = false;
    let documentSent = false;
    let documentOpened = false;
    let phase = "loading Photopea";
    const receivedMessageKinds = new Set<string>();
    let lastMessageOrigin = "";
    const timeout = window.setTimeout(() => {
      const received = receivedMessageKinds.size > 0 ? ` Received: ${Array.from(receivedMessageKinds).join(", ")}.` : "";
      const origin = lastMessageOrigin ? ` Last origin: ${lastMessageOrigin}.` : "";
      finishReject(new Error(`Photopea timed out while ${phase}. Make sure the editor is open in this browser.${received}${origin}`));
    }, PHOTOPEA_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      iframe.removeEventListener("load", onLoad);
    };
    const finishResolve = (value: Uint8Array) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(value);
    };
    const finishReject = (error: Error) => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(error);
    };
    const postToPhotopea = (message: string | ArrayBuffer, transfer?: Transferable[]) => {
      if (!iframe.contentWindow) {
        finishReject(new Error(`Photopea ${phase} failed because the editor frame is unavailable.`));
        return;
      }
      iframe.contentWindow.postMessage(message, "*", transfer ?? []);
    };
    const sendDocumentIfReady = () => {
      if (finished || documentSent || !iframeLoaded || !photopeaReady) return;
      documentSent = true;
      phase = "opening the PSD";
      const bytes = decodeBase64(base64);
      const buffer = asArrayBuffer(bytes);
      postToPhotopea(buffer, [buffer]);
    };
    const requestExport = () => {
      if (exportRequested) return;
      exportRequested = true;
      phase = "exporting the PNG";
      postToPhotopea('app.activeDocument.saveToOE("png")');
    };
    const onMessage = (event: MessageEvent) => {
      // Photopea's live-messaging contract identifies responses by their
      // origin, not by a stable WindowProxy. Embedded browsers can report a
      // nested frame (or null) as event.source even though the message is a
      // valid response from Photopea.
      if (event.origin !== PHOTOPEA_ORIGIN && event.origin !== "") return;
      lastMessageOrigin = event.origin;
      if (event.data === "done" && !documentSent) receivedMessageKinds.add("ready");
      else if (event.data === "done") receivedMessageKinds.add("done");
      else if (typeof event.data === "string") receivedMessageKinds.add(`string:${event.data.slice(0, 80)}`);
      else if (Object.prototype.toString.call(event.data) === "[object ArrayBuffer]" || ArrayBuffer.isView(event.data)) receivedMessageKinds.add("ArrayBuffer");
      else receivedMessageKinds.add(typeof event.data);
      if (event.data === SMART_OBJECT_REFRESH_MARKER) {
        // The refresh script only saves and closes the placed layer. Export
        // the parent here so Photopea emits one unambiguous ArrayBuffer.
        requestExport();
        return;
      }
      if (event.data === "done") {
        if (!documentSent) {
          // Photopea sends "done" once when the editor is initialized and
          // again after each command/file is processed. Do not treat the
          // initialization message as confirmation that the PSD opened.
          photopeaReady = true;
          sendDocumentIfReady();
          return;
        }
        if (!documentOpened) {
          documentOpened = true;
          if (smartObjectName) {
            refreshRequested = true;
            phase = "refreshing the Smart Object";
            postToPhotopea(buildSmartObjectRefreshScript(smartObjectName));
            return;
          }
          requestExport();
          return;
        }
        // Opening the linked Smart Object can emit another "done" message.
        // Wait for the explicit echo marker after save/close before exporting
        // the parent document.
        if (refreshRequested) return;
        requestExport();
        return;
      }
      const exportBytes = readPhotopeaExport(event.data);
      if (exportBytes) {
        if (exportBytes.byteLength === 0) {
          finishReject(new Error(`Photopea returned an empty PNG export while ${phase}.`));
          return;
        }
        finishResolve(exportBytes);
        return;
      }
      if (typeof event.data === "string" && /^error/i.test(event.data)) {
        finishReject(new Error(`Photopea ${phase} returned an error: ${event.data}`));
        return;
      }
      if (typeof event.data === "string" && event.data.startsWith(SMART_OBJECT_ERROR_MARKER)) {
        finishReject(new Error(`Photopea Smart Object refresh failed during ${phase}: ${event.data.slice(SMART_OBJECT_ERROR_MARKER.length) || "unknown error"}`));
      }
    };

    const onLoad = () => {
      iframeLoaded = true;
      sendDocumentIfReady();
    };

    window.addEventListener("message", onMessage);
    iframe.addEventListener("load", onLoad, { once: true });
    iframe.src = `${PHOTOPEA_URL}?trynext=${Date.now()}`;
  });
}

function createIsolatedPhotopeaFrame(): HTMLIFrameElement {
  const frame = document.createElement("iframe");
  frame.title = "Photopea baseline validation session";
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.left = "-10000px";
  frame.style.top = "0";
  frame.style.width = "1024px";
  frame.style.height = "768px";
  frame.style.border = "0";
  frame.style.opacity = "0";
  frame.style.pointerEvents = "none";
  document.body.appendChild(frame);
  return frame;
}

export default function SmartMockupBrowserValidator() {
  const [surfaces, setSurfaces] = useState<BrowserSurface[]>([]);
  const [surfaceKey, setSurfaceKey] = useState("cap/black/back");
  const [artwork, setArtwork] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "rendering" | "complete" | "error">("idle");
  const [renderPhase, setRenderPhase] = useState<"modified" | "baseline" | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<BrowserResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    void adminFetch<{ surfaces: BrowserSurface[] }>("/api/admin/smart-mockups/browser-catalog")
      .then((data) => {
        setSurfaces(data.surfaces);
        setSurfaceKey((current) => data.surfaces.some((surface) => surface.surfaceKey === current)
          ? current
          : data.surfaces[0]?.surfaceKey ?? "");
      })
      .catch((error: unknown) => {
        setStatus("error");
        setStatusMessage(error instanceof Error ? error.message : "Could not load the Smart Mockup catalog.");
      });
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectedSurface = useMemo(
    () => surfaces.find((surface) => surface.surfaceKey === surfaceKey) ?? surfaces[0],
    [surfaces, surfaceKey],
  );

  const runValidation = async () => {
    if (!selectedSurface) {
      setStatus("error");
      setStatusMessage("No staged Smart Mockup surface is available.");
      return;
    }
    if (!artwork) {
      setStatus("error");
      setStatusMessage("Choose a PNG, JPG, or WebP artwork file first.");
      return;
    }
    setResult(null);
    setStatus("loading");
    setRenderPhase(null);
    setStatusMessage("Preparing the private PSD pair…");
    let baselineFrame: HTMLIFrameElement | null = null;
    try {
      const payload = await adminFetch<BrowserPayload>("/api/admin/smart-mockups/browser-payload", {
        method: "POST",
        body: JSON.stringify({
          relativePath: selectedSurface.relativePath,
          smartObjectId: selectedSurface.smartObjectId,
          artwork: await fileToDataUrl(artwork),
        }),
      });

      if (!iframeRef.current) throw new Error("Photopea frame is not ready.");
      setStatus("rendering");
      setRenderPhase("modified");
      setStatusMessage("Rendering the modified Smart Object in your browser…");
      const modifiedBytes = await renderPsdInPhotopea(
        iframeRef.current,
        payload.modifiedPsdBase64,
        payload.smartObjectName,
      );
      setRenderPhase("baseline");
      setStatusMessage("Rendering the untouched baseline in your browser…");
      // Use a new Photopea session for the untouched source. Reusing the
      // modified session can retain the saved Smart Object composite or
      // deliver a late export from the previous document, making the
      // modified-vs-baseline comparison falsely pass or falsely fail.
      baselineFrame = createIsolatedPhotopeaFrame();
      const baselineBytes = await renderPsdInPhotopea(baselineFrame, payload.originalPsdBase64);
      const [renderedSha256, baselineSha256, dimensions] = await Promise.all([
        sha256(modifiedBytes),
        sha256(baselineBytes),
        readImageDimensions(modifiedBytes),
      ]);
      const validation: BrowserResult = {
        renderedSha256,
        baselineSha256,
        differsFromBaseline: renderedSha256 !== baselineSha256,
        width: dimensions.width,
        height: dimensions.height,
        outputBytes: modifiedBytes.byteLength,
      };
      setResult(validation);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(new Blob([asArrayBuffer(modifiedBytes)], { type: "image/png" })));
      setStatus(validation.differsFromBaseline ? "complete" : "error");
      setStatusMessage(validation.differsFromBaseline
        ? "Photopea produced a changed composite. The Smart Object artwork entered the render."
        : "Photopea returned the same composite as the untouched baseline. The template remains unapproved.");
    } catch (error) {
      setRenderPhase(null);
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Browser-side Photopea validation failed.");
    } finally {
      baselineFrame?.remove();
    }
  };

  return (
    <section className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="font-black">Browser Photopea validation</h2>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">
            Uses the Photopea session already open in your browser. Nothing is activated automatically; the modified export must differ from the untouched baseline.
          </p>
        </div>
        <a href={PHOTOPEA_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-300 hover:text-orange-200">
          Open Photopea <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-300">
              Staged Smart Mockup surface
              <select
                value={surfaceKey}
                onChange={(event) => setSurfaceKey(event.target.value)}
                disabled={status === "loading" || status === "rendering"}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm font-medium text-white outline-none focus:border-orange-400"
              >
                {surfaces.map((surface) => (
                  <option key={surface.surfaceKey} value={surface.surfaceKey}>
                    {surface.family} · {surface.color} · {surface.view}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-300">
              Artwork to place
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setArtwork(event.target.files?.[0] ?? null)}
                disabled={status === "loading" || status === "rendering"}
                className="mt-1.5 block w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void runValidation()}
            disabled={!selectedSurface || !artwork || status === "loading" || status === "rendering"}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" || status === "rendering" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {status === "loading"
              ? "Preparing…"
              : status === "rendering"
                ? renderPhase === "baseline" ? "Rendering baseline…" : "Rendering modified export…"
                : "Run browser validation"}
          </button>

          {statusMessage && (
            <div className={`flex gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5 ${status === "complete" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : status === "error" ? "border-red-400/30 bg-red-400/10 text-red-200" : "border-white/10 bg-white/5 text-slate-300"}`}>
              {status === "complete" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : status === "error" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />}
              <span aria-live="polite">{statusMessage}</span>
            </div>
          )}

          {result && (
            <dl className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-300 sm:grid-cols-2">
              <div><dt className="text-slate-500">Output</dt><dd className="font-bold text-white">{result.width} × {result.height} · {result.outputBytes.toLocaleString()} bytes</dd></div>
              <div><dt className="text-slate-500">Changed composite</dt><dd className={`font-bold ${result.differsFromBaseline ? "text-emerald-300" : "text-red-300"}`}>{result.differsFromBaseline ? "PASS" : "FAIL"}</dd></div>
              <div className="min-w-0"><dt className="text-slate-500">Modified SHA-256</dt><dd className="truncate font-mono text-[10px]">{result.renderedSha256}</dd></div>
              <div className="min-w-0"><dt className="text-slate-500">Baseline SHA-256</dt><dd className="truncate font-mono text-[10px]">{result.baselineSha256}</dd></div>
            </dl>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <div className="border-b border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Photopea session</div>
          <iframe ref={iframeRef} title="Photopea browser validation session" className="h-64 w-full border-0 bg-white" />
          {previewUrl && (
            <div className="border-t border-white/10 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-300">Modified export</p>
              <img src={previewUrl} alt="Photopea modified mockup export" className="max-h-52 w-full rounded-lg bg-white object-contain" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}