import { mkdir, readdir, readFile, rename, rm, stat } from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";
import type { Conversation, ConversationSummary } from "@/adapters";
import { createConversationTitle } from "@/core/chat/ConversationTitle";
import { findDuplicateConversationIds } from "@/core/chat/ConversationDeduplication";
import { isConversation } from "@/core/chat/ConversationValidation";
import { CONVERSATION_STORAGE_KEY } from "@/shared/constants";
import { SettingsManager } from "./SettingsManager";
import { writeJsonFileAtomic } from "./JsonFileStorage";
import { getCorruptHistoryDirectory, getHistoryDirectory } from "./UserDataPaths";

const MAX_CONVERSATIONS = 100;
const MAX_TOTAL_BYTES = 24 * 1024 * 1024;

interface StoredConversation {
  conversation: Conversation;
  filePath: string;
  sizeBytes: number;
}

export class HistoryManager {
  private readonly legacyHistoryCleared: Promise<void>;
  private mutationQueue: Promise<void> = Promise.resolve();

  constructor(private readonly context: vscode.ExtensionContext) {
    this.legacyHistoryCleared = clearLegacyWorkspaceHistory(context.workspaceState);
  }

  getWorkspaceUri(): string {
    const activeUri = vscode.window.activeTextEditor?.document.uri;
    return ((activeUri ? vscode.workspace.getWorkspaceFolder(activeUri)?.uri : undefined) ?? vscode.workspace.workspaceFolders?.[0]?.uri)?.toString() ?? "workspace:unknown";
  }

  async getSummaries(): Promise<ConversationSummary[]> {
    if (!SettingsManager.load().historyEnabled) {return [];}
    await this.waitForPendingMutations();
    const records = await this.readAll();
    const retained = await this.applyRetentionAndLimits(records);
    return retained.map(toSummary).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async save(conversation: Conversation): Promise<void> {
    if (!SettingsManager.load().historyEnabled) {return;}
    const normalized = normalizeConversation(conversation);
    await this.enqueueMutation(async () => {
      await writeJsonFileAtomic(getConversationPath(normalized.id), normalized);
      await this.applyRetentionAndLimits(await this.readAll());
    });
  }

  async delete(id: string): Promise<void> {
    await this.deleteMany([id]);
  }

  async deleteMany(ids: string[]): Promise<void> {
    const uniqueIds = [...new Set(ids)];
    await this.enqueueMutation(() => Promise.all(uniqueIds.map((id) => rm(getConversationPath(id), { force: true }))).then(() => undefined));
  }

  async getById(id: string): Promise<Conversation | undefined> {
    await this.waitForPendingMutations();
    const filePath = getConversationPath(id);
    try {
      const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
      if (!isConversation(parsed) || parsed.id !== id) {
        await isolateCorruptHistoryFile(filePath);
        return undefined;
      }
      return normalizeConversation(parsed);
    } catch (error) {
      if (isFileNotFoundError(error)) {return undefined;}
      await isolateCorruptHistoryFile(filePath);
      return undefined;
    }
  }

  private async readAll(): Promise<StoredConversation[]> {
    await this.legacyHistoryCleared;
    await mkdir(getHistoryDirectory(), { recursive: true });
    const entries = await readdir(getHistoryDirectory(), { withFileTypes: true });
    const records = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => this.readStoredConversation(path.join(getHistoryDirectory(), entry.name))),
    );
    return records.filter((record): record is StoredConversation => record !== undefined);
  }

  private async readStoredConversation(filePath: string): Promise<StoredConversation | undefined> {
    try {
      const [raw, metadata] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
      const parsed = JSON.parse(raw) as unknown;
      if (!isConversation(parsed)) {
        await isolateCorruptHistoryFile(filePath);
        return undefined;
      }
      return { conversation: normalizeConversation(parsed), filePath, sizeBytes: metadata.size };
    } catch {
      await isolateCorruptHistoryFile(filePath);
      return undefined;
    }
  }

  private async applyRetentionAndLimits(records: StoredConversation[]): Promise<StoredConversation[]> {
    const retentionDays = SettingsManager.load().historyRetentionDays;
    const threshold = retentionDays === 0 ? 0 : Date.now() - retentionDays * 86_400_000;
    const duplicateIds = findDuplicateConversationIds(records.map((record) => record.conversation));
    const duplicates = records.filter((record) => duplicateIds.has(record.conversation.id));
    const sorted = records.filter((record) => !duplicateIds.has(record.conversation.id)).sort((a, b) => b.conversation.updatedAt - a.conversation.updatedAt);
    const retained: StoredConversation[] = [];
    const removed: StoredConversation[] = [...duplicates];
    let totalBytes = 0;

    for (const record of sorted) {
      const expired = threshold !== 0 && record.conversation.updatedAt < threshold;
      const exceedsLimits = retained.length >= MAX_CONVERSATIONS || totalBytes + record.sizeBytes > MAX_TOTAL_BYTES;
      if (expired || exceedsLimits) {
        removed.push(record);
      } else {
        retained.push(record);
        totalBytes += record.sizeBytes;
      }
    }

    if (removed.length > 0) {
      await Promise.all(removed.map((record) => rm(record.filePath, { force: true })));
    }
    return retained;
  }

  private async waitForPendingMutations(): Promise<void> {
    await this.legacyHistoryCleared;
    await this.mutationQueue;
  }

  private enqueueMutation(operation: () => Promise<void>): Promise<void> {
    const next = this.mutationQueue.then(async () => {
      await this.legacyHistoryCleared;
      await operation();
    }, async () => {
      await this.legacyHistoryCleared;
      await operation();
    });
    this.mutationQueue = next.catch(() => undefined);
    return next;
  }
}

function getConversationPath(id: string): string {
  return path.join(getHistoryDirectory(), `${encodeURIComponent(id)}.json`);
}

function toSummary(record: StoredConversation): ConversationSummary {
  const { conversation, sizeBytes } = record;
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    model: conversation.model,
    messageCount: conversation.messages.length,
    sizeBytes,
    workspaceUri: conversation.workspaceUri,
  };
}

async function clearLegacyWorkspaceHistory(workspaceState: vscode.Memento): Promise<void> {
  const keys = workspaceState.keys().filter((key) => key.startsWith(CONVERSATION_STORAGE_KEY));
  await Promise.all(keys.map((key) => workspaceState.update(key, undefined)));
}

async function isolateCorruptHistoryFile(filePath: string): Promise<void> {
  try {
    await mkdir(getCorruptHistoryDirectory(), { recursive: true });
    const target = path.join(getCorruptHistoryDirectory(), `${Date.now()}-${path.basename(filePath)}`);
    await rename(filePath, target);
  } catch {
    await rm(filePath, { force: true }).catch(() => undefined);
  }
}

function isFileNotFoundError(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "ENOENT";
}

function normalizeConversation(conversation: Conversation): Conversation {
  const messages = conversation.messages.map((message) => ({
    ...message,
    content: message.content ?? "",
    toolCalls: message.toolCalls?.map(normalizeToolCall),
    timeline: message.timeline ?? undefined,
  }));
  return { ...conversation, title: createConversationTitle(messages, conversation.title), messages };
}

function normalizeToolCall<T extends NonNullable<Conversation["messages"][number]["toolCalls"]>[number]>(toolCall: T): T {
  if (toolCall.status === "pending" || toolCall.status === "awaiting_confirmation" || toolCall.status === "running") {
    return {
      ...toolCall,
      status: "cancelled",
      result: toolCall.result ?? "Interrupted because the extension host stopped.",
      isError: false,
      requiresConfirmation: false,
    };
  }
  return toolCall;
}
