# create-dovite — CLI repository

`create-dovite` is an npm "create" CLI (`yarn create dovite <name>` /
`npx create-dovite <name>`) that scaffolds **Domo pro-code (custom) apps**:
it runs `create-vite`, adds Domo + Tailwind dependencies, copies a template on
top, sets up shadcn, and initialises git — so a developer can start building a
Domo app in minutes.

This file is about **developing the CLI itself**. Each template ships its own
`CLAUDE.md` with Domo app context for the generated project.

## Layout

```
index.js                  CLI entry (bin). Orchestrates the steps below.
src/
  prompts.js              Args (`<name>`, `--template/-t`) + interactive prompts, name validation
  setup.js                Shell steps: prerequisites, create-vite, package.json, deps, shadcn, git
  files.js                Copy template, {{PROJECT_NAME}} placeholders, manifest, remove Vite demo files
templates/
  react-js/  react-ts/  vue-js/  vue-ts/     Files copied OVER the create-vite output
scripts/check-templates.js  Offline template checks (`npm test`, runs in CI)
.github/workflows/npm-publish.yml   test on push/PR, publish on GitHub release
```

## Scaffold pipeline (index.js)

1. `getProjectDetails()` — name + template (args or prompts)
2. `checkPrerequisites()` — yarn required, Domo CLI warned
3. `createViteProject()` — `yarn create vite <name> --template <vite-template> --no-interactive`
4. `updatePackageJson()` — keeps create-vite's scripts, adds `upload`
5. `installDependencies()` — `ryuu.js@^6 @domoinc/ryuu-proxy@^5 tailwindcss @tailwindcss/vite` (+ `react-icons` for React)
6. `copyTemplateFiles()` — template overwrites Vite files; `_gitignore` → `.gitignore`; `{{PROJECT_NAME}}` replaced in CLAUDE.md
7. `cleanupViteDefaults()` — removes `src/App.css`, `src/style.css`, `src/assets`, `HelloWorld.vue`
8. `updateManifest()` — sets `name` in `public/manifest.json`
9. `initializeShadcn()` — `npx shadcn(-vue)@latest init` + `add button` (interactive; failure is non-fatal but prints next steps)
10. `initializeGit()` — `git init -b main` + first commit

## What every template contains

| File | Purpose |
| --- | --- |
| `public/manifest.json` | Domo app manifest (name/size/mapping/collections/workflowMapping/packagesMapping) |
| `public/thumbnail.png` | Card thumbnail |
| `vite.config.(js\|ts)` | Tailwind plugin, ryuu-proxy dev middleware, `@` alias, `base: "./"`; reads manifest with `fs` (no JSON import — breaks under TS `module: nodenext`) |
| `src/API/domoApi.(js\|ts)` | **Single** Domo API file (datasets, SQL, AppDB, files, AI, workflows, Code Engine, navigate/env) |
| `src/API/currentUserContext.*` | React context + `useCurrentUser()` / Vue `useUserProvider()` + `useUserContext()` |
| `src/pages/index.*` | Landing page; imports `@/components/ui/button` (created by shadcn) |
| `src/index.css` | `@import "tailwindcss";` |
| `CLAUDE.md`, `.claudeignore`, `.claude/settings.json` | AI-assistant context for the generated app |

## Rules when changing templates

- **Keep the four templates in sync.** A change to `domoApi` must land in all of
  them: TS files are the source of truth; JS files are the same code with types
  stripped (comments kept). `npm test` fails if exported function names differ.
- Never import `axios`, `dataApi` or `domoAPI` (removed in 2.3.0 — merged into `domoApi`).
  Browser code must not call `api.domo.com` with client credentials; use Code Engine.
- Template `CLAUDE.md` files share one structure; update all four together.
- npm never publishes files named `.gitignore`. Name them `_gitignore` (renamed on copy).
- Don't hardcode options the upstream tools may drop. create-vite (currently Vite 8,
  TypeScript 7 for react-ts / 6 for vue-ts, oxlint) changes often:
  - no `baseUrl` in tsconfig (removed in TS 7, deprecated in 6) — `paths` alone works;
  - don't overwrite create-vite's `build`/`lint` scripts;
  - root `tsconfig.json` must keep `compilerOptions.paths` (shadcn reads it).
- `ryuu.js` is pinned to `^6` (ships its own types — don't add `declare module "ryuu.js"`).

## Testing changes

```bash
npm test                                    # offline checks (CI)
node index.js tmp-app -t react-ts           # full scaffold (needs network + yarn)
cd tmp-app && yarn build && yarn lint && yarn dev
```

Test **all four** templates for anything touching `src/` or shared template files.
`yarn build` must pass with no TS errors; the dev server should answer
`/domo/environment/v1` (401 "Not authenticated" without `domo login` is expected).
Delete `tmp-*` folders afterwards (ignored by git).

## Releasing

1. Bump `version` in `package.json` (semver; breaking template API changes = major).
2. Commit, push, create a GitHub release → workflow runs `npm test` then `npm publish`.

## Roadmap

- Angular templates (`angular-js`, `angular-ts`): Angular CLI is not a Vite
  template, so `createViteProject` needs a per-framework creator
  (`ng new --skip-git --style=css`), Tailwind via PostCSS, spartan/ui or
  shadcn-style components, ryuu-proxy wired through `proxy.conf`/dev-server
  middleware, and the same `domoApi.ts` (as an injectable service).
