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
    "AGENTS.md",
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

// --- domo-skills: each folder needs SKILL.md with matching name + description
const skillsDir = path.join(root, "domo-skills");
const skillNames = fs.existsSync(skillsDir)
  ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
  : [];
if (!skillNames.length) fail("domo-skills/ is missing or empty");
for (const name of skillNames) {
  const file = path.join(skillsDir, name, "SKILL.md");
  if (!fs.existsSync(file)) {
    fail(`domo-skills/${name}: missing SKILL.md`);
    continue;
  }
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(fs.readFileSync(file, "utf8"));
  if (!fm) fail(`domo-skills/${name}: SKILL.md has no frontmatter`);
  else {
    if (!new RegExp(`^name:\\s*${name}\\s*$`, "m").test(fm[1])) fail(`domo-skills/${name}: frontmatter name must be "${name}"`);
    if (!/^description:\s*\S/m.test(fm[1])) fail(`domo-skills/${name}: frontmatter description missing`);
  }
}

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
  // every skill referenced in AGENTS.md must exist
  const agents = path.join(dir, "AGENTS.md");
  if (fs.existsSync(agents)) {
    for (const m of fs.readFileSync(agents, "utf8").matchAll(/`(domo-[a-z-]+)`/g)) {
      if (!skillNames.includes(m[1])) fail(`${t}: AGENTS.md references unknown skill ${m[1]}`);
    }
    if (!/@AGENTS\.md/.test(fs.readFileSync(path.join(dir, "CLAUDE.md"), "utf8"))) fail(`${t}: CLAUDE.md must import @AGENTS.md`);
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
