const fs = require("fs");
const path = require("path");

function copyTemplateFiles(projectName, templateType) {
  // __dirname is .../src
  // templates are in .../templates
  const templateDir = path.join(__dirname, "..", "templates", templateType);
  const destDir = projectName; // Relative to CWD

  if (fs.existsSync(templateDir)) {
    console.log(`Copying ${templateType} template files...`);
    const copyRecursive = (src, dest) => {
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const files = fs.readdirSync(src);
        for (const file of files) {
          copyRecursive(path.join(src, file), path.join(dest, file));
        }
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    copyRecursive(templateDir, destDir);
  } else {
    console.warn(`Template directory not found: ${templateDir}`);
  }
}

function updateManifest(projectName) {
  const publicDir = path.join(projectName, "public");
  const manifestJsPath = path.join(publicDir, "manifest.js");
  const manifestJsonPath = path.join(publicDir, "manifest.json");

  if (fs.existsSync(manifestJsPath)) {
    // Legacy/JS template handling
    console.log("Updating manifest.js with project name...");
    let manifestContent = fs.readFileSync(manifestJsPath, "utf8");
    manifestContent = manifestContent.replace(
      /name:\s*["']([^"']*)["']/g,
      `name: "${projectName}"`
    );
    fs.writeFileSync(manifestJsPath, manifestContent);
  } else if (fs.existsSync(manifestJsonPath)) {
    // TS/JSON template handling
    console.log("Updating manifest.json with project name...");
    const manifestContent = JSON.parse(
      fs.readFileSync(manifestJsonPath, "utf8")
    );
    manifestContent.name = projectName;
    fs.writeFileSync(
      manifestJsonPath,
      JSON.stringify(manifestContent, null, 2)
    );
  } else {
    // Create if missing (fallback)
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    // Default to JSON for new setup
    console.log("Creating manifest.json with project name...");
    const basicManifest = {
      name: projectName,
      version: "1.0.0",
      description: `${projectName} application`,
    };
    fs.writeFileSync(manifestJsonPath, JSON.stringify(basicManifest, null, 2));
  }
}

module.exports = { copyTemplateFiles, updateManifest };
