# AppDB reference

Source: https://www.domo.com/docs/portal/API-Reference/app-framework-apis/AppDB-API.md ; FAQ ; Troubleshooting. [Documented]

## Model
Datastore (one per app, auto-created, UUID) -> Collection (table) -> Document (row; free-form `content` object inside a system envelope).
MongoDB query syntax [Confirmed]; atomic `$inc`, `$set`, `$push`.

## Querying (MongoDB syntax)
- **AppDB query language [Confirmed]:** MongoDB query syntax. Fields live under `content.`: `{ "content.status": "open" }`, comparison/logic operators such as `$eq $ne $gt $gte $lt $lte $in $nin $and $or $exists`, dates as `{ "$date": "2026-11-01T00:00:00Z" }`; updates via `partialUpdate` with `$set $inc $push`. Aggregations (groupby/count/sum/avg/min/max/unwind) are query-string options, not a Mongo aggregation pipeline. Operators beyond those listed: test before relying on them.

```js
// open tasks owned by the current user, created since 1 Nov 2026 (UTC)
QueryDocument("tasks", {
  $and: [
    { "content.owner": userId },
    { "content.status": { $in: ["open", "in-progress"] } },
    { createdOn: { $gte: { $date: "2026-11-01T00:00:00Z" } } }
  ]
}, { orderby: "createdOn", limit: 50 });
```
- System fields (`id`, `createdOn`, `updatedOn`, `owner`) are top-level and **UTC**; your data is under `content.`.
- Store your own dates as ISO-8601 UTC strings (`new Date().toISOString()`) so they compare and sync correctly.

## AppDB vs DataSet
- AppDB: app-owned state and user content; flexible JSON; immediate reads/writes; shared by all instances of the app.
- DataSet: BI/visualization; fixed columns; written by connectors/Workbench/API; full row replacement.

## Collections
- No schema needed unless syncing to a DataSet. Sync columns must be **top-level keys in `content`** (no dot notation). Types: STRING, LONG, DECIMAL, DOUBLE, DATE, DATETIME.
- `syncEnabled: true` + schema => synced dataset named `{collectionName}_{collectionUUID}_APP_DB`. Can take up to 15 min to appear; later errors show in dataset History.
- Manifest-defined collections are source of truth: **do not use Update Collection API on them** (saving the card reverts). Change manifest, republish, re-save card.
- Programmatic collections (create at runtime, e.g. per-user) are not overridden.

## Sync failure checklist
1. Sync not enabled. 2. Dataset owner differs from collection owner. 3. Docs flagged `syncRequired: true`. 4. A property not castable to its column type (most common; use Domo types not TS types).

## Permissions and security
Collection-level and document-level; grant to users, groups, or app instance. Document filters are server-enforced (see manifest.md). Blocked single-doc op returns 404; bulk delete returns 0. Filters do not apply to CREATE.

## Endpoints
- App Framework (inside running app, card session): `/domo/datastores/...`
- Product API (server, `X-DOMO-Developer-Token`): `/api/datastores/...` (adds datastore CRUD, download/import, permission reads)

## Limits
Document size, collection counts, query limits: NOT documented. Do not assume.

## Patterns
- Late joiner / state: AppDB for persistence, broadcasting for live updates.
- Bulk ops: `bulkCreate`, `bulkUpsert` (docs with `id` update), `bulkDelete`.
- Clear a collection: see guide `Guides/clearing-out-collections.md`. Custom sync schedule: `Guides/workflow-appdb-sync.md`.
- Credits: synced dataset updates count as data ingest executions (see credit skill); avoid syncing on every write.
