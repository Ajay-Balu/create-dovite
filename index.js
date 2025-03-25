#!/usr/bin/env node
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

async function main() {
  try {
    const projectName = process.argv[2];

    if (!projectName) {
      console.error("Please specify a project name");
      process.exit(1);
    }

    console.log(`Creating new project: ${projectName}`);

    // Create Vite project
    execSync(`yarn create vite ${projectName} --template react`, {
      stdio: "inherit",
    });

    // Move into project directory
    process.chdir(projectName);

    // Fix package name
    console.log("Updating package name...");
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    packageJson.name = projectName;
    fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));

    // Install initial dependencies
    console.log("Installing dependencies...");
    execSync("yarn", { stdio: "inherit" });

    // Install all required dependencies
    console.log("Installing additional dependencies...");
    execSync(
      "yarn add tailwindcss @tailwindcss/vite @domoinc/ryuu-proxy ryuu.js tailwind-merge react-icons",
      { stdio: "inherit" }
    );
    execSync("yarn add -D @types/node", { stdio: "inherit" });

    // Update src/index.css
    fs.writeFileSync("src/index.css", `@import "tailwindcss";`);

    // Copy template files if they exist
    const templateDir = path.join(__dirname, "template");
    if (fs.existsSync(templateDir)) {
      console.log("Copying template files...");
      // This is a simple implementation - you might want a more robust solution
      // that preserves directory structure
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
      copyRecursive(templateDir, "./");
    }

    // Update manifest.js if it exists in public folder
    const publicDir = path.join(process.cwd(), "public");
    const manifestPath = path.join(publicDir, "manifest.js");

    if (fs.existsSync(manifestPath)) {
      console.log("Updating manifest.js with project name...");
      let manifestContent = fs.readFileSync(manifestPath, "utf8");

      // Replace name field in manifest.js with the project name
      // This assumes a standard format like: name: "OldName",
      manifestContent = manifestContent.replace(
        /name:\s*["']([^"']*)["']/g,
        `name: "${projectName}"`
      );

      fs.writeFileSync(manifestPath, manifestContent);
    } else {
      // If manifest.js doesn't exist yet, create public directory and a basic manifest file
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      console.log("Creating manifest.js with project name...");
      const basicManifest = `export default {
  name: "${projectName}",
  version: "1.0.0",
  description: "${projectName} application"
};
`;
      fs.writeFileSync(manifestPath, basicManifest);
    }

    // Update package.json with latest versions
    console.log("Updating package.json...");
    const updatedPackageJson = JSON.parse(
      fs.readFileSync("package.json", "utf8")
    );

    // Update scripts
    updatedPackageJson.scripts = {
      dev: "vite",
      build: "vite build",
      lint: "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
      preview: "vite preview",
      upload: "yarn run build && cd dist && domo publish && cd ..", //only line need to be added
    };

    fs.writeFileSync(
      "package.json",
      JSON.stringify(updatedPackageJson, null, 2)
    );

    // Initialize shadcn
    console.log("Initializing shadcn...");
    try {
      execSync("npx shadcn@latest init", { stdio: "inherit" });
    } catch (error) {
      console.log(
        'Note: You may need to run "npx shadcn@latest init" manually if initialization failed.'
      );
    }

    // Install new dependencies after shadcn
    console.log("Installing final dependencies...");
    execSync("yarn", { stdio: "inherit" });

    // Modify components.json
    // const componentsJsonPath = path.join(process.cwd(), "components.json");
    // if (fs.existsSync(componentsJsonPath)) {
    //   console.log("Updating components.json...");
    //   try {
    //     const componentsJson = JSON.parse(
    //       fs.readFileSync(componentsJsonPath, "utf8")
    //     );

    //     // Modify the utils path as specified
    //     if (componentsJson.aliases) {
    //       componentsJson.aliases.utils = "/src/lib/utils";
    //     }

    //     fs.writeFileSync(
    //       componentsJsonPath,
    //       JSON.stringify(componentsJson, null, 2)
    //     );
    //     console.log("Successfully updated components.json");
    //   } catch (error) {
    //     console.error("Error updating components.json:", error.message);
    //   }
    // } else {
    //   console.log(
    //     "Warning: components.json not found. Make sure shadcn initialization completed successfully."
    //   );
    // }
    execSync("npx shadcn@latest add button", { stdio: "inherit" });

    console.log("Initializing git");

    execSync("git init", { stdio: "inherit" });
    execSync("git add .", { stdio: "inherit" });
    execSync(`git commit -m "first commit"`, { stdio: "inherit" });
    execSync("git checkout -b main", { stdio: "inherit" });

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
