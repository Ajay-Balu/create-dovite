# Domo CLI (ryuu) and local development

Sources: Tools/domo-CLI.md, Guides/Local-Development-with-Domo-CLI.md, Tools/domo-publish-CICD.md. [Documented]

Install: `npm install -g ryuu` (Homebrew/Chocolatey deprecated). Node 18+ recommended. Update: `npm update -g ryuu`.
Windows legacy prerequisites (Python 2.7, VS 2015 build tools) appear in Troubleshooting; likely outdated.

## Commands
| Command | Purpose |
|---|---|
| `domo init [name]` | New design from starter (hello world, manifest only, Phoenix bar chart, Phoenix world map, sugarforce) |
| `domo dev [-u userId] [-e]` | Local server http://localhost:3000, live reload, manifest-sized frame, data proxy |
| `domo login [-i inst] [-u email] [-t token]` / `--token-only` | Auth; needed for publish and live data in dev |
| `domo token add|remove -i inst -t TOKEN` | Manage stored developer tokens |
| `domo logout`, `domo remove [--instance n | --all]` | End session / delete saved creds |
| `domo owner add|rm|ls email` | Design owners (only owners manage/deploy) |
| `domo publish [-g]` | Upload design; writes `id` to manifest on first publish; overwrites same version |
| `domo release [-v version]` | Lock version for Appstore (default latest) |
| `domo download [-i id] [-d version]`, `domo ls` | Fetch / list designs |
| `domo delete [id] [-f] [-c]`, `domo undelete [id]` | Soft delete / restore |
| `domo proxy host port [-a] [-r]` | Corporate proxy |
| Global: `-m <manifest>`, `-s` (disable SSL, avoid), `-v` | |

## Local dev recipe
1. `domo login`; 2. `domo init my-app`; 3. add `thumbnail.png` 300x300; 4. `domo publish`;
5. create a card from the design, wire datasets; 6. copy card id (after `/kpis/details/`) into manifest `proxyId`;
7. `domo dev`; edit; test with real data; 8. bump `version`, `domo publish`.
Without `proxyId`, queries do not return data in dev. AppDB, Files, Code Engine, Workflows all need it. Deleting that card breaks proxying.

## CI/CD pattern
```bash
npm install -g ryuu
domo login -i $DOMO_INSTANCE -t $DOMO_TOKEN
domo publish          # on main you may add: domo release -v latest
```
Secrets `DOMO_INSTANCE`, `DOMO_TOKEN` in GitHub Actions/GitLab/Jenkins/Azure DevOps; separate staging vs production instances and tokens; protected branches; run tests first; rotate tokens; never commit tokens. Auth failures: token alphanumeric, >=20 chars, not expired, correct instance. Publish failures: valid manifest, you are owner, files committed.

## Vite/React projects (create-dovite style) [Inferred from user's repo, not Domo docs]
- `<pm> dev` (npm run / yarn / pnpm — check `AGENTS.md` for the project's package manager) = Vite dev server with `@domoinc/ryuu-proxy` middleware reading `public/manifest.json` (Vite default `base`, so asset URLs start with `/`).
- `<pm> upload` (`scripts/upload.mjs`): **auto-bumps `version` in `public/manifest.json`** (patch +1, patch/minor roll over after 9: 0.0.9 → 0.1.0, 0.9.9 → 1.0.0, major unbounded), builds, runs `domo publish` from `dist/`, rolls the bump back on failure, and copies the design `id` back into `public/manifest.json` after the first publish. Flags: `-- --no-bump`, `-- --dry-run`. Don't bump the version by hand in these projects.
- Vite copies `public/` (manifest.json, thumbnail.png) into `dist/`, so **edit `public/manifest.json`**, never `dist/manifest.json`.
- If you publish manually (`domo publish` in `dist/`), copy the `id` Domo writes into `dist/manifest.json` back into `public/manifest.json`, or the next build drops it and creates a new design. The upload script does this for you.
- `/domo/environment/v1` returning 401 "Not authenticated" without `domo login` is expected.
- Keep all Domo calls in one `src/API/domoApi.*` module; browser code must never call `api.domo.com` with client credentials (use Code Engine).

## Troubleshooting quick list
- App will not load an asset: path must start with `/` for in-design files; externals must be `https://`.
- Card cannot be created: missing 300x300 `thumbnail.png`.
- Version overwritten: bumped `package.json` instead of `manifest.json` version.
- Stale filters across tabs/cards: cookie session sharing; update ryuu/domo.js so header is used.
- Bug report to Domo: minimal repro app, webform dataset CSV in app dir, zip, include `domo --version`.
