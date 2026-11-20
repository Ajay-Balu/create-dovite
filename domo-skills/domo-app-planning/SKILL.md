---
name: domo-app-planning
description: Turn a Domo app request into the right architecture before writing code - requirement questions to ask, signal-to-solution rules (Code Engine vs browser, Data API vs SQL when embedded or filtered, AppDB vs DataSet, Workflows, Everywhere, AI, device features), what to recommend to the developer, credit impact, and the manual Domo steps to hand back. Use at the start of any new Domo app, feature, or significant change, and whenever a requirement smells like a platform limit.
---

# Domo app planning (requirements -> recommendations -> build)

Purpose: act like a senior Domo solution architect. Read the requirement, spot the platform constraints it will hit,
**recommend the better Domo-native approach with a short reason, and ask before building it**. Then implement using the
project's conventions (`src/API/domoApi.*`, `public/manifest.json`).

Tags: **[Documented]** (Domo docs, see the linked skills), **[Inferred]** (reasoned from docs/web platform), **[Confirmed]** (maintainer, hands-on).

## Protocol

1. **Read the request.** Note every signal from the table below that applies.
2. **Ask only what changes the design** (max ~5 questions, one message). Skip what the request already answers.
3. **Present a short plan** before coding:
   - What you'll build (screens/components, data calls).
   - **Recommendations** — one line each: *"Use X instead of Y because Z. Want me to do that?"*
   - Credit impact if any metered feature is involved (see `domo-credit-consumption`).
   - What the developer must do in Domo (dataset IDs, wiring, Code Engine package, proxyId).
4. **Build after the developer agrees** (or on clear "just build it" instructions; then state the assumptions you made).
5. **Finish with a hand-off checklist**: manifest entries to fill, cards to wire, `proxyId`, version bump, publish.

## Questions worth asking (pick the relevant ones)

| Question | Why it matters |
|---|---|
| Where will it run: Domo page/dashboard, App Studio, **embedded in an external site** (Domo Everywhere), Domo mobile? | Filters, auth/cookies, sizing, which data API to use |
| Which datasets, roughly how many rows, and does the UI need raw rows or aggregates? | Server-side aggregation, mapping only needed fields |
| Who uses it and must users see **different rows**? | PDP / programmatic filters / AppDB document filters (server-enforced) vs UI filtering (not security) |
| Does it **write** anything (forms, comments, approvals, status changes)? | AppDB, Workflows, sync-to-DataSet cost |
| Does it call **external systems** or need **secrets/service accounts**? | Code Engine + Domo Accounts |
| Anything scheduled, long-running, multi-step or needing approvals/notifications? | Workflows (+ Code Engine) |
| AI features? Domo-provided or customer-provided model? | AI Pro credits |
| Camera / QR / location / mic / Bluetooth / NFC? | Manifest `allow*` flags, browser support |
| Should it react to dashboard filters or drive other cards? | `onFiltersUpdated`, `requestFiltersUpdate`, broadcast |

## Signal -> recommendation rules

