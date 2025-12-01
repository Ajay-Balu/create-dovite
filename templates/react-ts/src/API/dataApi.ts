import domo from "ryuu.js";
import axios from "axios";

// --- Type Definitions ---

// Quick module declaration for ryuu.js if missing types
declare module "ryuu.js" {
  export function get(path: string): Promise<unknown>;
  export function post(
    path: string,
    body: unknown,
    options?: unknown
  ): Promise<unknown>;
}

interface DomoSqlResponse {
  columns: string[];
  rows: unknown[][];
  metadata?: unknown;
}

interface AIResponse {
  output?: string;
  choices?: Array<{ output: string }>;
}

interface EmailAttachment {
  filename: string;
  contentType: string;
  base64: string;
}

interface DomoUser {
  id: number;
  email: string;
  role: string;
  [key: string]: unknown;
}

interface DomoDataset {
  id: string;
  name: string;
  rows: number;
  columns: number;
  [key: string]: unknown;
}

// --- API Functions ---

/**
 * Fetches generated text from the Domo AI service.
 */
export async function fetchAIData(
  prompt: string,
  template?: string,
  maxWords?: number | string
): Promise<string | null> {
  try {
    // Validate the required "prompt" parameter
    if (!prompt || typeof prompt !== "string") {
      throw new Error(
        "The 'prompt' parameter is required and must be a string."
      );
    }

    // Construct the body dynamically
    const body: Record<string, unknown> = {
      input: prompt,
    };

    if (template && typeof template === "string") {
      body.promptTemplate = { template };
    }

    if (maxWords && !isNaN(Number(maxWords))) {
      body.parameters = { max_words: maxWords.toString() };
    }

    // Send the POST request
    const response = (await domo.post(
      `/domo/ai/v1/text/generation`,
      body
    )) as AIResponse;

    // console.log("AI Response:", response);

    if (response?.output) {
      return response.output;
    }
    if (response?.choices?.[0]?.output) {
      return response.choices[0].output;
    }

    return null;
  } catch (error) {
    console.error("Error fetching AI data:", error);
    throw error;
  }
}

/**
 * Simple fetch for a dataset.
 */
export async function fetchData(dataset: string): Promise<unknown> {
  try {
    const response = await domo.get(`/data/v1/${dataset}`);
    return response;
  } catch (error) {
    console.error(`Error fetching dataset ${dataset}:`, error);
    throw error;
  }
}

/**
 * Executes a SQL query against a Domo dataset and returns a mapped JSON array.
 * @template T - The expected shape of the row data.
 */
export async function fetchSqlData<T = Record<string, unknown>>(
  dataset: string,
  query: string
): Promise<T[]> {
  // Ensure the query is a string
  if (typeof query !== "string") {
    throw new Error("Query must be a string");
  }

  try {
    // Fetch data from the API
    const apiData = (await domo.post(`/sql/v1/${dataset}`, query, {
      contentType: "text/plain",
    })) as DomoSqlResponse;

    // Validate the fetched data
    if (
      !apiData ||
      !Array.isArray(apiData.columns) ||
      !Array.isArray(apiData.rows)
    ) {
      throw new Error("Invalid data received from the API");
    }

    // Extract and clean column names
    const cleanedColumns = apiData.columns.map((column: string) => {
      return column
        .replace(/`/g, "")
        .replace(/T1\./g, "")
        .replace(/avg\((.*?)\)/i, "$1")
        .trim();
    });

    // Map rows to cleaned column names
    const jsonResult = apiData.rows.map((row: unknown[]) => {
      const jsonObject: Record<string, unknown> = {};
      cleanedColumns.forEach((cleanedColumn: string, index: number) => {
        jsonObject[cleanedColumn] = row[index];
      });
      return jsonObject as T;
    });

    // console.log("Mapped SQL DATA", jsonResult);
    return jsonResult;
  } catch (error) {
    console.error("Error fetching or processing SQL data:", error);
    throw error;
  }
}

/**
 * Triggers a Domo Workflow email.
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  body: string,
  attachment?: EmailAttachment
): Promise<void> {
  const data: Record<string, unknown> = {
    to,
    subject,
    body,
  };

  if (attachment) {
    data.attachment = [attachment];
  }

  try {
    const response = await domo.post(
      `/domo/workflow/v1/models/email/start`,
      data
    );
    if (response) {
      console.log("Email sent successfully:", response);
    }
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
}

/**
 * Triggers a Dataflow action.
 */
export const DataflowsActions = async (
  action: string,
  dataflowId: string | number
): Promise<void> => {
  const data = {
    action,
    dataflowId,
    result: true,
  };

  try {
    const response = await domo.post(
      `/domo/workflow/v1/models/dataflow/start`,
      data
    );
    if (response) {
      console.log("Dataflow action response:", response);
    }
  } catch (err) {
    console.error("Error triggering dataflow:", err);
    throw err;
  }
};

/**
 * Generates an OAuth Access Token.
 */
export const generateAccessToken = async (
  clientId: string,
  clientSecret: string
): Promise<string> => {
  if (!clientId || !clientSecret) {
    throw new Error("Client ID and Secret are required to generate a token.");
  }

  const tokenUrl = "https://api.domo.com/oauth/token";

  try {
    const response = await axios.post<{ access_token: string }>(
      tokenUrl,
      new URLSearchParams({
        grant_type: "client_credentials",
        scope: "user",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
          username: clientId,
          password: clientSecret,
        },
      }
    );

    // console.log("Access Token generated successfully");
    return response.data.access_token;
  } catch (err) {
    console.error("Error generating access token:", err);
    throw err;
  }
};

// --- Admin/Management Functions ---

export const fetchUsers = async (
  accessToken: string
): Promise<DomoUser[] | undefined> => {
  if (!accessToken) {
    console.error("Access token missing in fetchUsers");
    return;
  }

  const userUrl = `https://api.domo.com/v1/users?limit=500`;

  try {
    const response = await axios.get<DomoUser[]>(userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log(`Fetched ${response.data.length} users`);
    return response.data;
  } catch (err) {
    console.error("Error fetching User details:", err);
    throw err;
  }
};

export const fetchDatasets = async (
  accessToken: string
): Promise<DomoDataset[] | undefined> => {
  if (!accessToken) {
    console.error("Access token missing in fetchDatasets");
    return;
  }

  const datasetUrl = `https://api.domo.com/v1/datasets`;

  try {
    const response = await axios.get<DomoDataset[]>(datasetUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching dataset details:", err);
    throw err;
  }
};

export const fetchDatasetDetails = async (
  accessToken: string,
  datasetId: string
): Promise<DomoDataset | undefined> => {
  if (!accessToken) {
    console.error("Access token missing in fetchDatasetDetails");
    return;
  }

  const datasetUrl = `https://api.domo.com/v1/datasets/${datasetId}`;

  try {
    const response = await axios.get<DomoDataset>(datasetUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching dataset details:", err);
    throw err;
  }
};
