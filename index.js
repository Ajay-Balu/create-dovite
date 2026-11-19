#!/usr/bin/env node
const { getProjectDetails } = require("./src/prompts");
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

async function main() {
  try {
    const { projectName, templateType } = await getProjectDetails();

    checkPrerequisites();

    // All steps take projectName and resolve paths relative to the CWD.
    createViteProject(projectName, templateType);
    updatePackageJson(projectName, templateType);
    installDependencies(projectName, templateType);
    copyTemplateFiles(projectName, templateType);
    cleanupViteDefaults(projectName);
    updateManifest(projectName);
    initializeShadcn(projectName, templateType);
    initializeGit(projectName);

    console.log(`
✔ Project ${projectName} created successfully!

Get started:
  cd ${projectName}
  domo login        # once, so the dev proxy can reach your instance
  yarn dev

Publish to Domo:
  yarn upload

AI agents (Claude Code, Cursor, Codex, Antigravity…): AGENTS.md + .claude/skills
teach them Domo. Describe the app you want — they'll plan, recommend, then build.
`);
  } catch (error) {
    console.error("\nError creating project:", error.message);
    process.exit(1);
  }
}

main();
