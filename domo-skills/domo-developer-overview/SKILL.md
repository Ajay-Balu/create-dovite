---
name: domo-developer-overview
description: Entry point for any Domo development task (custom/pro-code apps, Domo Everywhere embedding, Domo APIs, Code Engine, workflows, credits). Use first to pick the right Domo approach, learn the hard platform rules and limits, and find the right detailed skill or docs page.
---

# Domo Developer Overview (router)

Read this first, then open the specific skill. Confidence tags: **[Documented]**, **[Inferred]**, **[Unverified]**.
Researched 2026-11-19 from the Domo Developer Portal. Docs change often; when stakes are high, re-fetch the page
(append `.md` to any portal URL for clean markdown; full index at https://www.domo.com/docs/llms.txt).

## Mental model

Domo is a hosted data platform: data lands in **DataSets**, is transformed (Magic ETL, SQL dataflows, Jupyter),
and is shown in **cards/pages/App Studio**. Developers extend it four ways:

1. **Apps** (custom / pro-code): front-end web apps in a sandboxed iframe, data via `domo.js`. -> `domo-procode-apps`
2. **Automation**: Workflows (low-code orchestration) and Code Engine (server-side JS/Python functions). -> `domo-code-engine`
3. **APIs**: three families with different auth. -> `domo-apis`
4. **Domo Everywhere**: embed, publish, and white-label content to people outside your company. -> `domo-everywhere-embed`

Most platform activity meters **credits** (**Code Engine itself consumes none**). -> `domo-credit-consumption`

## Choose the right tool

| Need | Use | Why / caveat |
|---|---|---|
| Custom UI over Domo data, full control | **App Framework** (local dev, `domo` CLI, React/Vue/Angular, npm) | Up to 100 dataset connections, AppDB, Files API, CI/CD |
| Fast browser-only prototype | **Pro-Code Editor** (Asset Library > Pro-Code Apps) | HTML/CSS/JS, CDN libs, no local setup; released versions are locked |
| Drag-and-drop custom card | **Domo Bricks** (convertible to pro-code) | Use when no code is needed |
| Mason apps | Do not start new ones | Cannot be created/edited after Oct 14, 2026; migrate to Domo Apps |
| Server-side logic, secrets, external APIs from an app | **Code Engine** wired via `packagesMapping` | Apps cannot hold secrets or call Product APIs from the browser |
| Multi-step orchestration, human tasks, scheduled/event flows | **Workflows** (can run Code Engine functions) | App can start a workflow via `workflowMapping` |
| Heavy data processing | **Jupyter / Magic ETL** | Code Engine max 5 min / 1 GB, "not meant for heavy data processing" |
| App-owned state, user content | **AppDB** (JSON document store, optional sync to DataSet) | Not for BI-scale data |
| Show dashboards to external customers | **Domo Everywhere** embed with **programmatic filters** | Cookie-less, recommended over PDP+SSO cookies |
| Provision customer instances / push content | **Domo Publish** (needs Domo Everywhere license) | Purchase through CSM |
| Admin/ETL scripts outside Domo | **Platform (OAuth) APIs** | Scoped, expiring tokens |
| Anything the UI can do, from a server | **Product APIs** + developer token | Broadest power, server-side only (CORS) |
| LLM features inside an app | **AI Service Layer** (`/domo/ai/v1/...`) | AI Pro feature, consumes AI credits |

## Thirteen hard rules

1. **Apps are sandboxed.** No access to the parent DOM. Regular `<a href>` links do not work in the iframe; use `domo.navigate()`. [Documented]
2. **Never put secrets in app code** (client secrets, developer tokens). Use Code Engine + Domo Accounts. [Documented: Product APIs are CORS-restricted, server-side only]
3. **Only manifest-mapped datasets are queryable**; max 100 data connections per app. [Documented]
4. **Aggregate and filter server-side** (query params / SQL / ETL). Do not pull millions of rows into the browser. Map only the columns you need. [Documented]
5. **`proxyId` is required for local dev** against AppDB, Workflows, Code Engine, DQL, writeback, OAuth. It is a card ID; deleting that card breaks it. [Documented]
6. **Bump `version` in manifest.json** before `domo publish` or you overwrite the same version. `domo release` locks it. [Documented] (create-dovite projects: the `upload` script bumps it automatically; don't bump by hand.)
7. **External resources must be `https://`**; third-party APIs need CORS; external-link domain whitelist is admin-controlled. [Documented]
8. **Code Engine: 5 min, 1 GB, one output.** Return a single `object` for complex results. [Documented]
9. **Product APIs: server-side only.** App code uses App Framework APIs via `domo.js`. [Documented]
10. **Credits are consumed by ingest, ETL, AI, workflows, Jupyter, storage, and Everywhere end-customer accounts. Code Engine consumes no credits.** Fewer table updates = fewer credits. [Documented]
11. **Device features (camera, mic, location, Bluetooth, NFC) need manifest allow flags**: top-level booleans `allowCamera`, `allowBluetooth`, `allowMic`, `allowGeolocation`, `allowNFC`. [Confirmed by maintainer; see `domo-procode-apps/references/device-permissions.md`]
12. **Use the confirmed manifest key spellings**: `mapping`|`datasetsMapping`, `collections`|`collectionsMapping`, `workflowMapping`, `packagesMapping`, `id`, `proxyId`. The docs sometimes say `packageMapping` / `workflowsMapping`; do not use those. See `references/doc-inconsistencies.md`.
13. **SQL API = one dataset per call** (alias is the only table): no JOINs/UNIONs, subqueries OK. **Domo times are UTC.** **AppDB queries use MongoDB syntax** on `content.<field>`. [Confirmed]

## Terminology

- **Instance**: a customer's Domo account (`company.domo.com`).
- **App Design**: the published app template (has `id`). **App Instance = Card** created from a design.
- **Wiring screen**: where an instance maps to datasets/collections/workflows/packages after publish.
- **Manifest**: `manifest.json` (name, version, size, mappings, collections, channels, flags).
- **ryuu / Domo CLI**: `npm i -g ryuu`; **ryuu.js / domo.js**: browser SDK (v6).
- **AppDB**: Domo JSON document store (MongoDB-style queries) scoped to an app.
- **PDP**: Personalized Data Permissions (row-level security).
- **Beast Mode**: calculated field. **Magic ETL**: visual dataflow tool.
- **Domo Everywhere**: external sharing/embed/publish product line.

## Skill map

- `domo-app-planning`: requirement -> architecture rules, questions to ask, recommendations to offer before building
- `domo-procode-apps`: build apps, manifest, domo.js, AppDB, CLI, limits, device permissions
- `domo-everywhere-embed`: embed/publish/edit flows, programmatic filters, embed auth
- `domo-apis`: App Framework vs Platform (OAuth) vs Product APIs
- `domo-code-engine`: packages, `codeengine` library, limits, invocation paths
- `domo-credit-consumption`: credit table, caps, cost-aware design, estimator script

## References

- `references/docs-index.md`: Developer Portal sidebar structure with URLs
- `references/doc-inconsistencies.md`: doc contradictions and verify-before-trusting list

## Working method for agents

0. For a new app/feature, run the `domo-app-planning` protocol first: ask what changes the design, recommend Domo-native options, get agreement.
1. Identify which of the four extension paths applies, open that skill.
2. Prefer documented patterns; label anything inferred.
3. For manifest or API shapes not in the skill, fetch the exact docs page (index in `references/docs-index.md`) rather than guessing.
4. Before recommending architectures, estimate credit impact (`domo-credit-consumption`).

Sources: https://www.domo.com/docs/portal/Getting-Started/overview, https://www.domo.com/docs/portal/Apps/Overview.md,
https://www.domo.com/docs/s/article/Current-Release-Notes.md
