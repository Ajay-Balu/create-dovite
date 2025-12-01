// @ts-ignore
import domo from "ryuu.js";

const BASE_URL = "/domo/datastores/v1";

export interface User {
  userId: string;
  userName: string;
  displayName: string;
  avatarKey?: string;
  [key: string]: any;
}

export interface Document {
  [key: string]: any;
}

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

const GetCurrentUser = (): Promise<User> => {
  return domo
    .get("/domo/environment/v1")
    .then((user: any) => ({
      ...user,
      displayName: user.userName,
      avatarKey: `/domo/avatars/v2/USER/${user.userId}`,
    }))
    .catch((error: any) => {
      console.error("Error getting current user:", error);
      throw error;
    });
};

const GetAllUser = (): Promise<any> => {
  return domo
    .get(`/domo/users/v1?limit={500}`)
    .then((response: any) => response)
    .catch((error: any) => {
      console.error("Error getting All users:", error);
      throw error;
    });
};

const GetUser = (userId: string): Promise<User> => {
  return domo
    .get(`/domo/users/v1/${userId}?includeDetails=true`)
    .then((user: any) => ({ ...user, userName: user.displayName }))
    .catch((error: any) => {
      console.error("Error getting user:", error);
      throw error;
    });
};

const CreateDocument = (
  collectionName: string,
  document: Document
): Promise<any> => {
  console.log(document);
  console.log(collectionName);

  return domo
    .post(`${BASE_URL}/collections/${collectionName}/documents/`, {
      content: document,
    })
    .then((response: any) => response)
    .catch((error: any) => {
      console.error("Error creating document:", error);
      throw error;
    });
};

const ListDocuments = (collectionName: string): Promise<any> => {
  return domo
    .get(`${BASE_URL}/collections/${collectionName}/documents/`)
    .then((response: any) => response)
    .catch((error: any) => {
      console.error("Error listing documents:", error);
      throw error;
    });
};

const GetDocument = (
  collectionName: string,
  documentId: string
): Promise<any> => {
  return domo
    .get(`${BASE_URL}/collections/${collectionName}/documents/${documentId}`)
    .then((response: any) => response)
    .catch((error: any) => {
      console.error("Error getting document:", error);
      throw error;
    });
};

const UpdateDocument = (
  collectionName: string,
  documentId: string,
  document: Document
): Promise<any> => {
  return domo
    .put(`${BASE_URL}/collections/${collectionName}/documents/${documentId}`, {
      content: document,
    })
    .then((response: any) => response)
    .catch((error: any) => {
      console.error("Error updating document:", error);
      throw error;
    });
};

const queryDocumentsWithAggregations = (
  collectionName: string,
  query: any = {},
  aggregations: Aggregations = {},
  options: QueryOptions = {}
): Promise<any> => {
  // Base URL for the query
  let url = `${BASE_URL}/collections/${collectionName}/documents/query?`;

  // Helper function to format aggregation parameters
  const formatAggregationParams = (params: Record<string, string>) => {
    return Object.entries(params)
      .map(([property, alias]) => `${property} ${alias}`)
      .join(", ");
  };

  // Append aggregation parameters to URL
  if (aggregations.groupby) url += `groupby=${aggregations.groupby.join(",")}&`;
  if (aggregations.count) url += `count=${aggregations.count}&`;
  if (aggregations.avg)
    url += `avg=${formatAggregationParams(aggregations.avg)}&`;
  if (aggregations.min)
    url += `min=${formatAggregationParams(aggregations.min)}&`;
  if (aggregations.max)
    url += `max=${formatAggregationParams(aggregations.max)}&`;
  if (aggregations.sum)
    url += `sum=${formatAggregationParams(aggregations.sum)}&`;
  if (aggregations.unwind) url += `unwind=${aggregations.unwind.join(",")}&`;

  // Append options to the URL
  if (options.orderby) url += `orderby=${options.orderby}&`;
  if (options.limit !== undefined) url += `limit=${options.limit}&`;
  if (options.offset !== undefined) url += `offset=${options.offset}&`;

  // Remove trailing "&" or "?" from the URL
  url = url.replace(/[&?]$/, "");

  return domo
    .post(url, query)
    .then((response: any) => {
      console.log("Query successful:", response);
      return response;
    })
    .catch((error: any) => {
      console.error("Error querying documents with aggregations:", error);
      throw error;
    });
};

