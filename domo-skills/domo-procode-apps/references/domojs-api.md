# domo.js (ryuu.js v6) API cheat sheet

Source: https://www.domo.com/docs/portal/Apps/App-Framework/Tools/domo-js.md [Documented]
Install: `npm install ryuu.js` then `import domo from 'ryuu.js'` (CJS: `require('ryuu.js').default`) or CDN script global `domo`. Static class: never `new Domo()`.

## Environment
`domo.env`: `userId, userName, userEmail, customer, locale, platform ("desktop"|"mobile"), pageId, host, loaded`.
Query-param values can be spoofed; verify identity with `domo.get('/domo/environment/v1/')`.

## Data
- `domo.data.query(alias, opts?)`: opts `fields, filter, avg, count, max, min, sum, unique, groupBy, dateGrain, calendar, orderBy, limit, offset, useBeastMode, format`.
- `domo.data.sql(alias, sql)`: table name = alias; POST text/plain; no page filters, no JOINs; one dataset per call; **subqueries on the same alias work** [Confirmed].
- All dates/datetimes come back in **UTC** [Confirmed]; convert for display only.
- `domo.get('/data/v1/<alias>', { format, query:{limit,offset,fields,filter}, schema, fetch })`. Formats: `array-of-objects` (default), `array-of-arrays` (.columns/.rows), `csv`, `excel` (Blob), `plain`.
- Query-string syntax (Data API): `fields=rep,amount`, `groupby=rep`, `filter=date last 3 months`, `filter=rep ~ ax` (contains), `dategrain=date by month` (date field must be in fields), `orderby=amount descending`, `limit=10`, `sum=amount`, `calendar=fiscal`. Distinct = groupby the same fields.
- `domo.getAll([urls], opts)` parallel, ordered.
- `domo.post/put/delete`, `domo.domoHttp(method, url, opts, body)` for PATCH etc.

## AppDB (`domo.appdb`)
`list, get, create (auto-wraps in {content}), update, remove, query(collection, mongoFilter, {groupby,count,sum,orderby}) (fields as content.field), partialUpdate (e.g. $set), bulkCreate, bulkUpsert, bulkDelete, listCollections, createCollection({name,schema,syncEnabled}), updateCollection, deleteCollection, export()`.

## AI / workflow / Code Engine
- `domo.ai.generateText(prompt, opts?)`, `domo.ai.textToSQL(question, {dataSourceSchemas})`. Consume AI credits. Response shape: read `choices[0].output`.
- `domo.workflow.start(alias, input)` -> `{id}`; `getInstance(alias, id)` -> status `IN_PROGRESS|COMPLETED|CANCELED|FAILED`. Needs `workflowMapping`.
- Code Engine: documented call is `domo.post('/domo/codeengine/v2/packages/'+alias, body)`. Needs `packagesMapping`.

## Events (each returns an unsubscribe fn)
`onFiltersUpdated(cb)` (first registration clears parent filters), `onVariablesUpdated`, `onDataUpdated(cb(alias))`, `onAppDataUpdated` (legacy; prefer broadcast), `onBroadcast(channel, h)`, `onBroadcastOnce`, `onBroadcastFrom(channel, sourceAppId, h)`.
Filter: `{column, operator, values, dataType, dataSourceId?, label?}`; dataType STRING|NUMERIC|DATE|DATETIME.
String ops: IN, NOT_IN, CONTAINS, NOT_CONTAINS, STARTS_WITH, NOT_STARTS_WITH, ENDS_WITH, NOT_ENDS_WITH. Numeric/date: EQUALS, NOT_EQUALS, GREATER_THAN, GREAT_THAN_EQUALS_TO (sic), LESS_THAN, LESS_THAN_EQUALS_TO, BETWEEN.

## Emitters
`requestFiltersUpdate(filters|null, pageStateUpdate=true, onAck?, onReply?)` (null clears all filters for every app on page), `requestVariablesUpdate`, `requestAppDataUpdate` (legacy), `domo.broadcast(channel, payload)` (never throws; payload <64 KB; codes: RESERVED_NAMESPACE, PAYLOAD_TOO_LARGE, PAYLOAD_NOT_SERIALIZABLE, RATE_LIMIT_EXCEEDED, FEATURE_DISABLED).

## Navigation / utilities
`domo.navigate(url, newWindow=false)` (mobile web adds `/m#`; external domains must be whitelisted), `domo.extend`, `domo.getRequests/getRequest`, `domo.debug.enable(['http','messages','filters','variables','all'])`, type guards, enums `DataFormats, DomoDataTypes, RequestMethods`.

## Interceptors
`domo.intercept((config, next) => next(config))` onion order; return value removes interceptor; can short-circuit.

## Errors
`DomoHttpError(status,statusText,body,headers)`, `DomoAuthError` (401/403, extends Http: check first), `DomoConnectionError`, `DomoValidationError(errors[])`, `DomoTimeoutError(url)`. All HTTP methods add `X-DOMO-Ryuu-Session` automatically.

## Sessions
New session per `index.html` load; id injected as `window.__RYUU_SID__` and cookie `ryuu_sid`. Precedence: header `X-Domo-Ryuu-Session` > query `ryuu_sid` > cookie. Manifest `flags: {"authentication-cookies-disabled": true}` forces header/query only (403 otherwise).
