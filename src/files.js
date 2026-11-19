const fs = require("fs");
const path = require("path");

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

// npm never publishes files named .gitignore/.npmrc, so templates may store
// them with a leading underscore; they're renamed on copy.
const RENAME_ON_COPY = {
  _gitignore: ".gitignore",
  _npmrc: ".npmrc",
};

// Text files in which {{PROJECT_NAME}} is replaced after copying.
const PLACEHOLDER_FILES = ["CLAUDE.md"];

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

function copyTemplateFiles(projectName, templateType) {
  const templateDir = path.join(TEMPLATES_DIR, templateType);
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template directory not found: ${templateDir}`);
  }

  console.log(`\nCopying ${templateType} template files...`);
  copyRecursive(templateDir, projectName);

  const name = path.basename(projectName);
  for (const file of PLACEHOLDER_FILES) {
    const filePath = path.join(projectName, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      fs.writeFileSync(filePath, content.split("{{PROJECT_NAME}}").join(name));
    }
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
    mapping: [],
    collections: [],
    workflowMapping: [],
    packagesMapping: [],
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
