import domo from "ryuu.js";
import axios from "axios";

interface AIResponseBody {
  input: string;
  promptTemplate?: {
    template: string;
  };
  parameters?: {
    max_words: string;
  };
}

interface SqlApiData {
  columns: string[];
  rows: any[][];
}

interface EmailData {
  to: string;
  subject: string;
  body: string;
  attachment?: any[];
}

interface DataflowData {
  action: string;
  dataflowId: string;
  result: boolean;
}

export async function fetchAIData(
  prompt: string,
  template?: string,
  maxWords?: number
): Promise<string | undefined> {
  try {
    // Validate the required "prompt" parameter
    if (!prompt || typeof prompt !== "string") {
      throw new Error(
        "The 'prompt' parameter is required and must be a string."
      );
    }

    // Construct the body dynamically, including properties only if they are valid
    const body: AIResponseBody = {
      input: prompt,
      ...(template &&
        typeof template === "string" && {
          promptTemplate: {
            template,
          },
        }),
      ...(maxWords &&
        !isNaN(maxWords) && {
          parameters: {
            max_words: maxWords.toString(),
          },
        }),
    };

    // Send the POST request
    const response = await domo.post(`/domo/ai/v1/text/generation`, body);
    console.log("AI Response:", response.output);

    return response?.output;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Re-throw the error for better upstream handling
  }
}

export async function fetchData<T = any>(
  dataset: string
): Promise<T | undefined> {
  try {
    const response = await domo.get(`/data/v1/${dataset}`).then((data: T) => {
      return data;
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

export async function fetchSqlData<T = Record<string, any>>(
  dataset: string,
  query: string
): Promise<T[]> {
  // Ensure the query is a string
  if (typeof query !== "string") {
    throw new Error("Query must be a string");
  }

  try {
    // Fetch data from the API
    const apiData: SqlApiData = await domo
      .post(`/sql/v1/${dataset}`, query, { contentType: "text/plain" })
      .then((data: SqlApiData) => {
        return data;
      });

    // Validate the fetched data
    if (!apiData || !apiData.columns || !apiData.rows) {
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
    const jsonResult = apiData.rows.map((row: any[]) => {
      const jsonObject: Record<string, any> = {};
      cleanedColumns.forEach((cleanedColumn: string, index: number) => {
        jsonObject[cleanedColumn] = row[index];
      });
      return jsonObject as T;
    });

    return jsonResult;
  } catch (error) {
    console.error("Error fetching or processing data:", error);
    throw error;
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  attachment?: any
): Promise<void> {
  const data: EmailData = {
    to,
    subject,
    body,
    ...(attachment && { attachment: [attachment] }),
  };

  if (data) {
    try {
      const response = await domo.post(
        `/domo/workflow/v1/models/email/start`,
        data
      );
      if (response) {
        console.log("response", response);
      }
    } catch (err) {
      console.error("Error sending email:", err);
    }
  }
}

// Dataflow
export const DataflowsActions = async (
  action: string,
  dataflowId: string
): Promise<void> => {
  const data: DataflowData = {
    action,
    dataflowId,
    result: true,
  };

  if (data) {
    try {
      const response = await domo.post(
        `/domo/workflow/v1/models/dataflow/start`,
        data
      );
      if (response) {
        console.log("response", response);
      }
    } catch (err) {
      console.error("Error sending email:", err);
    }
  }
};

export const generateAccessToken = async (
  clientId: string,
  clientSecret: string
): Promise<string> => {
  const tokenUrl = "https://api.domo.com/oauth/token";
  try {
    const response = await axios.post(
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
    console.log("Response:", response);
    console.log("Access Token:", response.data.access_token);

    return response.data.access_token;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};

// List Of Users
export const fetchUsers = async (
  accessToken: string
): Promise<any[] | undefined> => {
  const userUrl = `https://api.domo.com/v1/users?limit=500`;
  console.log("accessToken", accessToken);
  try {
    if (!accessToken) {
      console.log("Access token not found");
      return;
    }
    const response = await axios.get(userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log("List of users with access token", response.data);
    return response.data;
  } catch (err) {
    console.error("Error fetching User details:", err);
  }
};

// List Of Dataset
export const fetchDatasets = async (
  accessToken: string
): Promise<any[] | undefined> => {
  const datasetUrl = `https://api.domo.com/v1/datasets`;

  try {
    if (!accessToken) {
      await generateAccessToken("", "");
    }
    const response = await axios.get(datasetUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching dataset details:", err);
  }
};

// Particular Dataset Details
export const fetchDatasetDetails = async (
  accessToken: string,
  datasetId: string
): Promise<any | undefined> => {
  const datasetUrl = `https://api.domo.com/v1/datasets/${datasetId}`;

  try {
    if (!accessToken) {
      await generateAccessToken("", "");
    }

    const response = await axios.get(datasetUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching dataset details:", err);
  }
};
