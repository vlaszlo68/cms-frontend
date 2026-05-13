export type ApiErrorBody = {
  error?: string;
  message?: string;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown, fallbackMessage: string) {
    super(getErrorMessage(body, fallbackMessage));
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method: "GET" | "POST";
  body?: unknown;
};

function getErrorMessage(body: unknown, fallbackMessage: string) {
  if (body && typeof body === "object") {
    const apiBody = body as ApiErrorBody;

    if (apiBody.error) {
      return apiBody.error;
    }

    if (apiBody.message) {
      return apiBody.message;
    }
  }

  return fallbackMessage;
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

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    method: options.method,
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new ApiError(response.status, data, `Request failed with ${response.status}.`);
  }

  return data as T;
}

export function apiGet<T>(path: string) {
  return apiRequest<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "POST", body });
}
