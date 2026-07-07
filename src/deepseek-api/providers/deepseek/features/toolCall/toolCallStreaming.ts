import type { ChatMessage, ChatUsage, StreamChunk, ToolCall, ToolDefinition } from "@/adapters";
import { chatCompletionStream, type ChatResponse } from "../chat";
import { buildToolCallRequest } from "./toolCallRequest";
import type { ToolCallCycleOptions } from "./toolCallTypes";

interface StreamToolCallRoundOptions {
  messages: ChatMessage[];
  tools: ToolDefinition[];
  model: string;
  apiKey: string;
  baseUrl: string;
  cycleOptions: ToolCallCycleOptions;
  emitStreamEvents?: boolean;
}

export async function streamToolCallRound(options: StreamToolCallRoundOptions): Promise<ChatResponse> {
  const { messages, tools, model, apiKey, baseUrl, cycleOptions, emitStreamEvents = true } = options;
  const streamRequest = buildToolCallRequest({
    model,
    messages,
    tools,
    stream: true,
    cycleOptions,
  });

  let finalContent = "";
  let finalReasoning = "";
  let hasToolCallsInStream = false;
  const streamingToolCalls = new Map<number, ToolCall>();
  let usage: ChatUsage | undefined;
  let finishReason = "stop";

  await chatCompletionStream({
    request: streamRequest,
    apiKey,
    baseUrl,
    onChunk: (chunk) => {
      const state = { finalContent, finalReasoning, hasToolCallsInStream, streamingToolCalls, usage, finishReason };
      const nextState = applyStreamChunk({ chunk, state, cycleOptions, emitStreamEvents });
      finalContent = nextState.finalContent;
      finalReasoning = nextState.finalReasoning;
      hasToolCallsInStream = nextState.hasToolCallsInStream;
      usage = nextState.usage;
      finishReason = nextState.finishReason;
    },
    signal: cycleOptions.signal,
  });

  const message: ChatMessage = {
    role: "assistant",
    content: finalContent || null,
    reasoning_content: finalReasoning || null,
    ...(hasToolCallsInStream ? { tool_calls: sortedToolCalls(streamingToolCalls) } : {}),
  };

  return {
    id: "",
    object: "chat.completion",
    created: Date.now(),
    model,
    choices: [
      {
        index: 0,
        message,
        finish_reason: hasToolCallsInStream
          ? "tool_calls"
          : (finishReason as "stop" | "length" | "tool_calls" | "content_filter" | "insufficient_system_resource" | null),
      },
    ],
    usage,
  };
}

interface StreamState {
  finalContent: string;
  finalReasoning: string;
  hasToolCallsInStream: boolean;
  streamingToolCalls: Map<number, ToolCall>;
  usage: ChatUsage | undefined;
  finishReason: string;
}

function applyStreamChunk(options: { chunk: StreamChunk; state: StreamState; cycleOptions: ToolCallCycleOptions; emitStreamEvents: boolean }): StreamState {
  const { chunk, state, cycleOptions, emitStreamEvents } = options;

  switch (chunk.type) {
    case "content":
      if (emitStreamEvents) {
        cycleOptions.onStreamChunk?.(chunk.content ?? "");
      }
      return { ...state, finalContent: state.finalContent + (chunk.content ?? "") };
    case "reasoning":
      if (emitStreamEvents) {
        cycleOptions.onStreamReasoning?.(chunk.reasoning_content ?? "");
      }
      return { ...state, finalReasoning: state.finalReasoning + (chunk.reasoning_content ?? "") };
    case "tool_call":
      mergeStreamingToolCalls(state.streamingToolCalls, chunk.tool_calls);
      return { ...state, hasToolCallsInStream: true };
    case "done":
      return {
        ...state,
        usage: chunk.usage ?? state.usage,
        finishReason: chunk.finish_reason ?? state.finishReason,
      };
    case "error":
      throw new Error(chunk.error ?? "Stream error during final response");
  }
}

function mergeStreamingToolCalls(streamingToolCalls: Map<number, ToolCall>, partialToolCalls: ToolCall[] | undefined): void {
  if (!partialToolCalls) {
    return;
  }

  for (const partialTc of partialToolCalls) {
    const idx = partialTc.index ?? 0;
    const existing = streamingToolCalls.get(idx);
    if (!existing) {
      streamingToolCalls.set(idx, {
        id: partialTc.id ?? `stream-tc-${idx}-${Date.now()}`,
        type: "function",
        function: {
          name: partialTc.function?.name ?? "",
          arguments: partialTc.function?.arguments ?? "",
        },
        index: idx,
      });
      continue;
    }

    if (partialTc.id) {
      existing.id = partialTc.id;
    }
    if (partialTc.function?.name) {
      existing.function.name = partialTc.function.name;
    }
    if (partialTc.function?.arguments) {
      existing.function.arguments += partialTc.function.arguments;
    }
  }
}

function sortedToolCalls(streamingToolCalls: Map<number, ToolCall>): ToolCall[] {
  return Array.from(streamingToolCalls.entries())
    .sort(([a], [b]) => a - b)
    .map(([, toolCall]) => toolCall);
}
