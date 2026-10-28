export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

export interface ApiEnvelope<T> {
  data: T;
  meta?: { page: number; pageSize: number; total: number; totalPages: number };
}

export type ApiErrorKind = "validation" | "authentication" | "authorization" | "csrf" | "server" | "network" | "request";
export interface ApiErrorDetail { field?: string; message: string; }

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly kind: ApiErrorKind = "request",
    readonly code?: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let csrfToken: string | undefined;
let csrfLoading: Promise<string> | undefined;
let refreshing: Promise<boolean> | undefined;
export function invalidateCsrfToken() { csrfToken = undefined; }

async function loadCsrfToken(): Promise<string> {
  if (!API_BASE_URL) throw new ApiError("API base URL is not configured.", 0);
  if (!csrfLoading) {
    csrfLoading = (async () => {
      let response: Response;
      try {
        const url = apiUrl("/auth/csrf");
        response = await fetch(url, { credentials: "include", cache: "no-store" });
      } catch {
        throw new ApiError("Could not reach the API to start a secure request session.", 0, "network");
      }
      const body = await response.json().catch(() => ({})) as { data?: { csrfToken?: string } };
      if (!response.ok || !body.data?.csrfToken) throw parseApiError(response.status, body);
      csrfToken = body.data.csrfToken;
      return csrfToken;
    })().finally(() => { csrfLoading = undefined; });
  }
  return csrfLoading;
}

async function csrf(): Promise<string> {
  return csrfToken ?? loadCsrfToken();
}

function isCsrfFailure(status: number, body: unknown): boolean {
  if (status !== 403 || !body || typeof body !== "object") return false;
  const error = (body as { error?: { message?: unknown } }).error;
  return typeof error?.message === "string" && /^(invalid csrf token|csrf token required)$/i.test(error.message);
}

async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const url = apiUrl("/auth/refresh");
        const response = await fetch(url, { method: "POST", credentials: "include", cache: "no-store" });
        return response.ok;
      } catch {
        return false;
      }
    })().finally(() => { refreshing = undefined; });
  }
  return refreshing;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  if (!API_BASE_URL) throw new ApiError("API base URL is not configured.", 0);
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (mutating) headers.set("X-CSRF-Token", await csrf());

  const requestUrl = apiUrl(path);
  const send = () => fetch(requestUrl, { ...init, method, headers, credentials: "include", cache: "no-store" });
  let response: Response;
  try {
    response = await send();
  } catch {
    throw new ApiError("Could not reach the API. Check that the backend is running.", 0, "network");
  }

  if (response.status === 401 && !["/auth/login", "/auth/csrf", "/auth/refresh"].includes(path)) {
    invalidateCsrfToken();
    if (await refreshSession()) {
      if (mutating) headers.set("X-CSRF-Token", await csrf());
      try { response = await send(); }
      catch { throw new ApiError("Could not reach the API. Check that the backend is running.", 0, "network"); }
    }
  }

  let body: unknown = await response.json().catch(() => ({}));
  if (mutating && isCsrfFailure(response.status, body)) {
    invalidateCsrfToken();
    headers.set("X-CSRF-Token", await loadCsrfToken());
    try { response = await send(); }
    catch { throw new ApiError("Could not reach the API. Check that the backend is running.", 0, "network"); }
    body = await response.json().catch(() => ({}));
  }

  if (!response.ok) throw parseApiError(response.status, body);
  return body as ApiEnvelope<T>;
}

function parseApiError(status: number, body: unknown): ApiError {
  const root = body && typeof body === "object" ? body as { error?: { code?: unknown; message?: unknown; details?: unknown } } : {};
  const error = root.error;
  const code = typeof error?.code === "string" ? error.code : undefined;
  const rawDetails = Array.isArray(error?.details) ? error.details : [];
  const details = rawDetails.flatMap((item): ApiErrorDetail[] => {
    if (typeof item === "string") return [{ message: item }];
    if (!item || typeof item !== "object") return [];
    const entry = item as { field?: unknown; message?: unknown };
    return typeof entry.message === "string" ? [{ ...(typeof entry.field === "string" ? { field: entry.field } : {}), message: entry.message }] : [];
  });
  const kind: ApiErrorKind = status === 400 ? "validation" : status === 401 ? "authentication" : status === 403 ? (/csrf/i.test(String(error?.message ?? "")) ? "csrf" : "authorization") : status >= 500 ? "server" : "request";
  const baseMessage = typeof error?.message === "string" ? error.message : status >= 500 ? "The server could not complete the request." : `Request failed (${status}).`;
  const message = status === 400 && details.length ? `${baseMessage}: ${details.map((detail) => detail.message).join("; ")}` : baseMessage;
  return new ApiError(message, status, kind, code, details);
}

export function apiGet<T>(path: string) { return apiRequest<T>(path); }
export function apiPost<T>(path: string, payload: unknown) { return apiRequest<T>(path, { method: "POST", body: JSON.stringify(payload) }); }
export function apiPatch<T>(path: string, payload: unknown) { return apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(payload) }); }
export function apiDelete<T>(path: string) { return apiRequest<T>(path, { method: "DELETE" }); }

export async function apiDownload(path: string): Promise<{ blob: Blob; filename: string }> {
  if (!API_BASE_URL) throw new ApiError("API base URL is not configured.", 0);
  const requestUrl = apiUrl(path);
  const send = () => fetch(requestUrl, { credentials: "include", cache: "no-store" });
  let response: Response;
  try { response = await send(); }
  catch { throw new ApiError("Could not reach the API. Check that the backend is running.", 0, "network"); }
  if (response.status === 401) {
    if (await refreshSession()) {
      try { response = await send(); }
      catch { throw new ApiError("Could not reach the API. Check that the backend is running.", 0, "network"); }
    }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw parseApiError(response.status, body);
  }
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename = disposition.match(/filename\s*=\s*"?([^";]+)"?/i)?.[1]?.trim() || "download.csv";
  return { blob: await response.blob(), filename };
}

export function apiQuery(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "" || (typeof value === "number" && !Number.isFinite(value))) continue;
    const normalized = String(value);
    if ((key === "page" || key === "pageSize") && !/^[1-9]\d*$/.test(normalized)) continue;
    if (key === "pageSize" && Number(normalized) > 100) continue;
    params.set(key, normalized);
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}

export async function apiGetServer<T>(path: string, cookie: string) {
  if (!API_BASE_URL) throw new ApiError("API base URL is not configured.", 0);
  let response: Response;
  const requestUrl = apiUrl(path);
  try { response = await fetch(requestUrl, { headers: { cookie }, cache: "no-store" }); }
  catch { throw new ApiError("Could not reach the API. Check that the backend is running.", 0, "network"); }
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw parseApiError(response.status, body);
  return body as ApiEnvelope<T>;
}
import { apiUrl } from "@/lib/api-url";
