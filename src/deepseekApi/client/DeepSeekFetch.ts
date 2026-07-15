import { DeepSeekApiError } from "@/deepseekApi/errors/DeepSeekApiError";
import { buildDeepSeekAuthHeaders } from "@/deepseekApi/auth/AuthHeaders";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const FETCH_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 3;

interface DeepSeekFetchOptions {
  pathOrUrl: string;
  apiKey: string;
  baseUrl?: string;
  requestInit?: RequestInit;
}

export async function deepseekFetch(options: DeepSeekFetchOptions): Promise<Response> {
  const { pathOrUrl, apiKey, baseUrl = DEEPSEEK_BASE_URL, requestInit = {} } = options;
  const url = buildApiUrl(baseUrl, pathOrUrl);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
    const signal = requestInit.signal ? AbortSignal.any([requestInit.signal, timeoutSignal]) : timeoutSignal;
    try {
      const response = await fetch(url, {
        ...requestInit,
        signal,
        headers: buildDeepSeekAuthHeaders(apiKey, requestInit.headers || {}),
      });
      if (response.ok) {return response;}

      if (attempt < MAX_ATTEMPTS && isRetryableStatus(response.status)) {
        const delay = getRetryDelayMs(response.headers.get("retry-after"), attempt);
        await response.body?.cancel();
        await wait(delay, requestInit.signal);
        continue;
      }
      throw await createApiError(response);
    } catch (error) {
      if (requestInit.signal?.aborted || isDeepSeekApiError(error) || attempt === MAX_ATTEMPTS) {throw error;}
      await wait(getRetryDelayMs(null, attempt), requestInit.signal);
    }
  }
  throw new Error("DeepSeek request failed after retries");
}

export function buildApiUrl(baseUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {return new URL(pathOrUrl).toString();}
  const base = new URL(baseUrl);
  const basePath = base.pathname.replace(/\/+$/, "");
  base.pathname = `${basePath}/${pathOrUrl.replace(/^\/+/, "")}`;
  return base.toString();
}

async function createApiError(response: Response): Promise<DeepSeekApiError> {
  let errorMessage = `HTTP ${response.status}`;
  try {
    const errorBody = await response.json() as { error?: { message?: string }; message?: string };
    errorMessage = errorBody.error?.message || errorBody.message || errorMessage;
  } catch {
    errorMessage = response.statusText || errorMessage;
  }
  return new DeepSeekApiError(response.status, errorMessage, String(response.status));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 408 || status >= 500;
}

function getRetryDelayMs(retryAfter: string | null, attempt: number): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {return Math.min(30_000, Math.max(0, seconds * 1_000));}
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) {return Math.min(30_000, Math.max(0, dateDelay));}
  }
  return Math.min(4_000, 500 * 2 ** (attempt - 1));
}

function wait(delayMs: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {return reject(signal.reason ?? new DOMException("Aborted", "AbortError"));}
    const onAbort = () => {
      clearTimeout(timeout);
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function isDeepSeekApiError(error: unknown): error is DeepSeekApiError {
  return error instanceof DeepSeekApiError;
}
