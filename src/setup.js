const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { pmCommands } = require("./pm");

const isVueTemplate = (t) => t === "vue-js" || t === "vue-ts";
const isTsTemplate = (t) => t === "react-ts" || t === "vue-ts";

// Map our template types to create-vite template names
const VITE_TEMPLATES = {
  "react-js": "react",
  "react-ts": "react-ts",
  "vue-js": "vue",
  "vue-ts": "vue-ts",
};

function run(cmd, cwd) {
  execSync(cmd, { stdio: "inherit", cwd });
}

function commandExists(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function checkPrerequisites(pm) {
  if (!commandExists(pm)) {
    throw new Error(
      pm === "npm"
        ? "npm was not found. Install Node.js 20.19+ from https://nodejs.org"
        : `${pm} was not found. Install it with: npm install -g ${pm}  (or pick another package manager with --pm)`
    );
  }
  if (!commandExists("domo")) {
    console.warn(
      "⚠  Domo CLI (ryuu) not found. You'll need it for `domo login` and the `upload` script:\n   npm install -g ryuu\n"
    );
  }
}

function createViteProject(projectName, templateType, pm) {
  console.log(
    `\nCreating new project: ${projectName} with template ${templateType}`
  );
  const viteTemplate = VITE_TEMPLATES[templateType];
  if (!viteTemplate) throw new Error(`Unknown template: ${templateType}`);

  run(pmCommands(pm).create(projectName, viteTemplate));

  if (!fs.existsSync(path.join(projectName, "package.json"))) {
    throw new Error("create-vite did not produce a project. See output above.");
  }
}

function updatePackageJson(projectName, templateType) {
  console.log("Updating package name and scripts...");
  const packageJsonPath = path.join(projectName, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  packageJson.name = path.basename(projectName);

  // Keep the scripts create-vite generated (build / lint / preview match the
  // toolchain it installed, e.g. `tsc -b`, `vue-tsc -b`, `oxlint`) and only
  // fill in what's missing plus the Domo upload script.
  const scripts = packageJson.scripts || {};
  packageJson.scripts = {
    dev: scripts.dev || "vite",
    build:
      scripts.build ||
      (isTsTemplate(templateType)
        ? isVueTemplate(templateType)
          ? "vue-tsc -b && vite build"
          : "tsc -b && vite build"
        : "vite build"),
    ...scripts,
    preview: scripts.preview || "vite preview",
    // bumps public/manifest.json version, builds, publishes, saves the design id
    upload: "node scripts/upload.mjs",
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
}

function installDependencies(projectName, templateType, pm, features = {}) {
  const cmd = pmCommands(pm);
  const vue = isVueTemplate(templateType);

  console.log("\nInstalling dependencies...");
  run(cmd.install, projectName);

  console.log("\nInstalling Domo + Tailwind dependencies...");
  const deps = [
    "ryuu.js@^6",
    "@domoinc/ryuu-proxy@^5",
    "tailwindcss",
    "@tailwindcss/vite",
  ];
  if (!vue) deps.push("react-icons");
  if (features.store) deps.push(...(vue ? ["pinia"] : ["@reduxjs/toolkit", "react-redux"]));
  if (features.router) deps.push(vue ? "vue-router" : "react-router");
  run(cmd.add(deps), projectName);

  // vite.config uses node:fs / node:path. create-vite's TS templates already
  // include @types/node; add it only if missing.
  if (isTsTemplate(templateType)) {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectName, "package.json"), "utf8")
    );
    if (!pkg.devDependencies || !pkg.devDependencies["@types/node"]) {
      run(cmd.addDev(["@types/node"]), projectName);
    }
  }
}

function initializeShadcn(projectName, templateType, pm) {
  console.log("\nInitializing shadcn...");
  const cmd = pmCommands(pm);
  const cli = `${cmd.dlx} ${isVueTemplate(templateType) ? "shadcn-vue" : "shadcn"}@latest`;

  try {
    run(`${cli} init`, projectName);
    console.log("Installing final dependencies...");
    run(cmd.install, projectName);
    run(`${cli} add button`, projectName);
  } catch {
    console.log(
      `\n⚠  shadcn setup did not finish. The starter page imports "@/components/ui/button",\n` +
        `   so run these inside ${projectName} before \`${cmd.run("dev")}\`:\n` +
        `     ${cli} init\n` +
        `     ${cli} add button\n`
    );
  }
}

function initializeGit(projectName) {
  console.log("\nInitializing git...");
  try {
    try {
      execSync("git init -b main", { stdio: "ignore", cwd: projectName });
    } catch {
      // git < 2.28 doesn't support -b
      execSync("git init", { stdio: "ignore", cwd: projectName });
      execSync("git checkout -b main", { stdio: "ignore", cwd: projectName });
    }
    execSync("git add .", { stdio: "ignore", cwd: projectName });
    execSync('git commit -m "Initial commit from create-dovite"', {
      stdio: "ignore",
      cwd: projectName,
    });
  } catch {
    console.log("Git initialization skipped (is git installed and configured?).");
  }
}

module.exports = {
  checkPrerequisites,
  createViteProject,
  updatePackageJson,
  installDependencies,
  initializeShadcn,
  initializeGit,
  isVueTemplate,
  isTsTemplate,
};