const DeleteDocument = (
  collectionName: string,
  documentId: string
): Promise<any> => {
  return domo
    .delete(`${BASE_URL}/collections/${collectionName}/documents/${documentId}`)
    .then((response: any) => response.data)
    .catch((error: any) => {
      console.error("Error deleting document:", error);
      throw error;
    });
};

const QueryDocument = (
  collectionName: string,
  query: any = {},
  options: QueryOptions = {}
): Promise<any> => {
  // Base URL for querying documents
  let url = `${BASE_URL}/collections/${collectionName}/documents/query?`;

  // Append optional parameters to the URL
  if (options.limit !== undefined) url += `limit=${options.limit}&`;
  if (options.offset !== undefined) url += `offset=${options.offset}&`;
  if (options.orderby) url += `orderby=${options.orderby}&`;

  // Remove trailing "&" or "?" from the URL
  url = url.replace(/[&?]$/, "");

  return domo
    .post(url, query)
    .then((response: any) => {
      // console.log("Query successful:", response);
      return response;
    })
    .catch((error: any) => {
      console.error("Error querying documents:", error);
      throw error;
    });
};

// Query documents based on a specific date range
const queryDocumentsByDate = (
  collectionName: string,
  dateString: string,
  options: QueryOptions = {}
): Promise<any> => {
  const query = {
    createdOn: {
      $lte: { $date: dateString },
    },
  };
  return QueryDocument(collectionName, query, options);
};

const BulkDeleteDocuments = (
  collectionName: string,
  ids: string[]
): Promise<any> => {
  return domo
    .delete(
      `${BASE_URL}/collections/${collectionName}/documents/bulk?ids=${ids}`
    )
    .then((response: any) => response)
    .catch((error: any) => {
      console.error("Error bulk deleting documents:", error);
      throw error;
    });
};

const UploadFile = (
  file: File,
  name: string,
  description: string = "",
  isPublic: boolean = false
): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);
  const url = `/domo/data-files/v1?name=
             ${name}&description=${description}&public=${isPublic}`;
  const options = { contentType: "multipart" };
  return domo
    .post(url, formData, options)
    .then((response: any) => response)
    .catch((err: any) => {
      console.log(err);
      throw err;
    });
};

const UploadRevision = (file: File, fileId: string): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);
  const url = `/domo/data-files/v1/${fileId}`;
  const options = { contentType: "multipart" };
  return domo
    .put(url, formData, options)
    .then((response: any) => response)
    .catch((err: any) => {
      console.log(err);
      throw err;
    });
};

const GetFile = (fileId: string, revisionId?: string): Promise<any> => {
  const options: any = { responseType: "blob" };
  const url = `/domo/data-files/v1/${fileId}${
    revisionId ? `/revisions/${revisionId}` : ""
  }`;
  return domo
    .get(url, options)
    .then((data: any) => data)
    .catch((err: any) => {
      console.log(err);
      throw err;
    });
};

const ListAllUsers = async (
  includeDetails: boolean = false,
  limit: number = 100,
  offset: number = 0
): Promise<any> => {
  try {
    const response = await domo.get(
      `/domo/users/v1?includeDetails=${includeDetails}&limit=${limit}&offset=${offset}`
    );
    return response;
  } catch (error) {
    console.error("Error listing users:", error);
    throw error;
  }
};

const partialupdateDocument = (
  collectionName: string,
  query: any,
  operation: any
): Promise<any> => {
  const requestBody = {
    query: query,
    operation: operation,
  };

  console.log("Request body:", requestBody);

  return domo
    .put(
      `${BASE_URL}/collections/${collectionName}/documents/update`,
      requestBody
    )
    .then((response: any) => {
      console.log("Document updated successfully:", response);
      return response;
    })
    .catch((error: any) => {
      console.error("Error updating document:", error);
      throw error;
    });
};

const DomoApi = {
  GetCurrentUser,
  GetAllUser,
  GetUser,
  CreateDocument,
  ListDocuments,
  DeleteDocument,
  BulkDeleteDocuments,
  GetDocument,
  UpdateDocument,
  QueryDocument,
  queryDocumentsByDate,
  UploadFile,
  UploadRevision,
  GetFile,
  queryDocumentsWithAggregations,
  ListAllUsers,
  partialupdateDocument,
};

export default DomoApi;
