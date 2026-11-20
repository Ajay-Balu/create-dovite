// Package-manager specific commands. Everything the CLI runs goes through here.

const PACKAGE_MANAGERS = ["npm", "yarn", "pnpm"];

const COMMANDS = {
  npm: {
    create: (name, template) =>
      `npm create vite@latest "${name}" -- --template ${template} --no-interactive`,
    install: "npm install",
    add: (pkgs) => `npm install ${pkgs.join(" ")}`,
    addDev: (pkgs) => `npm install -D ${pkgs.join(" ")}`,
    dlx: "npx",
    run: (script) => `npm run ${script}`,
  },
  yarn: {
    create: (name, template) =>
      `yarn create vite "${name}" --template ${template} --no-interactive`,
    install: "yarn install",
    add: (pkgs) => `yarn add ${pkgs.join(" ")}`,
    addDev: (pkgs) => `yarn add -D ${pkgs.join(" ")}`,
    dlx: "npx", // yarn 1 has no dlx; npx works everywhere
    run: (script) => `yarn ${script}`,
  },
  pnpm: {
    create: (name, template) =>
      `pnpm create vite "${name}" --template ${template} --no-interactive`,
    install: "pnpm install",
    add: (pkgs) => `pnpm add ${pkgs.join(" ")}`,
    addDev: (pkgs) => `pnpm add -D ${pkgs.join(" ")}`,
    dlx: "pnpm dlx",
    run: (script) => `pnpm ${script}`,
  },
};

/** The package manager that launched us (`yarn create dovite`, `pnpm create dovite`, `npx …`). */
function detectPackageManager() {
  const agent = process.env.npm_config_user_agent || "";
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";
  if (agent.startsWith("npm")) return "npm";
  return "npm";
}

function pmCommands(pm) {
  const cmds = COMMANDS[pm];
  if (!cmds) throw new Error(`Unsupported package manager: ${pm}`);
  return cmds;
}

module.exports = { PACKAGE_MANAGERS, detectPackageManager, pmCommands };
