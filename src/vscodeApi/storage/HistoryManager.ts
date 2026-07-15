import * as vscode from "vscode";
import type { Conversation, ConversationSummary } from "@/adapters";
import { createConversationTitle } from "@/core/chat/ConversationTitle";
import { isConversation } from "@/core/chat/ConversationValidation";
import { CONVERSATION_STORAGE_KEY } from "@/shared/constants";
import { CONFIG_SECTION } from "@/shared/constants";

const SCHEMA_VERSION = 1;
const MAX_CONVERSATIONS = 100;
const MAX_TOTAL_BYTES = 24 * 1024 * 1024;
const INDEX_KEY = `${CONVERSATION_STORAGE_KEY}.index`;
const BODY_PREFIX = `${CONVERSATION_STORAGE_KEY}.body.`;
const CORRUPT_PREFIX = `${CONVERSATION_STORAGE_KEY}.corrupt.`;

interface HistoryIndex { schemaVersion: 1; entries: ConversationSummary[] }
interface ConversationEnvelope { schemaVersion: 1; conversation: Conversation }

export class HistoryManager {
  constructor(private readonly context: vscode.ExtensionContext) {}

  getWorkspaceUri(): string {
    const activeUri = vscode.window.activeTextEditor?.document.uri;
    return ((activeUri ? vscode.workspace.getWorkspaceFolder(activeUri)?.uri : undefined) ?? vscode.workspace.workspaceFolders?.[0]?.uri)?.toString() ?? "workspace:unknown";
  }

  async getSummaries(): Promise<ConversationSummary[]> {
    if (!isHistoryEnabled()) {return [];}
    const entries = this.readIndex().entries;
    const retentionDays = getRetentionDays();
    const threshold = retentionDays === 0 ? 0 : Date.now() - retentionDays * 86_400_000;
    const expired = threshold === 0 ? [] : entries.filter((entry) => entry.updatedAt < threshold);
    if (expired.length > 0) {await this.deleteMany(expired.map((entry) => entry.id));}
    return entries.filter((entry) => threshold === 0 || entry.updatedAt >= threshold).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getAll(): Promise<Conversation[]> {
    const conversations = await Promise.all((await this.getSummaries()).map((item) => this.getById(item.id)));
    return conversations.filter((item): item is Conversation => item !== undefined);
  }

  async save(conversation: Conversation): Promise<void> {
    if (!isHistoryEnabled()) {return;}
    const normalized = normalizeConversation(conversation);
    const serialized = JSON.stringify(normalized);
    const summary = toSummary(normalized, Buffer.byteLength(serialized, "utf8"));
    await this.context.workspaceState.update(bodyKey(conversation.id), { schemaVersion: SCHEMA_VERSION, conversation: normalized } satisfies ConversationEnvelope);

    const entries = this.readIndex().entries.filter((item) => item.id !== conversation.id);
    entries.push(summary);
    entries.sort((a, b) => b.updatedAt - a.updatedAt);
    const removed: ConversationSummary[] = [];
    let totalBytes = entries.reduce((sum, item) => sum + item.sizeBytes, 0);
    while (entries.length > MAX_CONVERSATIONS || totalBytes > MAX_TOTAL_BYTES) {
      const item = entries.pop();
      if (!item) {break;}
      removed.push(item);
      totalBytes -= item.sizeBytes;
    }
    if (removed.length > 0) {
      void vscode.window.showWarningMessage(`History limit reached. ${removed.length} oldest conversation(s) were removed.`);
    }
    await Promise.all(removed.map((item) => this.context.workspaceState.update(bodyKey(item.id), undefined)));
    await this.writeIndex(entries);
  }

  async delete(id: string): Promise<void> {
    await this.deleteMany([id]);
  }

  async deleteMany(ids: string[]): Promise<void> {
    const uniqueIds = new Set(ids);
    await Promise.all([...uniqueIds].map((id) => this.context.workspaceState.update(bodyKey(id), undefined)));
    await this.writeIndex(this.readIndex().entries.filter((item) => !uniqueIds.has(item.id)));
  }

  async getById(id: string): Promise<Conversation | undefined> {
    const stored = this.context.workspaceState.get<unknown>(bodyKey(id));
    if (isEnvelope(stored)) {return normalizeConversation(stored.conversation);}
    if (stored !== undefined) {
      await this.context.workspaceState.update(`${CORRUPT_PREFIX}${id}.${Date.now()}`, stored);
      await this.delete(id);
      void this.offerCorruptExport(id, stored);
    }
    return undefined;
  }

  private async offerCorruptExport(id: string, stored: unknown): Promise<void> {
    const action = await vscode.window.showWarningMessage(`Conversation ${id} is corrupt and was isolated.`, "Export raw data");
    if (action !== "Export raw data") {
      return;
    }
    const target = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(`conversation-${id}-corrupt.json`),
      filters: { JSON: ["json"] },
    });
    if (target) {
      await vscode.workspace.fs.writeFile(target, Buffer.from(JSON.stringify(stored, null, 2), "utf8"));
    }
  }

  private readIndex(): HistoryIndex {
    const stored = this.context.workspaceState.get<unknown>(INDEX_KEY);
    return isHistoryIndex(stored) ? stored : { schemaVersion: SCHEMA_VERSION, entries: [] };
  }

  private async writeIndex(entries: ConversationSummary[]): Promise<void> {
    await this.context.workspaceState.update(INDEX_KEY, { schemaVersion: SCHEMA_VERSION, entries } satisfies HistoryIndex);
  }
}

