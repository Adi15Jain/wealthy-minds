/**
 * Base API client — type-safe HTTP abstraction layer.
 * Handles request/response typing, error handling, retries, and auth.
 */
import type { ApiResponse, ApiError } from "@/types";

// ── Configuration ────────────────────────────────────────────
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
const DEFAULT_TIMEOUT = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// ── Custom Error Class ───────────────────────────────────────
export class ApiClientError extends Error {
    public readonly code: string;
    public readonly status: number;
    public readonly details?: Record<string, string>;

    constructor(error: ApiError, status: number) {
        super(error.message);
        this.name = "ApiClientError";
        this.code = error.code;
        this.status = status;
        this.details = error.details;
    }
}

// ── Request Options ──────────────────────────────────────────
interface RequestOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
    timeout?: number;
    retries?: number;
    params?: Record<string, string | number | boolean | undefined>;
}

// ── Build URL with query params ──────────────────────────────
function buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
): string {
    const url = new URL(path, API_BASE_URL);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.set(key, String(value));
            }
        });
    }
    return url.toString();
}

// ── Get auth token ───────────────────────────────────────────
function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
        const stored = localStorage.getItem("wm-auth");
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed?.state?.token ?? null;
        }
    } catch {
        // ignore
    }
    return null;
}

// ── Sleep for retry delay ────────────────────────────────────
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Core request function ────────────────────────────────────
async function request<T>(
    method: string,
    path: string,
    options: RequestOptions = {},
): Promise<ApiResponse<T>> {
    const {
        body,
        timeout = DEFAULT_TIMEOUT,
        retries = 0,
        params,
        headers: customHeaders,
        ...fetchOptions
    } = options;

    const url = buildUrl(path, params);
    const token = getAuthToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(customHeaders as Record<string, string>),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
                ...fetchOptions,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = (await response.json().catch(() => ({
                    code: "UNKNOWN",
                    message: response.statusText,
                }))) as ApiError;

                throw new ApiClientError(errorData, response.status);
            }

            return (await response.json()) as ApiResponse<T>;
        } catch (error) {
            lastError = error as Error;

            if (error instanceof ApiClientError && error.status < 500) {
                throw error; // Don't retry client errors
            }

            if (attempt < retries) {
                await sleep(RETRY_DELAY * Math.pow(2, attempt));
            }
        }
    }

    clearTimeout(timeoutId);
    throw lastError ?? new Error("Request failed");
}

// ── Public API methods ───────────────────────────────────────
export const apiClient = {
    get: <T>(path: string, options?: RequestOptions) =>
        request<T>("GET", path, {
            ...options,
            retries: options?.retries ?? MAX_RETRIES,
        }),

    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>("POST", path, { ...options, body }),

    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>("PUT", path, { ...options, body }),

    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>("PATCH", path, { ...options, body }),

    delete: <T>(path: string, options?: RequestOptions) =>
        request<T>("DELETE", path, options),
};
