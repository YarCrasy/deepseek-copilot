// ── Cliente HTTP reutilizable para DeepSeek API ──

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

// ── Error personalizado ──
export class DeepSeekApiError extends Error {
  public status: number;
  public code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "DeepSeekApiError";
    this.status = status;
    this.code = code;
  }
}

// ── Fetch con autenticación y manejo de errores ──
interface DeepSeekFetchOptions {
  pathOrUrl: string;
  apiKey: string;
  baseUrl?: string;
  requestInit?: RequestInit;
}

export async function deepseekFetch(options: DeepSeekFetchOptions): Promise<Response> {
  const { pathOrUrl, apiKey, baseUrl = DEEPSEEK_BASE_URL, requestInit = {} } = options;

  // Si ya es una URL completa, usarla directamente
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${baseUrl.replace(/\/$/, "")}${pathOrUrl}`;

  const response = await fetch(url, {
    ...requestInit,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(requestInit.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error?.message || errorBody.message || errorMessage;
    } catch {
      // Si no se puede parsear el body, usar el status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new DeepSeekApiError(response.status, errorMessage, String(response.status));
  }

  return response;
}

// ── Lee un stream SSE (Server-Sent Events) y emite chunks ──
interface ReadSSEStreamOptions {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  onChunk: (data: unknown) => void;
  onDone: () => void;
  signal?: AbortSignal;
}

export async function readSSEStream(options: ReadSSEStreamOptions): Promise<void> {
  const { reader, onChunk, onDone, signal } = options;
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      onDone();
      break;
    }
    if (signal?.aborted) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const data = trimmed.slice(6).trim();
        if (data === "[DONE]") {
          onDone();
          return;
        }
        try {
          onChunk(JSON.parse(data));
        } catch {
          // Ignorar chunks malformados
        }
      }
    }
  }
}

// ── Builders de URLs ──
export function buildChatUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/chat/completions`;
}

export function buildModelsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/models`;
}

export function buildFimUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/completions`;
}

export function buildBalanceUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/user/balance`;
}

// ── Delay utility ──
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
