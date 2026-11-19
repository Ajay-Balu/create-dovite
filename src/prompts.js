const fs = require("fs");
const prompts = require("prompts");

const TEMPLATES = [
  { title: "React JavaScript", value: "react-js" },
  { title: "React TypeScript", value: "react-ts" },
  { title: "Vue JavaScript", value: "vue-js" },
  { title: "Vue TypeScript", value: "vue-ts" },
];

const TEMPLATE_VALUES = TEMPLATES.map((t) => t.value);

/** Parses `create-dovite [name] [--template|-t <template>]`. */
function parseArgs(argv) {
  const args = { projectName: undefined, template: undefined };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--template" || arg === "-t") {
      args.template = argv[++i];
    } else if (arg.startsWith("--template=")) {
      args.template = arg.slice("--template=".length);
    } else if (!arg.startsWith("-") && !args.projectName) {
      args.projectName = arg;
    }
  }
  return args;
}

function validateProjectName(name) {
  if (!name || !name.trim()) return "Project name is required";
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) {
    return "Use lowercase letters, numbers, '-', '_' or '.' (must start with a letter or number)";
  }
  if (fs.existsSync(name)) return `Folder "${name}" already exists`;
  return true;
}

async function getProjectDetails(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  if (args.template && !TEMPLATE_VALUES.includes(args.template)) {
    console.error(
      `Unknown template "${args.template}". Choose one of: ${TEMPLATE_VALUES.join(", ")}`
    );
    process.exit(1);
  }

  if (args.projectName) {
    const valid = validateProjectName(args.projectName);
    if (valid !== true) {
      console.error(valid);
      process.exit(1);
    }
  }

  const questions = [];
  if (!args.projectName) {
    questions.push({
      type: "text",
      name: "projectName",
      message: "Project name:",
      initial: "my-dovite-app",
      validate: validateProjectName,
    });
  }
  if (!args.template) {
    questions.push({
      type: "select",
      name: "template",
      message: "Select a template:",
      choices: TEMPLATES,
      initial: 0,
    });
  }

  const response = questions.length
    ? await prompts(questions, {
        onCancel: () => {
          console.log("Operation cancelled");
          process.exit(0);
        },
      })
    : {};

  return {
    projectName: args.projectName || response.projectName,
    templateType: args.template || response.template,
  };
}

module.exports = { getProjectDetails, TEMPLATE_VALUES };
