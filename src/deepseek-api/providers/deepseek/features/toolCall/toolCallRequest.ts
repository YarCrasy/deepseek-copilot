import type { AppConfig, ChatMessage, ToolDefinition } from "@/adapters";
import { DEEPSEEK_DEFAULTS } from "../../deepseek-config";
import { buildChatBody, type ChatRequest } from "../chat";
import type { ToolCallCycleOptions } from "./toolCallTypes";

interface BuildToolCallRequestOptions {
  model: string;
  messages: ChatMessage[];
  tools: ToolDefinition[];
  stream: boolean;
  cycleOptions: ToolCallCycleOptions;
}

export function buildToolCallRequest(options: BuildToolCallRequestOptions): ChatRequest {
  const { model, messages, tools, stream, cycleOptions } = options;
  const baseRequest: Partial<ChatRequest> = {
    model,
    messages,
    tools,
    stream,
    ...(stream ? { stream_options: { include_usage: true } } : {}),
    ...(cycleOptions.maxTokens !== undefined ? { max_tokens: cycleOptions.maxTokens } : {}),
    ...(cycleOptions.responseFormat ? { response_format: { type: cycleOptions.responseFormat } } : {}),
    ...(cycleOptions.userId ? { user_id: cycleOptions.userId } : {}),
  };

  const config: AppConfig = {
    ...DEEPSEEK_DEFAULTS,
    model,
    thinkingMode: cycleOptions.thinkingMode ?? true,
    reasoningEffort: cycleOptions.reasoningEffort,
    maxTokens: cycleOptions.maxTokens ?? DEEPSEEK_DEFAULTS.maxTokens,
    responseFormat: cycleOptions.responseFormat ?? DEEPSEEK_DEFAULTS.responseFormat,
    userId: cycleOptions.userId,
  };

  return { ...baseRequest, ...buildChatBody(baseRequest, config) } as ChatRequest;
}
