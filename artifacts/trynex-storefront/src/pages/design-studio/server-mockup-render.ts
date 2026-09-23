import { getApiUrl } from "@/lib/utils";
import {
  composeDesignTexture,
  type ComposerLayer,
  type ComposerPrintZone,
  type UnifiedMockupSurface,
} from "./composer";

type RuntimeRole = "studioBackground" | "base" | "shadow" | "protected" | "highlight" | "printMask";
type OptionalRuntimeRole = "displacement";

type ReleaseSurface = {
  surfaceKey: string;
  family: string;
  color: string;
  view: string;
  masterPath: string;
  masterChecksum: string;
  masterSize: number;
  masterFormat: "psd" | "psb";
  smartObject: {
    layerName: string;
    id: string;
    placed: string;
    transform: number[];
    proofDesign: string;
  };
  normalizedFrame: { canvasWidth: number; canvasHeight: number; x: number; y: number; w: number; h: number };
  printZone: { x: number; y: number; w: number; h: number };
  roles: Record<RuntimeRole, { path: string; sha256: string; sourceLayerPrefix: string }>
    & Partial<Record<OptionalRuntimeRole, { path: string; sha256: string; sourceLayerPrefix: string }>>;
};

type ReleaseManifest = {
  status: string;
  surfaces: ReleaseSurface[];
};

type ServerSurfaceManifest = {
  schema: "trynext-smart-mockup-ingestion/v1";
  releaseVersion: "smart-v10.3";
  sourceKitKey: string;
  category: ReleaseSurface["family"];
  color: string;
  face: ReleaseSurface["view"];
  master: {
    fileName: string;
    mime: "image/vnd.adobe.photoshop" | "application/vnd.adobe.photoshop";
    size: number;
    sha256: string;
    provenance: "catalog-psd-smart-object";
    smartObjectLayer: string;
    geometry: { canvasWidth: number; canvasHeight: number; x: number; y: number; w: number; h: number };
  };
  runtimeRoles: Record<RuntimeRole, { path: string; sha256: string; sourceLayerPrefix: string }>
    & Partial<Record<OptionalRuntimeRole, { path: string; sha256: string; sourceLayerPrefix: string }>>;
  printZone: { x: number; y: number; w: number; h: number };
  blendModes: { shadow: "multiply"; highlight: "screen"; protected: "source-over" };
};

type ServerRenderableSurface = Pick<UnifiedMockupSurface, "sourceKitKey" | "runtimeStatus" | "disabledReason" | "contractErrors">;

const RELEASE_MANIFEST_URL = "/mockups/psd-master-v10/runtime-roles/manifest.json";
const RUNTIME_ROOT = "/mockups/psd-master-v10/runtime-roles";
const ROLE_NAMES: RuntimeRole[] = ["studioBackground", "base", "shadow", "protected", "highlight", "printMask"];
let releaseManifestPromise: Promise<ReleaseManifest> | undefined;
const roleDataUrlCache = new Map<string, Promise<string>>();

function toSurfaceKey(sourceKitKey: string): string {
  const key = sourceKitKey.includes("/") ? sourceKitKey : sourceKitKey.replaceAll(":", "/");
  if (key.split("/").length !== 3) throw new Error("This mockup surface is not an approved Smart v10.3 source.");
  return key;
}

function toRoleUrl(surface: ReleaseSurface, role: RuntimeRole): string {
  const fileName = surface.roles[role]?.path.split("/").pop();
  if (!fileName) throw new Error(`The approved ${role} role is missing for ${surface.surfaceKey}.`);
  return `${RUNTIME_ROOT}/${surface.family}/${surface.color}/${fileName}`;
}

/** The displacement role is shared across every color of a view, so it
 *  lives at `<family>/_shared/<file>` rather than `<family>/<color>/<file>`.
 *  Derive the URL from its own stored path instead of assuming the
 *  per-color layout the other roles use. */
function toOptionalRoleUrl(surface: ReleaseSurface, role: OptionalRuntimeRole): string | null {
  const storedPath = surface.roles[role]?.path;
  if (!storedPath) return null;
  const marker = "runtime-roles/";
  const index = storedPath.indexOf(marker);
  if (index < 0) return null;
  return `${RUNTIME_ROOT}/${storedPath.slice(index + marker.length)}`;
}

function basename(path: string): string {
  return path.split("/").pop() ?? "";
}

function toDataUrl(bytes: ArrayBuffer, contentType: string): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < view.length; offset += chunkSize) {
    binary += String.fromCharCode(...view.subarray(offset, Math.min(offset + chunkSize, view.length)));
  }
  return `data:${contentType || "image/png"};base64,${btoa(binary)}`;
}

