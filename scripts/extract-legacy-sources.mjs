import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const appScriptFile = path.join(ROOT, "_sources", "app-script", "APP SCRIPT", "code.js.txt");
const ecomLabsFile = path.join(ROOT, "_sources", "ecomlabs", "server.js");
const outputDir = path.join(ROOT, "supabase", "seed-data");

const appScript = fs.readFileSync(appScriptFile, "utf8");
const ecomLabs = fs.readFileSync(ecomLabsFile, "utf8");

const providers = [...appScript.matchAll(/provider === "([A-Z0-9]+)"/g)].map((match) => match[1]);
const uniqueProviders = [...new Set(providers)];

const apiRoutes = [...ecomLabs.matchAll(/app\.(post|get)\('([^']+)'/g)].map((match) => ({
  method: match[1].toUpperCase(),
  route: match[2]
}));

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "legacy-provider-codes.json"),
  `${JSON.stringify(uniqueProviders, null, 2)}\n`
);
fs.writeFileSync(
  path.join(outputDir, "legacy-ecomlabs-routes.json"),
  `${JSON.stringify(apiRoutes, null, 2)}\n`
);

console.log(`Extracted ${uniqueProviders.length} delivery providers and ${apiRoutes.length} EcomLabs routes.`);
