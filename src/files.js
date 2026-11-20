const fs = require("fs");
const path = require("path");

const { pmCommands } = require("./pm");
const { featuresDoc } = require("./features");

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");
// Files shared by every template (e.g. scripts/upload.mjs)
const SHARED_DIR = path.join(TEMPLATES_DIR, "_shared");
// Shared Domo skills for AI agents, copied into every project's .claude/skills/
const SKILLS_DIR = path.join(__dirname, "..", "domo-skills");

// npm never publishes files named .gitignore/.npmrc, so templates may store
// them with a leading underscore; they're renamed on copy.
const RENAME_ON_COPY = {
  _gitignore: ".gitignore",
  _npmrc: ".npmrc",
};

// Text files in which {{PLACEHOLDERS}} are replaced after copying.
const PLACEHOLDER_FILES = ["CLAUDE.md", "AGENTS.md"];

function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      const target = RENAME_ON_COPY[entry] || entry;
      copyRecursive(path.join(src, entry), path.join(dest, target));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

/** Copies each domo-skills/<skill>/ folder to <project>/.claude/skills/<skill>/. */
function copySkills(projectName) {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.warn("domo-skills folder not found; skipping AI agent skills.");
    return;
  }
  const dest = path.join(projectName, ".claude", "skills");
  const skills = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(SKILLS_DIR, e.name, "SKILL.md")));
  for (const skill of skills) {
    copyRecursive(path.join(SKILLS_DIR, skill.name), path.join(dest, skill.name));
  }
  console.log(`Added ${skills.length} Domo skills for AI agents (.claude/skills)`);
}

function copyTemplateFiles(projectName, templateType, options = {}) {
  const templateDir = path.join(TEMPLATES_DIR, templateType);
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template directory not found: ${templateDir}`);
  }

  console.log(`\nCopying ${templateType} template files...`);
  if (fs.existsSync(SHARED_DIR)) copyRecursive(SHARED_DIR, projectName);
  copyRecursive(templateDir, projectName);
  copySkills(projectName);

  const pm = options.pm || "npm";
  const cmd = pmCommands(pm);
  const addCmd = cmd.add([]).trim();
  const values = {
    PROJECT_NAME: path.basename(projectName),
    PM: pm,
    RUN: cmd.run("").trim(),
    ADD: addCmd,
    DLX: cmd.dlx,
    FEATURES: featuresDoc(templateType, options, addCmd),
  };
  for (const file of PLACEHOLDER_FILES) {
    const filePath = path.join(projectName, file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs
      .readFileSync(filePath, "utf8")
      .replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => values[key] ?? match);
    fs.writeFileSync(filePath, content);
  }
}

function updateManifest(projectName) {
  const publicDir = path.join(projectName, "public");
  const manifestPath = path.join(publicDir, "manifest.json");
  const name = path.basename(projectName);

  let manifest = {
    name,
    version: "0.0.1",
    size: { width: 3, height: 3 },
    fullpage: true,
    mapping: [],
    collections: [],
    workflowMapping: [],
    packagesMapping: [],
    allowCamera: false,
    allowMic: false,
    allowGeolocation: false,
    allowBluetooth: false,
    allowNFC: false,
  };

  if (fs.existsSync(manifestPath)) {
    console.log("Updating manifest.json with project name...");
    manifest = { ...JSON.parse(fs.readFileSync(manifestPath, "utf8")), name };
  } else {
    console.log("Creating manifest.json...");
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}

/** Remove create-vite demo files that the Dovite templates replace. */
function cleanupViteDefaults(projectName) {
  const leftovers = [
    "src/App.css", // React demo styles
    "src/style.css", // Vue demo styles (global, unlayered — would override Tailwind)
    "src/assets", // demo logos / hero image
    "src/components/HelloWorld.vue", // Vue demo component
  ];

  for (const rel of leftovers) {
    const target = path.join(projectName, rel);
    if (fs.existsSync(target)) {
      console.log(`Removing default ${rel}...`);
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
}

module.exports = { copyTemplateFiles, updateManifest, cleanupViteDefaults };
