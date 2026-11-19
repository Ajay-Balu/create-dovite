# manifest.json reference

Sources: https://www.domo.com/docs/portal/Apps/App-Framework/Guides/manifest.md (+ AppDB, workflow, Code Engine, broadcasting guides),
plus maintainer-confirmed key spellings (tag **[Confirmed]**, overrides docs where they differ). Other tags: [Documented], [Inferred], [Unverified].

## Key names that work [Confirmed 2026-11-19]

| Purpose | Use exactly |
|---|---|
| Dataset mapping | `"mapping"` **or** `"datasetsMapping"` |
| AppDB collections | `"collections"` **or** `"collectionsMapping"` |
| Workflow mapping | `"workflowMapping"` |
| Code Engine function mapping | `"packagesMapping"` |
| Device features | `"allowCamera"`, `"allowBluetooth"`, `"allowMic"`, `"allowGeolocation"`, `"allowNFC"` (booleans) |
| Identity | `"id"` (written by `domo publish`), `"proxyId"` |

Do **not** use `packageMapping` or `workflowsMapping` even though some Domo doc pages show them.

## Properties

| Property | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes | Design name; users search for it when creating a card |
| `version` | string | yes | Semver. Read at runtime via `fetch('./manifest.json')` (build/deploy can change it) |
| `size` | `{width,height}` | yes | Domo card units 1-6 (table also lists 0.5 height); default 1x1 |
| `fullpage` | bool | no | Iframe resizes with window in Details view; app must handle resize |
| `mapping` / `datasetsMapping` | array | yes | `[]` if none |
| `collections` / `collectionsMapping` | array | no | AppDB collections; needs `proxyId` for local dev |
| `workflowMapping` | array | no | Workflows the app may start |
| `packagesMapping` | array | no | Code Engine functions the app may call |
| `channels` | object | no | `publishes` / `subscribes` for App Broadcasting |
| `ignore` | string[] | no | Globs skipped by `domo publish` (`node_modules` auto-ignored) |
| `id` | string | auto | Written by first `domo publish`. Never hand-write |
| `proxyId` | string | no | Card id for local dev against AppDB/Workflows/Code Engine/DQL/writeback/OAuth |
| `flags` | object | no | e.g. `"authentication-cookies-disabled": true` (then requests without session id get 403) [Documented] |
| `allowCamera` `allowBluetooth` `allowMic` `allowGeolocation` `allowNFC` | bool | no | Top-level; see device-permissions.md. Set unused ones to `false` |

## Card size pixels [Documented]

| Size | Width px | Height px |
|---|---|---|
| 6 | 1400 | 1700 |
| 5 | 1165 | 1410 |
| 4 | 930 | 1120 |
| 3 | 695 | 830 |
| 2 | 460 | 540 |
| 1 | 225 | 250 |
| 0.5 | n/a | 105 |

## Dataset mapping (`mapping` / `datasetsMapping`)

```json
{ "alias": "sales", "dataSetId": "<uuid from /datasources/<id>>",
  "fields": [ { "alias": "amount", "columnName": "Sales Amount" } ] }
```
Request via `GET data/v1/<alias>` (domo.get / domo.data.query). With empty `fields`, all columns return keyed by original names. [Documented]

## Collections (`collections` / `collectionsMapping`)

```json
"collections": [
  { "name": "CommentsTable",
    "schema": { "columns": [ { "name": "user", "type": "STRING" }, { "name": "comment", "type": "STRING" } ] },
    "syncEnabled": true },
  { "name": "Users" }
]
```
Schema types for sync: STRING, LONG, DECIMAL, DOUBLE, DATE, DATETIME. Top-level `content` keys only. [Documented]
Optional per-collection `filters` (document-level security): each needs `name`, `applyOn` (READ/UPDATE/DELETE), `applyTo` (USER_ID|GROUP_ID + `values`), `query`. All four required or upload fails. Wildcards `%userId%`, `%groupIds%`. Filters OR together; user query is ANDed; not applied to CREATE. [Documented]

## `workflowMapping` and `packagesMapping`

```json
"workflowMapping": [ { "alias": "workflow1", "parameters": [
  { "aliasedName": "num1", "type": "number", "list": false, "children": null } ] } ],
"packagesMapping": [ { "alias": "awesomeFunction",
  "parameters": [ { "alias": "number1AppInput", "type": "number", "nullable": false, "isList": false, "children": null } ],
  "output": { "alias": "sumAppOutput", "type": "number", "children": null } } ]
```
The parameter/output **shape** is from the Domo guides (which spell the outer key `packageMapping`; use `packagesMapping`).
Param types shown in the docs: `boolean, date, dateTime, decimal, duration, number, object, person, dataset, group, text, time`; use `children` for `object`.
Code Engine itself supports ACCOUNT, BOOLEAN, DATASET, DATE, DATE-TIME, DECIMAL, DOCUMENT COLLECTION, DURATION, FILE, GROUP, NUMBER, OBJECT, PERSON, TEXT, TIME (see `domo-code-engine`); manifest spellings for account/file/document collection are [Unverified].
After publish, wire each mapping on the card's Wiring screen (choose package/version/function and map inputs).
Start workflow: `domo.post('/domo/workflow/v1/models/${alias}/start', body)`. Run function: `domo.post('/domo/codeengine/v2/packages/${alias}', body)`. [Documented]

## channels [Documented]

Names: `namespace:event`, max 256 chars, not starting `domo:`, unique across publishes+subscribes, <=100 per direction; description <=2048.
In production an app receives only channels in `subscribes`; undeclared publishes warn in console. No history/replay.

## Full example

```json
{
  "name": "My App Design",
  "version": "0.0.1",
  "fullpage": true,
  "size": { "width": 4, "height": 3 },
  "mapping": [ { "alias": "sales", "dataSetId": "5168da8d-1c72-4e31-ba74-f609f73071dd",
    "fields": [ { "alias": "amount", "columnName": "Sales Amount" } ] } ],
  "collections": [ { "name": "Users" } ],
  "workflowMapping": [],
  "packagesMapping": [],
  "channels": { "publishes": [ { "name": "selection:changed", "description": "Row selected" } ],
                "subscribes": [ { "name": "filter:region", "description": "Region filter" } ] },
  "allowCamera": true,
  "allowBluetooth": false,
  "allowMic": false,
  "allowGeolocation": false,
  "allowNFC": false
}
```
(`id` and `proxyId` are added after the first publish / card creation.)

## proxyId how-to [Documented]

Publish -> create/open a card from the design -> copy the card id (the string after `/kpis/details/` in the card URL, or the id between `//` and `.domoapps` in the iframe URL) -> put in manifest `proxyId`. If that card is deleted, take an id from another card of the same design.
