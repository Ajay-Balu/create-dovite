const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function createViteProject(projectName, templateType) {
  console.log(
    `Creating new project: ${projectName} with template ${templateType}`
  );

  // Map our template types to Vite's template names
  const viteTemplateMap = {
    "react-js": "react",
    "react-ts": "react-ts",
    "vue-js": "vue",
    "vue-ts": "vue-ts",
  };

  const viteTemplate = viteTemplateMap[templateType] || "react";
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

  // TypeScript templates need tsc build step
  const isTypeScript = templateType === "react-ts" || templateType === "vue-ts";
  const buildCommand = isTypeScript ? "vue-tsc -b && vite build" : "vite build";
  // React-ts uses tsc, Vue-ts uses vue-tsc
  const tsBuildCommand =
    templateType === "react-ts" ? "tsc -b && vite build" : buildCommand;

  packageJson.scripts = {
    ...packageJson.scripts,
    dev: "vite",
    build: isTypeScript
      ? templateType === "react-ts"
        ? "tsc -b && vite build"
        : "vue-tsc -b && vite build"
      : "vite build",
    lint: "eslint .",
    preview: "vite preview",
    upload: "yarn run build && cd dist && domo publish && cd ..",
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function installDependencies(projectName, templateType) {
  console.log("Installing dependencies...");
  const options = { stdio: "inherit", cwd: projectName };
  const isVue = templateType === "vue-js" || templateType === "vue-ts";

  execSync("yarn", options);

  console.log("Installing additional dependencies...");

  // Common dependencies for all templates
  const commonDeps =
    "tailwindcss @tailwindcss/vite @domoinc/ryuu-proxy ryuu.js tailwind-merge";

  if (isVue) {
    // Vue-specific dependencies
    execSync(`yarn add ${commonDeps}`, options);
  } else {
    // React-specific dependencies
    execSync(`yarn add ${commonDeps} react-icons`, options);
  }

  execSync("yarn add -D @types/node", options);
}

function initializeShadcn(projectName, templateType) {
  console.log("Initializing shadcn...");
  const options = { stdio: "inherit", cwd: projectName };
  const isVue = templateType === "vue-js" || templateType === "vue-ts";

  try {
    if (isVue) {
      // Shadcn-vue uses a different initialization
      execSync("npx shadcn-vue@latest init", options);
      console.log("Installing final dependencies...");
      execSync("yarn", options);
      execSync("npx shadcn-vue@latest add button", options);
    } else {
      // React uses standard shadcn
      execSync("npx shadcn@latest init", options);
      console.log("Installing final dependencies...");
      execSync("yarn", options);
      execSync("npx shadcn@latest add button", options);
    }
  } catch (error) {
    const shadcnCmd = isVue
      ? "npx shadcn-vue@latest init"
      : "npx shadcn@latest init";
    console.log(
      `Note: You may need to run "${shadcnCmd}" manually if initialization failed.`
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
