import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = {
  rootGateway: resolve(root, "functions/api/[[catchall]].ts"),
  rootConfig: resolve(root, "functions/gateway-config.ts"),
  storefrontConfig: resolve(root, "artifacts/trynex-storefront/functions/gateway-config.ts"),
  mobileProductionEnv: resolve(root, "artifacts/trynext-mobile/.env.production"),
};
const retiredMobileHost = "trynex-api.onrender.com";

async function read(path) {
  return readFile(path, "utf8");
}

function assertEqual(label, leftPath, left, rightPath, right) {
  if (left !== right) {
    throw new Error(`${label} drifted: ${leftPath} must be byte-for-byte identical to ${rightPath}`);
  }
  console.log(`PASS ${label}: ${leftPath} == ${rightPath}`);
}

function assertNoRetiredProductionHost(envPath, contents) {
  const activeAssignments = contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && /^[A-Za-z_][A-Za-z0-9_]*=/.test(line));
  const staleAssignments = activeAssignments.filter((line) => line.includes(retiredMobileHost));
  if (staleAssignments.length > 0) {
    throw new Error(
      `retired mobile Render host is active in ${envPath}: ${staleAssignments.join(", ")}`,
    );
  }
  console.log(`PASS retired mobile Render-host guard: ${envPath}`);
}

const [rootGateway, rootConfig, storefrontConfig, mobileProductionEnv] = await Promise.all([
  read(files.rootGateway),
  read(files.rootConfig),
  read(files.storefrontConfig),
  read(files.mobileProductionEnv),
]);

console.log(`PASS authoritative Pages API gateway: ${files.rootGateway}`);
assertEqual("gateway config parity", files.rootConfig, rootConfig, files.storefrontConfig, storefrontConfig);
assertNoRetiredProductionHost(files.mobileProductionEnv, mobileProductionEnv);
