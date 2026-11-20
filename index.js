#!/usr/bin/env node
const { getProjectDetails, storeName } = require("./src/prompts");
const {
  checkPrerequisites,
  createViteProject,
  updatePackageJson,
  installDependencies,
  initializeShadcn,
  initializeGit,
} = require("./src/setup");
const {
  copyTemplateFiles,
  updateManifest,
  cleanupViteDefaults,
} = require("./src/files");
const { applyFeatures } = require("./src/features");
const { pmCommands } = require("./src/pm");

async function main() {
  try {
    const { projectName, templateType, pm, store, router } =
      await getProjectDetails();
    const features = { store, router };

    console.log(
      `\n${projectName}: ${templateType} · ${pm} · ` +
        `${store ? storeName(templateType) : "no store"} · ${router ? "hash routing" : "no routing"}`
    );

    checkPrerequisites(pm);

    // All steps take projectName and resolve paths relative to the CWD.
    createViteProject(projectName, templateType, pm);
    updatePackageJson(projectName, templateType);
    installDependencies(projectName, templateType, pm, features);
    copyTemplateFiles(projectName, templateType, { pm, ...features });
    applyFeatures(projectName, templateType, features);
    cleanupViteDefaults(projectName);
    updateManifest(projectName);
    initializeShadcn(projectName, templateType, pm);
    initializeGit(projectName);

    const run = (script) => pmCommands(pm).run(script);
    console.log(`
✔ Project ${projectName} created successfully!

Get started:
  cd ${projectName}
  domo login        # once, so the dev proxy can reach your instance
  ${run("dev")}

Publish to Domo (bumps the manifest version automatically):
  ${run("upload")}

AI agents (Claude Code, Cursor, Codex, Antigravity…): AGENTS.md + .claude/skills
teach them Domo. Describe the app you want — they'll plan, recommend, then build.
`);
  } catch (error) {
    console.error("\nError creating project:", error.message);
    process.exit(1);
  }
}

main();
