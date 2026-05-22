import type { ApiError as ApiErrorBody, ApiResponse } from "./types";
import { getCsrfToken } from "./authSession";

/**
 * Error thrown when the backend response cannot be treated as a successful API result.
 */
export class ApiError extends Error {
  status: number;
  body: unknown;
  code?: string;
  validationErrors?: string[];

  constructor(status: number, body: unknown, fallbackMessage: string, code?: string) {
    super(getErrorMessage(body, fallbackMessage));
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.code = code;
    this.validationErrors = isApiErrorBody(body) ? body.validationErrors : undefined;
  }
}

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  body?: unknown;
  skipCsrf?: boolean;
};

const CSRF_PROTECTED_METHODS = new Set<RequestOptions["method"]>([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

/**
 * Resolves a human-readable error message from a backend error payload.
 */
function getErrorMessage(body: unknown, fallbackMessage: string) {
  if (isApiErrorBody(body)) {
    return body.message;
  }

  return fallbackMessage;
}

/**
 * Narrows unknown JSON values to object records.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

/**
 * Checks whether an unknown value matches the backend error payload format.
 */
function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    (value.validationErrors === undefined ||
      (Array.isArray(value.validationErrors) &&
        value.validationErrors.every((item) => typeof item === "string")))
  );
}

/**
 * Checks whether an unknown value matches the common backend response envelope.
 */
function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!isRecord(value) || typeof value.success !== "boolean") {
    return false;
  }

  if (value.success === true) {
    return "data" in value;
  }

  return isApiErrorBody(value.error);
}

/**
 * Parses a response body as JSON and raises an ApiError when the payload is invalid.
 */
async function parseJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(response.status, text, "Invalid JSON response.");
  }
}

/**
 * Sends an API request using the CMS conventions for credentials, JSON payloads,
 * CSRF headers, and response envelopes.
 */
async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const headers = new Headers();
  const csrfToken = getCsrfToken();

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipCsrf && csrfToken && CSRF_PROTECTED_METHODS.has(options.method)) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetch(path, {
    method: options.method,
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const responseBody = await parseJson(response);

  if (!isApiResponse<T>(responseBody)) {
    throw new ApiError(response.status, responseBody, "Invalid API response.");
  }

  if (!responseBody.success) {
    throw new ApiError(
      response.status,
      responseBody.error,
      `Request failed with ${response.status}.`,
      responseBody.error.code,
    );
  }

  if (!response.ok) {
    throw new ApiError(response.status, responseBody, `Request failed with ${response.status}.`);
  }

  return responseBody.data;
}

/**
 * Sends a GET request and returns the unwrapped response data.
 */
export function apiGet<T>(path: string) {
  return apiRequest<T>(path, { method: "GET" });
}

/**
 * Sends a POST request and returns the unwrapped response data.
 */
export function apiPost<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "POST", body });
}

/**
 * Sends a public POST request without attaching a CSRF token.
 */
export function apiPublicPost<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "POST", body, skipCsrf: true });
}

/**
 * Sends a PUT request and returns the unwrapped response data.
 */
export function apiPut<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "PUT", body });
}

/**
 * Sends a PATCH request and returns the unwrapped response data.
 */
export function apiPatch<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "PATCH", body });
}

/**
 * Sends a DELETE request and returns the unwrapped response data.
 */
export function apiDelete<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "DELETE", body });
}
