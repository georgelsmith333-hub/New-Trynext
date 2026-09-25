import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, ShieldCheck, Upload } from "lucide-react";
import { getApiUrl, getAuthHeaders } from "@/lib/utils";

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
const PHOTOPEA_TIMEOUT_MS = 60_000;

async function adminFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(getApiUrl(url), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...getAuthHeaders(),
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body as { message?: string }).message ?? `Request failed (${response.status})`);
  return body as T;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the artwork file."));
    reader.readAsDataURL(file);
  });
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

function renderPsdInPhotopea(iframe: HTMLIFrameElement, base64: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    let finished = false;
    const timeout = window.setTimeout(() => finishReject(new Error("Photopea did not finish. Make sure the editor is open in this browser.")), PHOTOPEA_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      iframe.onload = null;
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
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      if (event.data === "done") {
        iframe.contentWindow?.postMessage('app.activeDocument.saveToOE("png")', "*");
        return;
      }
      if (event.data instanceof ArrayBuffer) {
        finishResolve(new Uint8Array(event.data));
        return;
      }
      if (typeof event.data === "string" && /^error/i.test(event.data)) {
        finishReject(new Error(event.data));
      }
    };

    window.addEventListener("message", onMessage);
    iframe.onload = () => {
      const bytes = decodeBase64(base64);
      const buffer = asArrayBuffer(bytes);
      iframe.contentWindow?.postMessage(buffer, "*", [buffer]);
    };
    iframe.src = `${PHOTOPEA_URL}?trynext=${Date.now()}`;
  });
}

export default function SmartMockupBrowserValidator() {
  const [surfaces, setSurfaces] = useState<BrowserSurface[]>([]);
  const [surfaceKey, setSurfaceKey] = useState("cap/black/back");
  const [artwork, setArtwork] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "rendering" | "complete" | "error">("idle");
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
    setStatusMessage("Preparing the private PSD pair…");
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
      setStatusMessage("Rendering the modified Smart Object in your browser…");
      const modifiedBytes = await renderPsdInPhotopea(iframeRef.current, payload.modifiedPsdBase64);
      setStatusMessage("Rendering the untouched baseline in your browser…");
      const baselineBytes = await renderPsdInPhotopea(iframeRef.current, payload.originalPsdBase64);
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
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Browser-side Photopea validation failed.");
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
                value={selectedSurface?.surfaceKey ?? ""}
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
            {status === "loading" ? "Preparing…" : status === "rendering" ? "Rendering in Photopea…" : "Run browser validation"}
          </button>

          {statusMessage && (
            <div className={`flex gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5 ${status === "complete" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : status === "error" ? "border-red-400/30 bg-red-400/10 text-red-200" : "border-white/10 bg-white/5 text-slate-300"}`}>
              {status === "complete" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : status === "error" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />}
              <span>{statusMessage}</span>
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