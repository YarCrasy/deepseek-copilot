import * as vscode from "vscode";
import type { Conversation, WebviewToHandlerMessage } from "@/adapters";
import { HistoryManager } from "@/vscodeApi/storage";
import { logWarning } from "@/shared/logging/Logger";

export class HistoryHandler {
  constructor(
    private readonly historyManager: HistoryManager,
    private readonly onConversationLoaded?: (conversation: Conversation) => void,
    private readonly onConversationDeleted?: (id: string) => void,
  ) {}

  handle(message: WebviewToHandlerMessage, webviewView: vscode.WebviewView): void {
    switch (message.type) {
      case "getHistory":
        void this.getHistory(webviewView);
        break;
      case "deleteConversation":
        void this.deleteConversation(message.id, webviewView);
        break;
      case "loadConversation":
        void this.loadConversation(message.id, webviewView);
        break;
      default:
        logWarning(`[HistoryHandler] Unknown message: ${message.type}`);
    }
  }

  private async getHistory(webviewView: vscode.WebviewView): Promise<void> {
    const conversations = await this.historyManager.getAll();
    webviewView.webview.postMessage({ type: "history", conversations });
  }

  private async deleteConversation(id: string, webviewView: vscode.WebviewView): Promise<void> {
    await this.historyManager.delete(id);
    this.onConversationDeleted?.(id);
    webviewView.webview.postMessage({ type: "conversationDeleted", id });
    await this.getHistory(webviewView);
  }

  private async loadConversation(id: string, webviewView: vscode.WebviewView): Promise<void> {
    const conversation = await this.historyManager.getById(id);
    if (!conversation) {
      return;
    }

    this.onConversationLoaded?.(conversation);
    webviewView.webview.postMessage({ type: "conversationLoaded", conversation });
  }
}
