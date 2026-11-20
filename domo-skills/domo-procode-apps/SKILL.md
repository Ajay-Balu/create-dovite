---
name: domo-procode-apps
description: How to build Domo custom (pro-code) apps with the App Framework, Pro-Code Editor, manifest.json, domo.js (ryuu.js), AppDB and the Domo CLI, including best practices, sandbox limitations, and enabling camera, microphone, location, Bluetooth and NFC through manifest flags. Use for any task that creates, edits, debugs or deploys a Domo app.
---

# Domo Pro-Code Apps

Tags: **[Documented]**, **[Inferred]**, **[Unverified]**. Researched 2026-11-19.
Deeper material: `references/manifest.md`, `references/device-permissions.md`, `references/domojs-api.md`,
`references/appdb.md`, `references/cli-and-local-dev.md`.

## What a Domo app is

A front-end web app (any JS framework; React, Angular, Vue starters exist) hosted by Domo and shown in a **sandboxed iframe**
on `{appId}.domoapps.{env}.domo.com`. It gets data and platform services through `domo.js` (ryuu.js), which proxies to App Framework APIs
using an app session ID. A published **App Design** produces many **App Instances (cards)**, each wired to its own datasets. [Documented]

## Pick the build path

| Path | Choose when | Notes |
|---|---|---|
| Pro-Code Editor (browser) | Quick prototype, HTML/CSS/JS, CDN libs | Built-in preview/version mgmt; released versions are view-only; preview updates only on save/refresh |
| App Framework + `domo` CLI | Complex app, npm/bundler, React/Vue/Angular, AppDB, Files API, CI/CD, teams | Up to 100 dataset connections; local dev with live reload |
| Domo Bricks | Low-code | Can convert to pro-code |
| App Catalyst | AI-assisted app creation; projects can jump straight to local dev | See `Apps/App-Catalyst.md` |
| Mason | Never for new work | Cannot be created/edited after 2026-10-14 |

