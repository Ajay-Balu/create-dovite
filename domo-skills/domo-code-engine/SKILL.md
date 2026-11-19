---
name: domo-code-engine
description: Domo Code Engine and packages - server-side JavaScript/Python functions for Workflows and Domo apps. Covers global vs custom packages, creating and versioning packages, the codeengine library (sendRequest, getAccount, axios), data types, limits (5 min, 1 GB, one output), permissions, and how to invoke from apps, workflows and external systems. Use when writing, wiring, debugging or choosing Code Engine functions.
---

# Domo Code Engine and Packages

Tags: **[Documented]**, **[Inferred]**, **[Unverified]**. Researched 2026-11-19. Library detail: `references/codeengine-library.md`. Manifest key to wire functions into an app: `packagesMapping`.

## What it is

A Domo-native, serverless runtime that executes **JavaScript or Python** functions. Functions are grouped into **packages**; they are used in
**Workflows** and **Domo apps** (and callable externally by API). It is the sanctioned place for secrets, external API calls, and logic the
browser cannot do. [Documented]

## Limits (design around them) [Documented]

| Limit | Value |
|---|---|
| Memory | 1 GB max |
| Runtime | 5 minutes max; "not meant for heavy data processing" |
| Output | **One output per function**; return a single `object` for complex results |
| Libraries | Limited preinstalled set only (see below) |
| Heavy jobs | Use Jupyter Workspace (a global package can start a DataFlow that runs a notebook) |
| Not documented | Payload size, rate limits, network egress rules, Python version [Unverified] |

## Global vs custom packages [Documented]

- **Global**: library Domo maintains for every instance. Two kinds: common Domo actions via Product APIs, and small-data utility functions. Anyone with Code Engine access can use them. Cannot be deleted.
- **Custom**: your own functions. Use when no global package covers: Domo APIs, non-Domo APIs/events, reshaping inputs/outputs between workflow steps.
- Prefer a global package when it exists; custom code is maintenance you own.

## Anatomy of a custom package function [Documented unless marked]

```javascript
const codeengine = require('codeengine');   // preinstalled; also require('axios'), require('google-auth-library')

// Plain named function, positional params, may be async. Return ONE value (use an object for several).
async function getDatasetInfo(dataSetId) {
  try {
    return await codeengine.sendRequest('GET', `/api/data/v3/datasources/${dataSetId}?part=core`);
  } catch (e) {
    console.error(e);   // console.log / console.error show in the test Console
    throw e;            // [Inferred best practice] rethrow so callers see failure; swallowing returns undefined
  }
}
```

After writing code: **Rescan Functions**, then in Function Configuration set each function's **description, input names + data types, and output** (types are required to save and to map in Workflows).
**Supported data types for params and outputs (closed list) [Confirmed by maintainer]:** `ACCOUNT, BOOLEAN, DATASET, DATE, DATE-TIME, DECIMAL, DOCUMENT COLLECTION, DURATION, FILE, GROUP, NUMBER, OBJECT, PERSON, TEXT, TIME`. Nothing else (no arrays/maps/any as a type; use the list option for arrays and OBJECT for structures). Params can be list, nullable, have defaults; Object is open or defined with children.
**Native Domo types (ACCOUNT, DATASET, GROUP, PERSON, and by extension DOCUMENT COLLECTION / FILE [Inferred]) are passed as the resource ID string.** Dates/times use DATE, TIME, DATE-TIME; durations use DURATION.

## codeengine library (summary) [Documented]

