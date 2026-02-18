/**
 * API client with Bearer token support.
 * Base URL from VITE_API_URL (default /api for dev proxy).
 */

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class ClientError extends Error {
  constructor(
    public status: number,
    public body: ApiError
  ) {
    super(body.message);
    this.name = "ClientError";
  }
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  localStorage.removeItem("token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: ApiError | T;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { code: "parse_error", message: "Не удалось прочитать ответ" };
  }

  if (!res.ok) {
    const err = body as ApiError;
    throw new ClientError(res.status, {
      code: err.code ?? `http_${res.status}`,
      message: err.message ?? "Ошибка запроса",
      details: err.details,
    });
  }

  return body as T;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  return handleResponse<T>(res);
}

export const api = {
  get: <T>(path: string) =>
    request<T>(path, { method: "GET" }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),

  postForm: <T>(path: string, formData: URLSearchParams) =>
    request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
};
