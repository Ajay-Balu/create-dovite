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
- 📦 `yarn upload` builds and publishes to Domo

## Prerequisites

> This package requires **yarn** and the **Domo CLI** (`ryuu`).

```bash
npm install -g yarn ryuu
```

- Node.js **20.19+** (required by Vite 8)

## Usage

```bash
# Using yarn (recommended)
yarn create dovite my-app

# Using npm
npx create-dovite my-app

# Skip the template prompt
npx create-dovite my-app --template react-ts   # react-js | react-ts | vue-js | vue-ts
```

Then:

```bash
cd my-app
domo login      # once per instance
yarn dev        # local dev with the Domo proxy
yarn upload     # build + domo publish
```

After the **first** publish, copy the `id` that Domo writes into `dist/manifest.json` back into `public/manifest.json` (see the project's `CLAUDE.md`).

## What you get

```
public/manifest.json         Domo app manifest (datasets, AppDB, workflows, Code Engine)
src/API/domoApi.(js|ts)      All Domo API calls in one place
src/API/currentUserContext.* Current Domo user (React context / Vue composable)
src/pages/index.*            Starter landing page
vite.config.*                Tailwind + ryuu-proxy + "@" alias
AGENTS.md / CLAUDE.md        Instructions for AI coding agents
.claude/skills/              Domo skills (planning, pro-code apps, APIs, Code Engine, embed, credits)
```

## What's new in 2.3.0

- Fixed React TS build errors with current create-vite (TypeScript 7 / Vite 8): removed `baseUrl`, manifest read without JSON import, `ryuu.js` v6 built-in types
- Domo agent skills (`domo-skills/`) copied into every project's `.claude/skills/`, plus `AGENTS.md` for Cursor / Codex / Antigravity; agents plan and recommend (Code Engine, Data API vs SQL for embeds, AppDB, Workflows…) before building
- New `queryData` (page-filter aware Data API), `onDataUpdated`, `onFiltersUpdated`; manifest gets `fullpage` and device-permission flags
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