function isHistoryEnabled(): boolean { return vscode.workspace.getConfiguration(CONFIG_SECTION).get<boolean>("historyEnabled", true); }
function getRetentionDays(): number { return vscode.workspace.getConfiguration(CONFIG_SECTION).get<number>("historyRetentionDays", 30); }

function bodyKey(id: string): string { return `${BODY_PREFIX}${id}`; }
function toSummary(conversation: Conversation, sizeBytes: number): ConversationSummary {
  return { id: conversation.id, title: conversation.title, createdAt: conversation.createdAt, updatedAt: conversation.updatedAt, model: conversation.model, messageCount: conversation.messages.length, sizeBytes, workspaceUri: conversation.workspaceUri };
}
function isEnvelope(value: unknown): value is ConversationEnvelope {
  return !!value && typeof value === "object" && (value as ConversationEnvelope).schemaVersion === SCHEMA_VERSION && isConversation((value as ConversationEnvelope).conversation);
}
function isHistoryIndex(value: unknown): value is HistoryIndex {
  return !!value && typeof value === "object" && (value as HistoryIndex).schemaVersion === SCHEMA_VERSION && Array.isArray((value as HistoryIndex).entries) && (value as HistoryIndex).entries.every(isSummary);
}
function isSummary(value: unknown): value is ConversationSummary {
  if (!value || typeof value !== "object") {return false;}
  const item = value as Partial<ConversationSummary>;
  return typeof item.id === "string" && typeof item.title === "string" && typeof item.model === "string" && typeof item.workspaceUri === "string" && Number.isSafeInteger(item.createdAt) && Number.isSafeInteger(item.updatedAt) && Number.isSafeInteger(item.messageCount) && Number.isSafeInteger(item.sizeBytes);
}
function normalizeConversation(conversation: Conversation): Conversation {
  const messages = conversation.messages.map((message) => ({ ...message, content: message.content ?? "", toolCalls: message.toolCalls?.map(normalizeToolCall), timeline: message.timeline ?? undefined }));
  return { ...conversation, title: createConversationTitle(messages, conversation.title), messages };
}
function normalizeToolCall<T extends NonNullable<Conversation["messages"][number]["toolCalls"]>[number]>(toolCall: T): T {
  if (toolCall.status === "pending" || toolCall.status === "awaiting_confirmation" || toolCall.status === "running") {
    return { ...toolCall, status: "cancelled", result: toolCall.result ?? "Interrupted because the extension host stopped.", isError: false, requiresConfirmation: false };
  }
  return toolCall;
}
