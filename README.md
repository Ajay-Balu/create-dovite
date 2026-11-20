# create-dovite

**create-dovite** is a CLI that jumpstarts **Domo Custom Apps (pro-code apps)**. It combines the speed of **Vite** with **Tailwind CSS v4**, **shadcn/ui** components and a ready-made **Domo integration** (ryuu.js API layer + local dev proxy), so you go from zero to a running Domo app in minutes.

## Features

- ⚡️ Vite for fast development
- ⚛️ React and Vue support
- 📘 TypeScript and JavaScript support
- 🎨 Tailwind CSS v4
- 🎯 shadcn/ui (React) / shadcn-vue (Vue) components
- 🔄 Domo integration: one `src/API/domoApi` file for datasets, SQL, AppDB, files, Domo AI, workflows and Code Engine
- 🔌 Local dev proxy (`@domoinc/ryuu-proxy`) so Domo calls work on `localhost`
- 🤖 AI-agent ready: `AGENTS.md`, `CLAUDE.md` and 7 Domo skills (`.claude/skills/`) in every project — Claude Code, Cursor, Codex and Antigravity learn Domo, plan the architecture, recommend Code Engine / Data API / AppDB where it fits, then build
- 🧰 Your choice of **npm, yarn or pnpm**, optional **Redux Toolkit** (React) / **Pinia** (Vue), and optional **hash routing** (react-router / vue-router)
- 📦 `upload` script bumps the manifest version (0.0.1 → … → 0.0.9 → 0.1.0 …), builds, publishes to Domo, rolls back on failure and saves the design id

## Prerequisites

> Requires the **Domo CLI** (`ryuu`) and the package manager you choose (npm, yarn or pnpm).

```bash
npm install -g ryuu
```

- Node.js **20.19+** (required by Vite 8)

## Usage

```bash
npm create dovite@latest my-app
# or
yarn create dovite my-app
# or
pnpm create dovite my-app
```

You'll be asked for the template, package manager, state management and routing. Or pass flags:

```bash
npx create-dovite my-app -t react-ts --pm pnpm --store --router
```

| Flag | Values | Default |
| --- | --- | --- |
| `-t, --template` | `react-js`, `react-ts`, `vue-js`, `vue-ts` | asked |
| `--pm` | `npm`, `yarn`, `pnpm` | the one you ran create-dovite with |
| `--store` / `--no-store` | Redux Toolkit (React) / Pinia (Vue) | no |
| `--router` / `--no-router` | hash routing (react-router / vue-router) | no |
| `-y, --yes` | accept defaults for anything not passed | |

Then (shown with npm; use `yarn …` / `pnpm …` if you chose those):

```bash
cd my-app
domo login          # once per instance
npm run dev         # local dev with the Domo proxy
npm run upload      # bump manifest version, build, domo publish
```

`upload` bumps `version` in `public/manifest.json` (patch +1; patch and minor roll over after 9: `0.0.9 → 0.1.0`, `0.9.9 → 1.0.0`), restores it if the build or publish fails, and after the first publish copies the design `id` into `public/manifest.json` for you. Use `npm run upload -- --no-bump` to republish the same version or `-- --dry-run` to preview the next one.

## What you get

```
public/manifest.json         Domo app manifest (datasets, AppDB, workflows, Code Engine)
src/API/domoApi.(js|ts)      All Domo API calls in one place
src/API/currentUserContext.* Current Domo user (React context / Vue composable)
src/pages/index.*            Starter landing page
vite.config.*                Tailwind + ryuu-proxy + "@" alias
scripts/upload.mjs           Version bump + build + publish
src/store/ | src/stores/     Redux Toolkit / Pinia (optional)
src/router.* | src/router/   Hash routing (optional)
AGENTS.md / CLAUDE.md        Instructions for AI coding agents
.claude/skills/              Domo skills (planning, pro-code apps, APIs, Code Engine, embed, credits)
```

## What's new in 2.4.0

- Choose **npm, yarn or pnpm**; optional **Redux Toolkit** / **Pinia**; optional **hash routing**; new CLI flags (`--pm`, `--store`, `--router`, `-y`)
- `upload` auto-bumps the manifest version, rolls back on failure and saves the design id
- `main` / `App` now wire the current-user provider automatically
- Domo agent skills (`domo-skills/`) copied into every project's `.claude/skills/`, plus `AGENTS.md` for Cursor / Codex / Antigravity; agents plan and recommend (Code Engine, Data API vs SQL for embeds, AppDB, Workflows…) before building
- New `queryData` (page-filter aware Data API), `onDataUpdated`, `onFiltersUpdated`; manifest gets `fullpage` and device-permission flags
- Domo rules for agents: SQL API = one dataset per call (no JOINs, subqueries OK), Domo times are UTC, AppDB uses MongoDB query syntax

## What's new in 2.3.0

- Fixed React TS build errors with current create-vite (TypeScript 7 / Vite 8): removed `baseUrl`, manifest read without JSON import, `ryuu.js` v6 built-in types
- `dataApi` + `domoAPI` merged into a single `domoApi` file; added `startWorkflow`, `runCodeEngine`, `navigate`, `getEnv`; URL-encoding and error handling fixed
- Removed browser-side `api.domo.com` client-credential helpers (exposed secrets) — use Code Engine instead
- Keeps create-vite's own `build`/`lint` scripts; Vue templates no longer get a broken `eslint` script
- Vue: removed global CSS that overrode Tailwind utilities
- `--template` flag, project-name validation, `git init -b main`
- `CLAUDE.md` / `.claudeignore` / `.claude/settings.json` in every template

## Domo resources

- [Domo CLI setup](https://developer.domo.com/portal/6hlzv1hinkq19-setup-and-installation)
- [Domo App APIs](https://developer.domo.com/portal/8ba9aedad3679-ap-is)
- [Domo Starter Kits](https://developer.domo.com/portal/u8w475o2245yp-starter-kits)

## Inspirations

- [DOMO Starter Kits](https://developer.domo.com/portal/u8w475o2245yp-starter-kits)
- [Vitawind](https://vitawind.vercel.app/)

## Roadmap

- Angular templates (JS / TS)

## License

MIT
