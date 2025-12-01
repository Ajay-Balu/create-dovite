const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function createViteProject(projectName, templateType) {
  console.log(
    `Creating new project: ${projectName} with template ${templateType}`
  );

  const viteTemplate = templateType === "react-ts" ? "react-ts" : "react";
  execSync(
    `yarn create vite ${projectName} --template ${viteTemplate} --no-interactive`,
    {
      stdio: "inherit",
    }
  );
}

function updatePackageJson(projectName, templateType) {
  console.log("Updating package name and scripts...");
  const packageJsonPath = path.join(projectName, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  packageJson.name = projectName;

  packageJson.scripts = {
    ...packageJson.scripts,
    dev: "vite",
    build: templateType === "react-ts" ? "tsc -b && vite build" : "vite build",
    lint: "eslint .",
    preview: "vite preview",
    upload: "yarn run build && cd dist && domo publish && cd ..",
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function installDependencies(projectName) {
  console.log("Installing dependencies...");
  // We need to run this inside the project directory
  // But since we are passing projectName, we can use cwd option or chdir before calling this.
  // However, the original script chdir'd into the project.
  // Let's assume the caller will handle chdir or we pass cwd.
  // To keep it simple and consistent with original flow, let's assume we are IN the project dir
  // OR we pass the cwd to execSync.
  // The original script did `process.chdir(projectName)`.

  // Let's stick to the original flow where we chdir in the main script,
  // OR we can make these functions robust.
  // For now, let's assume we are inside the directory for these commands to work easily
  // without passing cwd everywhere, BUT `updatePackageJson` used `path.join`.
  // Let's make `updatePackageJson` work with relative path, and these commands too.

  // Actually, `yarn` needs to run in the project dir.

  const options = { stdio: "inherit", cwd: projectName };

  execSync("yarn", options);

  console.log("Installing additional dependencies...");
  execSync(
    "yarn add tailwindcss @tailwindcss/vite @domoinc/ryuu-proxy ryuu.js tailwind-merge react-icons",
    options
  );
  execSync("yarn add -D @types/node", options);
}

function initializeShadcn(projectName) {
  console.log("Initializing shadcn...");
  const options = { stdio: "inherit", cwd: projectName };
  try {
    execSync("npx shadcn@latest init", options);

    // Install new dependencies after shadcn (it might add some)
    // The original script ran yarn again.
    console.log("Installing final dependencies...");
    execSync("yarn", options);

    execSync("npx shadcn@latest add button", options);
  } catch (error) {
    console.log(
      'Note: You may need to run "npx shadcn@latest init" manually if initialization failed.'
    );
  }
}

function initializeGit(projectName) {
  console.log("Initializing git");
  const options = { stdio: "inherit", cwd: projectName };
  try {
    execSync("git init", options);
    execSync("git add .", options);
    execSync(`git commit -m "first commit"`, options);
    execSync("git checkout -b main", options);
  } catch (e) {
    console.log("Git initialization failed or skipped.");
  }
}

module.exports = {
  createViteProject,
  updatePackageJson,
  installDependencies,
  initializeShadcn,
  initializeGit,
};