| If the requirement says / implies… | Recommend | Why | Read |
|---|---|---|---|
| Call a 3rd-party API, use an API key/secret, a service account, or a Domo **Product API** (admin, users, roles, groups, scheduled reports, dataset import, bulk AppDB ops…) | **Code Engine function** wired via `packagesMapping`, called with `runCodeEngine(alias, input)`. Offer to write the function + manifest entry | Browser can't hold secrets; Product APIs are CORS-blocked. Inside Code Engine, `codeengine.sendRequest('/api/...')` reaches any Product API **without domain or token** [Confirmed]; Node built-ins (crypto…) available; **no credits** [Confirmed] | `domo-code-engine`, `domo-apis` |
| A **global Code Engine package** already covers the action | Use the global package instead of custom code | Less code to own | `domo-code-engine` |
| App is **embedded in an external website** / customer portal, or sits on a dashboard with **page filters** | Use **`queryData` / `fetchData` (Data API)**, not `fetchSqlData` | `domo.data.sql` ignores page filters [Documented]; programmatic embed filters apply to dataset queries, so SQL would bypass them [Inferred] — a correctness *and* security issue | `domo-everywhere-embed`, `domo-procode-apps` |
| Embedded externally (any data) | Server-side **programmatic filtering** for row security; no cookie auth reliance (domo.js sends the session header); ask IdP admin to whitelist `*.domoapps.*.domo.com`; size iframe via postMessage height | Safari & others block 3rd-party cookies; client-side filters are not security | `domo-everywhere-embed` |
| Users on **Safari, iPhone/iPad, iOS/Android in-app web views**, or locked-down corporate browsers | Ask early. Warn that cookie-based Domo features (SSO+PDP embeds, cookie sessions, embedded edit) mostly fail when cross-site cookies are blocked; choose cookie-less options (programmatic filters, header auth) and plan Safari/iOS testing | Third-party/cross-site cookies blocked [Confirmed] | `domo-everywhere-embed` |
| Needs a **JOIN/UNION** across datasets | Build a **Magic ETL / DataSet View** output and map that one dataset | SQL API queries only the one dataset in the URL alias — no JOINs [Documented/Confirmed]; joining in the browser pulls too much data | `domo-procode-apps` |
| Comparisons within one dataset (above average, top-N per group, latest per key) | SQL **subquery** on the same alias via `fetchSqlData` (standalone apps) | Subqueries are supported [Confirmed]; keeps the work server-side | `references/domojs-api.md` |
| Dates, "today", time ranges, schedules, timestamps shown to users | Treat everything from Domo as **UTC**; filter/write in UTC ISO-8601, convert to the viewer's zone only for display; ask which time zone defines "day" for business rules | Domo uses UTC [Confirmed]; IST/US users see off-by-one days otherwise | `domo-procode-apps` |
| Search/filter saved app records | AppDB `QueryDocument` with **MongoDB** filters on `content.<field>` (`$in`, `$gte`, `$and`…) — not client-side filtering of `ListDocuments` | AppDB uses MongoDB query syntax [Confirmed]; server-side, scales | `references/appdb.md` |
| Large dataset, totals/averages/charts | Server-side aggregation: `queryData(alias, { groupBy, sum, fields, limit })` or SQL `GROUP BY`; map only needed fields | "No reason to calculate a sum client-side" [Documented]; browser memory | `domo-procode-apps` |
| Save user input, settings, comments, app state | **AppDB** collection (`collections` in manifest) via `CreateDocument`/`QueryDocument` | App-owned JSON store, immediate reads/writes | `domo-procode-apps/references/appdb.md` |
| That saved data must appear in dashboards | AppDB `syncEnabled: true` + schema with **top-level** keys and Domo types | Sync = a table update (ingest credit); can take ~15 min | `appdb.md`, `domo-credit-consumption` |
| Different users may only see/edit their own records | AppDB **document filters** in the manifest (`%userId%`), PDP on datasets | Server-enforced; UI checks are not security | `references/manifest.md` |
| Approvals, multi-step processes, human tasks, emails, scheduled runs | **Workflow** (`workflowMapping`, `startWorkflow`), with Code Engine steps where logic is needed | Apps can't run in the background; 0.04 credits per start + per task | `domo-code-engine`, `domo-credit-consumption` |
| Heavy transforms, ML, > 5 min or > 1 GB | Magic ETL / Jupyter / AutoML, app just reads the output | Code Engine limit 5 min / 1 GB, one output | `domo-code-engine` |
| Run a dataflow on demand | Workflow or Code Engine (Product API) triggered from the app | Avoid secrets in the browser | `domo-apis` |
| "Should update when data refreshes" | `onDataUpdated(cb)` and re-fetch | Otherwise Domo reloads the whole app | `domo-procode-apps` |
| React to / drive dashboard filters | `onFiltersUpdated` (first registration **clears** page filters) / `domo.requestFiltersUpdate` | Know the side effect before shipping | `references/domojs-api.md` |
| Talk to other custom apps on the page | `domo.broadcast` / `onBroadcast` + `channels` in manifest | Page-scoped, 64 KB, feature switch | `references/manifest.md` |
| AI summaries, text-to-SQL, chat | `fetchAIData` / `domo.ai.*`; cache results, avoid per-keystroke calls; suggest customer-provided model if credits matter | AI Pro credits per operation + tokens | `domo-credit-consumption` |
| QR/barcode scan, photos, GPS, voice, Bluetooth, NFC | Set only the needed `allow*` manifest flag to `true`; trigger from a click; provide a fallback | Browser support varies (Web Bluetooth/NFC = Chromium/Android only) | `references/device-permissions.md` |
| Export to CSV/Excel | Data API `format: "csv"`/`"excel"` (Blob) or build the file client-side | Card-details export isn't available for custom apps [Documented] | `references/domojs-api.md` |
| Link to other Domo pages or external sites | `navigate(url, newWindow)`; external domains must be whitelisted by an admin | `<a href>` can't navigate the sandboxed iframe | `domo-procode-apps` |
| Multiple customers each needing their own instance/content | Domo **Publish** (Everywhere license) | Distribution model, not an app feature | `domo-everywhere-embed` |
| Must look native in Domo | Domo design guidance (6 px grid, tokens); otherwise shadcn/Tailwind is fine | Consistency | `domo-procode-apps` |

## Phrase recommendations like this

- "Pulling Salesforce opportunities needs an API key, which can't live in the browser. I suggest a **Code Engine** function `getOpportunities` (no credits) that the app calls via `runCodeEngine`. Want me to write the function and the `packagesMapping` entry?"
- "Since this will be **embedded on your customer portal** with per-customer filtering, `fetchSqlData` would ignore those filters. I'll use `queryData` (Data API) instead, and the row security belongs in server-side programmatic filters. OK?"
- "You need sales joined with targets. The SQL API can't JOIN — create a Magic ETL output (1 credit per run per output table) and I'll map that single dataset."

## When you write Code Engine code

Follow `domo-code-engine` → "Code structure": only the functions callers need at top level, helpers as static methods in a class, relative `/api/...` paths with `codeengine.sendRequest` (no token/domain), one object output.

## Never

- Invent dataset IDs, package IDs, workflow model IDs or manifest keys — leave clearly marked placeholders and list them in the hand-off.
- Put secrets, developer tokens or OAuth client secrets in app code, env files bundled by Vite, or the manifest.
- Treat client-side filtering or hidden UI as access control.
- Skip the recommendation step for a requirement that hits a rule above.
