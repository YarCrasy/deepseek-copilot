export function buildDeepSeekAuthHeaders(apiKey: string, extraHeaders: HeadersInit = {}): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    ...extraHeaders,
  };
}
