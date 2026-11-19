#!/usr/bin/env node
/**
 * Offline sanity checks for the templates (runs in CI via `npm test`).
 * - every template has the required files
 * - JSON files parse
 * - domoApi exports are identical across all templates
 * - no template still references the removed dataApi / domoAPI files
 */
const fs = require("fs");
const path = require("path");
const { TEMPLATE_VALUES } = require("../src/prompts");

const root = path.join(__dirname, "..");
const errors = [];
const fail = (msg) => errors.push(msg);

const REQUIRED = {
  common: [
    "CLAUDE.md",
    ".claudeignore",
    ".claude/settings.json",
    "public/manifest.json",
    "public/thumbnail.png",
    "src/index.css",
  ],
  "react-js": ["src/API/domoApi.js", "src/API/currentUserContext.jsx", "src/App.jsx", "src/pages/index.jsx", "vite.config.js", "jsconfig.json"],
  "react-ts": ["src/API/domoApi.ts", "src/API/currentUserContext.tsx", "src/App.tsx", "src/pages/index.tsx", "vite.config.ts", "tsconfig.json", "tsconfig.app.json"],
  "vue-js": ["src/API/domoApi.js", "src/API/currentUserContext.js", "src/App.vue", "src/main.js", "src/pages/index.vue", "vite.config.js", "jsconfig.json"],
  "vue-ts": ["src/API/domoApi.ts", "src/API/currentUserContext.ts", "src/App.vue", "src/main.ts", "src/pages/index.vue", "vite.config.ts", "tsconfig.json", "tsconfig.app.json"],
};

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
  );

const exportsOf = (file) =>
  [...fs.readFileSync(file, "utf8").matchAll(/^export (?:const|async function|function) (\w+)/gm)]
    .map((m) => m[1])
    .sort()
    .join(",");

let referenceExports = null;

for (const t of TEMPLATE_VALUES) {
  const dir = path.join(root, "templates", t);
  if (!fs.existsSync(dir)) {
    fail(`missing template folder: ${t}`);
    continue;
  }
  for (const f of [...REQUIRED.common, ...(REQUIRED[t] || [])]) {
    if (!fs.existsSync(path.join(dir, f))) fail(`${t}: missing ${f}`);
  }
  for (const file of walk(dir)) {
    const rel = path.relative(dir, file);
    if (/(^|[\\/])\.gitignore$/.test(rel)) fail(`${t}: .gitignore is not published by npm — use _gitignore`);
    // tsconfig files are JSONC (comments allowed), so only strict-check the rest
    if (file.endsWith(".json") && !/tsconfig/.test(rel)) {
      try {
        JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (e) {
        fail(`${t}: invalid JSON in ${rel}: ${e.message}`);
      }
    }
    if (/\.(js|jsx|ts|tsx|vue)$/.test(file)) {
      const src = fs.readFileSync(file, "utf8");
      if (/from ["']\.\/(dataApi|domoAPI|DomoAPI)["']/.test(src)) fail(`${t}: ${rel} imports a removed API file`);
      if (/from ["']axios["']/.test(src)) fail(`${t}: ${rel} imports axios (not installed)`);
    }
  }
  const api = ["src/API/domoApi.ts", "src/API/domoApi.js"].map((f) => path.join(dir, f)).find(fs.existsSync);
  if (api) {
    const names = exportsOf(api);
    if (referenceExports === null) referenceExports = { t, names };
    else if (names !== referenceExports.names)
      fail(`${t}: domoApi exports differ from ${referenceExports.t}\n  ${names}\n  ${referenceExports.names}`);
  }
}

if (errors.length) {
  console.error("Template check failed:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`✔ ${TEMPLATE_VALUES.length} templates OK`);