| Call | Auth behavior | Use for |
|---|---|---|
| `sendRequest(method, url, body, headers, contentType)` | Runs **as the calling user** (user's access applies). GET/POST/PUT/PATCH/DELETE; default JSON | Domo product APIs |
| `getAccount(accountAliasOrId)` | Returns decrypted creds + fresh token for an Account the caller can access | Secrets for external APIs |
| `getUserAuthorization(accountTemplateId)` | Running user's own OAuth creds; 404 if not authorized | Per-user OAuth |
| `axios(url, options)` / `require('axios')` | **No auth added**; non-2xx rejects (`error.response`) | External APIs, service-account calls, cross-instance Domo calls |
| `getExecutionInformation()` | Sync; `entityType` WORKFLOW/DOMOAPP/UNKNOWN (editor = UNKNOWN, details null) | Context-aware logic |
| `getPersonDetails(personId)` | GET `/api/content/v3/users/{id}?includeDetails=true` | User lookups |
| `googleAuthLibrary` | JWT/GoogleAuth/OAuth2Client | Google APIs (service account private keys often lose newlines; restore `\n`) |

Rule of thumb: Domo API as the user -> `sendRequest`; run under a service account, other instance, or external API -> `axios` + `getAccount`.

## Python [Documented]
Runtime supports Python functions. Available modules: standard library (asyncio, csv, json, os, re, sqlite3, subprocess, urllib, etc.) plus third-party **boto3, botocore, certifi, numpy, pandas, requests**. The docs show no Python example of the `codeengine` helper library; Python usage of it is [Unverified].

## Creating and versioning [Documented]
1. **+ New Package** (needs grants): name, description, language (JavaScript or Python), optional thumbnail.
2. Edit in the code editor; **Create New Version** (copy from a version, semver number, optional description). The **new version becomes the default**; earlier versions stay accessible.
3. Test: **Start Function**, enter inputs, **Save and Start Function**, read Console + Response.
4. Share (package permissions: Admin, Delete, Read, Write, Share, Execute, Read Content, Update Content). Needs user/group + permission + Save.
5. Release-notes additions [Documented]: view where packages are used by apps/workflows; delete packages with no references (blocked if used; Domo packages undeletable); Workflows "Change Version" compares I/O across versions and keeps matching mappings; MCP Toolkits for Code Engine (Beta); Agent Tasks can use Code Engine functions as tools.

## Permissions model [Documented]
Two layers: account-level grants (**Create Code Engine Packages**, **Manage Code Engine Packages**; enabled by your Domo account team, not self-service) AND package-level permissions. The home page (More > Workflows > Code Engine) only lists packages you can access.

## Three ways to invoke

1. **From a Workflow**: function appears as a step; map inputs/outputs by type.
2. **From a Domo app** [Documented]:
   - manifest `packagesMapping` (alias, params {alias,type,nullable,isList,children}, output {alias,type,children}),
   - publish, then on the card Wiring screen: Select Package -> package/version/function -> map inputs -> Save and Finish,
   - call `domo.post('/domo/codeengine/v2/packages/' + alias, { paramAlias: value })`.
   Local testing needs a `proxyId`. Response schema and error codes are not documented; log and inspect.
3. **From outside Domo** [Documented]: `POST https://{instance}.domo.com/api/codeengine/v2/packages/{packageId}/versions/{version}/functions/{functionName}` with `X-DOMO-Developer-Token`, body `{"inputVariables": {...}, "settings": {"getLogs": true}}`; response has `executionId, status, result, stdout.log, stderr.log, errorInformation`. Server-side only.

## Best practices

- Keep functions small, single-purpose, typed. Return one object with named fields.
- Credentials only via Domo **Accounts** + `getAccount`; never hardcode.
- SQL passed as strings is **case sensitive**. [Documented]
- When mappings break, check data types first (lists/objects are the usual culprit) and that grants + package permissions exist. [Documented]
- Use `getExecutionInformation()` to branch behavior between workflow/app/editor runs.
- Offload bulk transforms to Magic ETL/Jupyter; Code Engine is glue, not a data engine.
- Wrap `sendRequest` errors and rethrow with context (note: `new Error(msg, err)` drops the cause in JS; use `{ cause: err }`). [Documented observation]
- For apps: Code Engine is how an app safely "connects to any API" (internal or external) without exposing keys. [Documented]

## Billing note
**Code Engine consumes no credits** [Confirmed by maintainer; the Consumption Terms page lists no Code Engine rate]. Do not add Code Engine to credit estimates.
Metered things around it still count: a Workflow that runs a Code Engine step is billed as a Workflow (0.04 credit per start, 0.04 per task completion per the terms) [Inferred that a function step counts as a task], and any dataset writes, ingest runs, or AI calls the function triggers are billed under their own rules. See `domo-credit-consumption`.

Sources: https://www.domo.com/docs/portal/Automate-Actions/Code-Engine/overview.md (+ global-vs-custom-packages, creating-packages, code-editor-overview,
javascript-libraries, python-packages, common-use-cases, limitations-and-troubleshooting); .../Apps/App-Framework/Guides/hitting-code-engine-from-an-app.md;
.../API-Reference/Product-APIs/Code-Engine.md; https://www.domo.com/docs/s/article/Current-Release-Notes.md
