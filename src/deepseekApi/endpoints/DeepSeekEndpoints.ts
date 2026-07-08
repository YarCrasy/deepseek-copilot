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
