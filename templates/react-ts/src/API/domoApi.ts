/**
 * domoApi.ts — single entry point for every Domo call made by this app.
 *
 * All requests go through `ryuu.js`, which talks to the Domo host page from
 * inside the app's iframe (in production) or through `@domoinc/ryuu-proxy`
 * (in local dev, see vite.config.ts). Never call `fetch`/`axios` against
 * Domo endpoints directly — authentication only works through ryuu.js.
 *
 * Every alias used below (dataset alias, AppDB collection, workflow alias,
 * Code Engine package alias) MUST be declared in `public/manifest.json`.
 */
import domo from "ryuu.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DomoUser {
  userId: string;
  userName: string;
  displayName: string;
  userEmail?: string;
  avatarKey: string;
  customer?: string;
  host?: string;
  [key: string]: unknown;
}

/** A document as stored in AppDB (your data lives under `content`). */
export interface AppDbDocument<T = Record<string, unknown>> {
  id: string;
  datastoreId?: string;
  collectionId?: string;
  syncRequired?: boolean;
  owner?: string;
  createdOn?: string;
  updatedOn?: string;
  updatedBy?: string;
  content: T;
}

/** AppDB aggregations. Keys are document properties, values are aliases. */
export interface Aggregations {
  groupby?: string[];
  count?: string;
  avg?: Record<string, string>;
  min?: Record<string, string>;
  max?: Record<string, string>;
  sum?: Record<string, string>;
  unwind?: string[];
}

export interface QueryOptions {
  orderby?: string;
  limit?: number;
  offset?: number;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  base64: string;
}

interface DomoSqlResponse {
  columns: string[];
  rows: unknown[][];
}

