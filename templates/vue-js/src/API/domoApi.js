/**
 * domoApi.js — single entry point for every Domo call made by this app.
 *
 * All requests go through `ryuu.js`, which talks to the Domo host page from
 * inside the app's iframe (in production) or through `@domoinc/ryuu-proxy`
 * (in local dev, see vite.config.js). Never call `fetch`/`axios` against
 * Domo endpoints directly — authentication only works through ryuu.js.
 *
 * Every alias used below (dataset alias, AppDB collection, workflow alias,
 * Code Engine package alias) MUST be declared in `public/manifest.json`.
 */
import domo from "ryuu.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
const DATASTORE = "/domo/datastores/v1";

const enc = encodeURIComponent;

/** Builds `?a=1&b=2`, skipping undefined/empty values and URL-encoding the rest. */
const toQueryString = (params) => {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${enc(k)}=${enc(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
};

const formatAggregation = (params) =>
  params
    ? Object.entries(params)
        .map(([property, alias]) => `${property} ${alias}`)
        .join(", ")
    : undefined;

/** Logs with context and re-throws so callers can handle the error. */
const fail = (context) => (error) => {
  console.error(`[domoApi] ${context}:`, error);
  throw error;
};

// ---------------------------------------------------------------------------
// User & environment
// ---------------------------------------------------------------------------
/** Current logged-in Domo user (works in Domo and through the local proxy). */
export const GetCurrentUser = () =>
  domo
    .get("/domo/environment/v1")
    .then((user) => ({
      ...user,
      userId: String(user.userId ?? ""),
      userName: String(user.userName ?? ""),
      displayName: String(user.userName ?? ""),
      avatarKey: `/domo/avatars/v2/USER/${user.userId}`,
    }))
    .catch(fail("GetCurrentUser"));

/** A single user by id. */
export const GetUser = (userId) =>
  domo
    .get(`/domo/users/v1/${enc(String(userId))}?includeDetails=true`)
    .then((user) => ({ ...user, userName: user.displayName }))
    .catch(fail("GetUser"));

/** Paged list of users in the instance. */
export const ListAllUsers = (includeDetails = false, limit = 100, offset = 0) =>
  domo
    .get(`/domo/users/v1${toQueryString({ includeDetails, limit, offset })}`)
    .catch(fail("ListAllUsers"));

/** @deprecated Use ListAllUsers(false, 500). Kept for backwards compatibility. */
export const GetAllUser = () => ListAllUsers(false, 500);

// ---------------------------------------------------------------------------
// Datasets (aliases from manifest.json → "mapping")
// ---------------------------------------------------------------------------
/**
 * Fetch rows from a mapped dataset.
 * `query` is appended as-is, e.g. "fields=region,sales&filter=sales>100&limit=50".
 */
export const fetchData = (datasetAlias, query = "") =>
  domo
    .get(`/data/v1/${enc(datasetAlias)}${query ? `?${query}` : ""}`)
    .catch(fail(`fetchData(${datasetAlias})`));

/**
 * Run SQL against a mapped dataset. Use the dataset ALIAS as the table name:
 *   fetchSqlData("sales", "SELECT region, SUM(amount) AS total FROM sales GROUP BY region")
 * Returns an array of objects keyed by (cleaned) column name.
 */
export const fetchSqlData = async (datasetAlias, query) => {
  if (typeof query !== "string" || !query.trim()) {
    throw new Error("fetchSqlData: query must be a non-empty string");
  }
  try {
    const apiData = await domo.post(`/sql/v1/${enc(datasetAlias)}`, query, {
      contentType: "text/plain",
    });
    if (
      !apiData ||
      !Array.isArray(apiData.columns) ||
      !Array.isArray(apiData.rows)
    ) {
      throw new Error("Invalid data received from the SQL API");
    }
    const columns = apiData.columns.map((c) =>
      c
        .replace(/`/g, "")
        .replace(/T1\./g, "")
        .replace(/avg\((.*?)\)/i, "$1")
        .trim(),
    );
    return apiData.rows.map((row) => {
      const obj = {};
      columns.forEach((col, i) => (obj[col] = row[i]));
      return obj;
    });
  } catch (error) {
    return fail(`fetchSqlData(${datasetAlias})`)(error);
  }
};

// ---------------------------------------------------------------------------
// AppDB (collections from manifest.json → "collections")
// ---------------------------------------------------------------------------
export const CreateDocument = (collection, document) =>
  domo
    .post(`${DATASTORE}/collections/${enc(collection)}/documents/`, {
      content: document,
    })
    .catch(fail("CreateDocument"));

export const ListDocuments = (collection) =>
  domo
    .get(`${DATASTORE}/collections/${enc(collection)}/documents/`)
    .catch(fail("ListDocuments"));

export const GetDocument = (collection, documentId) =>
  domo
    .get(
      `${DATASTORE}/collections/${enc(collection)}/documents/${enc(documentId)}`,
    )
    .catch(fail("GetDocument"));

/** Replaces the whole `content` of a document. */
export const UpdateDocument = (collection, documentId, document) =>
  domo
    .put(
      `${DATASTORE}/collections/${enc(collection)}/documents/${enc(documentId)}`,
      { content: document },
    )
    .catch(fail("UpdateDocument"));

/**
 * Update matching documents in place (Mongo-style).
 *   partialUpdateDocument("tasks", { "content.status": "open" }, { $set: { "content.status": "done" } })
 */
export const partialUpdateDocument = (collection, query, operation) =>
  domo
    .put(`${DATASTORE}/collections/${enc(collection)}/documents/update`, {
      query,
      operation,
    })
    .catch(fail("partialUpdateDocument"));

/** @deprecated Typo-cased alias kept for backwards compatibility. */
export const partialupdateDocument = partialUpdateDocument;

export const DeleteDocument = (collection, documentId) =>
  domo
    .delete(
      `${DATASTORE}/collections/${enc(collection)}/documents/${enc(documentId)}`,
    )
    .catch(fail("DeleteDocument"));

export const BulkDeleteDocuments = (collection, ids) =>
  domo
    .delete(
      `${DATASTORE}/collections/${enc(collection)}/documents/bulk?ids=${ids
        .map(enc)
        .join(",")}`,
    )
    .catch(fail("BulkDeleteDocuments"));

/**
 * Mongo-style query. Remember document fields live under `content.`:
 *   QueryDocument("tasks", { "content.owner": userId }, { orderby: "createdOn", limit: 50 })
 */
export const QueryDocument = (collection, query = {}, options = {}) =>
  domo
    .post(
      `${DATASTORE}/collections/${enc(collection)}/documents/query${toQueryString(
        {
          limit: options.limit,
          offset: options.offset,
          orderby: options.orderby,
        },
      )}`,
      query,
    )
    .catch(fail("QueryDocument"));

/** Documents created on or before `dateString` (ISO date). */
export const queryDocumentsByDate = (collection, dateString, options = {}) =>
  QueryDocument(
    collection,
    { createdOn: { $lte: { $date: dateString } } },
    options,
  );

/** Mongo-style query with server-side aggregations (returns aggregated rows). */
export const queryDocumentsWithAggregations = (
  collection,
  query = {},
  aggregations = {},
  options = {},
) =>
  domo
    .post(
      `${DATASTORE}/collections/${enc(collection)}/documents/query${toQueryString(
        {
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
        },
      )}`,
      query,
    )
    .catch(fail("queryDocumentsWithAggregations"));

// ---------------------------------------------------------------------------
// Files (Domo Data Files API)
// ---------------------------------------------------------------------------
export const UploadFile = (file, name, description = "", isPublic = false) => {
  const formData = new FormData();
  formData.append("file", file);
  return domo
    .post(
      `/domo/data-files/v1${toQueryString({ name, description, public: isPublic })}`,
      formData,
      { contentType: "multipart" },
    )
    .catch(fail("UploadFile"));
};

export const UploadRevision = (file, fileId) => {
  const formData = new FormData();
  formData.append("file", file);
  return domo
    .put(`/domo/data-files/v1/${enc(String(fileId))}`, formData, {
      contentType: "multipart",
    })
    .catch(fail("UploadRevision"));
};

export const GetFile = (fileId, revisionId) =>
  domo
    .get(
      `/domo/data-files/v1/${enc(String(fileId))}${revisionId !== undefined ? `/revisions/${enc(String(revisionId))}` : ""}`,
      { responseType: "blob" },
    )
    .catch(fail("GetFile"));

// ---------------------------------------------------------------------------
// Domo AI
// ---------------------------------------------------------------------------
/** Text generation via Domo AI. Returns the generated text or null. */
export const fetchAIData = async (prompt, template, maxWords) => {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("fetchAIData: 'prompt' is required and must be a string");
  }
  const body = { input: prompt };
  if (template) body.promptTemplate = { template };
  if (maxWords !== undefined && !isNaN(Number(maxWords))) {
    body.parameters = { max_words: String(maxWords) };
  }
  try {
    const response = await domo.post("/domo/ai/v1/text/generation", body);
    return response?.output ?? response?.choices?.[0]?.output ?? null;
  } catch (error) {
    return fail("fetchAIData")(error);
  }
};

// ---------------------------------------------------------------------------
// Workflows (aliases from manifest.json → "workflowMapping")
// ---------------------------------------------------------------------------
/** Start any workflow mapped in manifest.json by its alias. */
export const startWorkflow = (alias, body = {}) =>
  domo
    .post(`/domo/workflow/v1/models/${enc(alias)}/start`, body)
    .catch(fail(`startWorkflow(${alias})`));

/** Sends an email through a workflow mapped with alias "email" (by default). */
export const sendEmail = (
  to,
  subject,
  body,
  attachment,
  workflowAlias = "email",
) =>
  startWorkflow(workflowAlias, {
    to,
    subject,
    body,
    ...(attachment ? { attachment: [attachment] } : {}),
  });

/** Triggers a dataflow through a workflow mapped with alias "dataflow" (by default). */
export const DataflowsActions = (
  action,
  dataflowId,
  workflowAlias = "dataflow",
) => startWorkflow(workflowAlias, { action, dataflowId, result: true });

// ---------------------------------------------------------------------------
// Code Engine (aliases from manifest.json → "packagesMapping")
// ---------------------------------------------------------------------------
/**
 * Call a Code Engine function mapped in manifest.json. Use Code Engine for
 * anything that needs secrets/accounts or Domo public APIs — never put
 * client IDs/secrets in this front-end code.
 */
export const runCodeEngine = (alias, input = {}) =>
  domo
    .post(`/domo/codeengine/v2/packages/${enc(alias)}`, input)
    .catch(fail(`runCodeEngine(${alias})`));

// ---------------------------------------------------------------------------
// Iframe / host-page helpers
// ---------------------------------------------------------------------------
/**
 * Navigate the Domo host page. The app runs inside a sandboxed iframe, so
 * `window.location`/plain links can't leave it. Use a relative Domo path
 * ("/page/123") or a full URL; `newWindow` opens a new tab.
 */
export const navigate = (url, newWindow = false) =>
  domo.navigate(url, newWindow);

/** Environment info passed to the iframe (userId, customer, locale, pageId, ...). */
export const getEnv = () => domo.env;

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
};

export default DomoApi;
