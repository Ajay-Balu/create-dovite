# Domo API catalog by family

Index from https://www.domo.com/docs/_llms/en/developer-portal.txt (2026-11-19). Pages: https://www.domo.com/docs/portal/API-Reference/...
OpenAPI specs: https://www.domo.com/docs/openapi/<family>/<name>.yaml

## App Framework APIs (in-app, session auth) - openapi/framework/
AI Service Layer (text generation, text-to-SQL, image-to-text), AppDB (documents: create/list/get/replace/delete/query/partial update/bulk create/upsert/delete; collections: create/list/update/delete; sync collections; modify/delete permissions), Code Engine, Data, Files, Documents, Groups, Task Center (queues and tasks), User, Workflows.

AI Service Layer details [Documented]:
- `POST /domo/ai/v1/text/generation` body `input` (req), `promptTemplate.template` (must contain `${input}`), `parameters` (string map for template vars), `model` (optional). Response `prompt`, `choices[].output`, `modelId`, `isCustomerModel`.
- `POST /domo/ai/v1/text/sql` same + `dataSourceSchemas[]` (`dataSourceName`, `description`, `columns[{name,type}]`).
- `POST /domo/ai/v1/image/text` `input`, `image{mediaType,type:'base64',data}`, **`model` required**, optional `system`, `promptTemplate`. HEIC/HEIF restricted. Output often wrapped in `<answer>` tags.
- AI Pro feature; pricing per Consumption Terms and your instance Rate Card (Admin > Company Settings > Credit Utilization > Rate Card). Admins choose models per service.

## Platform (OAuth) APIs - openapi/platform/
Authentication (`/oauth/token`), Account, Activity Log, Cards (list/get/create chart card/definition/drill), DataSet (CRUD, query, import, export, PDP policies), Embed Token (cards, dashboard), Group, Page (+collections), Projects and Tasks (projects, lists, tasks, attachments, members), Simple (create dataset, import), Stream (CRUD, executions, upload data part, commit, abort), User.

Large-data ingest pattern [Documented in Connect via API]: Stream API = create stream -> create execution -> upload parts -> commit (see `Connectors/api-connections/*`). Simple API = lightweight create/import.

## Product APIs - openapi/product/ (header `X-DOMO-Developer-Token`)
Activity Log; AI Services (classification, data extraction, image/text embeddings, image-to-text, chat messages + streaming + tool calling, sentiment + targeted sentiment, text-to-BeastMode, text generation, text-to-SQL, summarization; several Beta); Alerts; AppDB (datastores, collections, documents, permissions, download/import); Beast Modes; Cards (update title); Certified Content; Code Engine (Run Function); Connectors (run a connector); Data Accounts; DataSets (metadata, partitions, permissions, query with SQL, schema, streams, tags, upload sessions); Dataset Schema; Documents (collections, files, multipart upload, shareable links); Export to S3; Federated V1<->V2 and Amplifier migration; Files; Groups; Managing Dataset History; Pages (subpages, bulk move, revoke); Query Dataset; KPI Card Image render; Roles Governance; Remote Domostats; Scheduled Reports (very large surface); SCIM (users, groups, provider config); Search; Task Center; Users; Workflows (start, cancel, permissions).

## Domo SDKs
Python SDK (https://www.domo.com/docs/s/article/360042936554.md) and R SDK (.../360042923734.md); Java SDK referenced. SDKs wrap Platform endpoints and auto-refresh tokens.

## Useful endpoint facts [Documented]
- Run Code Engine function externally: `POST /api/codeengine/v2/packages/{packageId}/versions/{version}/functions/{functionName}`; body `inputVariables`, `settings.getLogs`; response `executionId, packageId, version, functionName, status, startedOn, startedBy, completedOn, result, stdout.log, stderr.log, errorInformation`.
- App-side Code Engine: `POST /domo/codeengine/v2/packages/{functionAlias}`; keys match manifest param aliases.
- Platform token: `POST https://api.domo.com/oauth/token`.
- AppDB: `/domo/datastores/` (app) vs `/api/datastores/` (product, dev token).
- Check API health: Other-Resources/api-status.md.
