import type * as vscode from "vscode";
import type { ChatUsage, StreamChunk } from "@/adapters";

export interface StreamDonePayload {
  cancelled?: boolean;
  finish_reason?: string;
  usage?: ChatUsage;
}

export class StreamEventEmitter {
  constructor(private readonly webviewView: vscode.WebviewView) {}

  showTyping(): void {
    this.webviewView.webview.postMessage({ type: "showTyping" });
  }

  chunk(content: string): void {
    if (content) {
      this.webviewView.webview.postMessage({ type: "streamChunk", content });
    }
  }

  reasoning(content: string): void {
    if (content) {
      this.webviewView.webview.postMessage({ type: "streamReasoning", content });
    }
  }

  done(payload: StreamDonePayload = {}): void {
    this.webviewView.webview.postMessage({
      type: "streamDone",
      ...payload,
    });
  }

  error(error: string): void {
    this.webviewView.webview.postMessage({
      type: "streamError",
      error,
    });
  }

  fromChunk(chunk: StreamChunk): void {
    switch (chunk.type) {
      case "content":
        this.chunk(chunk.content ?? "");
        break;
      case "reasoning":
        this.reasoning(chunk.reasoning_content ?? "");
        break;
      case "done":
        this.done({
          finish_reason: chunk.finish_reason,
          usage: chunk.usage,
        });
        break;
      case "error":
        this.error(chunk.error ?? "Unknown stream error");
        break;
      case "tool_call":
        break;
    }
  }
}
