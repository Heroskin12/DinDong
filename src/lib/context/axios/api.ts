// Creates the axios instance
import { config } from "site/lib/config";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  GenericAbortSignal,
  InternalAxiosRequestConfig,
} from "axios";

const api: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 5000,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
};

type RateLimitState = {
  until: number;
  timer: ReturnType<typeof setTimeout> | null;
  waiters: Array<() => void>;
};

const MAX_RETRIES = 2;
const IDEMPOTENT_METHODS = new Set(["get", "head", "options", "put", "delete"]);

function canRetryRequest(
  config?: RetryableRequestConfig,
): config is RetryableRequestConfig {
  if (!config) return false;
  const method = config.method?.toLowerCase() ?? "get";
  const retryCount = config._retryCount ?? 0;
  return IDEMPOTENT_METHODS.has(method) && retryCount < MAX_RETRIES;
}

function retry(config: RetryableRequestConfig) {
  config._retryCount = (config._retryCount ?? 0) + 1;
  return api(config);
}

const rateLimitStates = new Map<string, RateLimitState>();

function rateLimitKey(config: RetryableRequestConfig): string {
  try {
    return new URL(config.url ?? "", config.baseURL).origin;
  } catch {
    return config.baseURL ?? "";
  }
}

function waitForRateLimit(
  key: string,
  delayMs: number,
  signal?: GenericAbortSignal,
): Promise<void> {
  const state = rateLimitStates.get(key) ?? {
    until: 0,
    timer: null,
    waiters: [],
  };
  rateLimitStates.set(key, state);

  state.until = Math.max(state.until, Date.now() + delayMs);

  if (state.timer) clearTimeout(state.timer);
  state.timer = setTimeout(() => {
    rateLimitStates.delete(key);
    const waiters = state.waiters.splice(0);
    waiters.forEach((resolve) => resolve());
  }, state.until - Date.now());

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new axios.CanceledError());
      return;
    }

    const onTimer = () => {
      signal?.removeEventListener?.("abort", onAbort);
      resolve();
    };

    const onAbort = () => {
      const idx = state.waiters.indexOf(onTimer);
      if (idx !== -1) state.waiters.splice(idx, 1);
      reject(new axios.CanceledError());
    };

    state.waiters.push(onTimer);
    signal?.addEventListener?.("abort", onAbort, { once: true });
  });
}

function withJitter(ms: number, ratio = 0.2): number {
  return ms + (Math.random() * 2 - 1) * ms * ratio;
}

const SERVER_ERROR_RETRY_DELAY_MS = 1000;

const MAX_RETRY_DELAY_MS = 60_000;

function parseRetryAfterMs(headerValue: unknown, fallbackMs = 1000): number {
  if (typeof headerValue !== "string") return fallbackMs;

  const seconds = Number(headerValue);
  if (Number.isFinite(seconds)) {
    return Math.min(Math.max(seconds, 0) * 1000, MAX_RETRY_DELAY_MS);
  }

  const dateMs = Date.parse(headerValue);
  if (!Number.isNaN(dateMs)) {
    return Math.min(Math.max(dateMs - Date.now(), 0), MAX_RETRY_DELAY_MS);
  }

  return fallbackMs;
}

const EMAIL_SEGMENT_PATTERN = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;
const JWT_SEGMENT_PATTERN = /^[\w-]+\.[\w-]+\.[\w-]+$/;
const OPAQUE_TOKEN_PATTERN = /^[\w-]{20,}$/;

function isSensitiveSegment(segment: string): boolean {
  return (
    EMAIL_SEGMENT_PATTERN.test(segment) ||
    JWT_SEGMENT_PATTERN.test(segment) ||
    OPAQUE_TOKEN_PATTERN.test(segment)
  );
}

function redactUrl(url?: string): string | undefined {
  if (!url) return url;
  const [path] = url.split("?");
  return path
    .split("/")
    .map((segment) => (isSensitiveSegment(segment) ? "[REDACTED]" : segment))
    .join("/");
}

function logError(label: string, error: AxiosError) {
  console.error(label, {
    status: error.response?.status,
    method: error.config?.method,
    url: redactUrl(error.config?.url),
    message: error.message,
  });
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    const region = localStorage.getItem("region");

    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (region) config.headers["X-Region"] = region;

    return config;
  },
  (error: unknown) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (axios.isCancel(error)) {
      throw error;
    }

    if (!error.response) {
      console.error("Network error:", error.code, error.message);
      throw error;
    }

    switch (error.response.status) {
      case 401: {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("auth:logout"));
        break;
      }
      case 403: {
        logError("Forbidden", error);
        break;
      }

      case 409: {
        logError(
          "This resource has been changed. Please reload and try again.",
          error,
        );
        break;
      }

      case 429: {
        const originalRequest = error.config as
          | RetryableRequestConfig
          | undefined;

        if (!canRetryRequest(originalRequest)) {
          logError("Too many requests:", error);
          break;
        }

        const delayMs = parseRetryAfterMs(
          error.response.headers["retry-after"],
        );
        await waitForRateLimit(
          rateLimitKey(originalRequest),
          withJitter(delayMs),
          originalRequest.signal,
        );
        return retry(originalRequest);
      }

      default: {
        if (error.response.status >= 500) {
          const originalRequest = error.config as
            | RetryableRequestConfig
            | undefined;

          if (!canRetryRequest(originalRequest)) {
            logError("Server error:", error);
            break;
          }

          await waitForRateLimit(
            rateLimitKey(originalRequest),
            withJitter(SERVER_ERROR_RETRY_DELAY_MS),
            originalRequest.signal,
          );
          return retry(originalRequest);
        }
        break;
      }
    }
    throw error;
  },
);

export default api;
