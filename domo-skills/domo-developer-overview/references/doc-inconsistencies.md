# Doc inconsistencies and verify-before-trusting list

Found while reading the Domo Developer Portal on 2026-11-19. Test each against a real instance before depending on it.

## Manifest key spelling (RESOLVED by maintainer, 2026-11-19)

The docs spell some keys inconsistently. These are the spellings **confirmed to work**; use them and avoid the others.

| Concept | Use (confirmed) | Docs variants to avoid / treat as unconfirmed |
|---|---|---|
| Datasets | `mapping` **or** `datasetsMapping` | |
| Collections (AppDB) | `collections` **or** `collectionsMapping` | |
| Workflows | `workflowMapping` | `workflowsMapping` (appears in the hitting-a-workflow guide) |
| Code Engine functions | `packagesMapping` | `packageMapping` (appears in the manifest and Code Engine guides) |
| Device features | `allowCamera`, `allowBluetooth`, `allowMic`, `allowGeolocation`, `allowNFC` (booleans) | not in the manifest guide |
| Identity | `id` (written by `domo publish`), `proxyId` | |

## Other manifest oddities

| Concept | Spellings seen | Where | Guidance |
|---|---|---|---|
| Workflow param alias | `aliasedName` (spec) vs `aliasName` (one example) | hitting-a-workflow | Use `aliasedName`. |
| Size scale | property table says 1-6; sizing table includes 0.5 height | manifest.md | 0.5 height exists in the table only. |
| Fullpage | manifest key `fullpage`; FAQ says `full-page: true` | manifest vs FAQ | Use `fullpage`. |

## domo.js (ryuu.js v6) doc mismatches

- `domo.ai.generateText` typed as `Promise<string>` but example reads `res.choices[0].output`. Handle both.
- `domo.workflow.getInstance` return type shows `state`, example reads `status`. Check actual payload.
- `domo.codeEngine(alias, input)` listed as namespace but the Code Engine guide only documents `domo.post('/domo/codeengine/v2/packages/{alias}', body)`. The POST form is the documented path.
- `onFiltersUpdated` clears all parent page filters on first registration (it calls `requestFiltersUpdate(null)`).
- `GREAT_THAN_EQUALS_TO` is the literal (misspelled) operator name in the docs.
- Filter payload: desktop uses `columnName`/`operator`, mobile `column`/`operand`; domo.js normalizes.
- `domo.onDataUpdate` (v4) no longer exists; use `onDataUpdated`.

## Embed doc oddities

- Dataset-switching example 2 is missing a comma between `datasetRedirects` entries; it will not parse as written.
- Embedded edit JWT sample uses `name`, `customer_id`, `groups`, which differ from documented claim names. Confirm with Domo.
- JS API filter message uses `operand` (`"operand": "IN"`), while programmatic filtering uses `operator`.

## Things the docs do NOT say (do not invent)

- The device-permission flags' default when omitted and per-device/browser support matrix (key names and boolean syntax are confirmed by the maintainer, not by the docs).
- AppDB document size, collection count, or query limits.
- Code Engine payload, rate, or network-egress limits; Python version. Code Engine data types are a closed list (see domo-code-engine).
- API call, AppDB, or Pro-Code app hosting credit rates on the Consumption Terms page. (Code Engine itself consumes no credits, per the maintainer.)
- Rate limits for Platform/Product APIs.
- Pro-Code Editor limits.
- Session expiry rules for app sessions.
- Credit expiration, and consequences of exceeding a Service Order.

## Deprecations / dates to remember

- Mason apps: cannot be created/edited from Oct 14, 2026.
- Previous embed framework URL: deprecated March 31, 2027 (update embedded cards before then).
- DA-SID login token: being retired in a legacy auth update.
- AI Agent Chat: 0.2 credits/request through Oct 31, 2026; from Nov 1, 2026 under Domo AI Pro consumption.
- DomoGPT Small v1/v1.1, Medium v1, OpenAI gpt-3.5-turbo: available until July 8, 2026 (now past; migrate).
- Homebrew/Chocolatey installs of the CLI are deprecated; use npm.
- On Windows CLI install: docs list legacy prerequisites (Python 2.7, VS 2015). Treat as outdated; prefer a current Node (18+).