**create-dovite projects** (`npm create dovite@latest <name>` / `yarn create dovite` / `pnpm create dovite`): Vite + Tailwind + shadcn + ryuu.js ^6 + ryuu-proxy, chosen package manager, optional Redux Toolkit/Pinia and hash routing (see the project's `AGENTS.md`). All Domo calls live in `src/API/domoApi.*` (datasets, SQL, AppDB, files, AI, workflows, Code Engine, navigate, events); add new calls there. Use `<pm> dev` / `<pm> upload` instead of `domo dev` / `domo publish` (see AGENTS.md in the project). [Confirmed]

## The best way to do things (recommended patterns)

1. **Push work to the server.** Use `domo.data.query` / `domo.get('/data/v1/alias?...')` with `fields`, `filter`, `groupby`, `sum`, `limit`, or `domo.data.sql`. "There is no reason to calculate a sum or average client-side." Never render millions of points; aggregate. [Documented]
2. **Map only needed columns** in `mapping[].fields` (or `datasetsMapping[].fields`), with aliases. An empty `fields` returns all columns under original names. [Documented]
3. **Listen, don't reload.** Register `domo.onDataUpdated(cb)`; without it the whole app reloads whenever the dataset updates (breaks SPA sub-routes). [Documented]
4. **Secrets and external APIs go through Code Engine**, wired by `packagesMapping`; call `domo.post('/domo/codeengine/v2/packages/{alias}', body)`. Cookie-less, no secrets in the browser. [Documented]
5. **App-owned state in AppDB**; sync to a DataSet only for reporting. Define collections in the manifest, add document-level filters for security (server-enforced). [Documented]
6. **Use a bundler** (Webpack recommended by Domo; Vite works in practice). Ship only needed assets. [Documented]
7. **Design responsive**: set `fullpage: true` so detail/fullscreen/mobile views fill the screen and handle resize; test mobile. [Documented]
8. **Semver in `manifest.json`**; bump before each publish; `domo release` only for Appstore-locked versions. [Documented]
9. **Add `thumbnail.png` (300x300)** at project root or card creation fails. [Documented]
10. **Cross-app coordination**: App Broadcasting (`domo.broadcast` / `onBroadcast`), 100 msg/s, 64 KB payload, page-scoped, needs `app-broadcasting` feature switch; use filters/variables when state must persist. [Documented]
11. **Typed errors**: catch `DomoAuthError` before `DomoHttpError` (it extends it). [Documented]
12. **Validate responses** with `options.schema` (zod etc.) to get `DomoValidationError`. [Documented]
13. **Follow Domo design guidance** (Material-like, 6 px grid, tokens in design-guide) only if the app should look native. [Documented]

## Limitations (design around them)

- No parent DOM access; no `<a href>` navigation (use `domo.navigate(url, newWindow?)`); external navigation domains must be whitelisted (**Admin > Network Security > Custom Apps authorized domains**; defaults: domo.com, jira.com, github.com, trello.com, salesforce.com, youtube.com, twitter.com, linkedin.com; customizing needs a CSM feature switch). [Documented]
- Product APIs are callable only from backend services, not from the app. [Documented]
- Cannot publish backend services; use Domo platform, AppDB, Code Engine, Workflows. [Documented]
- Only manifest-listed datasets are queryable; **max 100 data connections**. [Documented]
- No card Alerts, Buzz, Excel/CSV/PPT export from card details, or external slideshow viewing for custom apps. [Documented]
- Third-party APIs: must be `https://` and allow CORS. [Documented]
- `domo.data.sql` does not support page filters or JOINs. [Documented]
- **SQL API scope [Confirmed]:** each call targets ONE dataset — the alias in the URL is the only table. No JOINs or UNIONs across datasets. **Subqueries are supported** (against that same alias), e.g. `SELECT * FROM sales WHERE amount > (SELECT AVG(amount) FROM sales)`.
- **Time zone [Confirmed]:** Domo stores and returns dates/datetimes in **UTC** (datasets, SQL/Data API results, AppDB `createdOn`/`updatedOn`, workflow timestamps). Convert to the viewer's zone (`domo.env.locale`, `Intl.DateTimeFormat`) only for display; send UTC/ISO-8601 (`...Z`) in filters, AppDB queries and writes; beware day boundaries ("today" in IST starts 18:30 UTC the previous day).
- **AppDB query language [Confirmed]:** MongoDB query syntax. Fields live under `content.`: `{ "content.status": "open" }`, comparison/logic operators such as `$eq $ne $gt $gte $lt $lte $in $nin $and $or $exists`, dates as `{ "$date": "2026-11-01T00:00:00Z" }`; updates via `partialUpdate` with `$set $inc $push`. Aggregations (groupby/count/sum/avg/min/max/unwind) are query-string options, not a Mongo aggregation pipeline. Operators beyond those listed: test before relying on them.
- `onFiltersUpdated` first registration clears all parent page filters. [Documented]
- AppDB dataset sync can take ~15 min to appear; type mismatch is the top sync failure (use Domo types: STRING, LONG, DECIMAL, DOUBLE, DATE, DATETIME, not TS types). [Documented]
- Safari, iOS apps/web views and browsers with cross-site cookies disabled break most cookie-based Domo features (embeds, cookie sessions); rely on domo.js header auth and test there. See `domo-everywhere-embed`. [Confirmed]
- Public JS in `public-assets/` has no Domo API access and is unauthenticated; no secrets there. [Documented]
- Multiple copies of one app instance share the `ryuu_sid` cookie; send the session via header/query (domo.js does) to avoid stale filters. [Documented]
- Aggregated server queries cannot be sorted/limited server-side in the documented example; sort/slice client-side. [Documented]
- Unknown: AppDB size/count limits, Pro-Code Editor limits, browser support matrix, rate limits. Do not invent. [Not documented]

## Device features: camera, microphone, location, Bluetooth, NFC

Domo's March 2026 "Pro Code Components: API Updates" says Pro Code apps can "request access to browser peripheral APIs through
Boolean properties in the manifest": `allowGeolocation`, `allowCamera`, `allowMic`, `allowBluetooth`, `allowNFC`.
Example uses: camera for QR/QA code scanning, geolocation for location analytics, microphone for voice input. End users opt in
and control their own device permissions. [Documented]

Confirmed manifest syntax [Confirmed by maintainer]: five top-level booleans alongside the other manifest keys:

```json
{
  "name": "My App",
  "version": "1.0.0",
  "size": { "width": 4, "height": 3 },
  "mapping": [],
  "allowCamera": true,
  "allowBluetooth": false,
  "allowMic": false,
  "allowGeolocation": false,
  "allowNFC": false
}
```

Set each flag explicitly: `true` only for what the app needs, `false` for the rest (least privilege). The default when a flag is
omitted and the per-device/browser support matrix are not documented. [Unverified]

Procedure: set only the flags you need to `true` -> `domo publish` (bump version) -> re-save/recreate the card -> test in the
card on desktop and the Domo mobile app -> if it fails, check the browser console for Permissions-Policy / NotAllowedError messages
and ask Domo App Support (domoappsupport@domo.com) about device support. Full guidance: `references/device-permissions.md`.

## Standard workflow (CLI)

```bash
npm i -g ryuu                       # Node 18+ recommended
domo login -i your.instance.domo.com            # or: domo login -i ... -t <developer-token>
domo init my-app                    # or npm create dovite@latest my-app
cd my-app && domo dev               # http://localhost:3000, live reload, data proxy
domo publish                        # creates/updates the design; writes id into manifest
# create a card from the design, wire datasets, copy the card id -> manifest "proxyId"
```

Data queries in `domo dev` only work after first publish + `proxyId`. Details: `references/cli-and-local-dev.md`.

create-dovite equivalent: `domo login` -> `<pm> dev` (Vite on :5173 with ryuu-proxy) -> `<pm> upload` (`scripts/upload.mjs`): **auto-bumps `version` in `public/manifest.json`** (patch +1, patch/minor roll over after 9: 0.0.9 → 0.1.0, 0.9.9 → 1.0.0, major unbounded), builds, runs `domo publish` from `dist/`, rolls the bump back on failure, and copies the design `id` back into `public/manifest.json` after the first publish. Flags: `-- --no-bump`, `-- --dry-run`. Don't bump the version by hand in these projects. Set `proxyId` in `public/manifest.json` (the build copies `public/` into `dist/`).

## Do / Don't checklist

- Do `await domo.get('/domo/environment/v1/')` to verify identity; query-param `domo.env` values can be spoofed.
- Do filter and paginate (`limit`, `offset`) large datasets.
- Do keep `version` semver and publish from protected branches in CI with a token secret.
- Don't commit developer tokens; don't embed OAuth client secrets in app code.
- Don't use `domo.onDataUpdate` (v4, removed); don't `new Domo()` (static class).
- Don't edit manifest-defined AppDB collections via the Update Collection API (saving the card reverts them).

Sources: https://www.domo.com/docs/portal/Apps/Overview.md ; .../App-Framework/Guides/manifest.md ; .../Help/faq.md ; .../Tools/domo-js.md ;
.../Tools/domo-CLI.md ; https://www.domo.com/product/new-features/pro-code-components-api-updates ; https://www.domo.com/docs/s/article/March-2026-Release
