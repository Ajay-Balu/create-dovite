const fs = require("fs");
const prompts = require("prompts");
const { PACKAGE_MANAGERS, detectPackageManager } = require("./pm");

const TEMPLATES = [
  { title: "React JavaScript", value: "react-js" },
  { title: "React TypeScript", value: "react-ts" },
  { title: "Vue JavaScript", value: "vue-js" },
  { title: "Vue TypeScript", value: "vue-ts" },
];

const TEMPLATE_VALUES = TEMPLATES.map((t) => t.value);

const isVue = (template) => template.startsWith("vue");
/** Store library offered for a template: Redux Toolkit for React, Pinia for Vue. */
const storeName = (template) => (isVue(template) ? "Pinia" : "Redux Toolkit");

const USAGE = `
Usage: create-dovite [project-name] [options]

Options:
  -t, --template <name>   ${TEMPLATE_VALUES.join(" | ")}
  --pm <name>             ${PACKAGE_MANAGERS.join(" | ")} (default: the one you ran create-dovite with)
  --store / --no-store    Add Redux Toolkit (React) or Pinia (Vue)        (default: no)
  --router / --no-router  Add hash-based routing (react-router / vue-router) (default: no)
  -y, --yes               Use defaults for anything not given as a flag
  -h, --help              Show this help
`;

/** Parses `create-dovite [name] [flags]`. Unknown flags are reported. */
function parseArgs(argv) {
  const args = {};
  const takeValue = (i, flag) => {
    const value = argv[i + 1];
    if (!value || value.startsWith("-")) {
      console.error(`Missing value for ${flag}`);
      process.exit(1);
    }
    return value;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [flag, inline] = arg.split("=");
    switch (flag) {
      case "-t":
      case "--template":
        args.template = inline ?? takeValue(i++, flag);
        break;
      case "--pm":
        args.pm = inline ?? takeValue(i++, flag);
        break;
      case "--store":
        args.store = true;
        break;
      case "--no-store":
        args.store = false;
        break;
      case "--router":
        args.router = true;
        break;
      case "--no-router":
        args.router = false;
        break;
      case "-y":
      case "--yes":
        args.yes = true;
        break;
      case "-h":
      case "--help":
        console.log(USAGE);
        process.exit(0);
        break;
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}\n${USAGE}`);
          process.exit(1);
        }
        if (!args.projectName) args.projectName = arg;
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

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function ask(questions) {
  if (!questions.length) return {};
  return prompts(questions, {
    onCancel: () => {
      console.log("Operation cancelled");
      process.exit(0);
    },
  });
}

/**
 * Returns { projectName, templateType, pm, store, router }.
 * Flags win; otherwise the user is asked (or defaults are used with --yes).
 */
async function getProjectDetails(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const defaults = { pm: detectPackageManager(), store: false, router: false };

  if (args.template && !TEMPLATE_VALUES.includes(args.template)) {
    fail(`Unknown template "${args.template}". Choose one of: ${TEMPLATE_VALUES.join(", ")}`);
  }
  if (args.pm && !PACKAGE_MANAGERS.includes(args.pm)) {
    fail(`Unknown package manager "${args.pm}". Choose one of: ${PACKAGE_MANAGERS.join(", ")}`);
  }
  if (args.projectName) {
    const valid = validateProjectName(args.projectName);
    if (valid !== true) fail(valid);
  }
  if (args.yes) {
    args.projectName ??= "my-dovite-app";
    args.template ??= "react-ts";
    args.pm ??= defaults.pm;
    args.store ??= defaults.store;
    args.router ??= defaults.router;
  }

  // Name + template first (the store question depends on the framework).
  const first = await ask([
    !args.projectName && {
      type: "text",
      name: "projectName",
      message: "Project name:",
      initial: "my-dovite-app",
      validate: validateProjectName,
    },
    !args.template && {
      type: "select",
      name: "template",
      message: "Select a template:",
      choices: TEMPLATES,
      initial: 0,
    },
  ].filter(Boolean));

  const projectName = args.projectName || first.projectName;
  const templateType = args.template || first.template;

  const second = await ask([
    args.pm === undefined && {
      type: "select",
      name: "pm",
      message: "Package manager:",
      choices: PACKAGE_MANAGERS.map((pm) => ({ title: pm, value: pm })),
      initial: PACKAGE_MANAGERS.indexOf(defaults.pm),
    },
    args.store === undefined && {
      type: "toggle",
      name: "store",
      message: `Add ${storeName(templateType)} for state management?`,
      initial: defaults.store,
      active: "yes",
      inactive: "no",
    },
    args.router === undefined && {
      type: "toggle",
      name: "router",
      message: "Add routing (hash-based, works inside Domo)?",
      initial: defaults.router,
      active: "yes",
      inactive: "no",
    },
  ].filter(Boolean));

  return {
    projectName,
    templateType,
    pm: args.pm ?? second.pm,
    store: args.store ?? second.store,
    router: args.router ?? second.router,
  };
}

module.exports = { getProjectDetails, TEMPLATE_VALUES, isVue, storeName };
