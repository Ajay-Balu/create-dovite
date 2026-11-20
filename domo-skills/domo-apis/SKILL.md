---
name: domo-apis
description: The three families of Domo APIs - App Framework APIs (in-app via domo.js), Platform OAuth APIs (scoped client credentials), and Product APIs (developer token, full UI power) - with auth, base URLs, when to use each, security rules and pitfalls. Use when choosing or calling any Domo API, or when a task mentions tokens, OAuth, developer tokens, or domo.js HTTP calls.
---

# Domo APIs: the three families

Tags: **[Documented]**, **[Inferred]**. Researched 2026-11-19. Endpoint catalog: `references/api-catalog.md`.
Source: https://www.domo.com/docs/portal/API-Reference/overview.md

## At a glance

| Family | Auth | Reach | Use it for | Never |
|---|---|---|---|---|
| **1. App Framework APIs** | App session token (automatic via `domo login` in CLI or inherited inside Domo) | Only endpoints the App Framework exposes | Code running **inside a Domo app** (Bricks/custom apps) | Outside an app context |
| **2. Platform (OAuth) APIs** | OAuth 2.0 client credentials -> expiring bearer token | A **scoped subset** of Product endpoints | External scripts, Jupyter, Code Engine, ETL, integrations, embed token creation | Putting the client secret in browser/app code |
| **3. Product APIs** | `X-DOMO-Developer-Token` header (token grants full user-level access) | **Everything a user can do in the UI** | Admin automation, features lacking Platform endpoints | Browser calls (CORS-restricted); sharing the token |

Domo prefers Platform OAuth for development outside apps because clients can be **scoped, tokens expire and refresh**, limiting damage if leaked. [Documented]
Names overlap across families (e.g. Data, Files, Groups, User, Workflows). App Framework APIs work **only** within the app context. [Documented]

## Family 1: App Framework APIs [Documented]
List: AI Service Layer, AppDB, Code Engine, Data, Files, Documents, Groups, Task Center (queues/tasks), User, Workflows.
Called through `domo.js` (adds `X-DOMO-Ryuu-Session` automatically); paths are relative to the app origin, e.g.
- `GET /data/v1/<alias>`; SQL via `domo.data.sql`
- `/domo/datastores/...` (AppDB)
- `POST /domo/codeengine/v2/packages/{alias}` (Code Engine; alias from `packagesMapping`)
- `POST /domo/workflow/v1/models/{alias}/start`
- `POST /domo/ai/v1/text/generation`, `/domo/ai/v1/text/sql`, `/domo/ai/v1/image/text` (AI Pro feature; credits)
- `GET /domo/environment/v1/` (verify user identity)

Each resource must be declared in `manifest.json` and wired on the card. See `domo-procode-apps`.

## Family 2: Platform (OAuth) APIs [Documented]
- Base URL `https://api.domo.com`; token endpoint `https://api.domo.com/oauth/token`.
- Create client id/secret in **Admin > API Clients** (client id is public, secret is confidential).
- Request: HTTP Basic (`client_id:client_secret`) with `grant_type=client_credentials&scope=<space separated scopes, e.g. data user>`.
```sh
curl -v -u {CLIENT_ID}:{CLIENT_SECRET} "https://api.domo.com/oauth/token?grant_type=client_credentials&scope=data%20user"
```
- Response: `access_token`, `token_type` bearer, `expires_in` (3599 s in the example), `scope`, `role`, `customer`, `userId`, `jti`.
- Call with `Authorization: bearer <token>` (+ `Content-Type: application/json`), e.g. `POST https://api.domo.com/v1/groups`.
- No refresh token for raw calls; **regenerate** when expired. The Java/Python SDKs refresh automatically and are recommended over raw HTTP.
- APIs: Account, Activity Log, Cards, DataSet (+PDP), Embed Token, Group, Page, Projects and Tasks, Simple, Stream, User.
- Rotate immediately if the secret leaks; never store in repos, configs, logs, chat. Admins can revoke clients any time.
- Full scope list is not on the auth page; check the API client UI / specific endpoint docs.

## Family 3: Product APIs [Documented]
- Hosted at `https://<instance>.domo.com/api/...`; header `X-DOMO-Developer-Token: <token>` (create in the user's account/Admin; token = that user's power).
- CORS-restricted: **server-side only**. "Try It" in the portal does not work; use generated curl with your instance and token.
- Coverage: Activity Log, AI Services, Alerts, AppDB, Beast Modes, Cards, Certified Content, Code Engine, Connectors, Data Accounts, DataSets, Files, Groups, Pages, Roles Governance, Search, Task Center, Users, Workflows, Scheduled Reports, SCIM, Export to S3, Federated migration, etc. Many endpoints lack full docs; contact your CSM for undocumented functionality.
- Example: run a Code Engine function from outside Domo:
  `POST https://{instance}.domo.com/api/codeengine/v2/packages/{packageId}/versions/{version}/functions/{functionName}` with body `{"inputVariables": {...}, "settings": {"getLogs": true}}` and the developer-token header.
- Inside Code Engine use `codeengine.sendRequest('GET', '/api/...')` instead of raw tokens: no instance URL, no `X-DOMO-Developer-Token` needed (runs as the calling user) [Confirmed]. This is the easiest way to give an app Product-API power.

## Which one should I use? (decision path)

1. Code is running in the user's browser inside a Domo app? -> **App Framework API via domo.js**. Need something it cannot do (Product API, external API, secrets)? -> **Code Engine function**, called from the app.
2. Server/script/CI/Jupyter outside Domo, endpoint exists in Platform list? -> **Platform OAuth** with the narrowest scopes.
3. Needs a capability only in Product APIs (e.g. roles governance, scheduled reports, AppDB datastores admin)? -> **Product API + developer token on a server**, ideally wrapped in a Code Engine function or backend you control, token stored as a secret.
4. Inside Code Engine/Workflows calling Domo? -> `codeengine.sendRequest(method, '/api/...')`: **Product APIs with a relative path, no domain and no developer token** (it already runs inside the instance, as the calling user) [Confirmed]. Use `codeengine.axios` + account credentials only for a service account or another instance.
5. Embedding to external viewers? -> Platform OAuth (Embed Token API) from **your server** (see `domo-everywhere-embed`).

## Security rules for agents

- Never emit client secrets or developer tokens into front-end code, logs, or commits; use env vars, CI secrets, or Domo Accounts.
- Use a dedicated service user for tokens; least-privilege roles/scopes; rotate regularly.
- Verify user identity via `GET /domo/environment/v1/` from the app, not query params.
- Note: the DA-SID login token is being retired as part of a legacy authentication update. Do not build on it. [Documented in release notes]

## Not documented (do not invent)
Rate limits, base URLs other than api.domo.com, full scope list, token retrieval flow for Product API (developer tokens are created in the Domo UI), Product API error status table.

Related: AppDB base paths `/domo/datastores/` (app) vs `/api/datastores/` (product); OpenAPI specs under https://www.domo.com/docs/openapi/{framework,platform,product}/.
