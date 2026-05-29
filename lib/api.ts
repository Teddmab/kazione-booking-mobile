import * as Sentry from "@sentry/react-native";

import { getSupabase } from "@/lib/supabase";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
const REQUEST_TIMEOUT_MS = 15_000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Same hydration race guard as the web `api` client — session may not be readable immediately after sign-in. */
async function getAccessToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await getSupabase().auth.getSession();
    if (session?.access_token) return session.access_token;
    await wait(200);
    const {
      data: { session: retry },
    } = await getSupabase().auth.getSession();
    return retry?.access_token ?? null;
  } catch {
    return null;
  }
}

const PUBLIC_ENDPOINTS = [
  "/auth-register",
  "/marketplace-storefronts",
  "/get-storefront",
  "/get-availability",
  "/create-booking",
];

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(
      "MISCONFIGURATION",
      "EXPO_PUBLIC_API_BASE_URL is not set. Add it to your .env file.",
      0,
    );
  }

  const token = await getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const isPublicEndpoint = PUBLIC_ENDPOINTS.some(
    (endpoint) => path === endpoint || path.startsWith(`${endpoint}?`),
  );

  if (SUPABASE_ANON_KEY) {
    headers.apikey = SUPABASE_ANON_KEY;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (isPublicEndpoint && SUPABASE_ANON_KEY) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  const requestUrl = `${BASE_URL}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (networkErr) {
    const timedOut =
      networkErr instanceof Error &&
      (networkErr.name === "AbortError" || networkErr.message.includes("aborted"));
    throw new ApiError(
      "NETWORK_ERROR",
      timedOut
        ? "Request timed out. Check that Supabase and Edge Functions are running."
        : "Unable to reach the server. Check your connection.",
      0,
      networkErr,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  if (response.status === 502 || response.status === 503) {
    throw new ApiError(
      "NETWORK_ERROR",
      "Edge Functions indisponibles. Lancez `npm run dev` dans kazione-booking-backend.",
      response.status,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(
      "INVALID_RESPONSE",
      `Server returned a non-JSON response (${response.status})`,
      response.status,
    );
  }

  if (!response.ok) {
    const err = (json as { error?: { code?: string; message?: string; details?: unknown } })?.error;
    const code = err?.code ?? "UNKNOWN_ERROR";
    const message = err?.message ?? "An unexpected error occurred";
    const apiError = new ApiError(code, message, response.status, err?.details);
    if (response.status >= 500) {
      Sentry.captureException(apiError);
    }
    throw apiError;
  }

  const payload = json as Record<string, unknown>;
  return (payload.data !== undefined ? payload.data : json) as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
