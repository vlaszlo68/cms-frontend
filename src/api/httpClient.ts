import type { ApiError as ApiErrorBody, ApiResponse } from "./types";
import { getCsrfToken } from "./authSession";

export class ApiError extends Error {
  status: number;
  body: unknown;
  code?: string;

  constructor(status: number, body: unknown, fallbackMessage: string, code?: string) {
    super(getErrorMessage(body, fallbackMessage));
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.code = code;
  }
}

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  body?: unknown;
};

const CSRF_PROTECTED_METHODS = new Set<RequestOptions["method"]>([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

function getErrorMessage(body: unknown, fallbackMessage: string) {
  if (isApiErrorBody(body)) {
    return body.message;
  }

  return fallbackMessage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.message === "string"
  );
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!isRecord(value) || typeof value.success !== "boolean") {
    return false;
  }

  if (value.success === true) {
    return "data" in value;
  }

  return isApiErrorBody(value.error);
}

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

async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const headers = new Headers();
  const csrfToken = getCsrfToken();

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (csrfToken && CSRF_PROTECTED_METHODS.has(options.method)) {
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

export function apiGet<T>(path: string) {
  return apiRequest<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "POST", body });
}

export function apiPut<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "PUT", body });
}

export function apiPatch<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "PATCH", body });
}

export function apiDelete<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "DELETE", body });
}
