/**
 * Registers the repo's 188 real PSD/PSB Smart Object masters into the new
 * mockup_templates registry, through the actual admin HTTP API (not a direct
 * DB write) — this is also therefore a real end-to-end exercise of
 * POST /api/admin/smart-mockups/templates + the inspect endpoint.
 *
 * For each file:
 *   1. Register it (path validated server-side against MOCKUP_TEMPLATE_ROOT).
 *   2. Inspect it — real ag-psd Smart Object discovery.
 *   3. If exactly one Smart Object was found, auto-select it (these masters
 *      are single-artwork-layer by construction — see
 *      tools/build-smartobject-mockups.mjs). Multi-object templates would
 *      need an admin to pick from the inspection list; not the case here.
 *
 * Templates are left `active: false` — Section 13's fail-closed rule: never
 * auto-activate. Activation requires a passing test-render, which requires
 * a configured renderer (blocked in this environment; see AGENT_HANDOFF.md).
 *
 * Usage: node tools/seed-mockup-templates.mjs
 */
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const API_BASE = process.env.API_BASE ?? "http://localhost:8082";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "DevLocalAdmin123!";
const MASTERS_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "dist-mockups", "staging", "smart-v10-v3", "masters");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(psd|psb)$/i.test(entry.name)) out.push(full);
  }
  return out.sort();
}

function parseName(relativePath) {
  // e.g. tshirt/tshirt-white-front.psd -> { productType: "tshirt", color: "white", face: "front" }
  const [productType, fileName] = relativePath.split(path.sep);
  const stem = fileName.replace(/\.(psd|psb)$/i, "");
  const withoutProduct = stem.startsWith(productType + "-") ? stem.slice(productType.length + 1) : stem;
  const parts = withoutProduct.split("-");
  const face = parts[parts.length - 1];
  const color = parts.slice(0, -1).join("-");
  return { productType, color, face };
}

async function main() {
  const loginRes = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  if (!loginRes.ok) throw new Error(`Admin login failed: HTTP ${loginRes.status}`);
  const { token } = await loginRes.json();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const files = walk(MASTERS_ROOT);
  console.log(`Found ${files.length} PSD/PSB masters under ${MASTERS_ROOT}`);

  const results = { created: 0, inspected: 0, autoSelected: 0, errors: [] };

  for (const fullPath of files) {
    const relativePath = path.relative(MASTERS_ROOT, fullPath);
    const { productType, color, face } = parseName(relativePath);
    const name = `${productType} ${color} ${face}`;

    try {
      const createRes = await fetch(`${API_BASE}/api/admin/smart-mockups/templates`, {
        method: "POST",
        headers,
        body: JSON.stringify({ productType, name, color, face, relativePath }),
      });
      if (!createRes.ok) {
        const detail = await createRes.json().catch(() => ({}));
        throw new Error(`create failed: HTTP ${createRes.status} ${JSON.stringify(detail)}`);
      }
      const { template } = await createRes.json();
      results.created++;

      const inspectRes = await fetch(`${API_BASE}/api/admin/smart-mockups/templates/${template.id}/inspect`, {
        method: "POST",
        headers,
      });
      if (!inspectRes.ok) throw new Error(`inspect failed: HTTP ${inspectRes.status}`);
      const inspection = await inspectRes.json();
      results.inspected++;

      if (inspection.smartObjects.length === 1) {
        const so = inspection.smartObjects[0];
        const soRes = await fetch(`${API_BASE}/api/admin/smart-mockups/templates/${template.id}/smart-object`, {
          method: "POST",
          headers,
          body: JSON.stringify({ smartObjectId: so.id, smartObjectName: so.name }),
        });
        if (!soRes.ok) throw new Error(`smart-object selection failed: HTTP ${soRes.status}`);
        results.autoSelected++;
      } else {
        results.errors.push(`${relativePath}: expected 1 smart object, found ${inspection.smartObjects.length}`);
      }
    } catch (err) {
      results.errors.push(`${relativePath}: ${err.message}`);
    }
  }

  console.log(JSON.stringify(results, null, 2));
  if (results.errors.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
