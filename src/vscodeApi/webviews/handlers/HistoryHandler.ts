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
      case "deleteConversations":
        void this.deleteConversations(message.ids, webviewView);
        break;
      case "loadConversation":
        void this.loadConversation(message.id, webviewView);
        break;
      default:
        logWarning(`[HistoryHandler] Unknown message: ${message.type}`);
    }
  }

  private async getHistory(webviewView: vscode.WebviewView): Promise<void> {
    const conversations = await this.historyManager.getSummaries();
    webviewView.webview.postMessage({ type: "history", conversations });
  }

  private async deleteConversation(id: string, webviewView: vscode.WebviewView): Promise<void> {
    const deleted = await this.historyManager.getById(id);
    if (!deleted) {
      await this.getHistory(webviewView);
      return;
    }
    const confirmation = await vscode.window.showWarningMessage(
      `Delete conversation "${deleted.title}"?`,
      { modal: true, detail: "You can undo the deletion immediately afterwards." },
      "Delete",
    );
    if (confirmation !== "Delete") {
      return;
    }
    await this.historyManager.delete(id);
    this.onConversationDeleted?.(id);
    webviewView.webview.postMessage({ type: "conversationDeleted", id });
    await this.getHistory(webviewView);
    if ((await vscode.window.showInformationMessage("Conversation deleted.", "Undo")) === "Undo") {
      await this.historyManager.save(deleted);
      await this.getHistory(webviewView);
    }
  }

  private async deleteConversations(ids: string[], webviewView: vscode.WebviewView): Promise<void> {
    const deleted = (await Promise.all(ids.map((id) => this.historyManager.getById(id)))).filter(
      (item): item is Conversation => item !== undefined,
    );
    if (deleted.length === 0) {
      await this.getHistory(webviewView);
      return;
    }
    const confirmation = await vscode.window.showWarningMessage(
      `Delete ${deleted.length} conversation(s)?`,
      { modal: true, detail: "You can undo the deletion immediately afterwards." },
      "Delete all",
    );
    if (confirmation !== "Delete all") {
      return;
    }
    await this.historyManager.deleteMany(ids);
    ids.forEach((id) => {
      this.onConversationDeleted?.(id);
      void webviewView.webview.postMessage({ type: "conversationDeleted", id });
    });
    await this.getHistory(webviewView);
    if (deleted.length > 0 && (await vscode.window.showInformationMessage(`${deleted.length} conversation(s) deleted.`, "Undo")) === "Undo") {
      await Promise.all(deleted.map((conversation) => this.historyManager.save(conversation)));
      await this.getHistory(webviewView);
    }
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
