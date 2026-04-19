import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { env } from "../config/env";
import { logger } from "./logger";
import { pool } from "../config/database";
import { v4 as uuidv4 } from "uuid";

/**
 * Makes an HTTP request to the Embedly API.
 * Automatically logs every request and response to EmbedlyRequestResponseLogs.
 */
export async function embedlyRequest<T = unknown>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  urlPath: string,
  data?: unknown,
  extraConfig?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
  const fullUrl = `${env.embedly.apiUrl}${urlPath}`;

  const config: AxiosRequestConfig = {
    method,
    url: fullUrl,
    headers: {
      "x-api-key": env.embedly.apiKey,
      "Content-Type": "application/json",
    },
    data,
    ...extraConfig,
  };

  // Use config.url after spread so overrides from extraConfig are captured
  const actualUrl = config.url ?? fullUrl;

  logger.info(
    { method, url: actualUrl, payload: data },
    "Embedly request outgoing",
  );

  let response: AxiosResponse<T>;
  let responseStatusCode: number;
  let responsePayload: unknown;

  try {
    response = await axios(config);
    responseStatusCode = response.status;
    responsePayload = response.data;
    logger.info(
      { method, url: actualUrl, status: responseStatusCode },
      "Embedly response received",
    );
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      responseStatusCode = err.response.status;
      responsePayload = err.response.data;
      logger.error(
        {
          method,
          url: actualUrl,
          status: responseStatusCode,
          error: responsePayload,
        },
        "Embedly request failed",
      );
      await saveEmbedlyLog(
        actualUrl,
        method,
        data,
        responsePayload,
        responseStatusCode,
      );
      throw err;
    }
    throw err;
  }

  await saveEmbedlyLog(
    actualUrl,
    method,
    data,
    responsePayload,
    responseStatusCode,
  );

  return response;
}

/**
 * Makes an HTTP request to the Embedly Payout API (different base URL from WaaS).
 * Automatically logs every request and response to EmbedlyRequestResponseLogs.
 */
export async function embedlyPayoutRequest<T = unknown>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  urlPath: string,
  data?: unknown,
  extraConfig?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
  const fullUrl = `${env.embedly.payoutBaseUrl}${urlPath}`;

  const config: AxiosRequestConfig = {
    method,
    url: fullUrl,
    headers: {
      "x-api-key": env.embedly.apiKey,
      "Content-Type": "application/json",
    },
    data,
    ...extraConfig,
  };

  const actualUrl = config.url ?? fullUrl;

  logger.info(
    { method, url: actualUrl, payload: data },
    "Embedly Payout request outgoing",
  );

  let response: AxiosResponse<T>;
  let responseStatusCode: number;
  let responsePayload: unknown;

  try {
    response = await axios(config);
    responseStatusCode = response.status;
    responsePayload = response.data;
    logger.info(
      { method, url: actualUrl, status: responseStatusCode },
      "Embedly Payout response received",
    );
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      responseStatusCode = err.response.status;
      responsePayload = err.response.data;
      logger.error(
        {
          method,
          url: actualUrl,
          status: responseStatusCode,
          error: responsePayload,
        },
        "Embedly Payout request failed",
      );
      await saveEmbedlyLog(
        actualUrl,
        method,
        data,
        responsePayload,
        responseStatusCode,
      );
      throw err;
    }
    throw err;
  }

  await saveEmbedlyLog(
    actualUrl,
    method,
    data,
    responsePayload,
    responseStatusCode,
  );

  return response;
}

async function saveEmbedlyLog(
  apiUrl: string,
  method: string,
  requestPayload: unknown,
  responsePayload: unknown,
  responseStatusCode: number,
): Promise<void> {
  try {
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO EmbedlyRequestResponseLogs (Id, ApiUrl, Method, RequestPayload, ResponsePayload, ResponseStatusCode, DateCreated)
       VALUES (?, ?, ?, ?, ?, ?, NOW(6))`,
      [
        id,
        apiUrl,
        method,
        requestPayload ? JSON.stringify(requestPayload) : null,
        responsePayload ? JSON.stringify(responsePayload) : null,
        responseStatusCode,
      ],
    );
  } catch (logErr) {
    logger.error({ logErr }, "Failed to save Embedly request/response log");
  }
}
