import * as vscode from "vscode";
import type { Conversation } from "@/adapters";

const STORAGE_KEY = "deepseek-copilot.conversations";

export class HistoryManager {
  constructor(private context: vscode.ExtensionContext) {}

  async getAll(): Promise<Conversation[]> {
    const stored = this.context.globalState.get<Conversation[]>(STORAGE_KEY) || [];
    return stored.map(normalizeConversation).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async save(conversation: Conversation): Promise<void> {
    const list = await this.getAll();
    const idx = list.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      list[idx] = conversation;
    } else {
      list.push(conversation);
    }
    await this.context.globalState.update(STORAGE_KEY, list);
  }

  async delete(id: string): Promise<void> {
    const list = await this.getAll();
    await this.context.globalState.update(
      STORAGE_KEY,
      list.filter((c) => c.id !== id),
    );
  }

  async getById(id: string): Promise<Conversation | undefined> {
    const list = await this.getAll();
    return list.find((conversation) => conversation.id === id);
  }
}

function normalizeConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    messages: (conversation.messages ?? []).map((message) => ({
      ...message,
      content: message.content ?? "",
      toolCalls: message.toolCalls ?? undefined,
      reasoning: message.reasoning ?? undefined,
    })),
  };
}
