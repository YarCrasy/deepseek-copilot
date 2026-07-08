import { DeepSeekApiError } from "@/deepseek-api/errors/DeepSeekApiError";
import { buildDeepSeekAuthHeaders } from "@/deepseek-api/auth/authHeaders";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

interface DeepSeekFetchOptions {
  pathOrUrl: string;
  apiKey: string;
  baseUrl?: string;
  requestInit?: RequestInit;
}

export async function deepseekFetch(options: DeepSeekFetchOptions): Promise<Response> {
  const { pathOrUrl, apiKey, baseUrl = DEEPSEEK_BASE_URL, requestInit = {} } = options;
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${baseUrl.replace(/\/$/, "")}${pathOrUrl}`;

  const response = await fetch(url, {
    ...requestInit,
    headers: buildDeepSeekAuthHeaders(apiKey, requestInit.headers || {}),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error?.message || errorBody.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new DeepSeekApiError(response.status, errorMessage, String(response.status));
  }

  return response;
}