interface AIResponse {
  output?: string;
  choices?: Array<{ output: string }>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const DATASTORE = "/domo/datastores/v1";

const enc = encodeURIComponent;

/** Builds `?a=1&b=2`, skipping undefined/empty values and URL-encoding the rest. */
const toQueryString = (
  params: Record<string, string | number | boolean | undefined>
): string => {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${enc(k)}=${enc(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
};

const formatAggregation = (params?: Record<string, string>) =>
  params
    ? Object.entries(params)
        .map(([property, alias]) => `${property} ${alias}`)
        .join(", ")
    : undefined;

/** Logs with context and re-throws so callers can handle the error. */
const fail = (context: string) => (error: unknown): never => {
  console.error(`[domoApi] ${context}:`, error);
  throw error;
};

// ---------------------------------------------------------------------------
// User & environment
// ---------------------------------------------------------------------------

/**
 * Current logged-in Domo user, verified server-side (works in Domo and through
 * the local proxy). Use this — not `domo.env` query params, which can be
 * spoofed — for anything identity- or permission-related.
 */
export const GetCurrentUser = (): Promise<DomoUser> =>
  domo
    .get<Record<string, unknown>>("/domo/environment/v1")
    .then((user) => ({
      ...user,
      userId: String(user.userId ?? ""),
      userName: String(user.userName ?? ""),
      displayName: String(user.userName ?? ""),
      avatarKey: `/domo/avatars/v2/USER/${user.userId}`,
    }))
    .catch(fail("GetCurrentUser"));

/** A single user by id. */
export const GetUser = (userId: string | number) =>
  domo
    .get<Record<string, unknown>>(
      `/domo/users/v1/${enc(String(userId))}?includeDetails=true`
    )
    .then((user) => ({ ...user, userName: user.displayName }))
    .catch(fail("GetUser"));

/** Paged list of users in the instance. */
export const ListAllUsers = (
  includeDetails = false,
  limit = 100,
  offset = 0
) =>
  domo
    .get<Record<string, unknown>[]>(
      `/domo/users/v1${toQueryString({ includeDetails, limit, offset })}`
    )
    .catch(fail("ListAllUsers"));

/** @deprecated Use ListAllUsers(false, 500). Kept for backwards compatibility. */
export const GetAllUser = () => ListAllUsers(false, 500);

// ---------------------------------------------------------------------------
// Datasets (aliases from manifest.json → "mapping")
// ---------------------------------------------------------------------------

/**
 * Fetch rows from a mapped dataset via the Data API (respects page filters).
 * `query` is appended as-is, e.g. "fields=region,sales&groupby=region&sum=sales&limit=50".
 * Prefer `queryData` for structured options.
 */
export const fetchData = <T = Record<string, unknown>>(
  datasetAlias: string,
  query = ""
): Promise<T[]> =>
  domo
    .get<T[]>(`/data/v1/${enc(datasetAlias)}${query ? `?${query}` : ""}`)
    .catch(fail(`fetchData(${datasetAlias})`));

/**
 * Run SQL against a mapped dataset. Use the dataset ALIAS as the table name.
 * One call queries ONE dataset (the alias): no JOINs/UNIONs, but subqueries on the
 * same alias work. Dates come back in UTC.
 * ⚠ SQL ignores page filters and embed (programmatic) filters —
 * use `queryData`/`fetchData` when the app sits on a filtered dashboard or is embedded.
 *   fetchSqlData("sales", "SELECT region, SUM(amount) AS total FROM sales GROUP BY region")
 * Returns an array of objects keyed by (cleaned) column name.
 */
export const fetchSqlData = async <T = Record<string, unknown>>(
  datasetAlias: string,
  query: string
): Promise<T[]> => {
  if (typeof query !== "string" || !query.trim()) {
    throw new Error("fetchSqlData: query must be a non-empty string");
  }
  try {
    const apiData = await domo.post<DomoSqlResponse>(
      `/sql/v1/${enc(datasetAlias)}`,
      query,
      { contentType: "text/plain" }
    );
    if (!apiData || !Array.isArray(apiData.columns) || !Array.isArray(apiData.rows)) {
      throw new Error("Invalid data received from the SQL API");
    }
    const columns = apiData.columns.map((c) =>
      c.replace(/`/g, "").replace(/T1\./g, "").replace(/avg\((.*?)\)/i, "$1").trim()
    );
    return apiData.rows.map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, i) => (obj[col] = row[i]));
      return obj as T;
    });
  } catch (error) {
    return fail(`fetchSqlData(${datasetAlias})`)(error);
  }
};

/** Options for `queryData` — same as ryuu.js `domo.data.query`. */
export type DataQueryOptions = NonNullable<Parameters<typeof domo.data.query>[1]>;

/**
 * Structured Data API query (server-side aggregation, page-filter aware):
 *   queryData("sales", { fields: ["region", "amount"], groupBy: ["region"], sum: ["amount"], limit: 100 })
 * Pass `ignorePageFilters: true` only when the app must show unfiltered data.
 */
export const queryData = <T = Record<string, unknown>>(
  datasetAlias: string,
  options: DataQueryOptions = {}
): Promise<T[]> =>
  domo.data
    .query<T[]>(datasetAlias, options)
    .catch(fail(`queryData(${datasetAlias})`));

// ---------------------------------------------------------------------------
// AppDB (collections from manifest.json → "collections")
// ---------------------------------------------------------------------------

export const CreateDocument = <T = Record<string, unknown>>(
  collection: string,
  document: T
): Promise<AppDbDocument<T>> =>
  domo
    .post<AppDbDocument<T>>(`${DATASTORE}/collections/${enc(collection)}/documents/`, {
      content: document,
    })
    .catch(fail("CreateDocument"));

export const ListDocuments = <T = Record<string, unknown>>(
  collection: string
): Promise<AppDbDocument<T>[]> =>
  domo
    .get<AppDbDocument<T>[]>(`${DATASTORE}/collections/${enc(collection)}/documents/`)
    .catch(fail("ListDocuments"));

export const GetDocument = <T = Record<string, unknown>>(
  collection: string,
  documentId: string
): Promise<AppDbDocument<T>> =>
  domo
    .get<AppDbDocument<T>>(
      `${DATASTORE}/collections/${enc(collection)}/documents/${enc(documentId)}`
    )
    .catch(fail("GetDocument"));

/** Replaces the whole `content` of a document. */
export const UpdateDocument = <T = Record<string, unknown>>(
  collection: string,
  documentId: string,
  document: T
): Promise<AppDbDocument<T>> =>
  domo
    .put<AppDbDocument<T>>(
      `${DATASTORE}/collections/${enc(collection)}/documents/${enc(documentId)}`,
      { content: document }
    )
    .catch(fail("UpdateDocument"));

/**
 * Update matching documents in place (Mongo-style).
 *   partialUpdateDocument("tasks", { "content.status": "open" }, { $set: { "content.status": "done" } })
 */
export const partialUpdateDocument = (
  collection: string,
  query: Record<string, unknown>,
  operation: Record<string, unknown>
) =>
  domo
    .put(`${DATASTORE}/collections/${enc(collection)}/documents/update`, {
      query,
      operation,
    })
    .catch(fail("partialUpdateDocument"));

/** @deprecated Typo-cased alias kept for backwards compatibility. */
export const partialupdateDocument = partialUpdateDocument;

export const DeleteDocument = (collection: string, documentId: string) =>
  domo
    .delete(`${DATASTORE}/collections/${enc(collection)}/documents/${enc(documentId)}`)
    .catch(fail("DeleteDocument"));

export const BulkDeleteDocuments = (collection: string, ids: string[]) =>
  domo
    .delete(
      `${DATASTORE}/collections/${enc(collection)}/documents/bulk?ids=${ids
        .map(enc)
        .join(",")}`
    )
    .catch(fail("BulkDeleteDocuments"));

/**
 * MongoDB query syntax. Document fields live under `content.`; system dates are UTC:
 *   QueryDocument("tasks", { "content.owner": userId, "content.status": { $in: ["open"] } },
 *                 { orderby: "createdOn", limit: 50 })
 */
export const QueryDocument = <T = Record<string, unknown>>(
  collection: string,
  query: Record<string, unknown> = {},
  options: QueryOptions = {}
): Promise<AppDbDocument<T>[]> =>
  domo
    .post<AppDbDocument<T>[]>(
      `${DATASTORE}/collections/${enc(collection)}/documents/query${toQueryString({
        limit: options.limit,
        offset: options.offset,
        orderby: options.orderby,
      })}`,
      query
    )
    .catch(fail("QueryDocument"));

/** Documents created on or before `dateString` (ISO-8601, UTC — e.g. "2026-11-01T00:00:00Z"). */
export const queryDocumentsByDate = <T = Record<string, unknown>>(
  collection: string,
  dateString: string,
  options: QueryOptions = {}
) =>
  QueryDocument<T>(
    collection,
    { createdOn: { $lte: { $date: dateString } } },
    options
  );

/** Mongo-style query with server-side aggregations (returns aggregated rows). */
export const queryDocumentsWithAggregations = <T = Record<string, unknown>>(
  collection: string,
  query: Record<string, unknown> = {},
  aggregations: Aggregations = {},
  options: QueryOptions = {}
): Promise<T[]> =>
  domo
    .post<T[]>(
      `${DATASTORE}/collections/${enc(collection)}/documents/query${toQueryString({
        groupby: aggregations.groupby?.join(","),
        count: aggregations.count,
        avg: formatAggregation(aggregations.avg),
        min: formatAggregation(aggregations.min),
        max: formatAggregation(aggregations.max),
        sum: formatAggregation(aggregations.sum),
        unwind: aggregations.unwind?.join(","),
        orderby: options.orderby,
        limit: options.limit,
        offset: options.offset,
      })}`,
      query
    )
    .catch(fail("queryDocumentsWithAggregations"));

// ---------------------------------------------------------------------------
// Files (Domo Data Files API)
// ---------------------------------------------------------------------------

export const UploadFile = (
  file: File,
  name: string,
  description = "",
  isPublic = false
) => {
  const formData = new FormData();
  formData.append("file", file);
  return domo
    .post(
      `/domo/data-files/v1${toQueryString({ name, description, public: isPublic })}`,
      formData,
      { contentType: "multipart" }
    )
    .catch(fail("UploadFile"));
};

export const UploadRevision = (file: File, fileId: string | number) => {
  const formData = new FormData();
  formData.append("file", file);
  return domo
    .put(`/domo/data-files/v1/${enc(String(fileId))}`, formData, {
      contentType: "multipart",
    })
    .catch(fail("UploadRevision"));
};

export const GetFile = (fileId: string | number, revisionId?: string | number) =>
  domo
    .get<Blob>(
      `/domo/data-files/v1/${enc(String(fileId))}${
        revisionId !== undefined ? `/revisions/${enc(String(revisionId))}` : ""
      }`,
      { responseType: "blob" }
    )
    .catch(fail("GetFile"));

// ---------------------------------------------------------------------------
// Domo AI
// ---------------------------------------------------------------------------

/** Text generation via Domo AI. Returns the generated text or null. */
export const fetchAIData = async (
  prompt: string,
  template?: string,
  maxWords?: number | string
): Promise<string | null> => {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("fetchAIData: 'prompt' is required and must be a string");
  }
  const body: Record<string, unknown> = { input: prompt };
  if (template) body.promptTemplate = { template };
  if (maxWords !== undefined && !isNaN(Number(maxWords))) {
    body.parameters = { max_words: String(maxWords) };
  }
  try {
    const response = await domo.post<AIResponse>("/domo/ai/v1/text/generation", body);
    return response?.output ?? response?.choices?.[0]?.output ?? null;
  } catch (error) {
    return fail("fetchAIData")(error);
  }
};

// ---------------------------------------------------------------------------
// Workflows (aliases from manifest.json → "workflowMapping")
// ---------------------------------------------------------------------------

/** Start any workflow mapped in manifest.json by its alias. */
export const startWorkflow = <T = unknown>(
  alias: string,
  body: Record<string, unknown> = {}
): Promise<T> =>
  domo
    .post<T>(`/domo/workflow/v1/models/${enc(alias)}/start`, body)
    .catch(fail(`startWorkflow(${alias})`));

/** Sends an email through a workflow mapped with alias "email" (by default). */
export const sendEmail = (
  to: string | string[],
  subject: string,
  body: string,
  attachment?: EmailAttachment,
  workflowAlias = "email"
) =>
  startWorkflow(workflowAlias, {
    to,
    subject,
    body,
    ...(attachment ? { attachment: [attachment] } : {}),
  });

/** Triggers a dataflow through a workflow mapped with alias "dataflow" (by default). */
export const DataflowsActions = (
  action: string,
  dataflowId: string | number,
  workflowAlias = "dataflow"
) => startWorkflow(workflowAlias, { action, dataflowId, result: true });

// ---------------------------------------------------------------------------
// Code Engine (aliases from manifest.json → "packagesMapping")
// ---------------------------------------------------------------------------

/**
 * Call a Code Engine function mapped in manifest.json. Use Code Engine for
 * anything that needs secrets/accounts or Domo public APIs — never put
 * client IDs/secrets in this front-end code.
 */
export const runCodeEngine = <T = unknown>(
  alias: string,
  input: Record<string, unknown> = {}
): Promise<T> =>
  domo
    .post<T>(`/domo/codeengine/v2/packages/${enc(alias)}`, input)
    .catch(fail(`runCodeEngine(${alias})`));

// ---------------------------------------------------------------------------
// Iframe / host-page helpers
// ---------------------------------------------------------------------------

/**
 * Navigate the Domo host page. The app runs inside a sandboxed iframe, so
 * `window.location`/plain links can't leave it. Use a relative Domo path
 * ("/page/123") or a full URL; `newWindow` opens a new tab.
 */
export const navigate = (url: string, newWindow = false) =>
  domo.navigate(url, newWindow);

/**
 * Environment info passed to the iframe (userId, customer, locale, pageId,
 * platform …). Fine for UI hints; NOT for security (values come from the URL).
 */
export const getEnv = () => domo.env;

/**
 * Called when a mapped dataset updates. Registering this stops Domo from
 * reloading the whole app — re-fetch the affected data instead.
 * Returns an unsubscribe function.
 */
export const onDataUpdated = (callback: (alias: string) => void) =>
  domo.onDataUpdated(callback);

/**
 * Called when page filters change. Note: the FIRST registration clears the
 * parent page's filters. Returns an unsubscribe function.
 */
export const onFiltersUpdated = (
  callback: Parameters<typeof domo.onFiltersUpdated>[0]
) => domo.onFiltersUpdated(callback);

// ---------------------------------------------------------------------------
// Default export (keeps the old `DomoApi.X()` style working)
// ---------------------------------------------------------------------------

const DomoApi = {
  // user
  GetCurrentUser,
  GetUser,
  GetAllUser,
  ListAllUsers,
  // datasets
  fetchData,
  queryData,
  fetchSqlData,
  // appdb
  CreateDocument,
  ListDocuments,
  GetDocument,
  UpdateDocument,
  partialUpdateDocument,
  partialupdateDocument,
  DeleteDocument,
  BulkDeleteDocuments,
  QueryDocument,
  queryDocumentsByDate,
  queryDocumentsWithAggregations,
  // files
  UploadFile,
  UploadRevision,
  GetFile,
  // ai / workflows / code engine
  fetchAIData,
  startWorkflow,
  sendEmail,
  DataflowsActions,
  runCodeEngine,
  // iframe helpers
  navigate,
  getEnv,
  onDataUpdated,
  onFiltersUpdated,
};

export default DomoApi;
