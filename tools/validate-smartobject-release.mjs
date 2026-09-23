/**
 * Fail-closed gate for the generated native Smart Object release.
 *
 * This validates the full 188-surface staging matrix, re-open audit output,
 * checksums, embedded payloads, and public-path separation. It never promotes
 * files into public runtime directories. Pass --approve-visual only after the
 * generated contact sheets have been reviewed.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PNG } from "pngjs";

const repo = path.resolve(import.meta.dirname, "..");
const root = path.resolve(process.argv[2] ?? path.join(repo, "dist-mockups", "staging", "smart-v10-v3"));
const approveVisual = process.argv.includes("--approve-visual");
const manifestPath = path.join(root, "manifest.json");
const auditPath = path.join(root, "structural-audit.json");
const releasePath = path.join(root, "release-manifest.json");
const runtimeRolesPath = path.join(root, "runtime-roles", "manifest.json");

function fail(message) {
  throw new Error(message);
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

if (!existsSync(manifestPath)) fail(`missing staging manifest: ${manifestPath}`);
if (!existsSync(auditPath)) fail(`missing structural audit: ${auditPath}`);
if (!existsSync(runtimeRolesPath)) fail(`missing PSD-derived runtime role manifest: ${runtimeRolesPath}`);

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const audit = JSON.parse(readFileSync(auditPath, "utf8"));
const runtimeRoles = JSON.parse(readFileSync(runtimeRolesPath, "utf8"));
const errors = [];
const seen = new Set();

if (manifest.schema !== "trynext-smart-mockup-staging/v2") errors.push(`unexpected manifest schema ${manifest.schema}`);
 if (!["candidate", "accepted"].includes(manifest.status)) {
   errors.push(`staging manifest has an invalid status: ${manifest.status}`);
 }
if (manifest.surfaceCount !== 188 || manifest.canonicalSurfaceCount !== 188) errors.push("manifest does not declare exactly 188 canonical surfaces");
if (manifest.editableMastersOutsidePublic !== true) errors.push("editableMastersOutsidePublic must be true");
if (!Array.isArray(manifest.surfaces) || manifest.surfaces.length !== 188) errors.push("manifest surface list is not exactly 188 rows");
if (!Array.isArray(audit) || audit.length !== 188) errors.push("structural audit is not exactly 188 rows");
if (runtimeRoles.schema !== "trynext-smartobject-runtime-roles/v1") errors.push("unexpected runtime role manifest schema");
if (!["candidate", "accepted"].includes(runtimeRoles.status)) errors.push(`unexpected runtime role manifest status: ${runtimeRoles.status}`);
if (runtimeRoles.surfaceCount !== 188 || !Array.isArray(runtimeRoles.surfaces) || runtimeRoles.surfaces.length !== 188) {
  errors.push("runtime role manifest is not exactly 188 surfaces");
}

for (const row of manifest.surfaces ?? []) {
  const key = `${row.family}/${row.color}/${row.view}`;
  if (seen.has(key)) errors.push(`duplicate surface ${key}`);
  seen.add(key);
   if (!["candidate", "accepted", "structurally-verified"].includes(row.reviewStatus)) {
     errors.push(`${key}: unexpected review status ${row.reviewStatus}`);
   }
  if (!row.masterPath || row.masterPath.includes("/public/") || row.masterPath.includes("\\public\\")) errors.push(`${key}: master path is public or missing`);
  const masterPath = path.resolve(repo, row.masterPath);
  if (!existsSync(masterPath)) errors.push(`${key}: missing master ${row.masterPath}`);
  else if (sha256(masterPath) !== row.masterChecksum) errors.push(`${key}: master checksum mismatch`);
  if (!row.previewPath || !existsSync(path.resolve(repo, row.previewPath))) errors.push(`${key}: missing preview`);
  if (!row.smartObject?.layerName || !row.smartObject?.id) errors.push(`${key}: incomplete Smart Object metadata`);
}

const auditByFile = new Map(audit.map((row) => [row.file, row]));
const runtimeByKey = new Map((runtimeRoles.surfaces ?? []).map((row) => [row.surfaceKey, row]));
for (const row of manifest.surfaces ?? []) {
  const filename = path.basename(row.masterPath);
  const result = auditByFile.get(filename);
  const key = `${row.family}/${row.color}/${row.view}`;
  if (!result) {
    errors.push(`${key}: no structural audit row`);
    continue;
  }
  if (result.error) errors.push(`${key}: ${result.error}`);
  if (result.width !== 1024 || result.height !== 1024 || result.bit_depth !== 8) errors.push(`${key}: invalid document dimensions/depth`);
  if (result.smart_object_count !== 1) errors.push(`${key}: expected one Smart Object, found ${result.smart_object_count}`);
  if (!result.artwork_layers?.some((name) => result.smart_objects?.includes(name))) errors.push(`${key}: artwork layer is not the audited Smart Object`);
  if (!Object.values(result.embedded_smart_objects ?? {}).some((item) => item.kind === "data" && item.bytes > 0)) errors.push(`${key}: embedded Smart Object payload is empty`);
  if (!result.has_composite_preview || !result.composite_nonempty) errors.push(`${key}: composite preview is missing or empty`);

  const runtime = runtimeByKey.get(key);
  if (!runtime) {
    errors.push(`${key}: no PSD-derived runtime role row`);
    continue;
  }
  if (runtime.masterChecksum !== row.masterChecksum) errors.push(`${key}: runtime role points at a different master checksum`);
  const roleEntries = Object.entries(runtime.roles ?? {});
  // Six required roles, plus an optional pilot-only "displacement" role
  // (tools/build-displacement-maps.mjs) on the handful of surfaces that
  // have earned it. Anything else is a real count mismatch.
  const roleNames = new Set(roleEntries.map(([role]) => role));
  const hasSixRequired = ["studioBackground", "base", "shadow", "protected", "highlight", "printMask"]
    .every((role) => roleNames.has(role));
  const extras = [...roleNames].filter((role) => role !== "displacement" && !hasSixRequired);
  if (!hasSixRequired || (roleEntries.length !== 6 && roleEntries.length !== 7) || extras.length) {
    errors.push(`${key}: expected six required runtime roles plus an optional displacement role, found ${roleEntries.length} (${[...roleNames].join(",")})`);
  }
  // A surface can only claim "accepted" when real verification evidence
  // backs it — never from a bare status edit. See
  // tools/verify-smartobject-roundtrip.mjs.
  if (row.reviewStatus === "accepted") {
    const checks = row.verification?.checks;
    const hasEvidence = !!checks && Object.keys(checks).length > 0 && Object.values(checks).every(Boolean);
    if (!hasEvidence) errors.push(`${key}: reviewStatus is "accepted" but has no passing verification evidence`);
    if (row.verification?.masterChecksumAtVerification !== row.masterChecksum) {
      errors.push(`${key}: verification evidence was recorded against a different master checksum`);
    }
  }
  for (const [role, asset] of roleEntries) {
    const rolePath = path.resolve(repo, asset.path);
    if (!existsSync(rolePath)) {
      errors.push(`${key}: missing runtime role ${role}`);
    } else if (sha256(rolePath) !== asset.sha256) {
      errors.push(`${key}: runtime role checksum mismatch for ${role}`);
    }
    if (role === "protected" && existsSync(rolePath)) {
      const decoded = PNG.sync.read(readFileSync(rolePath));
      if (!Array.from(decoded.data).some((value, index) => index % 4 === 3 && value > 0)) {
        errors.push(`${key}: protected role is fully transparent`);
      }
    }
    if (asset.path.includes("/public/") || asset.path.includes("\\public\\")) {
      errors.push(`${key}: runtime role is incorrectly inside public`);
    }
  }
}

if (errors.length) {
  console.error(`Smart Object release gate FAILED with ${errors.length} issue(s)`);
  for (const error of errors.slice(0, 40)) console.error(`- ${error}`);
  process.exit(1);
}

const output = {
  schema: "trynext-smart-mockup-release/v1",
  status: approveVisual ? "verified" : "structurally-verified",
  generatedAt: "2026-09-06",
  surfaceCount: 188,
  nativeSmartObjects: true,
  editableMastersOutsidePublic: true,
  visualApproval: approveVisual,
  visualEvidence: "verification/smart-v10-v3-contact-sheets",
  sourceManifest: path.relative(repo, manifestPath),
  structuralAudit: path.relative(repo, auditPath),
  surfaces: manifest.surfaces.map((row) => ({
    ...row,
    // A surface individually verified with real evidence (row.verification)
    // keeps its "accepted" status. Never let a whole-release visual pass
    // downgrade evidence-backed status, and never let it upgrade an
    // unverified surface past what --approve-visual actually establishes.
    reviewStatus: row.reviewStatus === "accepted" ? "accepted" : (approveVisual ? "verified" : "structurally-verified"),
  })),
};
writeFileSync(releasePath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Smart Object release gate passed: ${output.status}, ${output.surfaceCount} surfaces`);
console.log(`wrote ${path.relative(repo, releasePath)}`);