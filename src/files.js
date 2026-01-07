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

function cleanupViteDefaults(projectName, templateType) {
  const isVue = templateType === "vue-js" || templateType === "vue-ts";

  if (isVue) {
    // Clean up default style.css created by Vite Vue template
    // Remove body/#app styles that conflict with our landing page
    const styleCssPath = path.join(projectName, "src", "style.css");
    if (fs.existsSync(styleCssPath)) {
      console.log("Cleaning up default style.css...");
      let content = fs.readFileSync(styleCssPath, "utf8");

      // Remove body styles block
      content = content.replace(
        /body\s*\{[^}]*display:\s*flex[^}]*place-items:\s*center[^}]*\}/gs,
        ""
      );

      // Remove #app styles block
      content = content.replace(
        /#app\s*\{[^}]*max-width:\s*1280px[^}]*\}/gs,
        ""
      );

      // Clean up extra whitespace
      content = content.replace(/\n{3,}/g, "\n\n").trim();

      // Write back the cleaned content (or empty string if nothing left)
      fs.writeFileSync(styleCssPath, content + "\n");
    }
  }

  // Remove App.css if it exists (created by Vite React template)
  const appCssPath = path.join(projectName, "src", "App.css");
  if (fs.existsSync(appCssPath)) {
    console.log("Removing default App.css...");
    fs.unlinkSync(appCssPath);
  }
}

module.exports = { copyTemplateFiles, updateManifest, cleanupViteDefaults };
