import * as vscode from "vscode";
import type { AppConfig, ChatCompletionRequest, ChatMessage, StreamChunk } from "@/adapters";
import type { BaseProvider } from "@/deepseekApi/BaseProvider";
import { createSystemMessage, mapReasoningEffort } from "@/adapters/deepseek/Chat";
import { PartialStreamError, type StreamedAssistantResult } from "@/core/errors/PartialStreamError";
import { StreamEventEmitter } from "./StreamEventEmitter";
import type { SendMessagePayload } from "./Types";

interface SendMessageStreamingOptions {
  messages: ChatMessage[];
  payload: SendMessagePayload;
  config: AppConfig;
  provider: BaseProvider;
  webviewView: vscode.WebviewView;
  signal: AbortSignal;
}

export async function sendMessageStreaming({ messages, payload, config, provider, webviewView, signal }: SendMessageStreamingOptions): Promise<StreamedAssistantResult> {
  const hasSystemPrompt = messages.length > 0 && messages[0].role === "system";
  const request: ChatCompletionRequest = {
    model: payload.modelId || config.model,
    messages: hasSystemPrompt ? messages : [createSystemMessage(), ...messages],
    stream: true,
    thinking: payload.reasoning !== "off" ? { type: "enabled" } : { type: "disabled" },
    reasoning_effort: mapReasoningEffort(payload.reasoning),
  };

  const result: StreamedAssistantResult = { content: "", reasoning: "", timeline: [] };
  const stream = new StreamEventEmitter(webviewView);

  try {
    await provider.chatCompletionStream(
      request,
      (chunk: StreamChunk) => {
        if (chunk.type === "content") {
          result.content += chunk.content ?? "";
        } else if (chunk.type === "reasoning") {
          result.reasoning += chunk.reasoning_content ?? "";
        }
        stream.fromChunk(chunk);
      },
      signal,
    );
  } catch (err: unknown) {
    result.timeline = stream.getTimeline();
    if (isCancellationError(err) && (result.content || result.reasoning)) {
      throw new PartialStreamError("Stream cancelled with partial content", result);
    }
    throw err;
  }

  result.timeline = stream.getTimeline();
  return result;
}

function isCancellationError(err: unknown): boolean {
  return err instanceof Error && (err.name === "AbortError" || err.name === "Canceled");
}
