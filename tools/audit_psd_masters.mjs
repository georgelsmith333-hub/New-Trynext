/**
 * Dependency-free structural audit for native PSD/PSB Smart Object masters.
 *
 * This is the Node equivalent of the older psd-tools audit. It deliberately
 * uses the same ag-psd parser as the API upload boundary, so the release
 * check does not depend on a Python virtualenv or a native canvas package.
 *
 * Usage:
 *   node tools/audit_psd_masters.mjs [master-root] [--json out.json]
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readPsd } from "ag-psd";

const repo = path.resolve(import.meta.dirname, "..");
const defaultRoot = path.join(repo, "dist-mockups", "staging", "smart-v10-v3", "masters");
const argv = process.argv.slice(2);
const jsonIndex = argv.indexOf("--json");
const jsonPath = jsonIndex >= 0 ? path.resolve(argv[jsonIndex + 1]) : null;
if (jsonIndex >= 0) argv.splice(jsonIndex, 2);
if (argv[0] === "--") argv.shift();
const inputRoot = path.resolve(argv[0] ?? defaultRoot);
const psdRoot = existsSync(path.join(inputRoot, "psd")) ? path.join(inputRoot, "psd") : inputRoot;

function walk(root) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(file));
    else if (/\.(psd|psb)$/i.test(entry.name)) files.push(file);
  }
  return files.sort();
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function formatFromSignature(buffer) {
  if (buffer.length < 6 || buffer.subarray(0, 4).toString("ascii") !== "8BPS") return null;
  const version = buffer.readUInt16BE(4);
  return version === 1 ? "psd" : version === 2 ? "psb" : null;
}

function readLength(buffer, offset, bytes) {
  if (offset + bytes > buffer.length) throw new Error("truncated Photoshop section length");
  return bytes === 4 ? buffer.readUInt32BE(offset) : Number(buffer.readBigUInt64BE(offset));
}

/**
 * Photoshop stores the composite image after the layer/mask section. We do
 * not decode pixels here; checking that the section exists and contains
 * non-zero bytes catches empty/truncated composites without native canvas.
 */
function compositeIsNonEmpty(buffer) {
  const version = buffer.readUInt16BE(4);
  let offset = 26;
  const sectionLengthBytes = [4, 4, version === 2 ? 8 : 4];
  for (const lengthBytes of sectionLengthBytes) {
    const length = readLength(buffer, offset, lengthBytes);
    offset += lengthBytes + length;
    if (offset > buffer.length) return false;
  }
  if (offset + 2 > buffer.length) return false;
  const imageData = buffer.subarray(offset + 2);
  return imageData.length > 0 && imageData.some((value) => value !== 0);
}

function layerBounds(layer) {
  const values = [layer.left, layer.top, layer.right, layer.bottom];
  if (!values.every((value) => typeof value === "number" && Number.isFinite(value))) return null;
  const [left, top, right, bottom] = values;
  return right > left && bottom > top
    ? { x: left, y: top, w: right - left, h: bottom - top }
    : null;
}

function findPlacedLayers(layers, output = []) {
  for (const layer of layers ?? []) {
    if (!layer || typeof layer !== "object") continue;
    if (layer.placedLayer && layerBounds(layer)) {
      output.push({
        name: typeof layer.name === "string" ? layer.name : "",
        id: typeof layer.id === "number" ? layer.id : undefined,
        placed: layer.placedLayer,
        bounds: layerBounds(layer),
      });
    }
    if (Array.isArray(layer.children)) findPlacedLayers(layer.children, output);
  }
  return output;
}

function embeddedSmartObjects(document) {
  return Object.fromEntries(
    (document.linkedFiles ?? []).map((file, index) => {
      const id = typeof file.id === "string" && file.id ? file.id : `linked-${index + 1}`;
      const bytes = file.data?.byteLength ?? file.data?.length ?? 0;
      return [id, { kind: "data", bytes, type: file.type ?? null }];
    }),
  );
}

function auditFile(file) {
  const basename = path.basename(file);
  const buffer = readFileSync(file);
  const format = formatFromSignature(buffer);
  const result = {
    file: basename,
    path: path.relative(repo, file),
    size: buffer.length,
    sha256: sha256(buffer),
    format,
    error: null,
    width: null,
    height: null,
    bit_depth: null,
    smart_object_count: 0,
    smart_objects: [],
    artwork_layers: [],
    embedded_smart_objects: {},
    has_composite_preview: false,
    composite_nonempty: false,
  };

  try {
    if (!format) throw new Error("not a PSD/PSB signature");
    if (path.extname(file).slice(1).toLowerCase() !== format) {
      throw new Error(`signature is ${format.toUpperCase()} but extension is ${path.extname(file)}`);
    }
    const document = readPsd(new Uint8Array(buffer), {
      skipLayerImageData: true,
      skipCompositeImageData: true,
      skipThumbnail: true,
      skipMergedImageData: true,
    });
    result.width = document.width ?? null;
    result.height = document.height ?? null;
    result.bit_depth = document.bitsPerChannel ?? null;
    result.smart_objects = findPlacedLayers(document.children);
    result.smart_object_count = result.smart_objects.length;
    result.artwork_layers = result.smart_objects
      .filter((layer) => /(artwork|smart.?object)/i.test(layer.name))
      .map((layer) => layer.name);
    const smartObjectDetails = result.smart_objects;
    result.smart_objects = smartObjectDetails.map((layer) => layer.name);
    result.smart_object_details = smartObjectDetails;
    result.embedded_smart_objects = embeddedSmartObjects(document);
    result.has_composite_preview = compositeIsNonEmpty(buffer);
    result.composite_nonempty = result.has_composite_preview;
    if (result.smart_object_count !== 1) throw new Error(`expected one Smart Object, found ${result.smart_object_count}`);
    if (result.artwork_layers.length !== 1) throw new Error("the Smart Object layer is not identified as artwork");
    if (!Object.values(result.embedded_smart_objects).some((item) => item.bytes > 0)) {
      throw new Error("embedded Smart Object payload is empty");
    }
    if (result.width !== 1024 || result.height !== 1024 || result.bit_depth !== 8) {
      throw new Error(`expected 1024x1024 8-bit document, got ${result.width}x${result.height} ${result.bit_depth}-bit`);
    }
    if (!result.has_composite_preview) throw new Error("composite preview is empty or truncated");
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }
  return result;
}

const files = walk(psdRoot);
if (files.length === 0) {
  console.error(`no PSD/PSB found under ${psdRoot}`);
  process.exit(2);
}

const results = files.map(auditFile);
const failures = results.filter((result) => result.error);
console.log(`Scanned ${results.length} master documents under ${psdRoot}`);
console.log(`  openable      : ${results.length - failures.length}`);
console.log(`  unreadable    : ${failures.length}`);
console.log(`  smart objects : ${results.filter((result) => result.smart_object_count === 1).length}`);
console.log(`  required gate : ${failures.length === 0 ? "pass" : "FAIL"}`);
for (const result of failures.slice(0, 20)) console.log(`    ! ${result.file}: ${result.error}`);

if (jsonPath) {
  writeFileSync(jsonPath, `${JSON.stringify(results, null, 2)}\n`);
  console.log(`wrote ${path.relative(repo, jsonPath)}`);
}
if (failures.length > 0) process.exit(1);