#!/usr/bin/env node
const { getProjectDetails } = require("./src/prompts");
const {
  createViteProject,
  updatePackageJson,
  installDependencies,
  initializeShadcn,
  initializeGit,
} = require("./src/setup");
const { copyTemplateFiles, updateManifest } = require("./src/files");

async function main() {
  try {
    const { projectName, templateType } = await getProjectDetails(
      process.argv[2]
    );

    createViteProject(projectName, templateType);

    // Operations that modify files inside the project
    // We pass projectName so they can resolve paths correctly relative to CWD
    updatePackageJson(projectName, templateType);

    installDependencies(projectName);

    copyTemplateFiles(projectName, templateType);

    updateManifest(projectName);

    initializeShadcn(projectName);

    initializeGit(projectName);

    console.log(`
Project ${projectName} created successfully!
To get started:
  cd ${projectName}
  yarn dev
  To upload to DOMO:
  domo login
  yarn upload
    `);
  } catch (error) {
    console.error("Error creating project:", error.message);
    process.exit(1);
  }
}

main();
