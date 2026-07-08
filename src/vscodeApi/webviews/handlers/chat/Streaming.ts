import * as vscode from "vscode";
import type { AppConfig, ChatCompletionRequest, ChatMessage, StreamChunk } from "@/adapters";
import type { BaseProvider } from "@/deepseekApi/BaseProvider";
import { createSystemMessage, mapReasoningEffort } from "@/adapters/deepseek/Chat";
import { PartialStreamError, type StreamedAssistantResult } from "@/core/errors/PartialStreamError";
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

  const result: StreamedAssistantResult = { content: "", reasoning: "" };

  try {
    await provider.chatCompletionStream(
      request,
      (chunk: StreamChunk) => {
        if (chunk.type === "content") {
          result.content += chunk.content ?? "";
        } else if (chunk.type === "reasoning") {
          result.reasoning += chunk.reasoning_content ?? "";
        }
        postStreamChunk(webviewView, chunk);
      },
      signal,
    );
  } catch (err: unknown) {
    if (isCancellationError(err) && (result.content || result.reasoning)) {
      throw new PartialStreamError("Stream cancelled with partial content", result);
    }
    throw err;
  }

  return result;
}

function postStreamChunk(webviewView: vscode.WebviewView, chunk: StreamChunk): void {
  switch (chunk.type) {
    case "content":
      webviewView.webview.postMessage({ type: "streamChunk", content: chunk.content ?? "" });
      break;
    case "reasoning":
      webviewView.webview.postMessage({
        type: "streamReasoning",
        content: chunk.reasoning_content ?? "",
      });
      break;
    case "done":
      webviewView.webview.postMessage({
        type: "streamDone",
        finish_reason: chunk.finish_reason,
        usage: chunk.usage,
      });
      break;
    case "error":
      webviewView.webview.postMessage({
        type: "streamError",
        error: chunk.error ?? "Unknown stream error",
      });
      break;
    case "tool_call":
      break;
  }
}

function isCancellationError(err: unknown): boolean {
  return err instanceof Error && (err.name === "AbortError" || err.name === "Canceled");
}