async function fetchDataUrl(url: string): Promise<string> {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Approved runtime role unavailable (${response.status}): ${url}`);
  return toDataUrl(await response.arrayBuffer(), response.headers.get("content-type") || "image/png");
}

// Structural completeness — not the manifest's self-reported `status` label —
// is what actually determines whether server rendering can proceed. The
// label used to be hard-coded to "accepted" by the builder regardless of
// each surface's real review state, so gating on it was really just gating
// on a string that was always true; it has since been fixed to reflect
// reality (see tools/build-smartobject-runtime-roles.mjs), which means it
// can now legitimately read "candidate". Requiring literally "accepted" here
// would break server rendering entirely until every one of the 188 surfaces
// passes full visual review — a real, separate, much larger effort (see
// MOCKUP_DEEP_AUDIT_AND_IMPLEMENTATION_PLAN_2026-09-23.md) — even though the
// structural data itself hasn't changed and is genuinely usable today.
const REJECTED_MANIFEST_STATUSES = new Set(["rejected", "quarantined"]);

async function getReleaseManifest(): Promise<ReleaseManifest> {
  releaseManifestPromise ??= fetch(RELEASE_MANIFEST_URL, { cache: "no-store" }).then(async (response) => {
    if (!response.ok) throw new Error(`Approved Smart v10.3 manifest unavailable (${response.status}).`);
    const manifest = await response.json() as ReleaseManifest;
    if (REJECTED_MANIFEST_STATUSES.has(manifest.status) || manifest.surfaces.length !== 188) {
      throw new Error(`The active Smart v10.3 runtime manifest is not usable (status: ${manifest.status}, surfaces: ${manifest.surfaces.length}).`);
    }
    return manifest;
  });
  return releaseManifestPromise;
}

async function getServerSurface(surface: ServerRenderableSurface): Promise<{ manifest: ServerSurfaceManifest; roleImages: Record<RuntimeRole, string> & Partial<Record<OptionalRuntimeRole, string>>; release: ReleaseSurface }> {
  if (surface.runtimeStatus !== "approved" || surface.contractErrors.length > 0) {
    throw new Error(surface.disabledReason ?? `Mockup surface ${surface.sourceKitKey} is not approved for server rendering.`);
  }
  const sourceKitKey = toSurfaceKey(surface.sourceKitKey);
  const release = (await getReleaseManifest()).surfaces.find((candidate) => candidate.surfaceKey === sourceKitKey);
  if (!release) throw new Error(`No approved Smart v10.3 release surface exists for ${sourceKitKey}.`);

  const runtimeRoles = Object.fromEntries(ROLE_NAMES.map((role) => [
    role,
    {
      path: `${RUNTIME_ROOT}/${release.family}/${release.color}/${basename(release.roles[role].path)}`,
      sha256: release.roles[role].sha256,
      sourceLayerPrefix: release.roles[role].sourceLayerPrefix,
    },
  ])) as ServerSurfaceManifest["runtimeRoles"];
  const displacementUrl = toOptionalRoleUrl(release, "displacement");
  if (displacementUrl && release.roles.displacement) {
    runtimeRoles.displacement = {
      path: displacementUrl,
      sha256: release.roles.displacement.sha256,
      sourceLayerPrefix: release.roles.displacement.sourceLayerPrefix,
    };
  }
  const manifest: ServerSurfaceManifest = {
    schema: "trynext-smart-mockup-ingestion/v1",
    releaseVersion: "smart-v10.3",
    sourceKitKey,
    category: release.family,
    color: release.color,
    face: release.view,
    master: {
      fileName: basename(release.masterPath),
        mime: release.masterFormat === "psb" ? "application/vnd.adobe.photoshop" : "image/vnd.adobe.photoshop",
        size: release.masterSize,
      sha256: release.masterChecksum,
      provenance: "catalog-psd-smart-object",
        smartObjectLayer: release.smartObject.layerName,
        geometry: { ...release.normalizedFrame },
    },
    runtimeRoles,
    printZone: {
      x: release.printZone.x / 1024,
      y: release.printZone.y / 1024,
      w: release.printZone.w / 1024,
      h: release.printZone.h / 1024,
    },
    blendModes: { shadow: "multiply", highlight: "screen", protected: "source-over" },
  };

  const roleImages = Object.fromEntries(await Promise.all(ROLE_NAMES.map(async (role) => {
    const url = toRoleUrl(release, role);
    let request = roleDataUrlCache.get(url);
    if (!request) {
      request = fetchDataUrl(url);
      roleDataUrlCache.set(url, request);
    }
    return [role, await request] as const;
  }))) as Record<RuntimeRole, string>;
  if (displacementUrl) {
    let request = roleDataUrlCache.get(displacementUrl);
    if (!request) {
      request = fetchDataUrl(displacementUrl);
      roleDataUrlCache.set(displacementUrl, request);
    }
    (roleImages as Record<RuntimeRole, string> & Partial<Record<OptionalRuntimeRole, string>>).displacement = await request;
  }
  return { manifest, roleImages, release };
}

function cropArtworkToPrintZone(source: HTMLCanvasElement, printZone: ComposerPrintZone): string {
  const scale = source.width / 1000;
  const crop = document.createElement("canvas");
  crop.width = Math.max(1, Math.round(printZone.w * scale));
  crop.height = Math.max(1, Math.round(printZone.h * scale));
  const context = crop.getContext("2d");
  if (!context) throw new Error("Unable to prepare artwork for server rendering.");
  context.clearRect(0, 0, crop.width, crop.height);
  context.drawImage(
    source,
    Math.round(printZone.x * scale),
    Math.round(printZone.y * scale),
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );
  return crop.toDataURL("image/png");
}

export async function renderApprovedMockupOnServer({
  surface,
  printZone,
  layers,
  curvature = 0,
}: {
  surface: ServerRenderableSurface;
  printZone: ComposerPrintZone;
  layers: ComposerLayer[];
  curvature?: number;
}): Promise<string> {
  const serverSurface = await getServerSurface(surface);
  const artworkCanvas = document.createElement("canvas");
  await composeDesignTexture({
    canvas: artworkCanvas,
    printZone,
    layers,
    outSize: 1024,
    imageCache: new Map(),
    clipToPrintZone: true,
    curvature,
  });
  const response = await fetch(getApiUrl("/api/mockup/render"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      surface: serverSurface.manifest,
      runtimeRoleImages: serverSurface.roleImages,
      artwork: cropArtworkToPrintZone(artworkCanvas, printZone),
    }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(detail?.message || `Server mockup rendering failed (${response.status}).`);
  }
  return toDataUrl(await response.arrayBuffer(), response.headers.get("content-type") || "image/webp");
}